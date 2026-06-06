from flask import jsonify, request
from app.AsignacionHorariosAUsuarios import bp
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


@bp.route("/getHorariosUsuario", methods=["POST"])
@jwt_required()
def getHorariosUsuario():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json()
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    usrcodigo = data.get("usrcodigo")
    loccodigo = data.get("loccodigo")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            query = """
            SELECT
                ciacodigo,
                loccodigo,
                usrcodigo,
                hrsecuen,
                usrnombre,
                locdescri,
                hrdia,
                CONVERT(VARCHAR(5), hrhorini, 108) AS hrhorini,
                CONVERT(VARCHAR(5), hrhorfin, 108) AS hrhorfin,
                hrcupo,
                hrfecisys,
                hrfecmsys,
                hrhorisys,
                hrhormsys,
                hrusuisys,
                hrusumsys,
                hrestisys,
                hrestmsys
            FROM rhbhorarios
            WHERE ciacodigo = :ciacodigo
            AND usrcodigo = :usrcodigo
            AND loccodigo = :loccodigo
            ORDER BY hrdia, hrsecuen
            """

            result = connection.execute(text(query), {"ciacodigo": ciacodigo, "usrcodigo": usrcodigo, "loccodigo": loccodigo}).mappings().fetchall()

            print(result)

            horarios_result = [
                {
                    **dict(row),
                }
                for row in result
            ]

    return jsonify({"data": horarios_result}), 200
