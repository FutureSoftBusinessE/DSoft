from flask import request, jsonify
from app.NotaDebitoDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
import time
import json

# =========================================================================
# REUTILIZAMOS SU MOTOR DE FACTURACIÓN ELECTRÓNICA
# =========================================================================
from app.IntegracionFacturacionElectronica.utils.generate_clave_acceso import generate_clave_acceso
from app.IntegracionFacturacionElectronica.utils.sign_xml import sign_xml
from app.IntegracionFacturacionElectronica.utils.sri_services import send_receipt, send_authorization, parse_authorization_response
from services.encrip_desencrip import desencriptar


def escape_xml(text_val):
    if not text_val:
        return ""
    return str(text_val).strip().replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&apos;")


def get_codigo_porcentaje_iva(porcentaje):
    p = float(porcentaje)
    if p == 0:
        return "0"
    if p == 12:
        return "2"
    if p == 14:
        return "3"
    if p == 15:
        return "4"
    if p == 5:
        return "5"
    return "0"


@bp.route("/autorizarSRI", methods=["POST"])
@jwt_required()
def autorizar_sri_nota_debito():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]
        usrcodigo = claims["user"]

        ipUser = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
        ipUser = ipUser.split(",")[0].strip()[:30]

        payload = request.get_json()
        facnumfac = payload.get("facnumfac")

        if not facnumfac:
            return jsonify({"success": False, "message": "No se proporcionó el número de Nota de Débito"}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        sql_data = text(
            """
            SELECT
                f.ciaciaruc as ruc, f.ciaciadescri as razonSocial, f.ciaciadirec as dirMatriz,
                f.locciadirec as dirEstablecimiento, f.cianumresolucion as num_resolucion,
                f.sriserie01 as estab, f.sriserie02 as ptoEmi, f.facnumero as secuencial,
                f.facfecemi as fechaEmision, f.cliruc as idComprador, f.clinombre as razonSocialComprador,
                f.facsubtot as totalSinImpuestos, f.factotal as valorTotal,
                f.factivapor, f.factivacer, f.faciva, f.facporiva, f.facdetalle as observacion,
                f.factippag as formaPago, f.facnumref as docModificado,
                o.sriserie01 as o_estab, o.sriserie02 as o_ptoEmi, o.facnumero as o_secuencial,
                o.facfecemi as o_fechaEmision,
                c.cliemail, c.cliidentifica
            FROM facfac f
            LEFT JOIN facfac o ON f.ciacodigo = o.ciacodigo AND f.facnumref = o.facnumfac
            LEFT JOIN cxcmcli c ON f.ciacodigo = c.ciacodigo AND f.clicodigo = c.clicodigo
            WHERE f.ciacodigo = :ciacodigo AND f.loccodigo = :loccodigo AND f.facnumfac = :facnumfac
        """
        )

        with engine.connect() as conn:
            doc = conn.execute(sql_data, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "facnumfac": facnumfac}).mappings().first()
            if not doc:
                return jsonify({"success": False, "message": "No se encontró el documento en la BD"}), 404

            # --- EXTRAER LOGO ---
            sql_cia = text("SELECT cialogo FROM siaccia WHERE ciacodigo = :ciacodigo")
            cia_row = conn.execute(sql_cia, {"ciacodigo": ciacodigo}).first()
            logo_bytes = cia_row[0] if cia_row and cia_row[0] else None

            # --- EXTRAER CÓDIGO Y DESCRIPCIÓN REAL DEL DETALLE ---
            sql_det = text(
                """
                SELECT TOP 1 t.sercodigo, COALESCE(a.artdescri, s.serdescri, t.sercodigo) as artdescri
                FROM fatfac t
                LEFT JOIN inmart a ON t.ciacodigo = a.ciacodigo AND t.sercodigo = a.artcodigo
                LEFT JOIN cxcbser s ON t.ciacodigo = s.ciacodigo AND t.sercodigo = s.sercodigo
                WHERE t.ciacodigo = :ciacodigo AND t.facnumfac = :facnumfac
            """
            )
            det_row = conn.execute(sql_det, {"ciacodigo": ciacodigo, "facnumfac": facnumfac}).mappings().first()

            sercodigo = det_row["sercodigo"] if det_row and det_row["sercodigo"] else "ND"
            artdescri = det_row["artdescri"] if det_row and det_row["artdescri"] else (doc["observacion"] or "Modificación de comprobante")

        # Limpieza y preparación de datos
        ambiente = "1"
        tipo_emision = "1"
        fecha_emision_str = doc["fechaEmision"].strftime("%d/%m/%Y")

        id_comprador = str(doc["idComprador"]).strip() if doc["idComprador"] else "9999999999999"
        if id_comprador == "9999999999999":
            tipo_id = "07"
            id_comprador = "9999999999999"
        elif len(id_comprador) == 13:
            tipo_id = "04"
        elif len(id_comprador) == 10:
            tipo_id = "05"
        else:
            tipo_id = "06"

        o_estab = str(doc["o_estab"]).strip() if doc["o_estab"] else "001"
        o_ptoEmi = str(doc["o_ptoEmi"]).strip() if doc["o_ptoEmi"] else "001"
        o_sec = str(doc["o_secuencial"]).strip() if doc["o_secuencial"] else "1"

        doc_sustento = f"{o_estab}-{o_ptoEmi}-{o_sec.zfill(9)}"
        fecha_sustento_str = doc["o_fechaEmision"].strftime("%d/%m/%Y") if doc.get("o_fechaEmision") else fecha_emision_str

        # =========================================================================
        # 2. GENERAR CLAVE DE ACCESO
        # =========================================================================
        clave_acceso, err_ca, det_ca = generate_clave_acceso(
            fecha_emision=fecha_emision_str, cod_doc="05", ruc=str(doc["ruc"]).strip(), ambiente=ambiente, serie=f"{str(doc['estab']).strip()}{str(doc['ptoEmi']).strip()}", secuencial=str(doc["secuencial"]).strip().zfill(9), codigo_numerico="12345678", tipo_emision=tipo_emision
        )
        if not clave_acceso:
            return jsonify({"success": False, "message": f"Error en Clave de Acceso: {err_ca}"}), 500

        # =========================================================================
        # 3. CONSTRUIR XML ESTRUCTURADO XSD NOTA DÉBITO (v1.0.0)
        # =========================================================================
        dir_matriz = escape_xml(doc["dirMatriz"]) or "S/N"
        dir_estab = escape_xml(doc["dirEstablecimiento"])
        razon_social = escape_xml(doc["razonSocial"]) or "N/A"
        razon_comprador = escape_xml(doc["razonSocialComprador"]) or "CONSUMIDOR FINAL"

        xml_nd = f"""<?xml version="1.0" encoding="UTF-8"?>
<notaDebito id="comprobante" version="1.0.0">
    <infoTributaria>
        <ambiente>{ambiente}</ambiente>
        <tipoEmision>{tipo_emision}</tipoEmision>
        <razonSocial>{razon_social}</razonSocial>
        <ruc>{doc["ruc"].strip()}</ruc>
        <claveAcceso>{clave_acceso}</claveAcceso>
        <codDoc>05</codDoc>
        <estab>{doc["estab"].strip()}</estab>
        <ptoEmi>{doc["ptoEmi"].strip()}</ptoEmi>
        <secuencial>{str(doc["secuencial"]).strip().zfill(9)}</secuencial>
        <dirMatriz>{dir_matriz}</dirMatriz>
    </infoTributaria>
    <infoNotaDebito>
        <fechaEmision>{fecha_emision_str}</fechaEmision>"""

        if dir_estab:
            xml_nd += f"\n        <dirEstablecimiento>{dir_estab}</dirEstablecimiento>"

        xml_nd += f"""
        <tipoIdentificacionComprador>{tipo_id}</tipoIdentificacionComprador>
        <razonSocialComprador>{razon_comprador}</razonSocialComprador>
        <identificacionComprador>{id_comprador}</identificacionComprador>
        <obligadoContabilidad>SI</obligadoContabilidad>
        <codDocModificado>01</codDocModificado>
        <numDocModificado>{doc_sustento}</numDocModificado>
        <fechaEmisionDocSustento>{fecha_sustento_str}</fechaEmisionDocSustento>
        <totalSinImpuestos>{doc["totalSinImpuestos"]:.2f}</totalSinImpuestos>
        <impuestos>"""

        if float(doc["factivapor"]) > 0:
            xml_nd += f"""
            <impuesto>
                <codigo>2</codigo>
                <codigoPorcentaje>{get_codigo_porcentaje_iva(doc["facporiva"])}</codigoPorcentaje>
                <tarifa>{doc["facporiva"]:.2f}</tarifa>
                <baseImponible>{doc["factivapor"]:.2f}</baseImponible>
                <valor>{doc["faciva"]:.2f}</valor>
            </impuesto>"""

        if float(doc["factivacer"]) > 0:
            xml_nd += f"""
            <impuesto>
                <codigo>2</codigo>
                <codigoPorcentaje>0</codigoPorcentaje>
                <tarifa>0.00</tarifa>
                <baseImponible>{doc["factivacer"]:.2f}</baseImponible>
                <valor>0.00</valor>
            </impuesto>"""

        xml_nd += f"""
        </impuestos>
        <valorTotal>{doc["valorTotal"]:.2f}</valorTotal>
    </infoNotaDebito>
    <motivos>
        <motivo>
            <razon>{escape_xml(doc["observacion"] or 'Modificacion de comprobante')}</razon>
            <valor>{doc["totalSinImpuestos"]:.2f}</valor>
        </motivo>
    </motivos>
</notaDebito>"""

        p12_bytes, clave_p12 = get_certificate_credentials(clicianonBD, claims["seleccion"]["cliciaciacodigo"])
        if not p12_bytes:
            return jsonify({"success": False, "message": "No se encontraron credenciales del certificado (.p12)"}), 500

        xml_firmado, err_firma, _ = sign_xml(xml_sin_firmar=xml_nd, p12_bytes=p12_bytes, clave_p12=clave_p12)
        if not xml_firmado:
            return jsonify({"success": False, "message": f"Error firmando XML: {err_firma}"}), 500

        receipt_resp, receipt_err, receipt_details = send_receipt(xml_firmado=xml_firmado, ambiente=ambiente)

        if receipt_resp is None or getattr(receipt_resp, "estado", "") == "DEVUELTO":
            detalle_sri = ""
            if receipt_details and isinstance(receipt_details, dict) and receipt_details.get("mensajes"):
                for m in receipt_details["mensajes"]:
                    detalle_sri += f" [{m.get('mensaje', '')}: {m.get('informacionAdicional', '')}]"

            error_final = detalle_sri.strip() if detalle_sri else receipt_err
            _guardar_estado_sri_bd(engine, ciacodigo, facnumfac, loccodigo, clave_acceso, xml_nd, xml_firmado, None, None, 0, f"Error Recepción: {error_final}", "E", usrcodigo, ipUser, doc)
            return jsonify({"success": False, "message": f"SRI Rechazó el XML: {error_final}"}), 500

        time.sleep(2)
        auth_resp, auth_err, _ = send_authorization(clave_acceso=clave_acceso, ambiente=ambiente)

        if not auth_resp:
            return jsonify({"success": False, "message": f"Error consultando Autorización: {auth_err}"}), 500

        auth_data = parse_authorization_response(auth_resp)
        estado_sri = auth_data.get("estado", "ERROR")

        detalle_errores = ""
        for m in auth_data.get("mensajes", []):
            detalle_errores += f" [{m.get('mensaje', '')}: {m.get('informacionAdicional', '')}]"

        mensaje_bd = f"Estado SRI: {estado_sri}{detalle_errores}"[:500]
        status_bd = "A" if estado_sri == "AUTORIZADO" else "R"
        is_auth_num = 1 if estado_sri == "AUTORIZADO" else 0

        # =========================================================================
        # GENERAR XML AUTORIZADO Y PDF RIDE
        # =========================================================================
        xml_autorizado_final = None
        pdf_content = None

        if estado_sri == "AUTORIZADO":
            from app.IntegracionFacturacionElectronica.utils.sri_services import build_autorizacion_xml
            from app.IntegracionFacturacionElectronica.utils.generate_ride_pdf import generate_ride_pdf
            import pathlib

            xml_autorizado_final = build_autorizacion_xml(auth_data, clave_acceso)

            # --- INYECCIÓN DE DATOS DINÁMICOS PARA EL RIDE ---
            nota_data = {
                "tipo_documento_nombre": "NOTA DE DÉBITO",
                "info_tributaria": {
                    "razon_social": doc["razonSocial"],
                    "ruc": doc["ruc"],
                    "estab": doc["estab"],
                    "pto_emi": doc["ptoEmi"],
                    "secuencial": str(doc["secuencial"]).strip().zfill(9),
                    "dir_matriz": doc["dirMatriz"] or "S/N",
                    # <-- LOGO DE LA BASE DE DATOS
                    "logo_bytes": logo_bytes,
                },
                "info_factura": {
                    "dir_establecimiento": doc["dirEstablecimiento"] or "S/N",
                    "obligado_contabilidad": "SI",
                    "razon_social_comprador": doc["razonSocialComprador"] or "CONSUMIDOR FINAL",
                    "identificacion_comprador": id_comprador,
                    "fecha_emision": fecha_emision_str,
                    "guia_remision": "",
                    "total_sin_impuestos": float(doc["totalSinImpuestos"]),
                    "total_descuento": 0.0,
                    "propina": 0.0,
                    "importe_total": float(doc["valorTotal"]),
                },
                "detalles": [
                    {
                        # <-- CÓDIGO REAL
                        "codigo_principal": sercodigo,
                        "cantidad": 1.0,
                        # <-- CÓDIGO REAL
                        "descripcion": artdescri,
                        "precio_unitario": float(doc["totalSinImpuestos"]),
                        "descuento": 0.0,
                        "precio_total_sin_impuesto": float(doc["totalSinImpuestos"]),
                    }
                ],
                "totales_impuestos": [{"valor": float(doc["faciva"])}],
                "pagos": [{"forma_pago": doc["formaPago"] or "01", "total": float(doc["valorTotal"]), "plazo": "", "unidad_tiempo": ""}],
                "info_adicional": [{"nombre": "Documento Modificado", "valor": f"Factura {doc_sustento}"}],
                "tipo_emision": tipo_emision,
            }

            try:
                dir_base = pathlib.Path(__file__).resolve().parent.parent.parent / "IntegracionFacturacionElectronica" / "facturas_rides"
                ruta_ride, _, _ = generate_ride_pdf(nota_data, auth_data, clave_acceso, dir_base)
                if ruta_ride:
                    with open(ruta_ride, "rb") as f:
                        pdf_content = f.read()
            except Exception as e:
                print(f"Advertencia RIDE: No se pudo generar PDF automáticamente: {e}")

        # Guardar en Base de datos enviando ahora la variable pdf_content
        _guardar_estado_sri_bd(engine, ciacodigo, facnumfac, loccodigo, clave_acceso, xml_nd, xml_firmado, xml_autorizado_final, pdf_content, is_auth_num, mensaje_bd, status_bd, usrcodigo, ipUser, doc)

        # ========== CONSTRUIR DATOS CORREO ==========
        email_destinatario = str(doc.get("cliemail") or "").strip()
        datos_correo = {}

        if email_destinatario:
            with engine.connect() as conn_correo:
                result_datos_correo = (
                    conn_correo.execute(
                        text(
                            """
                        SELECT emailsmtp, emailmascara, emailsalida, emailtema,
                            emailsubject, emailmensaje
                        FROM cgblocal
                        WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo
                    """
                        ),
                        {"ciacodigo": ciacodigo, "loccodigo": loccodigo},
                    )
                    .mappings()
                    .first()
                )

                if result_datos_correo:
                    datos_correo = {
                        "smtp_host": result_datos_correo["emailsmtp"] or "",
                        "puerto": result_datos_correo["emailmascara"] or "",
                        "email_salida": result_datos_correo["emailsalida"] or "",
                        "clave_email": result_datos_correo["emailtema"] or "",
                        "destinatario": email_destinatario,
                        "asunto": result_datos_correo["emailsubject"] or "Nota de Débito",
                        "mensaje": result_datos_correo["emailmensaje"] or "Adjuntamos su nota de débito electrónica.",
                    }

        if estado_sri == "AUTORIZADO":
            num_aut = auth_data.get("numero_autorizacion", "")
            fec_aut = auth_data.get("fecha_autorizacion", datetime.now())

            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        UPDATE facfac SET sriautnumero = :aut, sriautfecemi = :fecaut, facelectronica = 1,
                                          facfecmsys = GETDATE(), facusumsys = :usr
                        WHERE ciacodigo = :cia AND facnumfac = :fac AND loccodigo = :loc
                    """
                    ),
                    {"aut": num_aut, "fecaut": fec_aut, "cia": ciacodigo, "fac": facnumfac, "loc": loccodigo},
                )

                # ========== ENCOLAR ENVÍO DE CORREO ==========
                if email_destinatario and pdf_content and datos_correo:
                    from app.utils.encolar_envio_correo_docelectronico import encolar_envio_correo_docelectronico

                    encolar_envio_correo_docelectronico(connection=conn, ciacodigo=ciacodigo, facnumfac=facnumfac, loccodigo=loccodigo, datos_correo=datos_correo, usrcodigo=usrcodigo, ip_usuario=ipUser)

            return jsonify({"success": True, "message": "Nota de Débito Autorizada exitosamente", "numero_autorizacion": num_aut})
        else:
            return jsonify({"success": False, "message": f"El SRI rechazó el documento en Autorización: {mensaje_bd}"})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error interno: {str(e)}"}), 500


def _guardar_estado_sri_bd(engine, ciacodigo, facnumfac, loccodigo, clave_acceso, xml_origen, xml_firmado, xml_autorizado, pdf_content, is_auth, mensaje_bd, status_sri, usrcodigo, ipUser, doc):
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM siacdocelectronicos WHERE ciacodigo = :ciacodigo AND facnumfac = :facnumfac AND loccodigo = :loccodigo"), {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo})

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
                    :ciacodigo, :facnumfac, :loccodigo, :sriclave, :sridocumento,
                    CAST(:srixmlorigen AS VARBINARY(MAX)),
                    CAST(:srixmlfirmado AS VARBINARY(MAX)),
                    CAST(:srixmlautorizado AS VARBINARY(MAX)),
                    CAST(:sripdf AS VARBINARY(MAX)),
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
                "sridocumento": "05",
                "srixmlorigen": xml_origen.encode("utf-8") if xml_origen else None,
                "srixmlfirmado": xml_firmado.encode("utf-8") if xml_firmado else None,
                "srixmlautorizado": xml_autorizado.encode("utf-8") if xml_autorizado else None,
                "sripdf": pdf_content,
                "srifirmado": 1 if xml_firmado else 0,
                "sriautorizado": is_auth,
                "sricontingencia": 0,
                "srilote": 0,
                "sriprocesado": 1,
                "sripath": "",
                "sridestinatario": doc.get("cliemail", ""),
                "srisubject": f"Nota de Débito Electrónica {facnumfac}",
                "srimensaje": mensaje_bd[:500],
                "sriruc": str(doc.get("ruc", "")).strip(),
                "sristatus": status_sri,
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


def get_certificate_credentials(clicianonBD, ciacodigo):
    try:
        db_session = get_session(clicianonBD)
        with db_session.bind.connect() as conn:
            locpathxml = conn.execute(text("SELECT locpathxml FROM cgblocal WHERE ciacodigo = :cia"), {"cia": ciacodigo}).scalar()
            res = conn.execute(
                text(
                    """
                    SELECT COALESCE(d.documento, o.documento), COALESCE(d.doc_datos_sensibles, o.doc_datos_sensibles)
                    FROM gdocmdocumentos d
                    LEFT JOIN gdocmdocumentos o ON d.documento_origen_uuid = o.documentouuid
                    WHERE d.documentouuid = :uuid
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

            datos_json = json.loads(desencriptar(datos_sensibles))
            return p12_bytes, datos_json.get("clave_certificado", "")
    except Exception as e:
        print(f"Error obteniendo: {e}")
        return None, None
