from flask import jsonify, request
from app.PlanificacionTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from error_handling import api_endpoint


@bp.route("/getallclases", methods=["GET"])
@cross_origin()
@jwt_required()
@api_endpoint
def get_all_clases():
    """
    Obtiene todas las clases en formato value-label
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as conn:
        query = text(
            """
            SELECT vehclacodigo as value, vehcladesci as label
            FROM vehbclase
            ORDER BY vehcladesci
        """
        )

        result = conn.execute(query)
        clases = [dict(row) for row in result.mappings()]

        return clases
