from flask import jsonify, request
from app.CreacionClienteDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllCreacionClienteDF", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllCreacionClienteDF():
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
            # Se incluyeron cliidentifica y cliintersec en allowed_columns
            allowed_columns = [
                {"clicodigo": FILTER_VALUE_TYPE.STRING},
                {"cliidentifica": FILTER_VALUE_TYPE.STRING},
                {"clinombre": FILTER_VALUE_TYPE.STRING},
                {"cliruc": FILTER_VALUE_TYPE.STRING},
                {"clidirec": FILTER_VALUE_TYPE.STRING},
                {"clitelef1": FILTER_VALUE_TYPE.STRING},
                {"cliintersec": FILTER_VALUE_TYPE.STRING},
                {"clistatus": FILTER_VALUE_TYPE.STRING},
                {"cliemail": FILTER_VALUE_TYPE.STRING},
            ]

            # Se incluyeron cliidentifica y cliintersec en la consulta SELECT
            base_query = f"""
            SELECT
                clicodigo,
                cliidentifica,
                clinombre,
                cliruc,
                clidirec,
                clitelef1,
                cliintersec,
                clistatus,
                cliemail
            FROM cxcmcli
            WHERE ciacodigo = '{sCodCia}'
            """

            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["clinombre ASC"],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            result = connection.execute(text(final_query), params).mappings().fetchall()
            total_records = result[0]["total"] if result else 0
            all_clientes_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

    return (
        jsonify(
            {
                "data": all_clientes_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
