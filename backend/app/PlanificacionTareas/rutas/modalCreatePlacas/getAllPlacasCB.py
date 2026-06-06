from flask import jsonify, request
from app.PlanificacionTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from error_handling import api_endpoint


@bp.route("/getAllPlacasCB", methods=["GET"])
@jwt_required()
@api_endpoint
def getAllPlacasCB():
    """
    Obtiene todos las placas en formato value-label
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as conn:
        query = text(
            """
            SELECT  vehplaca as value,
                    vehplaca + ' ' + ISNULL(vehbmarca.vehmardesci, '') AS label
            FROM vehmplaca
            INNER JOIN vehbmarca ON vehmplaca.vehmarcodigo = vehbmarca.vehmarcodigo
            ORDER BY vehplaca
        """
        )

        result = conn.execute(query)
        placas = [dict(row) for row in result.mappings()]

        return placas
