from flask import jsonify, request
from app.Instituciones import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllInstituciones", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllInstituciones():
    claims = get_jwt()

    # 1. EXTRACCIÓN DE IDENTIDAD Y BASE DE DATOS
    # No usamos @api_endpoint aquí para no alterar el formato que espera la tabla de React
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        # No extraemos 'cliciaciacodigo' porque el catálogo es global
    except KeyError:
        return jsonify({"error": "Sesión inválida o incompleta"}), 401

    # 2. PARÁMETROS DE PAGINACIÓN Y FILTROS
    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Definición de columnas permitidas para el motor de búsqueda
        allowed_columns = [
            {"insticodigo": FILTER_VALUE_TYPE.STRING},
            {"instidescri": FILTER_VALUE_TYPE.STRING},
            {"instistatus": FILTER_VALUE_TYPE.STRING},
        ]

        # Query base: Al ser catálogo global, seleccionamos directamente sin filtrar por compañía
        base_query = """
        SELECT
            insticodigo,
            instidescri,
            instistatus
        FROM gdocbinstituciones
        """

        # Construcción de la consulta paginada con el helper del sistema
        final_query, params = build_paginated_query(
            base_query=base_query,
            order_by=["insticodigo ASC"],
            filters=filters,
            page=page,
            per_page=per_page,
            allowed_columns=allowed_columns,
        )

        result = connection.execute(text(final_query), params).mappings().fetchall()

        total_records = result[0]["total"] if result else 0

        # Limpiamos el campo 'total' de los resultados de la fila para el set de datos final
        data_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    # Retorno en formato JSON puro compatible con CustomConditionalActionsTableServerSide
    return (
        jsonify(
            {
                "data": data_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
