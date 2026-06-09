from flask import request, jsonify
from app.RetencionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
import xml.etree.ElementTree as ET

# Reutilizamos el servicio que consulta al SRI
from app.IntegracionFacturacionElectronica.utils.sri_services import send_authorization


@bp.route("/consultarFacturaSRI", methods=["POST"])
@cross_origin()
@jwt_required()
def consultar_factura_sri():
    """Consulta la clave de acceso en el SRI, extrae los datos y crea el proveedor si no existe."""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        usuario_sys = claims.get("sub", claims.get("user_id", "SISTEMA"))[:10]

        payload = request.get_json()
        clave_acceso = payload.get("claveAcceso", "").strip()

        if len(clave_acceso) != 49:
            return jsonify({"success": False, "message": "La clave de acceso debe tener 49 dígitos."}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        # ==========================================
        # 1. VERIFICACIÓN DE SEGURIDAD (RUC DE EMPRESA)
        # ==========================================
        with engine.connect() as conn:
            cia_row = conn.execute(text("SELECT ciaruc FROM siaccia WHERE ciacodigo = :cia"), {"cia": ciacodigo}).first()
            if not cia_row or not cia_row[0]:
                return jsonify({"success": False, "message": "No se encontró el RUC de la empresa en la configuración."}), 500
            nuestro_ruc = str(cia_row[0]).strip()

        # ==========================================
        # 2. CONSULTA AL WEB SERVICE DEL SRI
        # ==========================================
        # Extraemos el ambiente directamente de la clave de acceso (posición 23 = índice 23)
        ambiente = clave_acceso[23:24]
        auth_resp, auth_err, _ = send_authorization(clave_acceso=clave_acceso, ambiente=ambiente)

        if not auth_resp:
            return jsonify({"success": False, "message": f"Error comunicándose con el SRI: {auth_err}"}), 500

        # CORRECCIÓN: El SRI encapsula la respuesta dentro de 'autorizaciones.autorizacion'
        autorizaciones = getattr(auth_resp, "autorizaciones", None)
        if not autorizaciones or not getattr(autorizaciones, "autorizacion", None):
            return jsonify({"success": False, "message": "El SRI no devolvió el nodo de autorización para esta clave."}), 400

        # Extraemos la primera autorización del arreglo
        autorizacion_sri = autorizaciones.autorizacion[0]
        estado = getattr(autorizacion_sri, "estado", "ERROR")

        if estado != "AUTORIZADO":
            # Si el documento no está autorizado o fue anulado, extraemos el motivo del SRI
            mensajes_error = ""
            mensajes_node = getattr(autorizacion_sri, "mensajes", None)
            if mensajes_node and getattr(mensajes_node, "mensaje", None):
                for m in mensajes_node.mensaje:
                    msg = str(getattr(m, "mensaje", ""))
                    adic = str(getattr(m, "informacionAdicional", ""))
                    mensajes_error += f" [{msg}: {adic}]"

            return jsonify({"success": False, "message": f"La factura no se encuentra AUTORIZADA. Estado devuelto: {estado}. {mensajes_error}"}), 400

        # Extraemos el XML embebido en formato CDATA
        xml_cdata = getattr(autorizacion_sri, "comprobante", None)
        if not xml_cdata:
            return jsonify({"success": False, "message": "El comprobante XML viene vacío desde el SRI."}), 500

        # ==========================================
        # 3. EXTRACCIÓN Y PARSEO DEL XML (CDATA)
        # ==========================================
        try:
            root = ET.fromstring(xml_cdata)
        except ET.ParseError:
            return jsonify({"success": False, "message": "Error decodificando la estructura XML devuelta por el SRI."}), 500

        infoTributaria = root.find("infoTributaria")
        infoFactura = root.find("infoFactura")

        if infoTributaria is None or infoFactura is None:
            return jsonify({"success": False, "message": "El XML descargado no tiene el formato de una Factura estándar."}), 400

        identificacion_comprador = str(infoFactura.findtext("identificacionComprador") or "").strip()

        if identificacion_comprador != nuestro_ruc:
            return jsonify({"success": False, "message": f"Operación denegada. La factura fue emitida para el RUC {identificacion_comprador}, no para nuestra empresa ({nuestro_ruc})."}), 403

        # Extracción de datos del Emisor (El Proveedor)
        prov_ruc = str(infoTributaria.findtext("ruc") or "").strip()
        prov_razon_social = str(infoTributaria.findtext("razonSocial") or "").strip()
        prov_dir_matriz = str(infoTributaria.findtext("dirMatriz") or "S/N").strip()

        # Extracción de Email desde infoAdicional
        prov_email = ""
        infoAdicional = root.find("infoAdicional")
        if infoAdicional is not None:
            for campo in infoAdicional.findall("campoAdicional"):
                nombre_campo = campo.attrib.get("nombre", "").lower()
                if "email" in nombre_campo or "correo" in nombre_campo:
                    prov_email = str(campo.text or "").strip()
                    break

        # Extracción de Bases Imponibles
        total_sin_impuestos = float(infoFactura.findtext("totalSinImpuestos") or 0)
        base_iva_0 = 0.0
        base_iva_grabado = 0.0
        monto_iva = 0.0

        totalConImpuestos = infoFactura.find("totalConImpuestos")
        if totalConImpuestos is not None:
            for totalImp in totalConImpuestos.findall("totalImpuesto"):
                codigo = str(totalImp.findtext("codigo") or "").strip()
                cod_porcentaje = str(totalImp.findtext("codigoPorcentaje") or "").strip()
                base = float(totalImp.findtext("baseImponible") or 0)
                valor = float(totalImp.findtext("valor") or 0)

                # Código 2 = IVA
                if codigo == "2":
                    if cod_porcentaje == "0":
                        base_iva_0 += base
                        # 12%, 14%, 15%
                    elif cod_porcentaje in ["2", "3", "4"]:
                        base_iva_grabado += base
                        monto_iva += valor

        # ==========================================
        # 4. GESTIÓN DEL MAESTRO DE PROVEEDORES
        # ==========================================
        ahora = datetime.now()
        fecha_sys = ahora.strftime("%Y-%m-%d 00:00:00")
        hora_sys = ahora.strftime("1900-01-01 %H:%M:%S")

        with engine.begin() as conn:
            sql_check = text("SELECT procodigo, pronombre FROM cxpmprov WHERE ciacodigo = :cia AND proruc = :ruc")
            prov_row = conn.execute(sql_check, {"cia": ciacodigo, "ruc": prov_ruc}).first()

            if prov_row:
                procodigo = prov_row[0]
            else:
                # Creación automática del proveedor con los datos del SRI
                sql_max = text("SELECT MAX(CAST(procodigo AS INT)) FROM cxpmprov WHERE ciacodigo = :cia AND ISNUMERIC(procodigo) = 1")
                max_cod = conn.execute(sql_max, {"cia": ciacodigo}).scalar()
                siguiente_cod = (max_cod or 0) + 1
                procodigo = str(siguiente_cod).zfill(6)

                sql_insert_prov = text(
                    """
                    INSERT INTO cxpmprov (
                        ciacodigo, procodigo, pronombre, proruc, prorepres, propais, prociudad, prodirec, proemail,
                        prosaldosuc, prosaldodol, prostatus, proesperjur, proesconesp, procambiaimp,
                        profecisys, prohorisys, prousuisys, profecmsys, prohormsys, prousumsys, prodiacre
                    ) VALUES (
                        :cia, :procod, :nombre, :ruc, '.', 'ECUADOR', 'S/N', :direc, :email,
                        0.0, 0.0, 'A', 0, 0, 0,
                        :fec, :hor, :usr, :fec, :hor, :usr, 0
                    )
                """
                )
                conn.execute(sql_insert_prov, {"cia": ciacodigo, "procod": procodigo, "nombre": prov_razon_social[:200], "ruc": prov_ruc, "direc": prov_dir_matriz[:200], "email": prov_email[:100], "fec": fecha_sys, "hor": hora_sys, "usr": usuario_sys})

        # ==========================================
        # 5. RETORNO DE DATOS AL FRONTEND
        # ==========================================
        return jsonify(
            {
                "success": True,
                "data": {
                    "proveedor": {"procodigo": procodigo, "proruc": prov_ruc, "pronombre": prov_razon_social, "proemail": prov_email},
                    "factura": {"establecimiento": infoTributaria.findtext("estab"), "punto_emision": infoTributaria.findtext("ptoEmi"), "secuencial": infoTributaria.findtext("secuencial"), "fecha_emision": infoFactura.findtext("fechaEmision"), "clave_acceso": clave_acceso},
                    "montos": {"base_iva_0": round(base_iva_0, 2), "base_iva_grabado": round(base_iva_grabado, 2), "monto_iva": round(monto_iva, 2), "total_sin_impuestos": total_sin_impuestos},
                },
                "message": "Factura validada. Datos listos para la retención.",
            }
        )

    except Exception as e:
        return jsonify({"success": False, "message": f"Error interno procesando la consulta: {str(e)}"}), 500
