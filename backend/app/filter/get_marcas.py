# flake8: noqa
from flask_jwt_extended import get_jwt, jwt_required
from app.models.marca import Marca
from flask import jsonify, request
from app.filter import bp
from app.extensions import db
from flask_cors import cross_origin
from app.db import get_session


@bp.route("/get_marcas", methods=["POST"])
@cross_origin()
@jwt_required()
def get_marcas():

    data = request.get_json() if request.is_json else None
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    try:
        cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    except KeyError:
        error_response = {"error": 'No se encontró la clave "cliciaciacodigo" en el payload del JWT'}
        return jsonify(error_response), 400

    db.session = get_session(clicianonBD)

    results = db.session.query(Marca.marcodigo, Marca.mardescri).filter(Marca.ciacodigo == cliciaciacodigo).order_by(Marca.marcodigo).all()

    output = [row._asdict() for row in results]

    return jsonify(output)
