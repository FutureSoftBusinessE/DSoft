from flask import jsonify, request
from app.TipoDocumento import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllTipoDocumento", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllTipoDocumento():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    page = int(data.get("page", 1))  # Página actual
    per_page = int(data.get("perPage", 10))  # Registros por página
    filters = data.get("filters", {})  # Filtros enviados como un diccionario

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Definir columnas permitidas para filtros (evita inyección SQL)
            # Recordar que los valores siempre se pasan como texto plano desde el front
            # es por asi que aqui tengo que asignar un tipo de valor, los que no tienen
            # por defecto son FILTER_VALUE_TYPE.STRING
            allowed_columns = [
                {"tipdoccodigo": FILTER_VALUE_TYPE.STRING},
                {"tipdocdescri": FILTER_VALUE_TYPE.STRING},
                {"tipdocstatus": FILTER_VALUE_TYPE.STRING},
                {"tipdocfechorisys": FILTER_VALUE_TYPE.DATETIME},
                {"tipdocusuisys": FILTER_VALUE_TYPE.STRING},
                {"tipdocestisys": FILTER_VALUE_TYPE.STRING},
                {"tipdocfechormsys": FILTER_VALUE_TYPE.DATETIME},
                {"tipdocusumsys": FILTER_VALUE_TYPE.STRING},
                {"tipdocestmsys": FILTER_VALUE_TYPE.STRING},
            ]

            base_query = f"""
            SELECT
                tipdoccodigo,
                tipdocdescri,
                tipdocstatus,
                tipdocfechorisys,
                tipdocusuisys,
                tipdocestisys,
                tipdocfechormsys,
                tipdocusumsys,
                tipdocestmsys
            FROM gdocbtipodoc
            WHERE ciacodigo = '{sCodCia}'
            """

            # Construir consulta paginada con filtros usando la función auxiliar
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "tipdoccodigo ASC",
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Procesar resultado
            total_records = result[0]["total"] if result else 0
            # Crear lista de diccionarios excluyendo "total" directamente
            all_tipos_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

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
