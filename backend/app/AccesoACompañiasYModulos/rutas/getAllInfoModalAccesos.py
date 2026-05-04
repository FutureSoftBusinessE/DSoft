from flask import jsonify, request
from app.AccesoACompañiasYModulos import bp
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
from services.encrip_desencrip import desencriptar
import base64


@bp.route("/getAllInfoModalAccesos", methods=["GET"])
@cross_origin()
@jwt_required()
def getAllInfoModalAccesos():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():

            companias_query = """
            SELECT
                ciacodigo,
                ciadescri
            FROM siaccia
            WHERE ciastatus = 'A'
            """
            result_companias_query = connection.execute(text(companias_query)).mappings().fetchall()

            modulos_query = """
            SELECT
                modcodigo,
                moddescri
            FROM siacmod
            WHERE modstatus = 'A'
            """
            result_modulos_query = connection.execute(text(modulos_query)).mappings().fetchall()

            # Convertir compañías a formato value-label
            companias_formatted = [{"value": row["ciacodigo"], "label": row["ciadescri"]} for row in result_companias_query]

            # Convertir módulos a formato value-label
            modulos_formatted = [{"value": row["modcodigo"], "label": row["moddescri"]} for row in result_modulos_query]

    return jsonify({"data": {"companias": companias_formatted, "modulos": modulos_formatted}}), 200
