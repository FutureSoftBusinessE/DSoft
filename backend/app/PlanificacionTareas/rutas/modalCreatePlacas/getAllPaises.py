from flask import jsonify, request
from app.PlanificacionTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from error_handling import api_endpoint


@bp.route("/getAllPaises", methods=["GET"])
@cross_origin()
@jwt_required()
@api_endpoint
def getAllPaises():
    """
    Obtiene todos los paises en formato value-label
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as conn:
        query = text(
            """
            SELECT paiscodigo as value, paisdescri as label
            FROM hotbpais
            WHERE paisstatus = 'A'
            ORDER BY paiscodigo
        """
        )

        result = conn.execute(query)
        paises = [dict(row) for row in result.mappings()]

        return paises
