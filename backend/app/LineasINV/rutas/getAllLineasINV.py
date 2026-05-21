from flask import jsonify, request
from app.LineasINV import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text

# Importaciones de la arquitectura de paginación y filtros SIAC
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllLineasINV", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllLineasINV():
    # 1. Extracción de sesión y multitenancy
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    # Filtro obligatorio por compañía
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener parámetros de paginación enviados desde la grilla de React
    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. Definir columnas permitidas para filtros dinámicos basados en la tabla inblin
            allowed_columns = [
                {"lincodigo": FILTER_VALUE_TYPE.STRING},
                {"lindescri": FILTER_VALUE_TYPE.STRING},
                {"linlindes": FILTER_VALUE_TYPE.STRING},  # Código del Padre
                {"coscodigo": FILTER_VALUE_TYPE.STRING},
                {"linnivel": FILTER_VALUE_TYPE.NUMBER},  # Nivel de profundidad
                {"lintipo": FILTER_VALUE_TYPE.STRING},  # Movimiento (M) o Totalizador (T)
                {"linstatus": FILTER_VALUE_TYPE.STRING},
                {"numsecini": FILTER_VALUE_TYPE.NUMBER},
                {"numseccont": FILTER_VALUE_TYPE.NUMBER},
                # Código limpio para ordenamiento
                {"lincodigo1": FILTER_VALUE_TYPE.STRING},
                {"linfecisys": FILTER_VALUE_TYPE.DATETIME},
                {"linhorisys": FILTER_VALUE_TYPE.DATETIME},
                {"linusuisys": FILTER_VALUE_TYPE.STRING},
                {"linfecmsys": FILTER_VALUE_TYPE.DATETIME},
                {"linhormsys": FILTER_VALUE_TYPE.DATETIME},
                {"linusumsys": FILTER_VALUE_TYPE.STRING},
            ]

            # 4. Consulta Base (Filtrada estrictamente por la compañía del usuario)
            base_query = f"""
            SELECT
                lincodigo,
                lindescri,
                linlindes,
                coscodigo,
                linnivel,
                lintipo,
                linstatus,
                numsecini,
                numseccont,
                lincodigo1,
                linfecisys,
                linhorisys,
                linusuisys,
                linfecmsys,
                linhormsys,
                linusumsys
            FROM inblin
            WHERE ciacodigo = '{sCodCia}'
            """

            # 5. Construcción de la consulta paginada segura
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    # Ordenamiento jerárquico natural para que el árbol se dibuje correctamente
                    "lincodigo1 ASC",
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            # 6. Ejecución de la consulta en SQL Server
            result = connection.execute(text(final_query), params).mappings().fetchall()

            # 7. Procesamiento de resultados para la grilla
            total_records = result[0]["total"] if result else 0
            # Formatear lista excluyendo la columna virtual de conteo 'total'
            all_lineas_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    # 8. Retorno estructurado JSON para el componente CustomConditionalActionsTableServerSide en React
    return (
        jsonify(
            {
                "data": all_lineas_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
