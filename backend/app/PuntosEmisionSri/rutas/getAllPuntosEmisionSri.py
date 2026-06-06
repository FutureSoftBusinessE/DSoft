from flask import jsonify, request
from app.PuntosEmisionSri import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text

# Importaciones de tu arquitectura de paginación y filtros
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllPuntosEmisionSri", methods=["POST"])
@jwt_required()
def getAllPuntosEmisionSri():
    # 1. Extracción de sesión
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    # Obligatorio para filtrar la compañía
    sCodCia = str(claims["seleccion"]["cliciaciacodigo"]).strip()[:2]

    # 2. Obtener los parámetros de la solicitud enviados por la grilla de React
    data = request.get_json()
    page = int(data.get("page", 1))  # Página actual
    per_page = int(data.get("perPage", 10))  # Registros por página
    filters = data.get("filters", {})  # Filtros de búsqueda

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. Definir columnas permitidas para filtros en la grilla
            # CORRECCIÓN: Se quitan los alias C. y S. para que no fallen en el wrapper exterior
            allowed_columns = [
                {"cjacodigo": FILTER_VALUE_TYPE.STRING},
                {"cjadescri": FILTER_VALUE_TYPE.STRING},
                {"loccodigo": FILTER_VALUE_TYPE.STRING},
                {"cjastatus": FILTER_VALUE_TYPE.STRING},
                {"sripreauto": FILTER_VALUE_TYPE.STRING},
                {"sriautnumero": FILTER_VALUE_TYPE.STRING},
                {"sriserie01": FILTER_VALUE_TYPE.STRING},
                {"sriserie02": FILTER_VALUE_TYPE.STRING},
            ]

            # 4. Consulta Base (Uniendo la Caja con sus parámetros de Autorización SRI)
            base_query = f"""
            SELECT
                C.cjacodigo,
                C.cjadescri,
                C.loccodigo,
                C.cjastatus,
                S.sripreauto,
                S.sriautnumero,
                S.sriserie01,
                S.sriserie02,
                C.cjafecisys,
                C.cjausuisys,
                C.cjafecmsys,
                C.cjausumsys
            FROM fapcaja C
            LEFT JOIN siaccsriseries S ON C.ciacodigo = S.ciacodigo AND C.cjacodigo = S.cjacodigo
            WHERE C.ciacodigo = '{sCodCia}'
            """

            # 5. Construir consulta paginada de forma segura
            final_query, params = build_paginated_query(
                base_query=base_query,
                # CORRECCIÓN: Quitamos el C.
                order_by=[
                    "cjacodigo ASC",
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            # 6. Ejecutar la consulta en la base de datos
            result = connection.execute(text(final_query), params).mappings().fetchall()

            # 7. Procesar resultado para separar el conteo total de los registros reales
            total_records = result[0]["total"] if result else 0

            data_result = []
            for row in result:
                row_dict = dict(row)

                # Eliminar la columna total particionada
                if "total" in row_dict:
                    del row_dict["total"]

                # Castear el DECIMAL(18,0) a int para evitar error TypeError en jsonify
                if "sriautnumero" in row_dict and row_dict["sriautnumero"] is not None:
                    row_dict["sriautnumero"] = int(row_dict["sriautnumero"])

                data_result.append(row_dict)

    # 8. Retorno directo utilizando jsonify (manteniendo tu arquitectura original)
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
