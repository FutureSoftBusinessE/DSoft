from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session

# Importaciones de la arquitectura de paginación y filtros[cite: 10]
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllCatalogodeProductos", methods=["POST"])
@jwt_required()
def getAllCatalogodeProductos():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # Extracción de la metadata de paginación y filtros enviados por el frontend[cite: 10]
    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Columnas permitidas para los filtros dinámicos en la grilla[cite: 10]
            allowed_columns = [
                {"invcodigo": FILTER_VALUE_TYPE.STRING},
                {"artcodigo": FILTER_VALUE_TYPE.STRING},
                {"artdescri": FILTER_VALUE_TYPE.STRING},
                {"lincodigo": FILTER_VALUE_TYPE.STRING},
                {"lindescri": FILTER_VALUE_TYPE.STRING},
                {"marcodigo": FILTER_VALUE_TYPE.STRING},
                {"mardescri": FILTER_VALUE_TYPE.STRING},
                {"precodigo": FILTER_VALUE_TYPE.STRING},
                {"predescri": FILTER_VALUE_TYPE.STRING},
                {"medcodigo": FILTER_VALUE_TYPE.STRING},
                {"meddescri": FILTER_VALUE_TYPE.STRING},
                {"artstatus": FILTER_VALUE_TYPE.STRING},
                {"artpeso": FILTER_VALUE_TYPE.NUMBER},
                {"artprecventa1": FILTER_VALUE_TYPE.NUMBER},
                {"artnumparte": FILTER_VALUE_TYPE.STRING},
            ]

            # Consulta Base extraída de la lógica de VB6 cruzando con view_inmart
            base_query = f"""
            SELECT
                invcodigo,
                artcodigo,
                artdescri,
                artprecventa1,
                (SELECT ISNULL(SUM(stokactual), 0)
                 FROM inmstock WITH(NOLOCK)
                 WHERE inmstock.ciacodigo = view_inmart.ciacodigo
                   AND inmstock.invcodigo = view_inmart.invcodigo
                   AND inmstock.artcodigo = view_inmart.artcodigo) AS stock_total,
                artnumparte,
                artpeso,
                lincodigo,
                lindescri,
                marcodigo,
                mardescri,
                precodigo,
                predescri,
                medcodigo,
                meddescri,
                artstatus,
                (CASE codigo2 WHEN 0 THEN 'NO' ELSE 'SI' END) AS tiene_codigo2,
                (CASE barras WHEN 0 THEN 'NO' ELSE 'SI' END) AS tiene_barras,
                (CASE imagen WHEN 0 THEN 'NO' ELSE 'SI' END) AS tiene_imagen,
                (CASE documento WHEN 0 THEN 'NO' ELSE 'SI' END) AS tiene_pdf,
                (CASE sustituto WHEN 0 THEN 'NO' ELSE 'SI' END) AS tiene_sustituto
            FROM view_inmart
            WHERE ciacodigo = '{sCodCia}'
            """

            # Construir consulta paginada dinámicamente[cite: 10]
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["artcodigo ASC"],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Extracción del total de registros del primer row (lógica heredada de build_paginated_query)[cite: 10]
            total_records = result[0]["total"] if result else 0

            # Formateo del resultado quitando la columna virtual 'total'[cite: 10]
            all_productos_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    # Retorno directo usando jsonify para mantener la metadata en la raíz de la respuesta[cite: 10]
    return (
        jsonify(
            {
                "data": all_productos_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
