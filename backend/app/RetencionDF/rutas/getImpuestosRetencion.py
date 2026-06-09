from flask import request, jsonify
from app.RetencionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/getImpuestos", methods=["GET"])
@cross_origin()
@jwt_required()
def get_impuestos_retencion():
    """Obtiene el catálogo de impuestos y retenciones (cxpbimp) activos"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # Traemos solo los impuestos activos
            query = text(
                """
                SELECT
                    impid, impdescri, impporcent, impretimp, codSRI, impbienser
                FROM cxpbimp
                WHERE ciacodigo = :ciacodigo AND impstatus = 'A'
                ORDER BY impretimp, impporcent
            """
            )
            resultados = connection.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchall()

            impuestos = []
            for row in resultados:
                impuestos.append({"impid": str(row["impid"]).strip(), "impdescri": str(row["impdescri"]).strip(), "impporcent": float(row["impporcent"] or 0), "impretimp": str(row["impretimp"]).strip(), "codSRI": str(row["codSRI"] or "").strip(), "impbienser": str(row["impbienser"] or "").strip()})

        return jsonify({"success": True, "data": impuestos})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error obteniendo catálogo de impuestos: {str(e)}"}), 500
