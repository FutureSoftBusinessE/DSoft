from flask import jsonify, request
from app.ImpuestosRetenciones import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllImpuestosRetenciones", methods=["POST"])
@jwt_required()
def getAllImpuestosRetenciones():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Definir columnas permitidas para filtros (evita inyección SQL)
            # Recordar que los valores siempre se pasan como texto plano desde el front
            # es por asi que aqui tengo que asignar un tipo de valor, los que no tienen
            # por defecto son FILTER_VALUE_TYPE.STRING
            allowed_columns = [
                {"impid": FILTER_VALUE_TYPE.STRING},
                {"impdescri": FILTER_VALUE_TYPE.STRING},
                {"impctanor": FILTER_VALUE_TYPE.STRING},
                {"pctanomcta": FILTER_VALUE_TYPE.STRING},
                {"impporcent": FILTER_VALUE_TYPE.NUMBER},
                {"impesiva": FILTER_VALUE_TYPE.NUMBER},
                {"impstatus": FILTER_VALUE_TYPE.STRING},
                {"impretimp": FILTER_VALUE_TYPE.STRING},
                {"impaplica": FILTER_VALUE_TYPE.STRING},
                {"impbienser": FILTER_VALUE_TYPE.STRING},
                {"codSRI": FILTER_VALUE_TYPE.STRING},
                {"desSRI": FILTER_VALUE_TYPE.STRING},
                {"impfecisys": FILTER_VALUE_TYPE.DATETIME},
                {"imphorisys": FILTER_VALUE_TYPE.DATETIME},
                {"impusuisys": FILTER_VALUE_TYPE.STRING},
                {"impfecmsys": FILTER_VALUE_TYPE.DATETIME},
                {"imphormsys": FILTER_VALUE_TYPE.DATETIME},
                {"impusumsys": FILTER_VALUE_TYPE.STRING},
            ]

            base_query = """
            SELECT
                impid,
                impdescri,
                impctanor,
                COALESCE((
                    SELECT pctanomcta
                    FROM cgmpcta
                    WHERE cgmpcta.ciacodigo = cxpbimp.ciacodigo
                    AND cgmpcta.pctacodigo = cxpbimp.impctanor
                ), '') AS pctanomcta,
                impporcent,
                impesiva,
                impaplica,
                impstatus,
                impretimp,
                codSRI,
                desSRI,
                impbienser,
                impfecisys,
                imphorisys,
                impusuisys,
                impfecmsys,
                imphormsys,
                impusumsys
            FROM cxpbimp
            WHERE ciacodigo = :ciacodigo"""

            # Construir consulta paginada con filtros usando la función auxiliar
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "impid ASC",
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )
            params["ciacodigo"] = sCodCia

            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Procesar resultado
            total_records = result[0]["total"] if result else 0
            # Crear lista de diccionarios excluyendo "total" directamente
            all_impuestos_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    return (
        jsonify(
            {
                "data": all_impuestos_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
