from flask import jsonify, request
from app.FacturaDesdeArticulos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxcmcli import Cxcmcli
from sqlalchemy import func, or_
from enum import Enum


class SEARCH_TYPE_HELPER(Enum):
    ID_SEARCH = "id"
    FILTER_TABLE_SEARCH = "filter"


@bp.route("/getCliente", methods=["POST"])
@jwt_required()
def getCliente():
    claims = get_jwt()
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    data = request.get_json()
    typeSearch = data.get("typeSearch", None)

    if typeSearch == SEARCH_TYPE_HELPER.ID_SEARCH.value:
        clicodigo = data.get("clicodigo")
        query_cliente = (
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
            .filter(
                Cxcmcli.ciacodigo == ciacodigo,
                Cxcmcli.clicodigo == clicodigo,
            )
            .order_by(Cxcmcli.clinombre)
            .distinct()
            .first()
        )

        cliente = {
            "clicodigo": query_cliente.clicodigo,
            "clinombre": query_cliente.clinombre,
            "cliruc": query_cliente.cliruc,
            "clitelef1": query_cliente.clitelef1,
            "clidirec": query_cliente.clidirec,
            "clireferencia1": query_cliente.clireferencia1,
            "zoncodigo": query_cliente.zoncodigo,
            "clistatus": query_cliente.clistatus,
            "ciacodigo": query_cliente.ciacodigo,
        }

        return jsonify({"data": cliente}), 200

    if typeSearch == SEARCH_TYPE_HELPER.FILTER_TABLE_SEARCH.value:

        page = data.get("page", 1)
        per_page = data.get("perPage", 1)
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
            .filter(Cxcmcli.ciacodigo == ciacodigo)
            .order_by(Cxcmcli.clinombre)
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
            "data": [dict(cliente._asdict()) for cliente in clientes],
        }

        return jsonify(result)

    return "error", 500
