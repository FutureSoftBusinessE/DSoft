from flask import jsonify, request
from app.PlanificacionTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from error_handling import api_endpoint


@bp.route("/getAllCarrocerias", methods=["GET"])
@cross_origin()
@jwt_required()
@api_endpoint
def getAllCarrocerias():
    """
    Obtiene todas las carrocerias en formato value-label
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as conn:
        query = text(
            """
            SELECT vehcarroceria as value, vehcarroceria as label
            FROM vehmvehiculos
            GROUP BY vehcarroceria
            ORDER BY vehcarroceria
        """
        )

        result = conn.execute(query)
        carrocerias = [dict(row) for row in result.mappings()]

        return carrocerias
