from flask import request, jsonify
from app.RetencionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
import time
import json

from app.IntegracionFacturacionElectronica.utils.generate_clave_acceso import generate_clave_acceso
from app.IntegracionFacturacionElectronica.utils.sign_xml import sign_xml
from app.IntegracionFacturacionElectronica.utils.sri_services import send_receipt, send_authorization, parse_authorization_response
from services.encrip_desencrip import desencriptar


def escape_xml(text_val):
    if not text_val:
        return ""
    return str(text_val).strip().replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&apos;")


@bp.route("/autorizarSRI", methods=["POST"])
@jwt_required()
def autorizar_sri_retencion():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]
        usrcodigo = claims.get("sub", claims.get("user_id", "SISTEMA"))[:10]

        ipUser = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
        ipUser = ipUser.split(",")[0].strip()[:30]

        payload = request.get_json()
        retid = payload.get("retid")

        if not retid:
            return jsonify({"success": False, "message": "No se proporcionó el número de Retención"}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        # ==========================================
        # 1. EXTRACCIÓN DE DATOS DE BD
        # ==========================================
        with engine.connect() as conn:
            # Cabecera
            sql_cab = text(
                """
                SELECT
                    r.retfecemi, r.retruc, r.retnombre, r.retdirec, r.proemail,
                    r.sriserie01, r.sriserie02, r.retnumero, r.ciaobligadocon,
                    cia.ciaruc, cia.ciadescri, cia.ciadirec, cia.cianumresolucion,
                    loc.ciadirec AS locciadirec
                FROM cxpcret r
                LEFT JOIN siaccia cia ON r.ciacodigo = cia.ciacodigo
                LEFT JOIN cgblocal loc ON r.ciacodigo = loc.ciacodigo AND r.loccodigo = loc.loccodigo
                WHERE r.ciacodigo = :cia AND r.retid = :retid
            """
            )
            doc = conn.execute(sql_cab, {"cia": ciacodigo, "retid": retid}).mappings().first()
            if not doc:
                return jsonify({"success": False, "message": "No se encontró la Retención en la base de datos."}), 404

            # Detalles (Impuestos a retener)
            sql_det = text(
                """
                SELECT
                    t.fatimpret, t.fatbase, t.fatporcent, t.fatvalor, t.facid,
                    i.codSRI
                FROM cxptfac t
                LEFT JOIN cxpbimp i ON t.ciacodigo = i.ciacodigo AND t.impid = i.impid
                WHERE t.ciacodigo = :cia AND t.retid = :retid
            """
            )
            detalles = conn.execute(sql_det, {"cia": ciacodigo, "retid": retid}).mappings().fetchall()

            # Logo (Opcional para el RIDE posterior)
            sql_cia_img = text("SELECT cialogo FROM siaccia WHERE ciacodigo = :cia")
            cia_img_row = conn.execute(sql_cia_img, {"cia": ciacodigo}).first()
            logo_bytes = cia_img_row[0] if cia_img_row and cia_img_row[0] else None

        # ==========================================
        # 2. PREPARACIÓN DE VARIABLES SRI
        # ==========================================
        ambiente = "1"
        tipo_emision = "1"
        fecha_emision_str = doc["retfecemi"].strftime("%d/%m/%Y")
        periodo_fiscal = doc["retfecemi"].strftime("%m/%Y")

        id_retenido = str(doc["retruc"]).strip()
        tipo_id = "04" if len(id_retenido) == 13 else ("05" if len(id_retenido) == 10 else "06")

        obligado_cont = "SI" if doc["ciaobligadocon"] == 1 else "NO"

        # ==========================================
        # 3. GENERAR CLAVE DE ACCESO (07 = Retención)
        # ==========================================
        clave_acceso, err_ca, det_ca = generate_clave_acceso(
            fecha_emision=fecha_emision_str, cod_doc="07", ruc=str(doc["ciaruc"]).strip(), ambiente=ambiente, serie=f"{str(doc['sriserie01']).strip()}{str(doc['sriserie02']).strip()}", secuencial=str(doc["retnumero"]).strip().zfill(9), codigo_numerico="12345678", tipo_emision=tipo_emision
        )
        if not clave_acceso:
            return jsonify({"success": False, "message": f"Error generando Clave de Acceso: {err_ca}"}), 500

        # ==========================================
        # 4. CONSTRUIR XML ESTRUCTURADO XSD v1.0.0
        # ==========================================
        xml_ret = f"""<?xml version="1.0" encoding="UTF-8"?>
<comprobanteRetencion id="comprobante" version="1.0.0">
    <infoTributaria>
        <ambiente>{ambiente}</ambiente>
        <tipoEmision>{tipo_emision}</tipoEmision>
        <razonSocial>{escape_xml(doc["ciadescri"])}</razonSocial>
        <ruc>{doc["ciaruc"].strip()}</ruc>
        <claveAcceso>{clave_acceso}</claveAcceso>
        <codDoc>07</codDoc>
        <estab>{doc["sriserie01"].strip()}</estab>
        <ptoEmi>{doc["sriserie02"].strip()}</ptoEmi>
        <secuencial>{str(doc["retnumero"]).strip().zfill(9)}</secuencial>
        <dirMatriz>{escape_xml(doc["ciadirec"] or "S/N")}</dirMatriz>
    </infoTributaria>
    <infoCompRetencion>
        <fechaEmision>{fecha_emision_str}</fechaEmision>
        <dirEstablecimiento>{escape_xml(doc["locciadirec"] or "S/N")}</dirEstablecimiento>
        <obligadoContabilidad>{obligado_cont}</obligadoContabilidad>
        <tipoIdentificacionSujetoRetenido>{tipo_id}</tipoIdentificacionSujetoRetenido>
        <razonSocialSujetoRetenido>{escape_xml(doc["retnombre"])}</razonSocialSujetoRetenido>
        <identificacionSujetoRetenido>{id_retenido}</identificacionSujetoRetenido>
        <periodoFiscal>{periodo_fiscal}</periodoFiscal>
    </infoCompRetencion>
    <impuestos>"""

        for d in detalles:
            # fatimpret: 'R' (Renta -> Codigo 1) o 'I' (IVA -> Codigo 2)
            codigo_imp = "1" if str(d["fatimpret"]).strip().upper() == "R" else "2"
            cod_retencion = str(d["codSRI"] or "").strip()

            # CORRECCIÓN: Quitamos los guiones del documento sustento para cumplir con [0-9]{15}
            doc_sustento = str(d["facid"] or "000000000000000").strip().replace("-", "")

            xml_ret += f"""
        <impuesto>
            <codigo>{codigo_imp}</codigo>
            <codigoRetencion>{cod_retencion}</codigoRetencion>
            <baseImponible>{float(d['fatbase']):.2f}</baseImponible>
            <porcentajeRetener>{float(d['fatporcent']):.2f}</porcentajeRetener>
            <valorRetenido>{float(d['fatvalor']):.2f}</valorRetenido>
            <codDocSustento>01</codDocSustento>
            <numDocSustento>{doc_sustento}</numDocSustento>
            <fechaEmisionDocSustento>{fecha_emision_str}</fechaEmisionDocSustento>
        </impuesto>"""

        xml_ret += f"""
    </impuestos>
    <infoAdicional>
        <campoAdicional nombre="Direccion">{escape_xml(doc["retdirec"] or "S/N")}</campoAdicional>
        <campoAdicional nombre="Email">{escape_xml(doc["proemail"] or "S/N")}</campoAdicional>
    </infoAdicional>
</comprobanteRetencion>"""

        # ==========================================
        # 5. FIRMA DEL XML
        # ==========================================
        p12_bytes, clave_p12 = get_certificate_credentials(clicianonBD, ciacodigo)
        if not p12_bytes:
            return jsonify({"success": False, "message": "No se encontraron credenciales del certificado (.p12)"}), 500

        xml_firmado, err_firma, _ = sign_xml(xml_sin_firmar=xml_ret, p12_bytes=p12_bytes, clave_p12=clave_p12)
        if not xml_firmado:
            return jsonify({"success": False, "message": f"Error firmando XML: {err_firma}"}), 500

        # ==========================================
        # 6. ENVÍO AL SRI (RECEPCIÓN Y AUTORIZACIÓN)
        # ==========================================
        receipt_resp, receipt_err, receipt_details = send_receipt(xml_firmado=xml_firmado, ambiente=ambiente)
        estado_recepcion = getattr(receipt_resp, "estado", "") if receipt_resp else ""

        # Manejo del "Bypass" Inteligente de CLAVE REGISTRADA
        if receipt_resp is None or estado_recepcion == "DEVUELTO":
            detalle_sri = ""
            clave_registrada = False

            if receipt_details and isinstance(receipt_details, dict) and receipt_details.get("mensajes"):
                for m in receipt_details["mensajes"]:
                    msg = str(m.get("mensaje", ""))
                    adic = str(m.get("informacionAdicional", ""))
                    adic = adic if adic and adic != "None" else ""
                    detalle_sri += f" [{msg}: {adic}]".strip()
                    if "CLAVE ACCESO REGISTRADA" in msg.upper() or "CLAVE ACCESO REGISTRADA" in adic.upper():
                        clave_registrada = True

            if not clave_registrada:
                error_final = detalle_sri.strip() if detalle_sri else receipt_err
                _guardar_estado_sri_bd(engine, ciacodigo, retid, loccodigo, clave_acceso, xml_ret, xml_firmado, None, None, 0, f"Error Recepción: {error_final}", "E", usrcodigo, ipUser, doc)
                return jsonify({"success": False, "message": f"SRI Rechazó el XML: {error_final}"}), 500

        time.sleep(2)
        auth_resp, auth_err, _ = send_authorization(clave_acceso=clave_acceso, ambiente=ambiente)

        if not auth_resp:
            return jsonify({"success": False, "message": f"Error consultando Autorización: {auth_err}"}), 500

        auth_data = parse_authorization_response(auth_resp)
        estado_sri = auth_data.get("estado", "ERROR")

        detalle_errores = ""
        for m in auth_data.get("mensajes", []):
            msg = str(m.get("mensaje", ""))
            adic = str(m.get("informacionAdicional", ""))
            adic = adic if adic and adic != "None" else ""
            detalle_errores += f" [{msg} {adic}]".strip()

        mensaje_bd = f"Estado SRI: {estado_sri}{detalle_errores}"[:500]
        status_bd = "A" if estado_sri == "AUTORIZADO" else "R"
        is_auth_num = 1 if estado_sri == "AUTORIZADO" else 0

        # ==========================================
        # 7. RIDE Y ACTUALIZACIÓN BD
        # ==========================================
        xml_autorizado_final = None
        pdf_content = None

        if estado_sri == "AUTORIZADO":
            from app.IntegracionFacturacionElectronica.utils.sri_services import build_autorizacion_xml
            from app.IntegracionFacturacionElectronica.utils.generate_ride_pdf_retencion import generate_ride_pdf_retencion
            import pathlib

            xml_autorizado_final = build_autorizacion_xml(auth_data, clave_acceso)

            retencion_data = {
                "tipo_documento_nombre": "COMPROBANTE DE RETENCIÓN",
                "info_tributaria": {
                    "razon_social": doc["ciadescri"],
                    "ruc": doc["ciaruc"],
                    "estab": doc["sriserie01"],
                    "pto_emi": doc["sriserie02"],
                    "secuencial": str(doc["retnumero"]).strip().zfill(9),
                    "dir_matriz": doc["ciadirec"] or "S/N",
                    "logo_bytes": logo_bytes,
                    # --- AGREGADOS PARA EL NUEVO PDF ---
                    "resolucion_agente": doc.get("cianumresolucion", ""),
                    "telefono": "",
                    "correo": doc.get("proemail", ""),
                },
                "info_factura": {
                    "dir_establecimiento": doc["locciadirec"] or "S/N",
                    "obligado_contabilidad": obligado_cont,
                    "razon_social_comprador": doc["retnombre"],
                    "identificacion_comprador": id_retenido,
                    "fecha_emision": fecha_emision_str,
                    "periodo_fiscal": periodo_fiscal,
                },
                "detalles": [dict(d) for d in detalles],
                "info_adicional": [
                    {"nombre": "Email", "valor": doc["proemail"] or "S/N"},
                    # --- AGREGADO PARA QUE EL PDF LO LEA EN LA INFO DEL PROVEEDOR ---
                    {"nombre": "Direccion", "valor": doc["retdirec"] or "S/N"},
                ],
                "tipo_emision": tipo_emision,
            }

            try:
                dir_base = pathlib.Path(__file__).resolve().parent.parent.parent / "IntegracionFacturacionElectronica" / "retenciones_rides"
                ruta_ride, _, _ = generate_ride_pdf_retencion(retencion_data, auth_data, clave_acceso, dir_base)
                if ruta_ride:
                    with open(ruta_ride, "rb") as f:
                        pdf_content = f.read()
            except Exception as e:
                print(f"Advertencia RIDE: No se pudo generar PDF: {e}")

        _guardar_estado_sri_bd(engine, ciacodigo, retid, loccodigo, clave_acceso, xml_ret, xml_firmado, xml_autorizado_final, pdf_content, is_auth_num, mensaje_bd, status_bd, usrcodigo, ipUser, doc)

        if estado_sri == "AUTORIZADO":
            num_aut = auth_data.get("numero_autorizacion", "")
            with engine.begin() as conn:
                conn.execute(text("UPDATE cxpcret SET sriautnumero = :aut, retelectronica = 1, retfecmsys = GETDATE(), retusumsys = :usr WHERE ciacodigo = :cia AND retid = :retid"), {"aut": num_aut, "usr": usrcodigo, "cia": ciacodigo, "retid": retid})
            return jsonify({"success": True, "message": "Retención Autorizada exitosamente", "numero_autorizacion": num_aut})
        else:
            return jsonify({"success": False, "message": f"SRI Rechazó en Autorización: {mensaje_bd}"})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error interno: {str(e)}"}), 500


def _guardar_estado_sri_bd(engine, ciacodigo, retid, loccodigo, clave_acceso, xml_origen, xml_firmado, xml_autorizado, pdf_content, is_auth, mensaje_bd, status_sri, usrcodigo, ipUser, doc):
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    correo = str(doc.get("proemail") or "").strip()

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM siacdocelectronicos WHERE ciacodigo = :ciacodigo AND facnumfac = :retid AND loccodigo = :loccodigo"), {"ciacodigo": ciacodigo, "retid": retid, "loccodigo": loccodigo})

        conn.execute(
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
                    :ciacodigo, :retid, :loccodigo, :sriclave, '07',
                    CAST(:srixmlorigen AS VARBINARY(MAX)), CAST(:srixmlfirmado AS VARBINARY(MAX)), CAST(:srixmlautorizado AS VARBINARY(MAX)), CAST(:sripdf AS VARBINARY(MAX)),
                    :srifirmado, :sriautorizado, 0, 0, 1, '', :sridestinatario, :srisubject, :srimensaje, :sriruc, :sristatus, 1,
                    :fec, :hor, :usr, :ip, :fec, :hor, :usr, :ip
                )
            """
            ),
            {
                "ciacodigo": ciacodigo,
                "retid": retid,
                "loccodigo": loccodigo,
                "sriclave": clave_acceso,
                "srixmlorigen": xml_origen.encode("utf-8") if xml_origen else None,
                "srixmlfirmado": xml_firmado.encode("utf-8") if xml_firmado else None,
                "srixmlautorizado": xml_autorizado.encode("utf-8") if xml_autorizado else None,
                "sripdf": pdf_content,
                "srifirmado": 1 if xml_firmado else 0,
                "sriautorizado": is_auth,
                "sridestinatario": correo,
                "srisubject": f"Comprobante de Retención {retid}",
                "srimensaje": mensaje_bd[:500],
                "sriruc": str(doc.get("ciaruc", "")).strip(),
                "sristatus": status_sri,
                "fec": fecha_con_hora_cero,
                "hor": fecha_formato_1900,
                "usr": usrcodigo,
                "ip": ipUser,
            },
        )


def get_certificate_credentials(clicianonBD, ciacodigo):
    try:
        db_session = get_session(clicianonBD)
        with db_session.bind.connect() as conn:
            locpathxml = conn.execute(text("SELECT locpathxml FROM cgblocal WHERE ciacodigo = :cia"), {"cia": ciacodigo}).scalar()
            res = conn.execute(text("SELECT COALESCE(d.documento, o.documento), COALESCE(d.doc_datos_sensibles, o.doc_datos_sensibles) FROM gdocmdocumentos d LEFT JOIN gdocmdocumentos o ON d.documento_origen_uuid = o.documentouuid WHERE d.documentouuid = :uuid"), {"uuid": locpathxml}).first()

            if not res or not res[0]:
                return None, None
            p12_bytes = res[0]
            datos_sensibles = res[1].decode("utf-8").strip()
            while datos_sensibles and ord(datos_sensibles[-1]) < 32:
                datos_sensibles = datos_sensibles[:-1]
            return p12_bytes, json.loads(desencriptar(datos_sensibles)).get("clave_certificado", "")
    except Exception:
        return None, None
