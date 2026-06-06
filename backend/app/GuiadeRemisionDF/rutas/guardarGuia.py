from flask import request, jsonify
from app.GuiadeRemisionDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime


@bp.route("/guardarGuia", methods=["POST"])
@jwt_required()
def guardar_guia_remision():
    """Guarda la Guía de Remisión en IncGuia e IntGuia"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]
        usuario_sys = claims.get("sub", claims.get("user_id", "SISTEMA"))[:10]

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        payload = request.get_json()
        if not payload:
            return jsonify({"success": False, "message": "No se recibieron datos."}), 400

        # --- Extracción de Datos Principales ---
        guinumero = payload.get("guinumero", "").strip()
        facnumfac = payload.get("facnumfac", "").strip()
        transcodigo = payload.get("transcodigo", "").strip()
        ciucodigo = payload.get("ciucodigo", "").strip()
        cjacodigo = payload.get("cjacodigo", "").strip()

        clicodigo = payload.get("clicodigo", "").strip()
        clinombre = payload.get("clinombre", "").strip()
        cliruc = payload.get("cliruc", "").strip()
        clidirec = payload.get("clidirec", "").strip()
        cliemail = payload.get("cliemail", "").strip()
        guidirent = payload.get("guidirent", "").strip()

        motivo = payload.get("motivo", "").strip()
        guiplacafinal = payload.get("guiplacafinal", "").strip()

        guifecha_str = payload.get("guifecha")
        guifecfintrans_str = payload.get("guifecfintrans")

        detalles = payload.get("detalles", [])

        if not guinumero or not transcodigo or not ciucodigo or not cjacodigo or not detalles:
            return jsonify({"success": False, "message": "Faltan datos obligatorios para guardar."}), 400

        guifecha = datetime.strptime(guifecha_str, "%Y-%m-%d") if guifecha_str else datetime.now()
        guifecfintrans = datetime.strptime(guifecfintrans_str, "%Y-%m-%d") if guifecfintrans_str else guifecha

        # --- AUDITORÍA AL ESTILO SIAC ---
        fecha_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        fecha_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

        with engine.begin() as connection:
            # 1. ACTUALIZAR Y OBTENER SECUENCIA DE LA GUIA (Doc 06)
            sql_series = text(
                """
                SELECT sriserie01, sriserie02, srisecini, srisecfin, srisecact, sriautfecemi, sriautfecven
                FROM siactsriseries
                WHERE ciacodigo = :ciacodigo AND cjacodigo = :cjacodigo AND srisecdoc = '06'
            """
            )
            serie = connection.execute(sql_series, {"ciacodigo": ciacodigo, "cjacodigo": cjacodigo}).mappings().first()
            if not serie:
                raise Exception("No existe configuración de series SRI para la caja seleccionada (Doc 06).")

            srisecact_actual = int(serie["srisecact"] or 0)
            nuevo_guianumero_sri = srisecact_actual + 1

            connection.execute(text("UPDATE siactsriseries SET srisecact = srisecact + 1 WHERE ciacodigo = :ciacodigo AND cjacodigo = :cjacodigo AND srisecdoc = '06'"), {"ciacodigo": ciacodigo, "cjacodigo": cjacodigo})

            # 2. OBTENER METADATOS COMPLEMENTARIOS
            trans_data = connection.execute(text("SELECT transdescri, transruc FROM inbtranspor WHERE ciacodigo=:cia AND transcodigo=:trans"), {"cia": ciacodigo, "trans": transcodigo}).mappings().first()

            cia_data = connection.execute(text("SELECT ciaruc, ciadescri, ciadirec, ciatelefono1, ciaciudad, ciapais FROM siaccia WHERE ciacodigo=:cia"), {"cia": ciacodigo}).mappings().first()

            # =================================================================
            # 3. EXTRACCIÓN DE DATOS DE LA FACTURA SUSTENTO (facfac)
            # =================================================================
            fasriserie01 = fasriserie02 = fasriautnumero = ""
            fasrisecini = fasrisecfin = 0
            fasriautfecemi = fasriautfecven = None

            if facnumfac:
                sql_fac = text(
                    """
                    SELECT sriserie01, sriserie02, srisecini, srisecfin, sriautfecemi, sriautfecven, sriautnumero
                    FROM facfac
                    WHERE ciacodigo = :ciacodigo AND facnumfac = :facnumfac AND loccodigo = :loccodigo
                """
                )
                fac_data = connection.execute(sql_fac, {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo}).mappings().first()

                if fac_data:
                    fasriserie01 = fac_data["sriserie01"] or ""
                    fasriserie02 = fac_data["sriserie02"] or ""
                    fasrisecini = fac_data["srisecini"] or 1
                    fasrisecfin = fac_data["srisecfin"] or 999999999
                    fasriautfecemi = fac_data["sriautfecemi"]
                    fasriautfecven = fac_data["sriautfecven"]
                    fasriautnumero = fac_data["sriautnumero"] or ""

            # 4. INSERT CABECERA (IncGuia)
            sql_insert_incguia = text(
                """
                INSERT INTO IncGuia (
                    ciacodigo, guinumero, facnumfac, tranumero, tradocumento, loccodigo,
                    clicodigo, clinombre, cliruc, clidirec, cliemail, guidirent, transcodigo, ciucodigo,
                    guifecha, guifecfintrans, guistatus, guiplacafinal, Motivo,
                    fasriserie01, fasriserie02, fasrisecini, fasrisecfin, fasriautfecemi, fasriautfecven, fasriautnumero,
                    sriserie01, sriserie02, srisecini, srisecfin, sriautfecemi, sriautfecven,
                    guifecisys, guihorisys, guiusuisys, guifecmsys, guihormsys, guiusumsys,
                    transdescri, transruc, guianumero, guielectronica, ciaobligadocon, cjacodigo,
                    ciaciaruc, ciaciadescri, ciaciadirec, ciaciatelefono1, ciaciaciudad, ciaciapais
                ) VALUES (
                    :ciacodigo, :guinumero, :facnumfac, '', '', :loccodigo,
                    :clicodigo, :clinombre, :cliruc, :clidirec, :cliemail, :guidirent, :transcodigo, :ciucodigo,
                    :guifecha, :guifecfintrans, 'A', :guiplacafinal, :motivo,
                    :fasriserie01, :fasriserie02, :fasrisecini, :fasrisecfin, :fasriautfecemi, :fasriautfecven, :fasriautnumero,
                    :sriserie01, :sriserie02, :srisecini, :srisecfin, :sriautfecemi, :sriautfecven,
                    :fec0, :fec1900, :usuario_sys, :fec0, :fec1900, :usuario_sys,
                    :transdescri, :transruc, :guianumero_sri, 0, 1, :cjacodigo,
                    :ciaruc, :ciadescri, :ciadirec, :ciatelefono1, :ciaciudad, :ciapais
                )
            """
            )
            connection.execute(
                sql_insert_incguia,
                {
                    "ciacodigo": ciacodigo,
                    "guinumero": guinumero,
                    "facnumfac": facnumfac,
                    "loccodigo": loccodigo,
                    "clicodigo": clicodigo,
                    "clinombre": clinombre,
                    "cliruc": cliruc,
                    "clidirec": clidirec,
                    "cliemail": cliemail,
                    "guidirent": guidirent,
                    "transcodigo": transcodigo,
                    "ciucodigo": ciucodigo,
                    "guifecha": guifecha,
                    "guifecfintrans": guifecfintrans,
                    "guiplacafinal": guiplacafinal,
                    "motivo": motivo,
                    # Campos de la FACTURA Sustento (Extraídos de facfac)
                    "fasriserie01": fasriserie01,
                    "fasriserie02": fasriserie02,
                    "fasrisecini": fasrisecini,
                    "fasrisecfin": fasrisecfin,
                    "fasriautfecemi": fasriautfecemi,
                    "fasriautfecven": fasriautfecven,
                    "fasriautnumero": fasriautnumero,
                    # Campos de la GUIA de Remisión (Extraídos de siactsriseries)
                    "sriserie01": serie["sriserie01"],
                    "sriserie02": serie["sriserie02"],
                    "srisecini": serie["srisecini"],
                    "srisecfin": serie["srisecfin"],
                    "sriautfecemi": serie["sriautfecemi"],
                    "sriautfecven": serie["sriautfecven"],
                    "fec0": fecha_cero,
                    "fec1900": fecha_1900,
                    "usuario_sys": usuario_sys,
                    "transdescri": trans_data["transdescri"] if trans_data else "",
                    "transruc": trans_data["transruc"] if trans_data else "",
                    "guianumero_sri": nuevo_guianumero_sri,
                    "cjacodigo": cjacodigo,
                    "ciaruc": cia_data["ciaruc"] if cia_data else "",
                    "ciadescri": cia_data["ciadescri"] if cia_data else "",
                    "ciadirec": cia_data["ciadirec"] if cia_data else "",
                    "ciatelefono1": cia_data["ciatelefono1"] if cia_data else "",
                    "ciaciudad": cia_data["ciaciudad"] if cia_data else "",
                    "ciapais": cia_data["ciapais"] if cia_data else "",
                },
            )

            # 5. INSERT DETALLE (IntGuia)
            sql_insert_intguia = text(
                """
                INSERT INTO IntGuia (
                    ciacodigo, guinumero, facnumfac, tranumero, tradocumento, invcodigo, bodcodigo,
                    clicodigo, guitipo, guisigno, guistatus, artcodigo, artdescri, guisecuencia,
                    guicantdoc, guicantentr, artseriedesp, guipesoemp,
                    guifecisys, guihorisys, guiusuisys, guifecmsys, guihormsys, guiusumsys
                ) VALUES (
                    :ciacodigo, :guinumero, :facnumfac, '', '', '01', :bodcodigo,
                    :clicodigo, 'GUIA', '+', 'A', :artcodigo, :artdescri, :secuencia,
                    :cantidad, :cantidad, 0, 0.0,
                    :fec0, :fec1900, :usuario_sys, :fec0, :fec1900, :usuario_sys
                )
            """
            )

            secuencia = 1
            for d in detalles:
                connection.execute(
                    sql_insert_intguia,
                    {
                        "ciacodigo": ciacodigo,
                        "guinumero": guinumero,
                        "facnumfac": facnumfac,
                        "bodcodigo": d.get("bodcodigo", "MAT"),
                        "clicodigo": clicodigo,
                        "artcodigo": d.get("artcodigo", ""),
                        "artdescri": d.get("artdescri", ""),
                        "secuencia": secuencia,
                        "cantidad": float(d.get("cantidad", 0)),
                        "fec0": fecha_cero,
                        "fec1900": fecha_1900,
                        "usuario_sys": usuario_sys,
                    },
                )
                secuencia += 1

        return jsonify({"success": True, "data": {"guinumero": guinumero}, "message": "Guía de Remisión guardada exitosamente."})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error transaccional: {str(e)}"}), 500
