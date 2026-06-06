from flask import jsonify, request
from app.Cargos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllCargos", methods=["POST"])
@jwt_required()
def getAllCargos():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Asumimos que la compañía se envía en los filtros o por defecto es '01'
    ciacodigo = "01"

    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            allowed_columns = [
                {"cargocodigo": FILTER_VALUE_TYPE.STRING},
                {"cargodescri": FILTER_VALUE_TYPE.STRING},
                {"cargostatus": FILTER_VALUE_TYPE.STRING},
            ]

            # Filtramos siempre por la compañía actual para mantener la seguridad Multi-Compañía
            base_query = f"""
            SELECT
                cargocodigo,
                cargodescri,
                carsueldo,
                carrepresen,
                cargostatus
            FROM rhbcargos
            WHERE ciacodigo = '{ciacodigo}'"""

            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["cargocodigo ASC"],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            result = connection.execute(text(final_query), params).mappings().fetchall()

            total_records = result[0]["total"] if result else 0
            all_cargos_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    return (
        jsonify(
            {
                "data": all_cargos_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
