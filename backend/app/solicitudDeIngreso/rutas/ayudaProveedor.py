from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxpmprov import cxpmprov
from sqlalchemy import func, or_


@bp.route("/getProveedores", methods=["POST"])
@jwt_required()
def ayudaProveedor():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)

    data = request.get_json()
    page = data.get("page", 1)
    per_page = 10
    filters = data.get("filters", {})  # Obtén los filtros

    query_ayudaProveedor = (
        db.session.query(
            cxpmprov.procodigo,
            cxpmprov.pronombre,
            cxpmprov.proruc,
            cxpmprov.protelef1,
            cxpmprov.prodirec,
            cxpmprov.bcotipcta,
            cxpmprov.propais,
            cxpmprov.prostatus,
        )
        .order_by(cxpmprov.procodigo)
        .distinct()
    )

    # Aplica filtros
    for column, filter_value in filters.items():

        if filter_value:
            lower_filter_value = filter_value.lower()
            query_ayudaProveedor = query_ayudaProveedor.filter(
                or_(
                    func.lower(getattr(cxpmprov, column)) == lower_filter_value,
                    func.lower(getattr(cxpmprov, column)).like(f"%{lower_filter_value}%"),
                )
            )

    total = query_ayudaProveedor.count()
    proveedores = query_ayudaProveedor.offset((page - 1) * per_page).limit(per_page).all()

    result = {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "proveedores": [dict(proveedor._asdict()) for proveedor in proveedores],
    }

    return jsonify(result)
