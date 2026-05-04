from flask import jsonify, request
from app.Integradora import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from app.Clases.SEARCH_TYPE_HELPER import SEARCH_TYPE_HELPER


@bp.route("/getTipoIdentificacion", methods=["POST"])
@cross_origin()
@jwt_required()
def getTipoIdentificacion():
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
                codigo = str(data.get("codigo", "")).strip()

                if not codigo:
                    return jsonify({"data": {}}), 200

                query = text(
                    """
                    SELECT
                        codigo,
                        descripcion,
                        orden
                    FROM siacsritipoidentificacion
                    WHERE codigo = :codigo
                    """
                )

                result = connection.execute(query, {"codigo": codigo}).mappings().fetchone()
                return jsonify({"data": dict(result) if result else {}}), 200

            # Definir columnas permitidas para filtros
            allowed_columns = [
                {"codigo": FILTER_VALUE_TYPE.STRING},
                {"descripcion": FILTER_VALUE_TYPE.STRING},
                {"orden": FILTER_VALUE_TYPE.NUMBER},
            ]

            base_query = """
            SELECT
                codigo,
                descripcion,
                orden
            FROM siacsritipoidentificacion"""

            # Construir consulta paginada con filtros
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "codigo ASC",
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
