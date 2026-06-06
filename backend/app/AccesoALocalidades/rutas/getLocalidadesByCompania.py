from flask import jsonify, request
from app.AccesoALocalidades import bp
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
import base64


@bp.route("/getLocalidadesByCompania", methods=["GET"])
@jwt_required()
def get_localidades_by_compania():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            query = """
            SELECT
                ciacodigo,
                loccodigo,
                locdescri,
                locstatus
            FROM cgblocal
            WHERE ciacodigo = :ciacodigo
            AND locstatus = 'A'
            ORDER BY loccodigo
            """

            result = connection.execute(text(query), {"ciacodigo": ciacodigo}).mappings().fetchall()

            localidades = [{"ciacodigo": row["ciacodigo"], "loccodigo": row["loccodigo"], "locdescri": row["locdescri"], "locstatus": row["locstatus"]} for row in result]

    return jsonify({"data": localidades}), 200
