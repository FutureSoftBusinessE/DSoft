from flask import jsonify, request
from app.BancoDeTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getInstituciones", methods=["GET"])
@cross_origin()
@jwt_required()
def getInstituciones():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    # ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    # usrcodigo = claims["user"]
    # loccodigo = claims["localidad"]["loccodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Este query solo trae los horarios planificados por el empleado en la localidad actual y dia y hora actual, se omite los horarios planificados que son LIBRE donde hordiaini y hordiafin sean 0
            base_query = """
                SELECT
                   insticodigo,
                   instidescri
                FROM gdocbinstituciones
                WHERE
                    instistatus= 'A'
            """

            result = connection.execute(text(base_query)).mappings().fetchall()

            result = [{"value": row["insticodigo"], "label": row["instidescri"]} for row in result]

    return jsonify({"data": result}), 200
