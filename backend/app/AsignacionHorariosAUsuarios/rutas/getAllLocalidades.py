from flask import jsonify, request
from app.AsignacionHorariosAUsuarios import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime


@bp.route("/getAllLocalidades", methods=["GET"])
@cross_origin()
@jwt_required()
def getAllLocalidades():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            all_localidades_query = """
                SELECT
                    loccodigo,
                    locdescri
                FROM cgblocal
                WHERE
                    ciacodigo = :ciacodigo
            """
            all_localidades_result = connection.execute(text(all_localidades_query), {"ciacodigo": ciacodigo}).mappings().fetchall()
            all_localidades_result = [{"value": row.loccodigo, "label": f"{row.locdescri} [{row.loccodigo}]", "loccodigo": row.loccodigo, "locdescri": row.locdescri} for row in all_localidades_result]

    return jsonify({"data": all_localidades_result})
