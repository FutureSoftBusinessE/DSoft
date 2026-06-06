from flask import jsonify, request
from app.ServiciosNDNC import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllServiciosNDNC", methods=["POST"])
@jwt_required()
def getAllServiciosNDNC():
    claims = get_jwt()

    # 1. EXTRACCIÓN DE IDENTIDAD Y BASE DE DATOS
    # No usamos @api_endpoint aquí para no alterar el formato que espera la tabla
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        sCodCia = seleccion["cliciaciacodigo"]
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
        with connection.begin():
            # Definición de columnas permitidas para el motor de búsqueda
            allowed_columns = [
                {"sercodigo": FILTER_VALUE_TYPE.STRING},
                {"serdescri": FILTER_VALUE_TYPE.STRING},
                {"serncnd": FILTER_VALUE_TYPE.STRING},
                {"serstatus": FILTER_VALUE_TYPE.STRING},
                {"seriva": FILTER_VALUE_TYPE.NUMBER},
                {"serautor": FILTER_VALUE_TYPE.NUMBER},
            ]

            # Query base filtrando estrictamente por la compañía del usuario
            base_query = f"""
            SELECT
                sercodigo,
                serdescri,
                serncnd,
                serstatus,
                seriva,
                serautor
            FROM cxcbser
            WHERE ciacodigo = '{sCodCia}'"""

            # Construcción de la consulta paginada con el helper del sistema
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["sercodigo ASC"],
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
