from flask import jsonify, request
from app.PuntosEmisionSri import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text


@bp.route("/getSeriesSriByCaja", methods=["POST"])
@jwt_required()
def getSeriesSriByCaja():
    claims = get_jwt()
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        sCodCia = str(seleccion["cliciaciacodigo"]).strip()[:2]
    except KeyError:
        return jsonify({"error": "Sesión inválida o incompleta"}), 401

    data = request.get_json()
    cjacodigo = data.get("cjacodigo")

    if not cjacodigo:
        return jsonify({"error": "Falta el código de la caja"}), 400

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Extraemos los documentos de la caja desde siactsriseries
        query = text(
            """
            SELECT
                srisecdoc,
                sridestipo,
                srisecini,
                srisecfin,
                ISNULL(srisecact, 0) AS srisecact
            FROM siactsriseries
            WHERE ciacodigo = :cia AND cjacodigo = :cja
            ORDER BY srisecdoc ASC
            """
        )

        result = connection.execute(query, {"cia": sCodCia, "cja": cjacodigo}).mappings().fetchall()
        data_result = [dict(row) for row in result]

    return jsonify({"data": data_result}), 200
