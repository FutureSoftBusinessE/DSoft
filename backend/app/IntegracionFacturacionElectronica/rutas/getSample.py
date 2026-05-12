from flask import jsonify, request
from app.IntegracionFacturacionElectronica import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from app.IntegracionFacturacionElectronica.utils.generate_clave_acceso import generate_clave_acceso
from app.IntegracionFacturacionElectronica.utils.build_factura_desde_json import build_factura_desde_json
from app.IntegracionFacturacionElectronica.utils.build_xml_desde_factura import build_xml_desde_factura
from app.IntegracionFacturacionElectronica.utils.validate_factura_xml import validate_factura_xml
from app.IntegracionFacturacionElectronica.utils.sign_xml import sign_xml
from app.IntegracionFacturacionElectronica.utils.sri_services import send_receipt, send_authorization, parse_authorization_response, build_autorizacion_xml
from app.IntegracionFacturacionElectronica.utils.generate_ride_pdf import generate_ride_pdf
from pathlib import Path
from error_handling import api_endpoint, ValidationError, APIError
from datetime import datetime
import time


@bp.route("/getSample", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def getSample():
    # PRIMERO obtener los datos del request
    data = request.get_json()

    # Extraer datos anidados del JSON
    configuracion = data.get("configuracion", {})
    info_tributaria = data.get("info_tributaria", {})
    info_factura = data.get("info_factura", {})

    # Obtener datos del anidado configuracion
    nombre_file_p12 = configuracion.get("nombre_certificado")
    password_file_p12 = configuracion.get("clave_certificado")

    # Directorio base para guardar archivos
    dir_base = Path(__file__).parent.parent

    # Construir serie (establecimiento + punto emisión)
    serie = info_tributaria.get("estab", "") + info_tributaria.get("pto_emi", "")

    ruc_recibido = info_tributaria.get("ruc", "").strip()

    ambiente = data.get("ambiente", "1")

    # Generar clave de acceso con los datos del JSON
    clave_acceso, error_msg, error_details = generate_clave_acceso(
        fecha_emision=info_factura.get("fecha_emision"), cod_doc=data.get("tipo_documento"), ruc=ruc_recibido, ambiente=ambiente, serie=serie, secuencial=info_tributaria.get("secuencial"), codigo_numerico="00000000", tipo_emision=data.get("tipo_emision")
    )

    if clave_acceso is None:
        raise ValidationError(error_msg, details=error_details)

    # Construir factura con la clave generada
    factura_obj = build_factura_desde_json(data, clave_acceso)

    # Generar XML
    factura_xml = build_xml_desde_factura(factura_obj)

    # Validar contra XSD
    es_valido, detail = validate_factura_xml(factura_xml)

    if not es_valido:
        raise ValidationError("La factura generada no cumple con el formato XSD del SRI", details={"error_validacion": detail})

    # GUARDAR XML SIN FIRMAR
    try:
        dir_no_firmados = dir_base / "facturas_no_firmadas"
        dir_no_firmados.mkdir(parents=True, exist_ok=True)

        nombre_no_firmado = f"{clave_acceso}_sin_firma.xml"
        ruta_no_firmado = dir_no_firmados / nombre_no_firmado
        with open(ruta_no_firmado, "w", encoding="utf-8") as f:
            f.write(factura_xml)
    except Exception as e:
        raise APIError("Error al guardar XML sin firmar", details={"error": str(e)})

    # FIRMAR XML
    factura_firmada, error_msg, error_details = sign_xml(xml_sin_firmar=factura_xml, nombre_certificado=nombre_file_p12, clave_certificado=password_file_p12)

    if factura_firmada is None:
        raise ValidationError(error_msg, details=error_details)

    # GUARDAR XML FIRMADO
    try:
        dir_firmados = dir_base / "facturas_firmadas"
        dir_firmados.mkdir(parents=True, exist_ok=True)

        nombre_firmado = f"{clave_acceso}.xml"
        ruta_firmado = dir_firmados / nombre_firmado

        with open(ruta_firmado, "w", encoding="utf-8") as f:
            f.write(factura_firmada)
    except Exception as e:
        raise APIError("Error al guardar el archivo XML firmado", details={"error": str(e)})

    # ENVIAR A RECEPCIÓN SRI
    receipt_response, receipt_error, receipt_details = send_receipt(xml_firmado=factura_firmada, ambiente=ambiente)

    if receipt_response is None:
        raise ValidationError(receipt_error, details=receipt_details)

    # CONSULTAR AUTORIZACIÓN (con reintento)
    max_intentos = 2  # 1 intento inicial + 1 reintento
    espera_segundos = 2
    auth_data = None

    for intento in range(max_intentos):
        if intento > 0:
            time.sleep(espera_segundos)

        auth_response, auth_error, auth_details = send_authorization(clave_acceso=clave_acceso, ambiente=ambiente)

        if auth_response is None:
            # Si es el último intento, lanzar error
            if intento == max_intentos - 1:
                raise ValidationError(auth_error, details=auth_details)
            continue

        # PARSEAR RESPUESTA DE AUTORIZACIÓN
        auth_data = parse_authorization_response(auth_response)

        if auth_data.get("estado") in ["AUTORIZADO", "NO AUTORIZADO", "RECHAZADA"]:  # Estos son los posibles estados de error para send_authorization
            break

    if auth_data is None:
        raise ValidationError("No se pudo obtener autorización después de varios intentos", details={"intentos": max_intentos})

    # GUARDAR XML AUTORIZADO (formato SRI)
    ruta_autorizado = None
    nombre_autorizado = None

    if auth_data.get("comprobante"):
        try:
            dir_autorizados = dir_base / "facturas_autorizadas"
            dir_autorizados.mkdir(parents=True, exist_ok=True)

            nombre_autorizado = f"{clave_acceso}.xml"
            ruta_autorizado = dir_autorizados / nombre_autorizado

            # Construir XML de autorización
            xml_autorizacion = build_autorizacion_xml(auth_data, clave_acceso)

            with open(ruta_autorizado, "w", encoding="utf-8") as f:
                f.write(xml_autorizacion)
        except Exception as e:
            raise APIError("Error al guardar el archivo XML autorizado", details={"error": str(e)})

    # GENERAR RIDE (PDF)
    if auth_data.get("estado") == "AUTORIZADO":
        ruta_ride, ride_error, ride_details = generate_ride_pdf(factura_data=data, auth_data=auth_data, clave_acceso=clave_acceso, output_dir=dir_base / "facturas_rides")

        if ruta_ride is None:
            raise APIError(ride_error, details=ride_details)
    else:
        ruta_ride = None

    return {
        "msg": "Factura generada, validada, firmada, enviada y autorizada correctamente",
        "clave_acceso": clave_acceso,
        "archivos": {
            "sin_firma": {"nombre": nombre_no_firmado, "ruta": str(ruta_no_firmado)},
            "firmado": {"nombre": nombre_firmado, "ruta": str(ruta_firmado)},
            "autorizado": {"nombre": nombre_autorizado, "ruta": str(ruta_autorizado)},
            "ridePDF": {"nombre": f"{clave_acceso}.pdf", "ruta": str(ruta_ride) if ruta_ride else None},
        },
        "factura_firmada": factura_firmada,
        "autorizacion": auth_data,
    }
