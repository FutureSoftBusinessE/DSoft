from flask import jsonify, request
from app.Integradora import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from app.Clases.SEARCH_TYPE_HELPER import SEARCH_TYPE_HELPER


@bp.route("/getZonas", methods=["POST"])
@jwt_required()
def getZonas():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json() or {}
    type_search = data.get("typeSearch", SEARCH_TYPE_HELPER.FILTER_TABLE_SEARCH.value)
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            if type_search == SEARCH_TYPE_HELPER.ID_SEARCH.value:
                zoncodigo = str(data.get("zoncodigo", "")).strip()

                if not zoncodigo:
                    return jsonify({"data": {}}), 200

                query = text(
                    """
                    SELECT
                        zoncodigo,
                        zondescri,
                        zonstatus
                    FROM fapzona
                    WHERE zoncodigo = :zoncodigo
                    """
                )

                result = connection.execute(query, {"zoncodigo": zoncodigo}).mappings().fetchone()
                return jsonify({"data": dict(result) if result else {}}), 200

            # Definir columnas permitidas para filtros
            allowed_columns = [
                {"zoncodigo": FILTER_VALUE_TYPE.STRING},
                {"zondescri": FILTER_VALUE_TYPE.STRING},
                {"zonstatus": FILTER_VALUE_TYPE.STRING},
            ]

            base_query = """
            SELECT
                zoncodigo,
                zondescri,
                zonstatus
            FROM fapzona"""

            # Construir consulta paginada con filtros
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "zoncodigo ASC",
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Procesar resultado
            total_records = result[0]["total"] if result else 0
            all_integradora_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    return (
        jsonify(
            {
                "data": all_integradora_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
