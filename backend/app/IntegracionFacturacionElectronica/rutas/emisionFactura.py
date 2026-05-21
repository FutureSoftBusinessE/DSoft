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
import base64


@bp.route("/emisionFactura", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def emisionFactura():
    # ========== OBTENER DATOS DEL JWT ==========
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    usrcodigo = claims["user"]
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    # ========== OBTENER DATOS DEL REQUEST ==========
    data = request.get_json()

    # Extraer datos de la factura (vienen del payload de facturarProforma o recuperarPayloadFactura)
    ciacodigo = data.get("ciacodigo")
    facnumfac = data.get("facnumfac")
    loccodigo = data.get("loccodigo")
    tipo_proceso = data.get("tipo_proceso")

    # Validar que vengan los datos necesarios
    if not ciacodigo or not facnumfac or not loccodigo:
        raise ValidationError("Faltan datos de la factura (ciacodigo, facnumfac, loccodigo)")

    if not tipo_proceso:
        raise ValidationError("Falta dato del tipo de proceso: '0', '1', etc..")

    # Extraer datos anidados del JSON
    configuracion = data.get("configuracion", {})
    info_tributaria = data.get("info_tributaria", {})
    info_factura = data.get("info_factura", {})
    datos_cliente = data.get("datos_cliente", {})

    # Obtener datos del anidado configuracion
    nombre_file_p12 = configuracion.get("nombre_certificado")
    password_file_p12 = configuracion.get("clave_certificado")

    # Directorio base para guardar archivos
    dir_base = Path(__file__).parent.parent

    # Construir serie (establecimiento + punto emisión)
    serie = info_tributaria.get("estab", "") + info_tributaria.get("pto_emi", "")

    ruc_recibido = info_tributaria.get("ruc", "").strip()

    ambiente = data.get("ambiente", "1")

    # Fechas para actualizaciones
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    # Conexion a la BD
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    if tipo_proceso == "0":
        """
        Endpoint que procesa la factura electrónica:
        1. Recibe el payload del frontend (construido por facturarProforma o recuperarPayloadFactura)
        2. Genera, firma, envía y autoriza la factura en el SRI
        3. Actualiza las tablas facfac y siacdocelectronicos con la respuesta
        """

        # ========== PASO 1: GENERAR CLAVE DE ACCESO ==========
        clave_acceso, error_msg, error_details = generate_clave_acceso(
            fecha_emision=info_factura.get("fecha_emision"), cod_doc=data.get("tipo_documento"), ruc=ruc_recibido, ambiente=ambiente, serie=serie, secuencial=info_tributaria.get("secuencial"), codigo_numerico="00000000", tipo_emision=data.get("tipo_emision")
        )

        if clave_acceso is None:
            guardar_error_sri(clicianonBD=clicianonBD, ciacodigo=ciacodigo, facnumfac=facnumfac, loccodigo=loccodigo, clave_acceso="ERROR", mensaje=f"Error generando clave acceso: {error_msg}", usuario=usrcodigo, ip=ipUser)
            raise ValidationError(error_msg, details=error_details)

        # ========== PASO 2: CONSTRUIR FACTURA Y XML ==========
        factura_obj = build_factura_desde_json(data, clave_acceso)
        factura_xml = build_xml_desde_factura(factura_obj)

        # ========== PASO 3: VALIDAR XML CONTRA XSD ==========
        es_valido, detail = validate_factura_xml(factura_xml)

        if not es_valido:
            guardar_error_sri(clicianonBD=clicianonBD, ciacodigo=ciacodigo, facnumfac=facnumfac, loccodigo=loccodigo, clave_acceso=clave_acceso, mensaje=f"Error validación XSD: {detail}", usuario=usrcodigo, ip=ipUser)
            raise ValidationError("La factura generada no cumple con el formato XSD del SRI", details={"error_validacion": detail})

        # ========== PASO 4: GUARDAR XML SIN FIRMAR ==========
        try:
            dir_no_firmados = dir_base / "facturas_no_firmadas"
            dir_no_firmados.mkdir(parents=True, exist_ok=True)

            nombre_no_firmado = f"{clave_acceso}_sin_firma.xml"
            ruta_no_firmado = dir_no_firmados / nombre_no_firmado
            with open(ruta_no_firmado, "w", encoding="utf-8") as f:
                f.write(factura_xml)
        except Exception as e:
            guardar_error_sri(clicianonBD=clicianonBD, ciacodigo=ciacodigo, facnumfac=facnumfac, loccodigo=loccodigo, clave_acceso=clave_acceso, mensaje=f"Error guardando XML sin firmar: {str(e)}", usuario=usrcodigo, ip=ipUser)
            raise APIError("Error al guardar XML sin firmar", details={"error": str(e)})

        # ========== PASO 5: FIRMAR XML ==========
        factura_firmada, error_msg, error_details = sign_xml(xml_sin_firmar=factura_xml, nombre_certificado=nombre_file_p12, clave_certificado=password_file_p12)

        if factura_firmada is None:
            guardar_error_sri(clicianonBD=clicianonBD, ciacodigo=ciacodigo, facnumfac=facnumfac, loccodigo=loccodigo, clave_acceso=clave_acceso, mensaje=f"Error firmando XML: {error_msg}", usuario=usrcodigo, ip=ipUser)
            raise ValidationError(error_msg, details=error_details)

        # ========== PASO 6: GUARDAR XML FIRMADO ==========
        try:
            dir_firmados = dir_base / "facturas_firmadas"
            dir_firmados.mkdir(parents=True, exist_ok=True)

            nombre_firmado = f"{clave_acceso}.xml"
            ruta_firmado = dir_firmados / nombre_firmado

            with open(ruta_firmado, "w", encoding="utf-8") as f:
                f.write(factura_firmada)
        except Exception as e:
            guardar_error_sri(clicianonBD=clicianonBD, ciacodigo=ciacodigo, facnumfac=facnumfac, loccodigo=loccodigo, clave_acceso=clave_acceso, mensaje=f"Error guardando XML firmado: {str(e)}", usuario=usrcodigo, ip=ipUser)
            raise APIError("Error al guardar el archivo XML firmado", details={"error": str(e)})

        # ========== PASO 7: ENVIAR A RECEPCIÓN SRI ==========
        receipt_response, receipt_error, receipt_details = send_receipt(xml_firmado=factura_firmada, ambiente=ambiente)

        if receipt_response is None:
            guardar_error_sri(clicianonBD=clicianonBD, ciacodigo=ciacodigo, facnumfac=facnumfac, loccodigo=loccodigo, clave_acceso=clave_acceso, mensaje=f"Error en recepción SRI: {receipt_error}", usuario=usrcodigo, ip=ipUser, xml_firmado=factura_firmada)
            raise ValidationError(receipt_error, details=receipt_details)

        # ========== PASO 8: CONSULTAR AUTORIZACIÓN (con reintentos) ==========
        max_intentos = 2
        espera_segundos = 2
        auth_data = None

        for intento in range(max_intentos):
            if intento > 0:
                time.sleep(espera_segundos)

            auth_response, auth_error, auth_details = send_authorization(clave_acceso=clave_acceso, ambiente=ambiente)

            if auth_response is None:
                if intento == max_intentos - 1:
                    guardar_error_sri(clicianonBD=clicianonBD, ciacodigo=ciacodigo, facnumfac=facnumfac, loccodigo=loccodigo, clave_acceso=clave_acceso, mensaje=f"Error en autorización después de {max_intentos} intentos: {auth_error}", usuario=usrcodigo, ip=ipUser, xml_firmado=factura_firmada)
                    raise ValidationError(auth_error, details=auth_details)
                continue

            auth_data = parse_authorization_response(auth_response)

            if auth_data.get("estado") in ["AUTORIZADO", "NO AUTORIZADO", "RECHAZADA"]:
                break

        if auth_data is None:
            raise ValidationError("No se pudo obtener autorización después de varios intentos", details={"intentos": max_intentos})

        # ========== PASO 9: GUARDAR XML AUTORIZADO ==========
        ruta_autorizado = None
        nombre_autorizado = None
        xml_autorizacion = None

        if auth_data.get("comprobante"):
            try:
                dir_autorizados = dir_base / "facturas_autorizadas"
                dir_autorizados.mkdir(parents=True, exist_ok=True)

                nombre_autorizado = f"{clave_acceso}.xml"
                ruta_autorizado = dir_autorizados / nombre_autorizado

                xml_autorizacion = build_autorizacion_xml(auth_data, clave_acceso)

                with open(ruta_autorizado, "w", encoding="utf-8") as f:
                    f.write(xml_autorizacion)
            except Exception as e:
                raise APIError("Error al guardar el archivo XML autorizado", details={"error": str(e)})

        # ========== PASO 10: GENERAR RIDE (PDF) ==========
        ruta_ride = None
        pdf_content = None

        if auth_data.get("estado") == "AUTORIZADO":
            ruta_ride, ride_error, ride_details = generate_ride_pdf(factura_data=data, auth_data=auth_data, clave_acceso=clave_acceso, output_dir=dir_base / "facturas_rides")

            if ruta_ride is None:
                raise APIError(ride_error, details=ride_details)

            try:
                with open(ruta_ride, "rb") as f:
                    pdf_content = f.read()
            except Exception as e:
                print(f"Error leyendo PDF del RIDE: {str(e)}")

        # ========== PASO 11: ACTUALIZAR TABLAS EN BD ==========
        with engine.connect() as connection:
            with connection.begin():

                # PASO 11.1: Guardar en siacdocelectronicos
                sri_autorizado = 1 if auth_data.get("estado") == "AUTORIZADO" else 0
                sri_status = "A" if auth_data.get("estado") == "AUTORIZADO" else "R"

                # ELIMINAR registro anterior si existe (del error)
                connection.execute(
                    text(
                        """
                        DELETE FROM siacdocelectronicos
                        WHERE ciacodigo = :ciacodigo
                        AND facnumfac = :facnumfac
                        AND loccodigo = :loccodigo
                    """
                    ),
                    {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo},
                )

                # INSERTAR siempre el registro correcto
                connection.execute(
                    text(
                        """
                        INSERT INTO siacdocelectronicos (
                            ciacodigo, facnumfac, loccodigo, sriclave, sridocumento,
                            srixmlorigen, srixmlfirmado, srixmlautorizado, sripdf,
                            srifirmado, sriautorizado, sricontingencia, srilote,
                            sriprocesado, sripath, sridestinatario, srisubject,
                            srimensaje, sriruc, sristatus, srienvio,
                            srifecisys, srihorisys, sriusuisys, sriestisys,
                            srifecmsys, srihormsys, sriusumsys, sriestmsys
                        ) VALUES (
                            :ciacodigo, :facnumfac, :loccodigo, :sriclave, :sridocumento,
                            :srixmlorigen, :srixmlfirmado, :srixmlautorizado, :sripdf,
                            :srifirmado, :sriautorizado, :sricontingencia, :srilote,
                            :sriprocesado, :sripath, :sridestinatario, :srisubject,
                            :srimensaje, :sriruc, :sristatus, :srienvio,
                            :srifecisys, :srihorisys, :sriusuisys, :sriestisys,
                            :srifecmsys, :srihormsys, :sriusumsys, :sriestmsys
                        )
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "facnumfac": facnumfac,
                        "loccodigo": loccodigo,
                        "sriclave": clave_acceso,
                        "sridocumento": "01",
                        "srixmlorigen": factura_xml.encode("utf-8") if factura_xml else None,
                        "srixmlfirmado": factura_firmada.encode("utf-8") if factura_firmada else None,
                        "srixmlautorizado": xml_autorizacion.encode("utf-8") if xml_autorizacion else None,
                        "sripdf": pdf_content,
                        "srifirmado": 1,
                        "sriautorizado": sri_autorizado,
                        "sricontingencia": 0,
                        "srilote": 0,
                        "sriprocesado": 1,
                        "sripath": str(ruta_autorizado) if ruta_autorizado else "",
                        "sridestinatario": datos_cliente.get("email", ""),
                        "srisubject": f"Factura Electrónica {facnumfac}",
                        "srimensaje": f"Estado SRI: {auth_data.get('estado', 'ERROR')}",
                        "sriruc": info_tributaria.get("ruc", ""),
                        "sristatus": sri_status,
                        "srienvio": 1,
                        "srifecisys": fecha_con_hora_cero,
                        "srihorisys": fecha_formato_1900,
                        "sriusuisys": usrcodigo,
                        "sriestisys": ipUser,
                        "srifecmsys": fecha_con_hora_cero,
                        "srihormsys": fecha_formato_1900,
                        "sriusumsys": usrcodigo,
                        "sriestmsys": ipUser,
                    },
                )

                # PASO 11.2: Actualizar facfac con datos de autorización
                if auth_data.get("estado") == "AUTORIZADO":
                    numero_autorizacion = auth_data.get("numero_autorizacion", "")
                    fecha_autorizacion = auth_data.get("fecha_autorizacion", datetime.now())

                    update_facfac = """
                        UPDATE facfac
                        SET audnumxml = :audnumxml,
                            sriautnumero = :sriautnumero,
                            sriautfecemi = :sriautfecemi,
                            facelectronica = 1,
                            facfecmsys = :fecha,
                            facusumsys = :usuario
                        WHERE ciacodigo = :ciacodigo
                        AND facnumfac = :facnumfac
                        AND loccodigo = :loccodigo
                    """
                    connection.execute(text(update_facfac), {"audnumxml": None, "sriautnumero": numero_autorizacion, "sriautfecemi": fecha_autorizacion, "fecha": fecha_con_hora_cero, "usuario": usrcodigo, "ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo})
                else:
                    update_facfac = """
                        UPDATE facfac
                        SET facelectronica = 1,
                            facdetalle = CONCAT(facdetalle, :mensaje),
                            facfecmsys = :fecha,
                            facusumsys = :usuario
                        WHERE ciacodigo = :ciacodigo
                        AND facnumfac = :facnumfac
                        AND loccodigo = :loccodigo
                    """
                    connection.execute(text(update_facfac), {"mensaje": f" | SRI: {auth_data.get('estado', 'ERROR')}", "fecha": fecha_con_hora_cero, "usuario": usrcodigo, "ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo})

        # ========== PASO 12: RETORNAR RESPUESTA ==========
        return {
            "msg": "Factura procesada correctamente",
            "clave_acceso": clave_acceso,
            "estado_sri": auth_data.get("estado"),
            "numero_autorizacion": auth_data.get("numero_autorizacion", ""),
            "archivos": {
                "sin_firma": {"nombre": nombre_no_firmado, "ruta": str(ruta_no_firmado)},
                "firmado": {"nombre": nombre_firmado, "ruta": str(ruta_firmado)},
                "autorizado": {"nombre": nombre_autorizado, "ruta": str(ruta_autorizado) if ruta_autorizado else None},
                "ridePDF": {"nombre": f"{clave_acceso}.pdf", "ruta": str(ruta_ride) if ruta_ride else None},
            },
            "factura_firmada": factura_firmada,
            "autorizacion": auth_data,
        }
    if tipo_proceso == "1":
        with engine.connect() as connection:
            query_ride = """
                SELECT sripdf, sriclave
                FROM siacdocelectronicos
                WHERE ciacodigo = :ciacodigo
                AND facnumfac = :facnumfac
                AND loccodigo = :loccodigo
            """
            query_result_ride = connection.execute(text(query_ride), {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo}).fetchone()

            if not query_result_ride:
                raise APIError(f"La factura {facnumfac} no tiene un ride asociado")

            pdf_base64 = base64.b64encode(query_result_ride[0]).decode("utf-8")

            return {"msg": "RIDE generado correctamente", "ridePDF": pdf_base64, "claveAcceso": query_result_ride[1]}


def guardar_error_sri(clicianonBD, ciacodigo, facnumfac, loccodigo, clave_acceso, mensaje, usuario, ip, xml_firmado=None):
    """
    Guarda un registro de error en siacdocelectronicos.
    Usa su PROPIA conexión y transacción INDEPENDIENTE para que
    sobreviva al rollback de la transacción principal.
    """
    try:
        from app.db import get_session

        fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

        db_error = get_session(clicianonBD)
        engine_error = db_error.bind

        with engine_error.connect() as conn_error:
            with conn_error.begin():
                conn_error.execute(
                    text(
                        """
                        INSERT INTO siacdocelectronicos (
                            ciacodigo, facnumfac, loccodigo, sriclave, sridocumento,
                            srixmlfirmado, srifirmado, sriautorizado, sricontingencia, srilote,
                            sriprocesado, sripath, sridestinatario, srisubject,
                            srimensaje, sriruc, sristatus, srienvio,
                            srifecisys, srihorisys, sriusuisys, sriestisys,
                            srifecmsys, srihormsys, sriusumsys, sriestmsys
                        ) VALUES (
                            :ciacodigo, :facnumfac, :loccodigo, :sriclave, :sridocumento,
                            :srixmlfirmado, :srifirmado, :sriautorizado, :sricontingencia, :srilote,
                            :sriprocesado, :sripath, :sridestinatario, :srisubject,
                            :srimensaje, :sriruc, :sristatus, :srienvio,
                            :srifecisys, :srihorisys, :sriusuisys, :sriestisys,
                            :srifecmsys, :srihormsys, :sriusumsys, :sriestmsys
                        )
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "facnumfac": facnumfac,
                        "loccodigo": loccodigo,
                        "sriclave": clave_acceso,
                        "sridocumento": "01",
                        "srixmlfirmado": xml_firmado.encode("utf-8") if xml_firmado else None,
                        "srifirmado": 1 if xml_firmado else 0,
                        "sriautorizado": 0,
                        "sricontingencia": 0,
                        "srilote": 0,
                        "sriprocesado": 0,
                        "sripath": "",
                        "sridestinatario": "",
                        "srisubject": "Error en facturación electrónica",
                        "srimensaje": mensaje,
                        "sriruc": "",
                        "sristatus": "E",
                        "srienvio": 0,
                        "srifecisys": fecha_con_hora_cero,
                        "srihorisys": fecha_formato_1900,
                        "sriusuisys": usuario,
                        "sriestisys": ip,
                        "srifecmsys": fecha_con_hora_cero,
                        "srihormsys": fecha_formato_1900,
                        "sriusumsys": usuario,
                        "sriestmsys": ip,
                    },
                )
    except Exception as e:
        print(f"CRÍTICO: No se pudo guardar error SRI: {str(e)}")
