from flask import jsonify
from app.SecuenciasDoc import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text


@bp.route("/getModulos", methods=["GET", "POST"])
@cross_origin()
@jwt_required()
def getModulos():
    claims = get_jwt()

    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
    except KeyError:
        return jsonify({"error": "Sesión inválida o incompleta"}), 401

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Extraemos los módulos distintos directamente de siacdoc
        query = text(
            """
            SELECT DISTINCT
                modcodigo,
                modcodigo AS moddescri
            FROM siacdoc
            WHERE docstatus = 'A'
            ORDER BY modcodigo ASC
            """
        )

        result = connection.execute(query).mappings().fetchall()
        data_result = [dict(row) for row in result]

    return jsonify({"data": data_result}), 200
