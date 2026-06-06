# flake8: noqa
from flask import jsonify

from flask_jwt_extended import jwt_required
from app.siacopc import bp
from app.productos import bp

from app.extensions import db
from app.models.siacopc import Siacopc


@bp.route("/obtener_items", methods=["GET"])
@jwt_required()
def obtener_items():
    query_result = db.session.query(
        Siacopc.modcodigo.label("modcodigo"),
        Siacopc.opccaption.label("opccaption"),
        Siacopc.opcname.label("opcname"),
        Siacopc.opctag.label("opctag"),
        Siacopc.opcmenujquery.label("opcmenuquery"),
        Siacopc.nivel.label("nivel"),
        Siacopc.item_number.label("item_number"),
        Siacopc.padre_id.label("padre_id"),
    )
    data = [row._asdict() for row in query_result]

    return jsonify(data)
