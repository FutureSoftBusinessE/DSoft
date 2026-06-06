from flask import jsonify, request
from app.PlanificacionTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from error_handling import api_endpoint


@bp.route("/getalltipos", methods=["GET"])
@jwt_required()
@api_endpoint
def get_all_tipos():
    """
    Obtiene todos los tipos en formato value-label
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as conn:
        query = text(
            """
            SELECT vehtipcodigo as value, vehtipdesci as label
            FROM vehbtipo
            ORDER BY vehtipdesci
        """
        )

        result = conn.execute(query)
        tipos = [dict(row) for row in result.mappings()]

        return tipos
