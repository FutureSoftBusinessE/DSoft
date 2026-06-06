from flask import jsonify, request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from app.Localidad import bp
from app.db import get_session
from app.extensions import db
from app.utils.build_paginated_query import build_paginated_query


@bp.route("/getAllLocalidad", methods=["POST"])
@jwt_required()
def getAllLocalidad():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json() or {}
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            allowed_columns = [
                # Header
                {"ciacodigo": FILTER_VALUE_TYPE.STRING},
                {"loccodigo": FILTER_VALUE_TYPE.STRING},
                {"locdescri": FILTER_VALUE_TYPE.STRING},
                {"locstatus": FILTER_VALUE_TYPE.STRING},
                # Datos de la Localidad
                {"ciaruc": FILTER_VALUE_TYPE.STRING},
                {"ciadirec": FILTER_VALUE_TYPE.STRING},
                {"ciaciudad": FILTER_VALUE_TYPE.STRING},
                {"ciaprovincia": FILTER_VALUE_TYPE.STRING},
                {"ciapais": FILTER_VALUE_TYPE.STRING},
                {"unicodigo": FILTER_VALUE_TYPE.STRING},
                {"ciatelefono1": FILTER_VALUE_TYPE.STRING},
                {"ciatelefono2": FILTER_VALUE_TYPE.STRING},
                {"ciafax": FILTER_VALUE_TYPE.STRING},
                {"ciaemail": FILTER_VALUE_TYPE.STRING},
                {"locservidor": FILTER_VALUE_TYPE.STRING},
                # Parámetros internos para procesos de emisión de documentos fiscales
                {"fatrainv": FILTER_VALUE_TYPE.STRING},
                {"notacertificado": FILTER_VALUE_TYPE.STRING},
                {"clavep12": FILTER_VALUE_TYPE.STRING},
                {"locpathxml": FILTER_VALUE_TYPE.STRING},
                # Auditoría
                {"locfecisys": FILTER_VALUE_TYPE.DATETIME},
                {"lochorisys": FILTER_VALUE_TYPE.DATETIME},
                {"locusuisys": FILTER_VALUE_TYPE.STRING},
                {"locfecmsys": FILTER_VALUE_TYPE.DATETIME},
                {"lochormsys": FILTER_VALUE_TYPE.DATETIME},
                {"locusumsys": FILTER_VALUE_TYPE.STRING},
            ]

            base_query = f"""
            SELECT
                "ciacodigo",
                "loccodigo",
                "locdescri",
                "locstatus",
                "ciaruc",
                "ciadirec",
                "ciaciudad",
                "ciaprovincia",
                "ciapais",
                "unicodigo",
                "ciatelefono1",
                "ciatelefono2",
                "ciafax",
                "ciaemail",
                "locservidor",
                "fatrainv",
                "notacertificado",
                "clavep12",
                "locpathxml",
                "locfecisys",
                "lochorisys",
                "locusuisys",
                "locfecmsys",
                "lochormsys",
                "locusumsys"
            FROM cgblocal
            WHERE ciacodigo = '{sCodCia}'
            """

            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["ciacodigo ASC", "loccodigo ASC"],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

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
