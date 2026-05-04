# flake8: noqa
from urllib import request
from flask import jsonify
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required
from app.siacopc import bp
from app.extensions import db
from app.models.siacopc import Siacopc


@bp.route("/obtener_items", methods=["GET"])
@cross_origin()
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
    )  # .order_by(Producto.artcodigo).all()

    # El resultado de la consulta es un objeto Row, que no puede ser serializado en JSON directamente.
    # Para convertir los objetos Row en diccionarios se utiliza el mÃ©todo as_dict() que se puede agregar en el modelo de SQLAlchemy.
    # Luego, se puede construir una lista de diccionarios y devolverla como una respuesta JSON
    data = [row._asdict() for row in query_result]

    return jsonify(data)
