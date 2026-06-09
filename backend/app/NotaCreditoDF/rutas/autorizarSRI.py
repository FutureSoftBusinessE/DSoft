from flask import request, jsonify
from app.NotaCreditoDF import bp
from app.extensions import db
from flask_cors import cross_origin
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
def autorizar_sri_nota_credito():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]
        usrcodigo = claims["user"]

        ipUser = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
        ipUser = ipUser.split(",")[0].strip()[:30]

        payload = request.get_json()
        nccodigo = payload.get("nccodigo")

        if not nccodigo:
            return jsonify({"success": False, "message": "No se proporcionó el número de Nota de Crédito"}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        # =========================================================================
        # 1. EXTRAER CABECERA (cxccnc)
        # =========================================================================
        sql_data = text(
            """
            SELECT
                n.ciaciaruc as ruc, n.ciaciadescri as razonSocial, n.ciaciadirec as dirMatriz,
                n.locciadirec as dirEstablecimiento, n.cianumresolucion as num_resolucion,
                n.sriserie01 as estab, n.sriserie02 as ptoEmi, n.ncnumero as secuencial,
                n.ncfecemi as fechaEmision, n.cliruc as idComprador, n.clinombre as razonSocialComprador,
                n.ncsubtot as totalSinImpuestos, n.ncmonto as valorModificacion,
                n.nctivapor, n.nctivacer, n.nctotiva, n.ncporiva, n.ncdetalle as motivo,
                n.ciaobligadocon,
                n.fasriserie01 as o_estab, n.fasriserie02 as o_ptoEmi, n.fasrisecfin as o_secuencial,
                n.fasriautfecemi as o_fechaEmision,
                n.cliemail, n.clidirec, c.clitelef1
            FROM cxccnc n
            LEFT JOIN cxcmcli c ON n.ciacodigo = c.ciacodigo AND n.clicodigo = c.clicodigo
            WHERE n.ciacodigo = :ciacodigo AND n.loccodigo = :loccodigo AND n.nccodigo = :nccodigo
        """
        )

        with engine.connect() as conn:
            doc = conn.execute(sql_data, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "nccodigo": nccodigo}).mappings().first()
            if not doc:
                return jsonify({"success": False, "message": "No se encontró la Nota de Crédito en la BD"}), 404

            # --- EXTRAER LOGO ---
            sql_cia = text("SELECT cialogo FROM siaccia WHERE ciacodigo = :ciacodigo")
            cia_row = conn.execute(sql_cia, {"ciacodigo": ciacodigo}).first()
            logo_bytes = cia_row[0] if cia_row and cia_row[0] else None

            # --- EXTRAER DETALLES (cxctnc) ---
            sql_det = text(
                """
                SELECT
                    COALESCE(t.artcodigo, t.sercodigo) as codigoInterno,
                    t.artdescri as descripcion,
                    t.artcantidad as cantidad,
                    t.artpvp as precioUnitario,
                    t.facvaldesc as descuento,
                    t.ncsubtot as precioTotalSinImpuesto,
                    t.artiva as tarifa,
                    t.artivamonto as valor_iva,
                    t.ncsubtot as baseImponible
                FROM cxctnc t
                WHERE t.ciacodigo = :ciacodigo AND t.loccodigo = :loccodigo AND t.nccodigo = :nccodigo
                ORDER BY t.ncsecuen
            """
            )
            detalles = conn.execute(sql_det, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "nccodigo": nccodigo}).mappings().all()

        # Limpieza y preparación de datos
        # PRUEBAS
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

        # Construcción del Documento Modificado
        o_estab = str(doc["o_estab"]).strip() if doc["o_estab"] else "001"
        o_ptoEmi = str(doc["o_ptoEmi"]).strip() if doc["o_ptoEmi"] else "001"
        o_sec = str(doc["o_secuencial"]).strip() if doc["o_secuencial"] else "1"
        doc_sustento = f"{o_estab}-{o_ptoEmi}-{o_sec.zfill(9)}"
        fecha_sustento_str = doc["o_fechaEmision"].strftime("%d/%m/%Y") if doc.get("o_fechaEmision") else fecha_emision_str

        obligado_cont = "SI" if doc["ciaobligadocon"] == 1 else "NO"

        # =========================================================================
        # 2. GENERAR CLAVE DE ACCESO (04 = Nota de Crédito)
        # =========================================================================
        clave_acceso, err_ca, det_ca = generate_clave_acceso(
            fecha_emision=fecha_emision_str, cod_doc="04", ruc=str(doc["ruc"]).strip(), ambiente=ambiente, serie=f"{str(doc['estab']).strip()}{str(doc['ptoEmi']).strip()}", secuencial=str(doc["secuencial"]).strip().zfill(9), codigo_numerico="12345678", tipo_emision=tipo_emision
        )
        if not clave_acceso:
            return jsonify({"success": False, "message": f"Error en Clave de Acceso: {err_ca}"}), 500

        # =========================================================================
        # 3. CONSTRUIR XML ESTRUCTURADO XSD NOTA CRÉDITO (v1.1.0)
        # =========================================================================
        dir_matriz = escape_xml(doc["dirMatriz"]) or "S/N"
        dir_estab = escape_xml(doc["dirEstablecimiento"])
        razon_social = escape_xml(doc["razonSocial"]) or "N/A"
        razon_comprador = escape_xml(doc["razonSocialComprador"]) or "CONSUMIDOR FINAL"

        xml_nc = f"""<?xml version="1.0" encoding="UTF-8"?>
<notaCredito id="comprobante" version="1.1.0">
    <infoTributaria>
        <ambiente>{ambiente}</ambiente>
        <tipoEmision>{tipo_emision}</tipoEmision>
        <razonSocial>{razon_social}</razonSocial>
        <ruc>{doc["ruc"].strip()}</ruc>
        <claveAcceso>{clave_acceso}</claveAcceso>
        <codDoc>04</codDoc>
        <estab>{doc["estab"].strip()}</estab>
        <ptoEmi>{doc["ptoEmi"].strip()}</ptoEmi>
        <secuencial>{str(doc["secuencial"]).strip().zfill(9)}</secuencial>
        <dirMatriz>{dir_matriz}</dirMatriz>
    </infoTributaria>
    <infoNotaCredito>
        <fechaEmision>{fecha_emision_str}</fechaEmision>"""

        if dir_estab:
            xml_nc += f"\n        <dirEstablecimiento>{dir_estab}</dirEstablecimiento>"

        xml_nc += f"""
        <tipoIdentificacionComprador>{tipo_id}</tipoIdentificacionComprador>
        <razonSocialComprador>{razon_comprador}</razonSocialComprador>
        <identificacionComprador>{id_comprador}</identificacionComprador>
        <obligadoContabilidad>{obligado_cont}</obligadoContabilidad>
        <codDocModificado>01</codDocModificado>
        <numDocModificado>{doc_sustento}</numDocModificado>
        <fechaEmisionDocSustento>{fecha_sustento_str}</fechaEmisionDocSustento>
        <totalSinImpuestos>{doc["totalSinImpuestos"]:.2f}</totalSinImpuestos>
        <valorModificacion>{doc["valorModificacion"]:.2f}</valorModificacion>
        <moneda>DOLAR</moneda>
        <totalConImpuestos>"""

        if float(doc["nctivapor"]) > 0:
            xml_nc += f"""
            <totalImpuesto>
                <codigo>2</codigo>
                <codigoPorcentaje>{get_codigo_porcentaje_iva(doc["ncporiva"])}</codigoPorcentaje>
                <baseImponible>{doc["nctivapor"]:.2f}</baseImponible>
                <valor>{doc["nctotiva"]:.2f}</valor>
            </totalImpuesto>"""

        if float(doc["nctivacer"]) > 0:
            xml_nc += f"""
            <totalImpuesto>
                <codigo>2</codigo>
                <codigoPorcentaje>0</codigoPorcentaje>
                <baseImponible>{doc["nctivacer"]:.2f}</baseImponible>
                <valor>0.00</valor>
            </totalImpuesto>"""

        xml_nc += f"""
        </totalConImpuestos>
        <motivo>{escape_xml(doc["motivo"] or 'Devolucion o Descuento')}</motivo>
    </infoNotaCredito>
    <detalles>"""

        for d in detalles:
            xml_nc += f"""
        <detalle>
            <codigoInterno>{escape_xml(d['codigoInterno'])}</codigoInterno>
            <descripcion>{escape_xml(d['descripcion'])}</descripcion>
            <cantidad>{d['cantidad']:.2f}</cantidad>
            <precioUnitario>{d['precioUnitario']:.6f}</precioUnitario>
            <descuento>{d['descuento']:.2f}</descuento>
            <precioTotalSinImpuesto>{d['precioTotalSinImpuesto']:.2f}</precioTotalSinImpuesto>
            <impuestos>
                <impuesto>
                    <codigo>2</codigo>
                    <codigoPorcentaje>{get_codigo_porcentaje_iva(d["tarifa"])}</codigoPorcentaje>
                    <tarifa>{d['tarifa']:.2f}</tarifa>
                    <baseImponible>{d['baseImponible']:.2f}</baseImponible>
                    <valor>{d['valor_iva']:.2f}</valor>
                </impuesto>
            </impuestos>
        </detalle>"""

        xml_nc += f"""
    </detalles>
    <infoAdicional>
        <campoAdicional nombre="Dirección">{escape_xml(doc["clidirec"] or 'S/N')}</campoAdicional>
        <campoAdicional nombre="Teléfono">{escape_xml(doc["clitelef1"] or '999999999')}</campoAdicional>
        <campoAdicional nombre="Email">{escape_xml(doc["cliemail"] or 'noreply@designsoft.com')}</campoAdicional>
        <campoAdicional nombre="Observación">{escape_xml(doc["motivo"])}</campoAdicional>
    </infoAdicional>
</notaCredito>"""

        p12_bytes, clave_p12 = get_certificate_credentials(clicianonBD, ciacodigo)
        if not p12_bytes:
            return jsonify({"success": False, "message": "No se encontraron credenciales del certificado (.p12)"}), 500

        xml_firmado, err_firma, _ = sign_xml(xml_sin_firmar=xml_nc, p12_bytes=p12_bytes, clave_p12=clave_p12)
        if not xml_firmado:
            return jsonify({"success": False, "message": f"Error firmando XML: {err_firma}"}), 500

        # =========================================================================
        # 4. ENVÍO AL SRI Y MANEJO DEL "BYPASS" DE CLAVE REGISTRADA
        # =========================================================================
        receipt_resp, receipt_err, receipt_details = send_receipt(xml_firmado=xml_firmado, ambiente=ambiente)
        estado_recepcion = getattr(receipt_resp, "estado", "") if receipt_resp else ""

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

            # Si NO está registrada previamente, es un error real y abortamos.
            if not clave_registrada:
                error_final = detalle_sri.strip() if detalle_sri else receipt_err
                _guardar_estado_sri_bd(engine, ciacodigo, nccodigo, loccodigo, clave_acceso, xml_nc, xml_firmado, None, None, 0, f"Error Recepción: {error_final}", "E", usrcodigo, ipUser, doc)
                return jsonify({"success": False, "message": f"SRI Rechazó el XML: {error_final}"}), 500

            # SI LLEGA AQUÍ: Es porque 'clave_registrada' es True.
            # El sistema sonríe, ignora el "Devuelto" y pasa directamente a la etapa de Autorización.

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

        # =========================================================================
        # 5. GENERAR XML AUTORIZADO Y PDF RIDE
        # =========================================================================
        xml_autorizado_final = None
        pdf_content = None

        if estado_sri == "AUTORIZADO":
            from app.IntegracionFacturacionElectronica.utils.sri_services import build_autorizacion_xml
            from app.IntegracionFacturacionElectronica.utils.generate_ride_pdf import generate_ride_pdf
            import pathlib

            xml_autorizado_final = build_autorizacion_xml(auth_data, clave_acceso)

            nota_data = {
                "tipo_documento_nombre": "NOTA DE CRÉDITO",
                "info_tributaria": {
                    "razon_social": doc["razonSocial"],
                    "ruc": doc["ruc"],
                    "estab": doc["estab"],
                    "pto_emi": doc["ptoEmi"],
                    "secuencial": str(doc["secuencial"]).strip().zfill(9),
                    "dir_matriz": doc["dirMatriz"] or "S/N",
                    "logo_bytes": logo_bytes,
                },
                "info_factura": {
                    "dir_establecimiento": doc["dirEstablecimiento"] or "S/N",
                    "obligado_contabilidad": obligado_cont,
                    "razon_social_comprador": doc["razonSocialComprador"] or "CONSUMIDOR FINAL",
                    "identificacion_comprador": id_comprador,
                    "fecha_emision": fecha_emision_str,
                    "guia_remision": "",
                    "total_sin_impuestos": float(doc["totalSinImpuestos"]),
                    "total_descuento": float(doc.get("ncdesglobal", 0)),
                    "propina": 0.0,
                    "importe_total": float(doc["valorModificacion"]),
                },
                "detalles": [
                    {"codigo_principal": d["codigoInterno"], "cantidad": float(d["cantidad"]), "descripcion": d["descripcion"], "precio_unitario": float(d["precioUnitario"]), "descuento": float(d["descuento"]), "precio_total_sin_impuesto": float(d["precioTotalSinImpuesto"])} for d in detalles
                ],
                "totales_impuestos": [{"valor": float(doc["nctotiva"])}],
                "pagos": [{"forma_pago": "01", "total": float(doc["valorModificacion"]), "plazo": "", "unidad_tiempo": ""}],
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
                print(f"Advertencia RIDE: No se pudo generar PDF: {e}")

        _guardar_estado_sri_bd(engine, ciacodigo, nccodigo, loccodigo, clave_acceso, xml_nc, xml_firmado, xml_autorizado_final, pdf_content, is_auth_num, mensaje_bd, status_bd, usrcodigo, ipUser, doc)

        if estado_sri == "AUTORIZADO":
            num_aut = auth_data.get("numero_autorizacion", "")
            fec_aut = auth_data.get("fecha_autorizacion", datetime.now())

            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        UPDATE cxccnc SET sriautnumero = :aut, sriautfecemi = :fecaut, ncelectronica = 1
                        WHERE ciacodigo = :cia AND nccodigo = :nc AND loccodigo = :loc
                    """
                    ),
                    {"aut": num_aut, "fecaut": fec_aut, "usr": usrcodigo, "cia": ciacodigo, "nc": nccodigo, "loc": loccodigo},
                )

            return jsonify({"success": True, "message": "Nota de Crédito Autorizada exitosamente", "numero_autorizacion": num_aut})
        else:
            return jsonify({"success": False, "message": f"El SRI rechazó el documento en Autorización: {mensaje_bd}"})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error interno: {str(e)}"}), 500


def _guardar_estado_sri_bd(engine, ciacodigo, nccodigo, loccodigo, clave_acceso, xml_origen, xml_firmado, xml_autorizado, pdf_content, is_auth, mensaje_bd, status_sri, usrcodigo, ipUser, doc):
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    correo_destinatario = doc.get("cliemail")
    if not correo_destinatario:
        correo_destinatario = ""
    else:
        correo_destinatario = str(correo_destinatario).strip()

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM siacdocelectronicos WHERE ciacodigo = :ciacodigo AND facnumfac = :nccodigo AND loccodigo = :loccodigo"), {"ciacodigo": ciacodigo, "nccodigo": nccodigo, "loccodigo": loccodigo})

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
                    :ciacodigo, :nccodigo, :loccodigo, :sriclave, :sridocumento,
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
                "nccodigo": nccodigo,
                "loccodigo": loccodigo,
                "sriclave": clave_acceso,
                "sridocumento": "04",
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
                "sridestinatario": correo_destinatario,
                "srisubject": f"Nota de Crédito Electrónica {nccodigo}",
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
