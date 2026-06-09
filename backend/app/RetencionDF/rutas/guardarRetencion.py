from flask import request, jsonify
from app.RetencionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime


@bp.route("/guardarRetencion", methods=["POST"])
@cross_origin()
@jwt_required()
def guardar_retencion():
    """Guarda la cabecera (cxpcret) y el detalle de impuestos (cxptfac) de la Retención"""
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

        cjacodigo = payload.get("cjacodigo", "").strip()
        procodigo = payload.get("procodigo", "").strip()
        proruc = payload.get("proruc", "").strip()
        num_doc_sustento = payload.get("numDocSustento", "").strip()
        # fecha_emision_doc = payload.get("fechaEmisionDocSustento", "").strip()
        detalles = payload.get("detalles", [])

        if not cjacodigo or not procodigo or not num_doc_sustento or not detalles:
            return jsonify({"success": False, "message": "Datos de retención incompletos."}), 400

        ahora = datetime.now()
        fecha_sys = ahora.strftime("%Y-%m-%d 00:00:00")
        hora_sys = ahora.strftime("1900-01-01 %H:%M:%S")

        # Cálculos de Totales
        retvalfuente = 0.0
        retvaliva = 0.0

        for d in detalles:
            tipo_imp = str(d.get("impretimp", "")).strip().upper()
            valor = float(d.get("valorRetenido", 0))
            if tipo_imp == "R":
                retvalfuente += valor
            elif tipo_imp == "I":
                retvaliva += valor

        with engine.begin() as connection:
            # 1. Obtener y actualizar secuencia de Retención (Doc 07)
            sql_series = text("SELECT sriserie01, sriserie02, srisecini, srisecfin, srisecact, sriautfecemi, sriautfecven, sriautnumero FROM siactsriseries WHERE ciacodigo=:c AND cjacodigo=:cj AND srisecdoc='07'")
            serie = connection.execute(sql_series, {"c": ciacodigo, "cj": cjacodigo}).mappings().first()
            if not serie:
                raise Exception("No existe configuración de series SRI para Retenciones (07) en esta caja.")

            nuevo_retnumero = int(serie.get("srisecact", 0)) + 1
            connection.execute(text("UPDATE siactsriseries SET srisecact = :n WHERE ciacodigo=:c AND cjacodigo=:cj AND srisecdoc='07'"), {"n": nuevo_retnumero, "c": ciacodigo, "cj": cjacodigo})

            year = ahora.strftime("%y")
            sriserie01_ret = str(serie.get("sriserie01", "001")).strip()
            sriserie02_ret = str(serie.get("sriserie02", "001")).strip()
            retid = f"R{year}{sriserie01_ret}{sriserie02_ret}{nuevo_retnumero:09}"

            # 2. Extracción Aislada de Metadatos (Evita errores de columna)
            sql_prov = text("SELECT pronombre, proruc, prodirec, proemail FROM cxpmprov WHERE ciacodigo=:c AND procodigo=:p")
            prov_data = connection.execute(sql_prov, {"c": ciacodigo, "p": procodigo}).mappings().first()
            if not prov_data:
                raise Exception("No se encontró el proveedor registrado.")

            sql_cia = text("SELECT ciaruc, ciadescri, ciadirec, ciatelefono1, ciaciudad, ciapais, ciacontabilidad FROM siaccia WHERE ciacodigo=:c")
            cia_data = connection.execute(sql_cia, {"c": ciacodigo}).mappings().first() or {}

            sql_loc = text("SELECT locdescri, ciadirec, ciatelefono1, ciaciudad, ciapais FROM cgblocal WHERE ciacodigo=:c AND loccodigo=:l")
            loc_data = connection.execute(sql_loc, {"c": ciacodigo, "l": loccodigo}).mappings().first() or {}

            # 3. INSERTAR CABECERA (cxpcret)
            sql_insert_cxpcret = text(
                """
                INSERT INTO cxpcret (
                    ciacodigo, retid, retdescri, impdoc, imptipo, retmoneda, rettipocambio,
                    retvalfuente, retvaliva, procodigo, retnombre, retruc, retdirec,
                    retstatus, retfecisys, rethorisys, retusuisys, retfecmsys, rethormsys, retusumsys,
                    sriserie01, sriserie02, srisecini, srisecfin, sriautfecemi, sriautfecven, sriautnumero,
                    retidsr, retfecemi, loccodigo, retnumero, retelectronica, proemail, cjacodigo,
                    ciaciaruc, ciaciadescri, ciaciadirec, ciaciatelefono1, ciaciaciudad, ciaciapais,
                    locdescri, locciadirec, locciatelefono1, locciaciudad, locciapais, ciaobligadocon, cianumresolucion
                ) VALUES (
                    :ciacodigo, :retid, '', 'P', 'D', 'D', 0.0,
                    :retvalfuente, :retvaliva, :procodigo, :retnombre, :retruc, :retdirec,
                    'A', :fecha_sys, :hora_sys, :usuario_sys, :fecha_sys, :hora_sys, :usuario_sys,
                    :sriserie01, :sriserie02, :srisecini, :srisecfin, :sriautfecemi, :sriautfecven, :sriautnumero,
                    :retidsr, :fecha_sys, :loccodigo, :retnumero, 0, :proemail, :cjacodigo,
                    :ciaciaruc, :ciaciadescri, :ciaciadirec, :ciaciatelefono1, :ciaciaciudad, :ciaciapais,
                    :locdescri, :locciadirec, :locciatelefono1, :locciaciudad, :locciapais, :ciaobligadocon, ''
                )
            """
            )

            connection.execute(
                sql_insert_cxpcret,
                {
                    "ciacodigo": ciacodigo,
                    "retid": retid,
                    "retvalfuente": round(retvalfuente, 2),
                    "retvaliva": round(retvaliva, 2),
                    "procodigo": procodigo,
                    "retnombre": str(prov_data.get("pronombre", "")).strip(),
                    "retruc": str(prov_data.get("proruc", "")).strip(),
                    "retdirec": str(prov_data.get("prodirec", "")).strip(),
                    "fecha_sys": fecha_sys,
                    "hora_sys": hora_sys,
                    "usuario_sys": usuario_sys,
                    "sriserie01": sriserie01_ret,
                    "sriserie02": sriserie02_ret,
                    "srisecini": int(serie.get("srisecini") or 1),
                    "srisecfin": int(serie.get("srisecfin") or 999999999),
                    "sriautfecemi": serie.get("sriautfecemi") or fecha_sys,
                    "sriautfecven": serie.get("sriautfecven") or fecha_sys,
                    "sriautnumero": str(serie.get("sriautnumero", "")).strip(),
                    "retidsr": str(nuevo_retnumero),
                    "loccodigo": loccodigo,
                    "retnumero": nuevo_retnumero,
                    "cjacodigo": cjacodigo,
                    "proemail": str(prov_data.get("proemail", "")).strip(),
                    "ciaciaruc": str(cia_data.get("ciaruc", "")).strip(),
                    "ciaciadescri": str(cia_data.get("ciadescri", "")).strip(),
                    "ciaciadirec": str(cia_data.get("ciadirec", "")).strip(),
                    "ciaciatelefono1": str(cia_data.get("ciatelefono1", "")).strip(),
                    "ciaciaciudad": str(cia_data.get("ciaciudad", "")).strip(),
                    "ciaciapais": str(cia_data.get("ciapais", "")).strip(),
                    "locdescri": str(loc_data.get("locdescri", "")).strip(),
                    "locciadirec": str(loc_data.get("ciadirec", "")).strip(),
                    "locciatelefono1": str(loc_data.get("ciatelefono1", "")).strip(),
                    "locciaciudad": str(loc_data.get("ciaciudad", "")).strip(),
                    "locciapais": str(loc_data.get("ciapais", "")).strip(),
                    "ciaobligadocon": int(cia_data.get("ciacontabilidad") or 0),
                },
            )

            # 4. INSERTAR DETALLE DE RETENCIONES (cxptfac)
            sql_insert_cxptfac = text(
                """
                INSERT INTO cxptfac (
                    ciacodigo, proruc, factipo, facsecuen, facnumero, codigo, impid,
                    cocid, gstid, factipdoc, procodigo, fatimpret, fatbase, fatporcent,
                    fatsigno, fatvalor, fatfecmsys, fathormsys, fatusumsys, retid,
                    moncodigo, tipocambio, retidsri, facid, fatirpagadosoc, fatanioutilidad,
                    fatnumcajban, fatpreccajban
                ) VALUES (
                    :ciacodigo, :proruc, 0, :facsecuen, :facnumero, :codigo, :impid,
                    '', '', 'F', :procodigo, :fatimpret, :fatbase, :fatporcent,
                    '-', :fatvalor, :fecha_sys, :hora_sys, :usuario_sys, :retid,
                    'D', 0.0, :retidsri, :facid, 0.0, 0, 0, 0.0
                )
            """
            )

            # Dividimos num_doc_sustento (001-002-000123456)
            partes_doc = num_doc_sustento.split("-")
            facsecuen = partes_doc[0] + partes_doc[1] if len(partes_doc) >= 2 else "000000"
            facnumero = partes_doc[2] if len(partes_doc) >= 3 else num_doc_sustento

            for det in detalles:
                # El frontend enviará impid (Ej: 'R11'), baseImponible, porcentaje, y valorRetenido
                connection.execute(
                    sql_insert_cxptfac,
                    {
                        "ciacodigo": ciacodigo,
                        "proruc": proruc,
                        "facsecuen": facsecuen[-6:],
                        "facnumero": facnumero[-25:],
                        "codigo": "FACTURA",
                        "impid": det.get("impid", ""),
                        "procodigo": procodigo,
                        "fatimpret": det.get("impretimp", "R"),
                        "fatbase": float(det.get("baseImponible", 0)),
                        "fatporcent": float(det.get("porcentaje", 0)),
                        "fatvalor": float(det.get("valorRetenido", 0)),
                        "fecha_sys": fecha_sys,
                        "hora_sys": hora_sys,
                        "usuario_sys": usuario_sys,
                        "retid": retid,
                        "retidsri": str(nuevo_retnumero),
                        "facid": num_doc_sustento,
                    },
                )

        return jsonify({"success": True, "data": {"retid": retid}, "message": "Retención guardada exitosamente."})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error transaccional: {str(e)}"}), 500
