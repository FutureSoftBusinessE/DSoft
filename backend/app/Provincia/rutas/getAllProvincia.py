from flask import jsonify, request
from app.Provincia import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllProvincia", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllProvincia():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Definir columnas permitidas para filtros
            allowed_columns = [
                {"procodigo": FILTER_VALUE_TYPE.STRING},
                {"prodescri": FILTER_VALUE_TYPE.STRING},
                {"prostatus": FILTER_VALUE_TYPE.STRING},
                {"profecsys": FILTER_VALUE_TYPE.DATETIME},
                {"prohorsys": FILTER_VALUE_TYPE.DATETIME},
                {"proususys": FILTER_VALUE_TYPE.STRING},
            ]

            base_query = """
            SELECT
                procodigo,
                prodescri,
                prostatus,
                profecsys,
                prohorsys,
                proususys
            FROM rhbprov"""

            # Construir consulta paginada con filtros
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "procodigo ASC",
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Procesar resultado
            total_records = result[0]["total"] if result else 0
            all_provincia_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    return (
        jsonify(
            {
                "data": all_provincia_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
