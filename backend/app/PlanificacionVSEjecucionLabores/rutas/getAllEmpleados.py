from flask import jsonify, request
from app.PlanificacionVSEjecucionLabores import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from services.encrip_desencrip import desencriptar
from error_handling import api_endpoint, ValidationError, validate_required, NotFoundError


@bp.route("/getAllEmpleados", methods=["GET"])
@jwt_required()
@api_endpoint
def getAllEmpleados():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Traer usuarios de todas las compania de esa base de datos
        base_query = """
            SELECT
            rhmper.ciacodigo,
            rhmper.emcodemp,
            rhmper.emnombre + ' ' + rhmper.emapellido AS emnombre
        FROM rhmper
        WHERE
            rhmper.ciacodigo = :ciacodigo
            AND rhmper.emstatus = 'ACTIVO'
        """

        result = connection.execute(text(base_query), {"ciacodigo": ciacodigo}).mappings().fetchall()

        empleados_result = [
            {
                **row,
                "value": row["emcodemp"] if "emcodemp" in row else None,
                "label": row["emnombre"] if "emnombre" in row else None,
                "emcodemp": row["emcodemp"] if "emcodemp" in row else None,
            }
            for row in result
        ]

    return empleados_result
