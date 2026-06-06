from flask import jsonify, request
from app.ProveedoresDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text

# Importaciones de la arquitectura de paginación y filtros SIAC
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllProveedoresDF", methods=["POST"])
@jwt_required()
def getAllProveedoresDF():
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
            # 3. Definir columnas permitidas para filtros dinámicos
            # IMPORTANTE: Los nombres deben coincidir con los alias del SELECT para que el paginador los reconozca
            allowed_columns = [
                {"procodigo": FILTER_VALUE_TYPE.STRING},
                {"Tipo de Identificacion": FILTER_VALUE_TYPE.STRING},
                {"Cedula o Ruc": FILTER_VALUE_TYPE.STRING},
                {"Nombre": FILTER_VALUE_TYPE.STRING},
                {"Razon Social": FILTER_VALUE_TYPE.STRING},
                {"Direccion": FILTER_VALUE_TYPE.STRING},
                {"Email": FILTER_VALUE_TYPE.STRING},
                {"Telefono": FILTER_VALUE_TYPE.STRING},
                {"Celular": FILTER_VALUE_TYPE.STRING},
                {"Estado": FILTER_VALUE_TYPE.STRING},
            ]

            # 4. Consulta Base con los alias solicitados
            base_query = f"""
            SELECT
                procodigo,
                procalif as "Tipo de Identificacion",
                proruc as "Cedula o Ruc",
                pronombre as Nombre,
                pronommat as "Razon Social",
                prodirec as Direccion,
                proemail as Email,
                protelef1 as Telefono,
                procelu as Celular,
                prostatus as Estado
            FROM cxpmprov
            WHERE ciacodigo = '{sCodCia}'
            """

            # 5. Construcción de la consulta paginada segura
            # CORRECCIÓN: Se utiliza "Nombre ASC" en lugar de "pronombre ASC"
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "Nombre ASC",
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
            all_proveedores_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    # 8. Retorno estructurado para el componente de grilla en React
    return (
        jsonify(
            {
                "data": all_proveedores_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
