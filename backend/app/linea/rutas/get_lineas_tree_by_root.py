# flake8: noqa
from flask_jwt_extended import get_jwt, jwt_required
from app.linea.utils.build_tree import build_tree
from flask import jsonify, request
from app.linea import bp
from app.extensions import db
from flask_cors import cross_origin
from app.models.linea import Linea

# {
#      "lincodigo_root": "01000"
# }


@bp.route("/get_lineas_tree_by_root", methods=["POST"])
@cross_origin()
@jwt_required()
def get_lineas_tree_by_root():
    data = request.get_json() if request.is_json else None
    claims = get_jwt()
    try:
        cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    except KeyError:
        error_response = {"error": 'No se encontró la clave "cliciaciacodigo" en el payload del JWT'}
        return jsonify(error_response), 400

    try:
        lincodigo = str(data.get("lincodigo_root"))
    except KeyError:
        error_response = {"error": 'No se encontró la clave "lincodigo_root" en el json de entrada'}
        return jsonify(error_response), 400

    lincodigo_recortado = lincodigo.rstrip("0")  # recortar los ceros a la derecha

    results = (
        db.session.query(
            Linea.lincodigo,
            Linea.lindescri,
            Linea.linlindes,
            Linea.linnivel,
            Linea.lintipo,
            Linea.linstatus,
            Linea.lincodigo1,
        )
        .filter(
            Linea.ciacodigo == cliciaciacodigo,
            Linea.lincodigo.like(lincodigo_recortado + "%"),  # utilizar like para filtrar
            Linea.linstatus == "A",
        )
        .order_by(Linea.lincodigo1)
        .all()
    )

    res = [row._asdict() for row in results]

    tree = {"items": build_tree(res, lincodigo)}

    return jsonify(tree)
