from flask import jsonify, request
from app.ContraCliDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text

# Importaciones de la arquitectura de paginación y filtros SIAC
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllContraCliDF", methods=["POST"])
@jwt_required()
def getAllContraCliDF():
    # 1. Extracción de sesión y contexto multitenancy (Estándar SIAC)
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
            # 3. Definir columnas permitidas para filtros dinámicos en la grilla
            # Permitimos buscar por código de contrato, cliente, descripción o estado
            allowed_columns = [
                {"concodcontrato": FILTER_VALUE_TYPE.STRING},
                {"clicodigo": FILTER_VALUE_TYPE.STRING},
                {"clicodigoFac": FILTER_VALUE_TYPE.STRING},
                {"condescri": FILTER_VALUE_TYPE.STRING},
                {"constatus": FILTER_VALUE_TYPE.STRING},
            ]
            # 4. Consulta Base filtrada por compañía y formateo seguro de fechas para JSON
            base_query = f"""
            SELECT
                concodcontrato,
                condescri,
                clicodigo,
                clicodigoFac,
                concodigo,
                constatus,
                CONVERT(varchar, confecinicio, 23) AS confecinicio,
                CONVERT(varchar, confecfin, 23) AS confecfin,
                confrecuencia,
                convalor
            FROM cxcccontratos
            WHERE ciacodigo = '{sCodCia}'
            """

            # 5. Construcción de la consulta paginada segura
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "confecinicio DESC",  # Ordenamiento por defecto: Los más recientes primero
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
            # y forzando la conversión de Decimal a Float para que JSON no de error
            all_contratos_result = []
            for row in result:
                row_dict = dict(row)
                if "total" in row_dict:
                    del row_dict["total"]
                # Aseguramos que el valor monetario se serialice correctamente en JSON
                row_dict["convalor"] = float(row_dict.get("convalor", 0.0))
                all_contratos_result.append(row_dict)

    # 8. Retorno estructurado para el componente de grilla en React (Material React Table)
    return (
        jsonify(
            {
                "data": all_contratos_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
