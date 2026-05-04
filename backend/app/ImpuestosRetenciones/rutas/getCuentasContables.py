from flask import jsonify, request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.ImpuestosRetenciones import bp
from app.extensions import db
from app.db import get_session
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from app.Clases.SEARCH_TYPE_HELPER import SEARCH_TYPE_HELPER


@bp.route("/getCuentasContables", methods=["POST"])
@cross_origin()
@jwt_required()
def getCuentasContables():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json() or {}
    type_search = data.get("typeSearch", SEARCH_TYPE_HELPER.FILTER_TABLE_SEARCH.value)
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            if type_search == SEARCH_TYPE_HELPER.ID_SEARCH.value:
                pctacodigo = str(data.get("pctacodigo", "")).strip()

                if not pctacodigo:
                    return jsonify({"data": {}}), 200

                query = text(
                    """
                    SELECT
                        pctacodigo,
                        pctanomcta,
                        pctastatus
                    FROM cgmpcta
                    WHERE ciacodigo = :ciacodigo
                      AND pctacodigo = :pctacodigo
                    """
                )

                result = connection.execute(query, {"ciacodigo": sCodCia, "pctacodigo": pctacodigo}).mappings().fetchone()
                return jsonify({"data": dict(result) if result else {}}), 200

            allowed_columns = [
                {"pctacodigo": FILTER_VALUE_TYPE.STRING},
                {"pctanomcta": FILTER_VALUE_TYPE.STRING},
                {"pctastatus": FILTER_VALUE_TYPE.STRING},
            ]

            base_query = """
            SELECT
                pctacodigo,
                pctanomcta,
                pctastatus
            FROM cgmpcta
            WHERE ciacodigo = :ciacodigo
            """

            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["pctacodigo ASC"],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )
            params["ciacodigo"] = sCodCia

            result = connection.execute(text(final_query), params).mappings().fetchall()
            total_records = result[0]["total"] if result else 0
            all_rows = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    return (
        jsonify(
            {
                "data": all_rows,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
