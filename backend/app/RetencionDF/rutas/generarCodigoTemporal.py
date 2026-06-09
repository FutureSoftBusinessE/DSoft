from flask import request, jsonify
from app.RetencionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime


@bp.route("/generarCodigoTemporal/<cjacodigo>", methods=["GET"])
@jwt_required()
def generarCodigoTemporal(cjacodigo):
    """Genera el código NEMOTÉCNICO de la Retención (R) según la caja seleccionada"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # Filtrado estricto por documento '07' (Comprobante de Retención)
            query = text(
                """
                SELECT sriautnumero, sriserie01, sriserie02, srisecini, srisecfin, srisecact
                FROM siactsriseries
                WHERE ciacodigo = :ciacodigo
                  AND cjacodigo = :cjacodigo
                  AND srisecdoc = '07'
            """
            )
            serie = connection.execute(query, {"ciacodigo": ciacodigo, "cjacodigo": cjacodigo}).mappings().first()

            if not serie:
                return jsonify({"success": False, "message": "No existe configuración SRI (07) para la caja seleccionada."}), 404

            srisecact = int(serie.get("srisecact") or 0)
            secuencia_actual = srisecact + 1
            year = datetime.now().strftime("%y")

            serie01 = str(serie.get("sriserie01", "001")).strip()
            serie02 = str(serie.get("sriserie02", "001")).strip()

            # Formato R + Año + Serie1 + Serie2 + Secuencia (Ej: R26001001000001421)
            codigo_generado = f"R{year}{serie01}{serie02}{secuencia_actual:09}"

            return jsonify({"success": True, "data": codigo_generado})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error interno: {str(e)}"}), 500
