# flake8: noqa
from flask_jwt_extended import get_jwt, jwt_required
from flask import jsonify, request
from flask_cors import cross_origin
from app.productos import bp
from app.extensions import db
from app.models.viewProductos import ViewProducto
from app.db import get_session

# {
#     "limit": 100,
#     "page": 1
# }


@bp.route("/obtener_viewProductos_x_pagina", methods=["POST"])
@cross_origin()
@jwt_required()
def obtener_viewProductos_x_pagina():
    # page = request.args.get('page', 1, type=int)
    # limit = request.args.get('limit', 100, type=int)
    data = request.get_json() if request.is_json else None
    claims = get_jwt()
    cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    limit = int(data["limit"])
    page = int(data["page"])

    offset = (page - 1) * limit

    clicianonBD = claims["seleccion"]["clicianonBD"]
    db.session = get_session(clicianonBD)

    query_result = (
        db.session.query(
            ViewProducto.artcodigo.label("codigo"),
            ViewProducto.artdescri.label("descripcion"),
            ViewProducto.artprecventa1.label("precio"),
            ViewProducto.meddescri.label("medida"),
            ViewProducto.mardescri.label("marca"),
            ViewProducto.predescri.label("presentacion"),
            ViewProducto.lindescri.label("linea"),
        )
        .filter(ViewProducto.ciacodigo == cliciaciacodigo)
        .order_by(ViewProducto.artcodigo)
        .offset(offset)
        .limit(limit)
        .all()
    )

    data = [row._asdict() for row in query_result]

    return jsonify(data)
