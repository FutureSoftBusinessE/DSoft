from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.viewProductos import ViewProducto as view_inmart
from app.models.intimagen import intimagen as intimagen
from sqlalchemy import func, or_


@bp.route("/getProductos", methods=["POST"])
@jwt_required()
def ayudaProducto():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)

    data = request.get_json()
    page = data.get("page", 1)
    per_page = 10
    filters = data.get("filters", {})

    # Crea la consulta base
    query_ayudaProducto = (
        db.session.query(
            view_inmart.artcodigo,  # cod
            view_inmart.artdescri,  # nombre
            view_inmart.artcantactual,  # stock local 1
            view_inmart.artprecventa1,  # precio 1
            view_inmart.mardescri,  # marca
            view_inmart.codigo2,
            view_inmart.artnumparte,
            view_inmart.lindescri,
            view_inmart.predescri,
            view_inmart.meddescri,
            view_inmart.artprecventa2,  # precio 2
            view_inmart.artprecventa3,  # precio 3
            view_inmart.artprecventa4,  # precio 4
            view_inmart.artprecventa5,  # precio 5
            view_inmart.artprecventa6,  # precio 6
            view_inmart.artstatus,
            view_inmart.artdecimal,
            func.coalesce(intimagen.artcodigo, "No existe imagen disponible").label("imagen"),
        )
        .outerjoin(
            intimagen,
            (intimagen.ciacodigo == ciacodigo) & (intimagen.artcodigo == view_inmart.artcodigo),
        )
        .order_by(view_inmart.artcodigo)
        .distinct()
    )

    # Aplica filtros
    for column, filter_value in filters.items():
        if filter_value:
            lower_filter_value = filter_value.lower()
            query_ayudaProducto = query_ayudaProducto.filter(
                or_(
                    func.lower(getattr(view_inmart, column)) == lower_filter_value,
                    func.lower(getattr(view_inmart, column)).like(f"%{lower_filter_value}%"),
                )
            )

    # Paginación y conteo
    total = query_ayudaProducto.count()
    productos = query_ayudaProducto.offset((page - 1) * per_page).limit(per_page).all()

    result = {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "productos": [dict(producto._asdict()) for producto in productos],
    }

    return jsonify(result)
