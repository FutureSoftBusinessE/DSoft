from flask import jsonify, request
from app.TiposCliente import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text

# Importaciones de la arquitectura de paginación y filtros SIAC
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllTiposCliente", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllTiposCliente():
    # 1. Extracción de sesión y contexto multitenancy
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener parámetros de paginación y filtros enviados desde el Frontend
    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. Definir columnas permitidas para filtros dinámicos según tabla cxcbtipcli
            allowed_columns = [
                {"tipcodigo": FILTER_VALUE_TYPE.STRING},
                {"tipdescri": FILTER_VALUE_TYPE.STRING},
                {"tipcobdir": FILTER_VALUE_TYPE.NUMBER},
                {"tipstatus": FILTER_VALUE_TYPE.STRING},
                {"tipdefacr": FILTER_VALUE_TYPE.NUMBER},
                {"tipfecisys": FILTER_VALUE_TYPE.DATETIME},
                {"tiphorisys": FILTER_VALUE_TYPE.DATETIME},
                {"tipusuisys": FILTER_VALUE_TYPE.STRING},
                {"tipfecmsys": FILTER_VALUE_TYPE.DATETIME},
                {"tiphormsys": FILTER_VALUE_TYPE.DATETIME},
                {"tipusumsys": FILTER_VALUE_TYPE.STRING},
            ]

            # 4. Consulta Base (Filtrada estrictamente por compañía activa)
            base_query = f"""
            SELECT
                tipcodigo,
                tipdescri,
                tipcobdir,
                tipstatus,
                tipdefacr,
                tipfecisys,
                tiphorisys,
                tipusuisys,
                tipfecmsys,
                tiphormsys,
                tipusumsys
            FROM cxcbtipcli
            WHERE ciacodigo = '{sCodCia}'
            """

            # 5. Construcción de la consulta paginada segura
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "tipdescri ASC",   # Ordenamiento por defecto: Alfabético
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            # 6. Ejecución de la consulta
            result = connection.execute(text(final_query), params).mappings().fetchall()

            # 7. Procesamiento de resultados para la grilla
            total_records = result[0]["total"] if result else 0

            # Formatear lista excluyendo la columna virtual de conteo 'total'
            all_tipos_result = [
                {**{key: value for key, value in dict(row).items() if key != "total"}}
                for row in result
            ]

    # 8. Retorno estructurado para el componente de grilla en React
    return (
        jsonify(
            {
                "data": all_tipos_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
