from flask import jsonify, request
from app.Integradora import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllIntegradora", methods=["POST"])
@jwt_required()
def getAllIntegradora():
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
                {"integracodigo": FILTER_VALUE_TYPE.STRING},
                {"integradescri": FILTER_VALUE_TYPE.STRING},
                {"integradirecc": FILTER_VALUE_TYPE.STRING},
                {"integrafono": FILTER_VALUE_TYPE.STRING},
                {"integrastatus": FILTER_VALUE_TYPE.STRING},
                {"integraruc": FILTER_VALUE_TYPE.STRING},
                {"integraidentifica": FILTER_VALUE_TYPE.STRING},
                {"integratipo": FILTER_VALUE_TYPE.STRING},
                {"sectorcodigo": FILTER_VALUE_TYPE.STRING},
            ]

            base_query = """
            SELECT
                integracodigo,
                integradescri,
                integradirecc,
                integrafono,
                integrastatus,
                integrafecisys,
                integrahorisys,
                integrausuisys,
                integraestisys,
                integrafecmsys,
                integrahormsys,
                integrausumsys,
                integraestmsys,
                integraruc,
                integraidentifica,
                integratipo,
                sectorcodigo
            FROM fabintegra"""

            # Construir consulta paginada con filtros
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "integracodigo ASC",
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
