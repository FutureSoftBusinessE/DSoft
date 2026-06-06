from flask import jsonify, request
from app.SectorComercialCliente import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllSectorComercialCliente", methods=["POST"])
@jwt_required()
def getAllSectorComercialCliente():
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
                {"activicodigo": FILTER_VALUE_TYPE.STRING},
                {"actividescri": FILTER_VALUE_TYPE.STRING},
                {"activistatus": FILTER_VALUE_TYPE.STRING},
                {"activifecisys": FILTER_VALUE_TYPE.DATETIME},
                {"activihorisys": FILTER_VALUE_TYPE.DATETIME},
                {"activiusuisys": FILTER_VALUE_TYPE.STRING},
                {"activiestisys": FILTER_VALUE_TYPE.STRING},
                {"activifecmsys": FILTER_VALUE_TYPE.DATETIME},
                {"activihormsys": FILTER_VALUE_TYPE.DATETIME},
                {"activiusumsys": FILTER_VALUE_TYPE.STRING},
                {"activiestmsys": FILTER_VALUE_TYPE.STRING},
            ]

            base_query = """
            SELECT
                activicodigo,
                actividescri,
                activistatus,
                activifecisys,
                activihorisys,
                activiusuisys,
                activiestisys,
                activifecmsys,
                activihormsys,
                activiusumsys,
                activiestmsys
            FROM cxcbacteconomicas"""

            # Construir consulta paginada con filtros
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "activicodigo ASC",
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Procesar resultado
            total_records = result[0]["total"] if result else 0
            all_sector_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    return (
        jsonify(
            {
                "data": all_sector_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
