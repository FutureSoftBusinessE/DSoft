# flake8: noqa
import base64

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import and_, func
from app.models.intimagen import intimagen
from flask import jsonify, request
from flask_cors import cross_origin
from app.productos import bp
from app.extensions import db
from app.models.viewProductos import ViewProducto
from app.models.view_inmstock import view_inmstock

from app.utils import paginate
from app.db import get_session

# {
#       "limit": 100,
#       "page": 1
# {


@bp.route("/get_productos_fichas", methods=["POST"])
@cross_origin()
@jwt_required()
def get_productos_fichas():
    data = request.get_json() if request.is_json else None
    claims = get_jwt()
    cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    clicianonBD = claims["seleccion"]["clicianonBD"]
    db.session = get_session(clicianonBD)

    # producto_codigo = data['producto_codigo']
    limit = int(data.get("limit", 10))  # default limit to 10 if not provided
    page = int(data.get("page", 1))  # default page to 1 if not provided

    query_columns = [
        ViewProducto.artcodigo.label("codigo"),
        ViewProducto.artdescri.label("descripcion"),
        ViewProducto.artprecventa1.label("precio"),
        ViewProducto.meddescri.label("medida"),
        ViewProducto.mardescri.label("marca"),
        ViewProducto.predescri.label("presentacion"),
        ViewProducto.lindescri.label("linea"),
        ViewProducto.artcantactual.label("cantidad"),
        intimagen.artimagen.label("imagen"),
        # func.encode(intimagen.artimagen, 'base64').label('imagen')
    ]

    head_and_image, count_query = paginate(
        page,
        limit,
        db.session.query(*query_columns)
        .join(
            intimagen,
            and_(
                # ViewProducto.artcodigo == intimagen.artcodigo,
                ViewProducto.ciacodigo
                == intimagen.ciacodigo
            ),
        )
        .filter(
            # ViewProducto.artcodigo == str(producto_codigo),
            ViewProducto.ciacodigo
            == cliciaciacodigo
        )
        .order_by(ViewProducto.artcodigo),
    )

    # Convertir los objetos Row en diccionarios
    data = [row._asdict() for row in head_and_image]
    for item in data:
        if item["imagen"] is not None:
            item["imagen"] = base64.b64encode(item["imagen"]).decode("utf-8")

    response_data = {"data": data, "total_count": count_query}

    return jsonify(response_data)
