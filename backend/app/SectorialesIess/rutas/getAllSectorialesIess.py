from flask import jsonify, request
from app.SectorialesIess import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text

# Importaciones de la arquitectura de paginación y filtros SIAC
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllSectorialesIess", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllSectorialesIess():
    # 1. Extracción de sesión y multitenancy
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener parámetros de paginación enviados desde el Frontend
    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. Definir columnas permitidas para filtros dinámicos
            allowed_columns = [
                {"seccodigo": FILTER_VALUE_TYPE.STRING},
                {"secanio": FILTER_VALUE_TYPE.NUMBER},
                {"seccargo": FILTER_VALUE_TYPE.STRING},
                {"secestruc": FILTER_VALUE_TYPE.STRING},
                {"secdetalle": FILTER_VALUE_TYPE.STRING},
                {"secsalario": FILTER_VALUE_TYPE.NUMBER},
                {"secstatus": FILTER_VALUE_TYPE.STRING},
                {"secfecisys": FILTER_VALUE_TYPE.DATETIME},
                {"sechorisys": FILTER_VALUE_TYPE.DATETIME},
                {"secusuisys": FILTER_VALUE_TYPE.STRING},
                {"secestisys": FILTER_VALUE_TYPE.STRING},
                {"secfecmsys": FILTER_VALUE_TYPE.DATETIME},
                {"sechormsys": FILTER_VALUE_TYPE.DATETIME},
                {"secusumsys": FILTER_VALUE_TYPE.STRING},
                {"secestmsys": FILTER_VALUE_TYPE.STRING},
            ]

            # 4. Consulta Base (Filtrada por compañía)
            base_query = f"""
            SELECT
                seccodigo,
                secanio,
                seccargo,
                secestruc,
                secdetalle,
                secsalario,
                secstatus,
                secfecisys,
                sechorisys,
                secusuisys,
                secestisys,
                secfecmsys,
                sechormsys,
                secusumsys,
                secestmsys
            FROM nomsectorialiess
            WHERE ciacodigo = '{sCodCia}'
            """

            # 5. Construcción de la consulta paginada segura
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "secanio DESC",  # Ordenamiento por defecto: Año más reciente
                    "seccargo ASC",  # Luego por descripción de cargo
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

            # Formatear lista excluyendo la columna virtual de conteo
            all_sectoriales_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    # 8. Retorno estructurado para el componente de grilla en React
    return (
        jsonify(
            {
                "data": all_sectoriales_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
