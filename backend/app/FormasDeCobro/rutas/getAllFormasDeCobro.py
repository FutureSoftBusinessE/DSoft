from flask import jsonify, request
from app.FormasDeCobro import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text

# Importaciones de tu arquitectura de paginación y filtros
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllFormasDeCobro", methods=["POST"])
@jwt_required()
def getAllFormasDeCobro():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Columnas permitidas para filtros (lista de diccionarios como en fuente 9)
            allowed_columns = [
                {"factippag": FILTER_VALUE_TYPE.STRING},
                {"fordescri": FILTER_VALUE_TYPE.STRING},
                {"fordias": FILTER_VALUE_TYPE.NUMBER},
                {"fortipo": FILTER_VALUE_TYPE.STRING},
                {"forcuotas": FILTER_VALUE_TYPE.NUMBER},
                {"forstatus": FILTER_VALUE_TYPE.STRING},
                {"forfecisys": FILTER_VALUE_TYPE.DATETIME},
                {"forusuisys": FILTER_VALUE_TYPE.STRING},
                {"forfecmsys": FILTER_VALUE_TYPE.DATETIME},
                {"forusumsys": FILTER_VALUE_TYPE.STRING},
            ]

            # Consulta Base
            base_query = f"""
            SELECT
                f.factippag,
                f.fordescri,
                f.fordias,
                f.fortipo,
                f.forcuotas,
                f.forstatus,
                f.forfecisys,
                f.forhorisys,
                f.forusuisys,
                f.forfecmsys,
                f.forhormsys,
                f.forusumsys
            FROM cxcbformapag f
            WHERE f.ciacodigo = '{sCodCia}'
            """

            # Construir consulta paginada
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["factippag ASC"],  # Ordenamiento por defecto
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Extracción del total como viene empaquetado en la arquitectura
            total_records = result[0]["total"] if result else 0

            # Limpiamos el campo "total" del diccionario final para no ensuciar la data del frontend
            all_formas_cobro_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    return (
        jsonify(
            {
                "data": all_formas_cobro_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
                # NOTA: Agrego estas dos llaves adicionales ("success" y "meta")
                # para asegurar compatibilidad absoluta con la grilla de React en caso de que
                # el componente CustomConditionalActionsTableServer requiera la meta-estructura anterior.
                "success": True,
                "meta": {"totalRowCount": total_records},
            }
        ),
        200,
    )
