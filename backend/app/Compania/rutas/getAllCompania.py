import base64
from flask import jsonify, request
from app.Compania import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllCompania", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllGravamenes():
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
                # Header
                {"ciacodigo": FILTER_VALUE_TYPE.STRING},
                {"ciadescri": FILTER_VALUE_TYPE.STRING},
                {"ciastatus": FILTER_VALUE_TYPE.STRING},
                {"ciaruc": FILTER_VALUE_TYPE.STRING},
                {"ciatelefono1": FILTER_VALUE_TYPE.STRING},
                {"ciatelefono2": FILTER_VALUE_TYPE.STRING},
                {"ciafax": FILTER_VALUE_TYPE.STRING},
                # Datos de la Empresa
                {"ciaalias": FILTER_VALUE_TYPE.STRING},
                {"ciadirec": FILTER_VALUE_TYPE.STRING},
                {"ciaciudad": FILTER_VALUE_TYPE.STRING},
                {"ciapais": FILTER_VALUE_TYPE.STRING},
                {"ciaemail": FILTER_VALUE_TYPE.STRING},
                {"ciaweb": FILTER_VALUE_TYPE.STRING},
                # Información S.R.I. de la Compañía
                {"ciaescontesp": FILTER_VALUE_TYPE.NUMBER},
                {"cianumresolucion": FILTER_VALUE_TYPE.STRING},
                {"ciafecresolucion": FILTER_VALUE_TYPE.DATETIME},
                {"sriagenteretencion": FILTER_VALUE_TYPE.STRING},
                {"sriagenteretencionnumres": FILTER_VALUE_TYPE.STRING},
                {"srimicroempresa": FILTER_VALUE_TYPE.STRING},
                # Identificación del Contribuyente para el ATS
                {"ciasrirazon": FILTER_VALUE_TYPE.STRING},
                # Imágenes
                {"cialogo": FILTER_VALUE_TYPE.STRING},
                {"ciaselloagua": FILTER_VALUE_TYPE.STRING},
                # Auditoría
                {"ciafecisys": FILTER_VALUE_TYPE.DATETIME},
                {"ciahorisys": FILTER_VALUE_TYPE.DATETIME},
                {"ciausuisys": FILTER_VALUE_TYPE.STRING},
                {"ciafecmsys": FILTER_VALUE_TYPE.DATETIME},
                {"ciahormsys": FILTER_VALUE_TYPE.DATETIME},
                {"ciausumsys": FILTER_VALUE_TYPE.STRING},
            ]

            base_query = f"""
            SELECT
                ciacodigo,
                ciadescri,
                ciastatus,
                ciaruc,
                ciatelefono1,
                ciatelefono2,
                ciafax,
                ciaalias,
                ciadirec,
                ciaciudad,
                ciapais,
                ciaemail,
                ciaweb,
                ciaescontesp,
                cianumresolucion,
                ciafecresolucion,
                sriagenteretencion,
                sriagenteretencionnumres,
                srimicroempresa,
                ciasrirazon,
                cialogo,
                ciaselloagua,
                ciafecisys,
                ciahorisys,
                ciausuisys,
                ciafecmsys,
                ciahormsys,
                ciausumsys
            FROM siaccia
            WHERE ciacodigo = '{sCodCia}'
            """

            # Construir consulta paginada con filtros usando la función auxiliar
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "ciacodigo ASC",
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
            all_tipos_result = []
            for row in result:
                row_dict = {key: value for key, value in dict(row).items() if key != "total"}

                # Convertir campos de imagen a Base64
                row_dict["cialogo"] = [base64.b64encode(row_dict["cialogo"]).decode("utf-8").replace("\n", "")] if row_dict and row_dict.get("cialogo") else None
                row_dict["ciaselloagua"] = [base64.b64encode(row_dict["ciaselloagua"]).decode("utf-8").replace("\n", "")] if row_dict and row_dict.get("ciaselloagua") else None

                if row_dict.get("ciastatus_text") is not None:
                    row_dict["ciastatus_raw"] = row_dict.get("ciastatus")
                    row_dict["ciastatus"] = row_dict.get("ciastatus_text")

                if row_dict.get("ciaescontesp_text") is not None:
                    row_dict["ciaescontesp_raw"] = row_dict.get("ciaescontesp")
                    row_dict["ciaescontesp"] = row_dict.get("ciaescontesp_text")

                if row_dict.get("sriagenteretencion_text") is not None:
                    row_dict["sriagenteretencion_raw"] = row_dict.get("sriagenteretencion")
                    row_dict["sriagenteretencion"] = row_dict.get("sriagenteretencion_text")

                if row_dict.get("srimicroempresa_text") is not None:
                    row_dict["srimicroempresa_raw"] = row_dict.get("srimicroempresa")
                    row_dict["srimicroempresa"] = row_dict.get("srimicroempresa_text")

                all_tipos_result.append(row_dict)

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
