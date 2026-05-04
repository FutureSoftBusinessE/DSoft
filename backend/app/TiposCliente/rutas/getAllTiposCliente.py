from flask import jsonify, request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from app.TiposCliente import bp
from app.TiposCliente.rutas.common import TABLE_NAME
from app.db import get_session
from app.extensions import db
from app.utils.build_paginated_query import build_paginated_query


@bp.route("/getAllTiposCliente", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllTiposCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json() or {}
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    allowed_columns = [
        {"clicodigo": FILTER_VALUE_TYPE.STRING},
        {"cliidentifica": FILTER_VALUE_TYPE.STRING},
        {"cliruc": FILTER_VALUE_TYPE.STRING},
        {"clistatus": FILTER_VALUE_TYPE.STRING},
        {"clinombre": FILTER_VALUE_TYPE.STRING},
        {"clitipodomicilio": FILTER_VALUE_TYPE.STRING},
        {"clitiempodomicilio": FILTER_VALUE_TYPE.STRING},
        {"cliubicacionrapido": FILTER_VALUE_TYPE.STRING},
        {"clidirec": FILTER_VALUE_TYPE.STRING},
        {"activicodigo": FILTER_VALUE_TYPE.STRING},
        {"clitelpref1": FILTER_VALUE_TYPE.STRING},
        {"clitelef1": FILTER_VALUE_TYPE.STRING},
        {"clitelext1": FILTER_VALUE_TYPE.STRING},
        {"clitelpref2": FILTER_VALUE_TYPE.STRING},
        {"clitelef2": FILTER_VALUE_TYPE.STRING},
        {"clitelext2": FILTER_VALUE_TYPE.STRING},
        {"clifax": FILTER_VALUE_TYPE.STRING},
        {"clifonolabora": FILTER_VALUE_TYPE.STRING},
        {"cliprofesion": FILTER_VALUE_TYPE.STRING},
        {"cliaparta": FILTER_VALUE_TYPE.STRING},
        {"cliemail": FILTER_VALUE_TYPE.STRING},
        {"website": FILTER_VALUE_TYPE.STRING},
        {"tipcodigo": FILTER_VALUE_TYPE.STRING},
        {"clifecnac": FILTER_VALUE_TYPE.DATETIME},
        {"cliestciv": FILTER_VALUE_TYPE.STRING},
        {"clisexo": FILTER_VALUE_TYPE.STRING},
        {"clipersona": FILTER_VALUE_TYPE.STRING},
        {"clifecisys": FILTER_VALUE_TYPE.DATETIME},
        {"clihorisys": FILTER_VALUE_TYPE.DATETIME},
        {"cliusuisys": FILTER_VALUE_TYPE.STRING},
        {"clifecmsys": FILTER_VALUE_TYPE.DATETIME},
        {"clihormsys": FILTER_VALUE_TYPE.DATETIME},
        {"cliusumsys": FILTER_VALUE_TYPE.STRING},
        {"cliestisys": FILTER_VALUE_TYPE.STRING},
        {"cliestmsys": FILTER_VALUE_TYPE.STRING},
    ]
    base_query = f"""
        SELECT
            ciacodigo,
            clicodigo,
            cliidentifica,
            cliruc,
            clistatus,
            clinombre,
            clitipodomicilio,
            clitiempodomicilio,
            cliubicacionrapido,
            clidirec,
            activicodigo,
            clitelpref1,
            clitelef1,
            clitelext1,
            clitelpref2,
            clitelef2,
            clitelext2,
            clifax,
            clifonolabora,
            cliprofesion,
            cliaparta,
            cliemail,
            website,
            tipcodigo,
            clifecnac,
            cliestciv,
            clisexo,
            clipersona,
            clifecisys,
            clihorisys,
            cliusuisys,
            clifecmsys,
            clihormsys,
            cliusumsys,
            cliestisys,
            cliestmsys
        FROM {TABLE_NAME}
        WHERE ciacodigo = :ciacodigo
    """

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["ciacodigo ASC", "clicodigo ASC"],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            # enforce company code param
            params["ciacodigo"] = sCodCia

            result = connection.execute(text(final_query), params).mappings().fetchall()
            total_records = result[0]["total"] if result else 0
            rows = [{key: value for key, value in dict(row).items() if key != "total"} for row in result]

    return (
        jsonify(
            {
                "data": rows,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
