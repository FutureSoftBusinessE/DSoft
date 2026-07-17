from flask import jsonify, request
from app.ExcepcionesdeIVA import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text

# Importaciones de la arquitectura de paginación y filtros SIAC
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllExcepcionesdeIVA", methods=["POST"])
@jwt_required()
def getAllExcepcionesdeIVA():
    # 1. Extracción de variables de sesión[cite: 21]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    # Nota: No usamos cliciaciacodigo (sCodCia) en la consulta porque
    # siacivaexcepcion se maneja globalmente por ivetipocompania.

    # 2. Extracción de los parámetros de paginación[cite: 21]
    data = request.get_json() or {}
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 15))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. Columnas permitidas para filtros según la tabla siacivaexcepcion[cite: 21]
            allowed_columns = [
                {"ivetipocompania": FILTER_VALUE_TYPE.STRING},
                {"ivefecinicio": FILTER_VALUE_TYPE.DATETIME},
                {"ivefectermino": FILTER_VALUE_TYPE.DATETIME},
                {"iveporcentajeactual": FILTER_VALUE_TYPE.NUMBER},
                {"iveporcentajeresolucion": FILTER_VALUE_TYPE.NUMBER},
                {"ivenumresolucion": FILTER_VALUE_TYPE.STRING},
                {"ivemotivo": FILTER_VALUE_TYPE.STRING},
                {"ivestatus": FILTER_VALUE_TYPE.STRING},
                {"ivefecisys": FILTER_VALUE_TYPE.DATETIME},
                {"iveusuisys": FILTER_VALUE_TYPE.STRING},
                {"ivefecmsys": FILTER_VALUE_TYPE.DATETIME},
                {"iveusumsys": FILTER_VALUE_TYPE.STRING},
            ]

            # 4. Consulta Base limpia (Sin alias problemáticos en el order_by)[cite: 21]
            base_query = """
            SELECT
                ivetipocompania,
                ivefecinicio,
                ivefectermino,
                iveporcentajeactual,
                iveporcentajeresolucion,
                ivenumresolucion,
                ivemotivo,
                ivestatus,
                ivefecisys,
                ivehorisys,
                iveusuisys,
                iveestisys,
                ivefecmsys,
                ivehormsys,
                iveusumsys,
                iveestmsys
            FROM siacivaexcepcion
            """

            # 5. Construir consulta paginada usando parámetros nombrados (kwargs)[cite: 21]
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["ivetipocompania ASC", "ivefecinicio DESC"],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            # 6. Ejecución de la consulta empaquetada[cite: 21]
            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Extracción del total como viene inyectado desde la arquitectura SIAC[cite: 21]
            total_records = result[0]["total"] if result else 0

            # Limpiamos el campo 'total' del diccionario para no ensuciar la data de React[cite: 21]
            all_excepciones_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    # 7. Retorno PLANO directo (Sin @api_endpoint) para compatibilidad con la grilla[cite: 21]
    return (
        jsonify(
            {
                "success": True,
                "data": all_excepciones_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
                "meta": {"totalRowCount": total_records},
            }
        ),
        200,
    )
