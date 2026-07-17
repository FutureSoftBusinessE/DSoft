from flask import jsonify, request
from app.TipoDeCompania import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text

# Importaciones de tu arquitectura de paginación y filtros[cite: 19]
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllTipoDeCompania", methods=["POST"])
@jwt_required()
# IMPORTANTE: No usamos @api_endpoint aquí para no alterar el formato de respuesta de la grilla[cite: 19]
def getAllTipoDeCompania():
    # 1. Extracción de variables de sesión[cite: 19]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    # Nota: No usamos cliciaciacodigo (sCodCia) en la consulta porque
    # siactipocompania se maneja globalmente.

    # 2. Extracción de los parámetros de paginación[cite: 19]
    data = request.get_json() or {}
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. Columnas permitidas para filtros según la tabla siactipocompania[cite: 19]
            allowed_columns = [
                {"tpcodigo": FILTER_VALUE_TYPE.STRING},
                {"tpdescripcion": FILTER_VALUE_TYPE.STRING},
                {"tpobservacion": FILTER_VALUE_TYPE.STRING},
                {"tpstatus": FILTER_VALUE_TYPE.STRING},
                {"tpfecisys": FILTER_VALUE_TYPE.DATETIME},
                {"tpusuisys": FILTER_VALUE_TYPE.STRING},
                {"tpfecmsys": FILTER_VALUE_TYPE.DATETIME},
                {"tpusumsys": FILTER_VALUE_TYPE.STRING},
            ]

            # 4. Consulta Base limpia sin cruces ni alias problemáticos[cite: 19]
            base_query = """
            SELECT
                tpcodigo,
                tpdescripcion,
                tpobservacion,
                tpstatus,
                tpfecisys,
                tphorisys,
                tpusuisys,
                tpestisys,
                tpfecmsys,
                tphormsys,
                tpusumsys,
                tpestmsys
            FROM siactipocompania
            """

            # 5. Construir consulta paginada[cite: 19]
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["tpcodigo ASC"],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            # 6. Ejecución de la consulta empaquetada[cite: 19]
            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Extracción del total de registros[cite: 19]
            total_records = result[0]["total"] if result else 0

            # Limpiamos el campo 'total' del diccionario para no ensuciar la data de React[cite: 19]
            all_tipos_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    # 7. Retorno PLANO directo para compatibilidad con CustomConditionalActionsTableServerSide[cite: 19]
    return (
        jsonify(
            {
                "success": True,
                "data": all_tipos_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
                "meta": {"totalRowCount": total_records},
            }
        ),
        200,
    )
