from flask import request, jsonify
from app.GuiadeRemisionDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
import time
import json
from pathlib import Path
import re

# =========================================================================
# REUTILIZAMOS SU MOTOR DE FACTURACIÓN ELECTRÓNICA
# =========================================================================
from app.IntegracionFacturacionElectronica.utils.generate_clave_acceso import generate_clave_acceso
from app.IntegracionFacturacionElectronica.utils.sign_xml import sign_xml
from app.IntegracionFacturacionElectronica.utils.sri_services import send_receipt, send_authorization, parse_authorization_response
from services.encrip_desencrip import desencriptar
from dotenv import load_dotenv
from decouple import config as config_env

load_dotenv()


def escape_xml(text_val):
    if not text_val:
        return ""
    return str(text_val).strip().replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&apos;")


def safe_strip(val):
    return str(val).strip() if val else ""


@bp.route("/autorizarSRI", methods=["POST"])
@jwt_required()
def autorizar_sri_guia():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]
        usrcodigo = claims["user"]

        ipUser = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
        ipUser = ipUser.split(",")[0].strip()[:30]

        payload = request.get_json()
        guinumero = payload.get("guinumero")

        if not guinumero:
            return jsonify({"success": False, "message": "No se proporcionó el número de Guía de Remisión"}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        # 1. EXTRAER CABECERA (IncGuia)
        sql_cabecera = text(
            """
            SELECT
                g.guinumero, g.facnumfac, g.clinombre, g.cliruc, g.guidirent, g.clidirec,
                g.transdescri, g.transruc, g.guiplacafinal, g.Motivo,
                g.guifecha, g.guifecfintrans, g.cliemail, g.ciucodigo,
                g.sriserie01, g.sriserie02, g.guianumero,
                g.ciaciaruc, g.ciaciadescri, g.ciaciadirec,
                g.fasriserie01, g.fasriserie02, g.fasrisecfin, g.fasriautnumero, g.fasriautfecemi,
                g.ciaciatelefono1,
                g.cianumresolucion,
                g.numsolanusri,
                g.ciaobligadocon,
                g.clicodigo,
                l.ciadirec as dirEstablecimiento
            FROM IncGuia g
            LEFT JOIN cgblocal l ON g.ciacodigo = l.ciacodigo AND g.loccodigo = l.loccodigo
            WHERE g.ciacodigo = :ciacodigo AND g.guinumero = :guinumero
        """
        )

        with engine.connect() as conn:
            doc = conn.execute(sql_cabecera, {"ciacodigo": ciacodigo, "guinumero": guinumero}).mappings().first()
            if not doc:
                return jsonify({"success": False, "message": "No se encontró la Guía en la BD"}), 404

            ciudescri = ""
            ciucodigo = doc.get("ciucodigo")
            if ciucodigo:
                sql_ciu = text("SELECT ciudescri FROM hotbciu WHERE ciucodigo = :ciucodigo")
                ciu_row = conn.execute(sql_ciu, {"ciucodigo": ciucodigo}).first()
                if ciu_row:
                    ciudescri = safe_strip(ciu_row[0])

            sql_cia = text("SELECT cialogo, ciaemail FROM siaccia WHERE ciacodigo = :ciacodigo")
            cia_row = conn.execute(sql_cia, {"ciacodigo": ciacodigo}).mappings().first()
            logo_bytes = cia_row["cialogo"] if cia_row and cia_row["cialogo"] else None
            email_compania = cia_row["ciaemail"] if cia_row else ""

            # Info cliente
            telefono_cliente = ""
            clicodigo = doc.get("clicodigo")
            if clicodigo:
                sql_cliente = text(
                    """
                    SELECT clitelef1
                    FROM cxcmcli
                    WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
                """
                )
                cliente_row = conn.execute(sql_cliente, {"ciacodigo": ciacodigo, "clicodigo": clicodigo}).mappings().first()

                if cliente_row:
                    telefono_cliente = cliente_row.get("clitelef1", "") or ""

            sql_detalles = text(
                """
                SELECT artcodigo, artdescri, guicantdoc
                FROM IntGuia
                WHERE ciacodigo = :ciacodigo AND guinumero = :guinumero
                ORDER BY guisecuencia
            """
            )
            detalles = conn.execute(sql_detalles, {"ciacodigo": ciacodigo, "guinumero": guinumero}).mappings().fetchall()

        # =================================================================
        # LIMPIEZA Y PREPARACIÓN DE DATOS
        # =================================================================
        ambiente = "1"
        tipo_emision = "1"

        dt_ini = doc["guifecha"]
        dt_fin = doc.get("guifecfintrans") or dt_ini
        if dt_fin < dt_ini:
            dt_fin = dt_ini

        fecha_ini_str = dt_ini.strftime("%d/%m/%Y")
        fecha_fin_str = dt_fin.strftime("%d/%m/%Y")

        transruc = safe_strip(doc["transruc"])
        if not transruc:
            transruc = "9999999999999"
        tipo_id_trans = "04" if len(transruc) == 13 else "05" if len(transruc) == 10 else "06"

        cliruc = safe_strip(doc["cliruc"]) or "9999999999999"
        ciaciaruc = safe_strip(doc["ciaciaruc"])

        sriserie01 = safe_strip(doc["sriserie01"]).zfill(3)
        sriserie02 = safe_strip(doc["sriserie02"]).zfill(3)
        secuencial = str(int(doc["guianumero"] or 0)).zfill(9)

        razonSocial = escape_xml(doc["ciaciadescri"] or "S/N")[:290]
        dirMatriz = escape_xml(doc["ciaciadirec"] or "S/N")[:290]
        dirEstablecimiento = escape_xml(doc["dirEstablecimiento"] or doc["ciaciadirec"] or "S/N")[:290]
        dirPartida = escape_xml(doc["ciaciadirec"] or "S/N")[:290]
        razonSocialTransportista = escape_xml(doc["transdescri"] or "S/N")[:290]
        razonSocialDestinatario = escape_xml(doc["clinombre"] or "CONSUMIDOR FINAL")[:290]

        dirDestinatarioCruda = safe_strip(doc.get("guidirent", "S/N"))
        if ciudescri and ciudescri.lower() not in dirDestinatarioCruda.lower():
            dirDestinatarioCruda = f"{dirDestinatarioCruda} - {ciudescri}"

        dirDestinatario = escape_xml(dirDestinatarioCruda)[:290]
        motivoTraslado = escape_xml(doc["Motivo"] or "VENTA")[:290]

        placa_cruda = safe_strip(doc["guiplacafinal"])
        placa_limpia = re.sub(r"[^a-zA-Z0-9]", "", placa_cruda)
        placa = escape_xml(placa_limpia or "XXX0000")[:20]
        ruta_str = escape_xml(f"De {dirPartida} a {dirDestinatario}")[:290]

        # 2. GENERAR CLAVE DE ACCESO
        clave_acceso, err_ca, det_ca = generate_clave_acceso(fecha_emision=fecha_ini_str, cod_doc="06", ruc=ciaciaruc, ambiente=ambiente, serie=f"{sriserie01}{sriserie02}", secuencial=secuencial, codigo_numerico="12345678", tipo_emision=tipo_emision)
        if not clave_acceso:
            return jsonify({"success": False, "message": f"Error en Clave Acceso: {err_ca}"}), 500

        # 3. CONSTRUIR XML ESTRUCTURADO XSD GUIA REMISION (v1.1.0)
        xml_gr = f"""<?xml version="1.0" encoding="UTF-8"?>
<guiaRemision id="comprobante" version="1.1.0">
    <infoTributaria>
        <ambiente>{ambiente}</ambiente>
        <tipoEmision>{tipo_emision}</tipoEmision>
        <razonSocial>{razonSocial}</razonSocial>
        <ruc>{ciaciaruc}</ruc>
        <claveAcceso>{clave_acceso}</claveAcceso>
        <codDoc>06</codDoc>
        <estab>{sriserie01}</estab>
        <ptoEmi>{sriserie02}</ptoEmi>
        <secuencial>{secuencial}</secuencial>
        <dirMatriz>{dirMatriz}</dirMatriz>
    </infoTributaria>
    <infoGuiaRemision>
        <dirEstablecimiento>{dirEstablecimiento}</dirEstablecimiento>
        <dirPartida>{dirPartida}</dirPartida>
        <razonSocialTransportista>{razonSocialTransportista}</razonSocialTransportista>
        <tipoIdentificacionTransportista>{tipo_id_trans}</tipoIdentificacionTransportista>
        <rucTransportista>{transruc}</rucTransportista>
        <obligadoContabilidad>SI</obligadoContabilidad>
        <fechaIniTransporte>{fecha_ini_str}</fechaIniTransporte>
        <fechaFinTransporte>{fecha_fin_str}</fechaFinTransporte>
        <placa>{placa}</placa>
    </infoGuiaRemision>
    <destinatarios>
        <destinatario>
            <identificacionDestinatario>{cliruc}</identificacionDestinatario>
            <razonSocialDestinatario>{razonSocialDestinatario}</razonSocialDestinatario>
            <dirDestinatario>{dirDestinatario}</dirDestinatario>
            <motivoTraslado>{motivoTraslado}</motivoTraslado>"""

        # =================================================================
        # LA LLAVE MAESTRA DEL SRI: SIEMPRE 001
        # =================================================================
        xml_cod_estab = "<codEstabDestino>001</codEstabDestino>"

        facnumfac = safe_strip(doc.get("facnumfac"))
        aut_sustento = safe_strip(doc.get("fasriautnumero"))
        num_sustento = ""

        if facnumfac and len(facnumfac) >= 9:
            secuencia_sustento = facnumfac[-9:]
            fasriserie01 = safe_strip(doc.get("fasriserie01", "001")).zfill(3)
            fasriserie02 = safe_strip(doc.get("fasriserie02", "001")).zfill(3)

            if not secuencia_sustento.isdigit():
                secuencia_sustento = "000000001"

            num_sustento = f"{fasriserie01}-{fasriserie02}-{secuencia_sustento}"

            fasriautfecemi = doc.get("fasriautfecemi")
            fecha_sustento = fasriautfecemi.strftime("%d/%m/%Y") if fasriautfecemi else fecha_ini_str

            if len(aut_sustento) not in [10, 37, 49]:
                aut_sustento = "0000000000"

            xml_gr += f"""
            {xml_cod_estab}
            <ruta>{ruta_str}</ruta>
            <codDocSustento>01</codDocSustento>
            <numDocSustento>{num_sustento}</numDocSustento>
            <numAutDocSustento>{aut_sustento}</numAutDocSustento>
            <fechaEmisionDocSustento>{fecha_sustento}</fechaEmisionDocSustento>"""
        else:
            xml_gr += f"""
            {xml_cod_estab}
            <ruta>{ruta_str}</ruta>"""

        xml_gr += """
            <detalles>"""

        for det in detalles:
            cod_interno = escape_xml(det["artcodigo"] or "000")[:25]
            desc = escape_xml(det["artdescri"] or "S/N")[:290]
            xml_gr += f"""
                <detalle>
                    <codigoInterno>{cod_interno}</codigoInterno>
                    <descripcion>{desc}</descripcion>
                    <cantidad>{float(det["guicantdoc"] or 0):.2f}</cantidad>
                </detalle>"""

        xml_gr += """
            </detalles>
        </destinatario>
    </destinatarios>
</guiaRemision>"""

        # 4. OBTENER CERTIFICADO Y FIRMAR
        p12_bytes, clave_p12 = get_certificate_credentials(clicianonBD, ciacodigo)
        if not p12_bytes:
            return jsonify({"success": False, "message": "Credenciales del certificado no encontradas"}), 500

        xml_firmado, err_firma, _ = sign_xml(xml_sin_firmar=xml_gr, p12_bytes=p12_bytes, clave_p12=clave_p12)
        if not xml_firmado:
            return jsonify({"success": False, "message": f"Error firmando XML: {err_firma}"}), 500

        # 5. ENVIAR A RECEPCIÓN SRI
        receipt_resp, receipt_err, receipt_details = send_receipt(xml_firmado=xml_firmado, ambiente=ambiente)

        if receipt_resp is None or getattr(receipt_resp, "estado", "") == "DEVUELTO":
            detalle_sri = ""
            if receipt_details and isinstance(receipt_details, dict) and receipt_details.get("mensajes"):
                for m in receipt_details["mensajes"]:
                    detalle_sri += f" [{m.get('mensaje', '')}: {m.get('informacionAdicional', '')}]"
            error_final = detalle_sri.strip() if detalle_sri else receipt_err

            _guardar_estado_sri_bd(engine, ciacodigo, guinumero, loccodigo, clave_acceso, xml_gr, xml_firmado, None, None, 0, f"Error Recepción: {error_final}", "E", usrcodigo, ipUser, doc)

            return jsonify({"success": False, "message": f"SRI Rechazó el XML: {error_final}. XML Generado: {xml_gr}"}), 500

        time.sleep(2)
        auth_resp, auth_err, _ = send_authorization(clave_acceso=clave_acceso, ambiente=ambiente)
        if not auth_resp:
            return jsonify({"success": False, "message": f"Error Autorización: {auth_err}"}), 500

        auth_data = parse_authorization_response(auth_resp)
        estado_sri = auth_data.get("estado", "ERROR")

        detalle_errores = ""
        for m in auth_data.get("mensajes", []):
            detalle_errores += f" [{m.get('mensaje', '')}: {m.get('informacionAdicional', '')}]"

        mensaje_bd = f"Estado SRI: {estado_sri}{detalle_errores}"[:500]
        status_bd = "A" if estado_sri == "AUTORIZADO" else "R"
        is_auth_num = 1 if estado_sri == "AUTORIZADO" else 0

        # 6. GENERAR XML AUTORIZADO Y PDF RIDE
        xml_autorizado_final = None
        pdf_content = None

        if estado_sri == "AUTORIZADO":
            from app.IntegracionFacturacionElectronica.utils.sri_services import build_autorizacion_xml
            from app.IntegracionFacturacionElectronica.utils.generate_ride_pdf_remision import generate_ride_pdf_remision

            xml_autorizado_final = build_autorizacion_xml(auth_data, clave_acceso)

            guia_data = {
                "tipo_documento_nombre": "GUÍA DE REMISIÓN",
                "info_tributaria": {
                    "razon_social": doc["ciaciadescri"],
                    "ruc": ciaciaruc,
                    "estab": sriserie01,
                    "pto_emi": sriserie02,
                    "secuencial": secuencial,
                    "dir_matriz": doc["ciaciadirec"] or "S/N",
                    "logo_bytes": logo_bytes,
                    "contribuyente_especial": doc.get("cianumresolucion", ""),
                    "resolucion_agente": doc.get("numsolanusri", ""),
                    "exportador_habitual": "",
                    "telefono": doc.get("ciaciatelefono1", ""),
                    "correo": email_compania,  # Email de comapania
                },
                "info_guia": {
                    "dir_establecimiento": doc["dirEstablecimiento"] or "S/N",
                    "obligado_contabilidad": "SI",
                    "identificacion_transportista": transruc,
                    "razon_social_transportista": doc["transdescri"],
                    "placa": placa,
                    "punto_partida": doc.get("ciaciadirec", "S/N"),
                    "fecha_inicio_transporte": fecha_ini_str,
                    "fecha_fin_transporte": doc.get("guifecfintrans", fecha_ini_str),
                    "motivo_traslado": doc["Motivo"] or "VENTA",
                    "destino": doc.get("clidirec", "S/N"),
                    "identificacion_destinatario": cliruc,
                    "razon_social_destinatario": doc["clinombre"] or "CONSUMIDOR FINAL",
                    "ruta": ruta_str,
                    "cod_estab_destino": "",
                    "comprobante_venta": num_sustento if num_sustento else "",
                    "fecha_emision_comprobante": "",
                    "num_aut_comprobante": "",
                    "doc_aduanero": "",
                },
                "detalles": [{"cantidad": float(det["guicantdoc"] or 0), "descripcion": det["artdescri"], "codigo_principal": det["artcodigo"], "codigo_auxiliar": ""} for det in detalles],
                "info_adicional": [
                    {"nombre": "Telefono", "valor": telefono_cliente or "S/N"},  # Telefono cliente
                    {"nombre": "Email", "valor": doc.get("cliemail", "")},
                ],
                "tipo_emision": tipo_emision,
            }

            if num_sustento:
                guia_data["info_adicional"].append({"nombre": "Documento Sustento", "valor": num_sustento})

            try:
                if config_env("DOC_ELECTRONICOS_RIDES_REMISION_PDF_ENABLED") == "true":
                    ahora = datetime.now()
                    ride_dir = Path(config_env("DOC_ELECTRONICOS_RIDES_REMISION_PDF_PATH")) / "GuiasRemision" / str(ahora.year) / f"{ahora.month:02d}" / f"{ahora.day:02d}"
                    ruta_ride, _, _ = generate_ride_pdf_remision(guia_data, auth_data, clave_acceso, ride_dir)

                    if ruta_ride:
                        with open(ruta_ride, "rb") as f:
                            pdf_content = f.read()
            except Exception as e:
                print(f"Advertencia RIDE: No se pudo generar PDF automáticamente: {e}")

        # 7. ACTUALIZAR BASE DE DATOS
        _guardar_estado_sri_bd(engine, ciacodigo, guinumero, loccodigo, clave_acceso, xml_gr, xml_firmado, xml_autorizado_final, pdf_content, is_auth_num, mensaje_bd, status_bd, usrcodigo, ipUser, doc)

        if estado_sri == "AUTORIZADO":
            num_aut = auth_data.get("numero_autorizacion", "")
            fec_aut = auth_data.get("fecha_autorizacion", datetime.now())

            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        UPDATE IncGuia SET sriautnumero = :aut, sriautfecemi = :fecaut, guielectronica = 1,
                                           guifecmsys = GETDATE(), guiusumsys = :usr
                        WHERE ciacodigo = :cia AND guinumero = :gui
                    """
                    ),
                    {"aut": num_aut, "fecaut": fec_aut, "usr": usrcodigo, "cia": ciacodigo, "gui": guinumero},
                )

            return jsonify({"success": True, "message": "Guía de Remisión Autorizada", "numero_autorizacion": num_aut})
        else:
            return jsonify({"success": False, "message": f"SRI rechazó Autorización: {mensaje_bd}"})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error interno: {str(e)}"}), 500


def _guardar_estado_sri_bd(engine, ciacodigo, guinumero, loccodigo, clave_acceso, xml_origen, xml_firmado, xml_autorizado, pdf_content, is_auth, mensaje_bd, status_sri, usrcodigo, ipUser, doc):
    fecha_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM siacdocelectronicos WHERE ciacodigo = :cia AND facnumfac = :fac"), {"cia": ciacodigo, "fac": guinumero})
        conn.execute(
            text(
                """
                INSERT INTO siacdocelectronicos (
                    ciacodigo, facnumfac, loccodigo, sriclave, sridocumento,
                    srixmlorigen, srixmlfirmado, srixmlautorizado, sripdf,
                    srifirmado, sriautorizado, sricontingencia, srilote, sriprocesado, sripath, sridestinatario, srisubject,
                    srimensaje, sriruc, sristatus, srienvio,
                    srifecisys, srihorisys, sriusuisys, sriestisys, srifecmsys, srihormsys, sriusumsys, sriestmsys
                ) VALUES (
                    :cia, :fac, :loc, :clave, '06',
                    CAST(:xmlorigen AS VARBINARY(MAX)), CAST(:xmlfirmado AS VARBINARY(MAX)),
                    CAST(:xmlautorizado AS VARBINARY(MAX)), CAST(:pdf AS VARBINARY(MAX)),
                    :firmado, :isauth, 0, 0, 1, '', :email, 'Guia de Remision Electronica',
                    :msg, :ruc, :status, 1,
                    :fec0, :fec1900, :usr, :ip, :fec0, :fec1900, :usr, :ip
                )
            """
            ),
            {
                "cia": ciacodigo,
                "fac": guinumero,
                "loc": loccodigo,
                "clave": clave_acceso,
                "xmlorigen": xml_origen.encode("utf-8") if xml_origen else None,
                "xmlfirmado": xml_firmado.encode("utf-8") if xml_firmado else None,
                "xmlautorizado": xml_autorizado.encode("utf-8") if xml_autorizado else None,
                "pdf": pdf_content,
                "firmado": 1 if xml_firmado else 0,
                "isauth": is_auth,
                "email": doc.get("cliemail", ""),
                "msg": mensaje_bd[:500],
                "ruc": safe_strip(doc.get("ciaciaruc")),
                "status": status_sri,
                "fec0": fecha_cero,
                "fec1900": fecha_1900,
                "usr": usrcodigo,
                "ip": ipUser,
            },
        )


def get_certificate_credentials(clicianonBD, ciacodigo):
    try:
        db_session = get_session(clicianonBD)
        with db_session.bind.connect() as conn:
            locpathxml = conn.execute(text("SELECT locpathxml FROM cgblocal WHERE ciacodigo = :cia"), {"cia": ciacodigo}).scalar()
            res = conn.execute(
                text(
                    """
                    SELECT COALESCE(d.documento, o.documento), COALESCE(d.doc_datos_sensibles, o.doc_datos_sensibles)
                    FROM gdocmdocumentos d LEFT JOIN gdocmdocumentos o ON d.documento_origen_uuid = o.documentouuid WHERE d.documentouuid = :uuid
                """
                ),
                {"uuid": locpathxml},
            ).first()

            if not res or not res[0]:
                return None, None

            p12_bytes = res[0]
            datos_sensibles = res[1].decode("utf-8").strip()
            while datos_sensibles and ord(datos_sensibles[-1]) < 32:
                datos_sensibles = datos_sensibles[:-1]
            return p12_bytes, json.loads(desencriptar(datos_sensibles)).get("clave_certificado", "")
    except Exception:
        return None, None
