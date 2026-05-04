# flake8: noqa
from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text, func, cast, VARCHAR
import json
from app.linea import bp
from app.extensions import db
from flask_cors import cross_origin

from app.models.linea import Linea, LineaSchema
from app.db import get_session


@bp.route("/get_lineas", methods=["POST"])
@cross_origin()
@jwt_required()
def get_lineas():
    data = request.get_json() if request.is_json else None
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    try:
        cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    except KeyError:
        error_response = {"error": 'No se encontró la clave "cliciaciacodigo" en el payload del JWT'}
        return jsonify(error_response), 400

    db.session = get_session(clicianonBD)

    results = (
        db.session.query(
            Linea.lincodigo,  # este es el id
            Linea.lindescri,
            Linea.linlindes,  # este es el id del padre
            Linea.linnivel,
            Linea.lintipo,
            Linea.linstatus,
            Linea.lincodigo1,
        )
        .filter(
            Linea.ciacodigo == cliciaciacodigo,
            # Linea.linlindes == lincodigo,
            Linea.linstatus == "A",
        )
        .order_by(Linea.lincodigo)
        .all()
    )

    # plan b =======--------------------------------
    data = []

    # iterar sobre los resultados y crear un diccionario para cada fila
    for row in results:
        item = {
            "lincodigo": row[0],
            "lindescri": row[1],
            "linlindes": row[2],
            "linnivel": row[3],
            "lintipo": row[4],
            "linstatus": row[5],
            "lincodigo1": row[6],
        }
        # agregar cada diccionario a la lista de resultados
        data.append(item)

    # convertir la lista de diccionarios en un objeto JSON
    json_data = json.dumps(data)
    # =======--------------------------------

    return json_data
    # return jsonify(output)
