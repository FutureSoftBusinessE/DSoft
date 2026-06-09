from flask import request, jsonify
from app.RetencionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/getRetencionBuscar", methods=["POST"])
@cross_origin()
@jwt_required()
def get_retencion_buscar():
    """Reconstruye toda la información de un Comprobante de Retención para la vista de Solo Lectura"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        payload = request.get_json()
        retid = payload.get("retid")

        if not retid:
            return jsonify({"success": False, "message": "No se proporcionó el número de Retención para la búsqueda."}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # ==========================================
            # 1. OBTENER CABECERA (cxpcret) Y PROVEEDOR
            # ==========================================
            query_cabecera = text(
                """
                SELECT
                    retid, retfecemi, retstatus, sriautnumero,
                    retvalfuente, retvaliva,
                    procodigo, retruc, retnombre, retdirec, proemail
                FROM cxpcret
                WHERE ciacodigo = :ciacodigo
                  AND retid = :retid
            """
            )
            cabecera_row = connection.execute(query_cabecera, {"ciacodigo": ciacodigo, "retid": retid}).mappings().first()

            if not cabecera_row:
                return jsonify({"success": False, "message": f"La Retención {retid} no fue encontrada."}), 404

            # ==========================================
            # 2. OBTENER DETALLES DE IMPUESTOS (cxptfac + cxpbimp)
            # ==========================================
            query_detalles = text(
                """
                SELECT
                    t.facid AS docSustento,
                    t.fatimpret,
                    t.fatbase,
                    t.fatporcent,
                    t.fatvalor,
                    COALESCE(i.codSRI, '') AS codSRI,
                    COALESCE(i.impdescri, '') AS descripcion
                FROM cxptfac t
                LEFT JOIN cxpbimp i ON t.ciacodigo = i.ciacodigo AND t.impid = i.impid
                WHERE t.ciacodigo = :ciacodigo
                  AND t.retid = :retid
                ORDER BY t.facid
            """
            )
            detalles_rows = connection.execute(query_detalles, {"ciacodigo": ciacodigo, "retid": retid}).mappings().fetchall()

        # ==========================================
        # 3. FORMATEAR RESPUESTA FINAL PARA REACT
        # ==========================================

        # Formatear la cabecera
        cabecera_dict = {
            "retid": str(cabecera_row["retid"]).strip(),
            "retfecemi": cabecera_row["retfecemi"].isoformat() if cabecera_row["retfecemi"] else None,
            "retstatus": str(cabecera_row["retstatus"]).strip(),
            "sriautnumero": str(cabecera_row["sriautnumero"] or "").strip(),
            "retvalfuente": float(cabecera_row["retvalfuente"] or 0),
            "retvaliva": float(cabecera_row["retvaliva"] or 0),
        }

        # Formatear el proveedor extrayéndolo de la misma tabla de cabecera
        proveedor_dict = {"procodigo": str(cabecera_row["procodigo"] or "").strip(), "retruc": str(cabecera_row["retruc"]).strip(), "retnombre": str(cabecera_row["retnombre"]).strip(), "retdirec": str(cabecera_row["retdirec"] or "").strip(), "proemail": str(cabecera_row["proemail"] or "").strip()}

        # Formatear los detalles iterando los resultados
        detalles_list = []
        secuencia = 1

        for d in detalles_rows:
            # Determinamos si es RENTA o IVA para el frontend
            tipo_impuesto = str(d["fatimpret"]).strip().upper()
            tipo_etiqueta = "RENTA" if tipo_impuesto == "R" else ("IVA" if tipo_impuesto == "I" else tipo_impuesto)

            # Construimos el concepto: "312 - TRANSFERENCIA DE BIENES"
            cod_sri = str(d["codSRI"]).strip()
            desc = str(d["descripcion"]).strip()
            concepto_sri = f"{cod_sri} - {desc}" if cod_sri else desc

            detalles_list.append({"secuencia": secuencia, "docSustento": str(d["docSustento"]).strip(), "concepto": concepto_sri, "tipo": tipo_etiqueta, "baseImponible": float(d["fatbase"] or 0), "porcentaje": float(d["fatporcent"] or 0), "valorRetenido": float(d["fatvalor"] or 0)})
            secuencia += 1

        return jsonify({"success": True, "data": {"data": {"cabecera": cabecera_dict, "proveedor": proveedor_dict, "detalles": detalles_list}}})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error al reconstruir la Retención: {str(e)}"}), 500
