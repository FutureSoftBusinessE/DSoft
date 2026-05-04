from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxcmcli import Cxcmcli
from sqlalchemy import func, or_


@bp.route("/getClientes", methods=["POST"])
@cross_origin()
@jwt_required()
def ayudaCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)

    data = request.get_json()
    page = data.get("page", 1)
    per_page = 10
    filters = data.get("filters", {})

    query_ayudaCliente = (
        db.session.query(
            Cxcmcli.clicodigo,
            Cxcmcli.clinombre,
            Cxcmcli.cliruc,
            Cxcmcli.clitelef1,
            Cxcmcli.clidirec,
            Cxcmcli.clireferencia1,
            Cxcmcli.zoncodigo,
            Cxcmcli.clistatus,
            Cxcmcli.ciacodigo,
        )
        .order_by(Cxcmcli.clicodigo)
        .distinct()
    )

    # Aplica filtros
    for column, filter_value in filters.items():

        if filter_value:
            lower_filter_value = filter_value.lower()
            query_ayudaCliente = query_ayudaCliente.filter(
                or_(
                    func.lower(getattr(Cxcmcli, column)) == lower_filter_value,
                    func.lower(getattr(Cxcmcli, column)).like(f"%{lower_filter_value}%"),
                )
            )

    total = query_ayudaCliente.count()
    clientes = query_ayudaCliente.offset((page - 1) * per_page).limit(per_page).all()

    result = {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "clientes": [dict(cliente._asdict()) for cliente in clientes],
    }

    return jsonify(result)
