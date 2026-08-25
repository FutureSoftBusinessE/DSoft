from flask import jsonify, request
from app.TransEvenAsesor import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text

# Importaciones de tu arquitectura de paginación y filtros[cite: 27]
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getEventosOrigen", methods=["POST"])
@jwt_required()
def getEventosOrigen():
    # 1. Extracción de sesión[cite: 27]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Recepción de parámetros de la grilla[cite: 27]
    data = request.get_json() or {}
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    # Extracción del parámetro externo enviado desde el Acordeón/Filtro del Frontend
    external_filters = data.get("externalFilters", {})
    usrcodigo_origen = str(external_filters.get("usrcodigo_origen", "")).strip().replace("'", "''")

    # Si no hay usuario origen seleccionado, devolvemos un arreglo vacío inmediatamente
    # para no saturar la base de datos con consultas innecesarias.
    if not usrcodigo_origen:
        return (
            jsonify(
                {
                    "data": [],
                    "total": 0,
                    "page": page,
                    "per_page": per_page,
                    "total_pages": 0,
                }
            ),
            200,
        )

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. Columnas permitidas para filtros directos de la tabla[cite: 27]
            allowed_columns = [
                {"eventocodigo": FILTER_VALUE_TYPE.STRING},
                {"pregdescri": FILTER_VALUE_TYPE.STRING},
                {"eventofecha": FILTER_VALUE_TYPE.DATETIME},
                {"clicodigo": FILTER_VALUE_TYPE.STRING},
                {"clinombre": FILTER_VALUE_TYPE.STRING},
                {"eventostatus": FILTER_VALUE_TYPE.STRING},
            ]

            # 4. Consulta Base (Solo filtramos eventos ACTIVOS)
            base_query = f"""
            SELECT
                eventocodigo,
                pregcodigo,
                pregdescri,
                eventofecha,
                eventohorainicio,
                eventohorafin,
                clicodigo,
                clinombre,
                eventostatus
            FROM gdocmeventos
            WHERE ciacodigo = '{sCodCia}'
              AND usrcodigo = '{usrcodigo_origen}'
              AND eventostatus IN ('PENDIENTE', 'EN_PROCESO')
            """

            # 5. Construir consulta paginada[cite: 27]
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["eventofecha ASC", "eventohorainicio ASC"],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            # Ejecutar la consulta generada
            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Extraer el total de registros calculados[cite: 27]
            total_records = result[0]["total"] if result else 0

            # Limpiar la columna 'total' añadida por build_paginated_query para la respuesta final[cite: 27]
            all_eventos_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    # 6. Retorno nativo del framework (Sin decorador)[cite: 27]
    return (
        jsonify(
            {
                "data": all_eventos_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
