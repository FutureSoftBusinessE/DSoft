from flask import jsonify, request
from app.CreacionUsuarios import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from services.encrip_desencrip import desencriptar
import base64


@bp.route("/getAllUsuarios", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllUsuarios():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

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
                {"usrcodigo": FILTER_VALUE_TYPE.ENCRYPTED},
                {"usrnombre": FILTER_VALUE_TYPE.STRING},
                {"usrfeccad": FILTER_VALUE_TYPE.DATETIME},
                {"usrcodper": FILTER_VALUE_TYPE.ENCRYPTED},
                "usremail",
                "usrflagoficre",
                "usrflagperfil",
                {"usrstatus": FILTER_VALUE_TYPE.ENCRYPTED},
            ]

            base_query = """
            SELECT
                usrcodigo,
                usrnombre,
                usrfeccad,
                usrcodper,
                usremail,
                usrflagoficre,
                usrflagperfil,
                usrstatus,
                usrimagen,
                usrdiascaduclave,
                usrcodigoreporta,
                usrfecisys,
                usrhorisys,
                usrfecmsys,
                usrhormsys
            FROM siaccusr
            """

            # Construir consulta paginada con filtros usando la función auxiliar
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "usrstatus ASC",
                    "usrfecmsys DESC",
                    "usrhormsys DESC",
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
            all_usuarios_result = [
                {
                    **{key: value for key, value in dict(row).items() if key != "total"},
                    "usrcodigo": desencriptar(row["usrcodigo"]) if "usrcodigo" in row else None,
                    "usrnombre": desencriptar(row["usrnombre"]) if "usrnombre" in row else None,
                    "usrcodper": desencriptar(row["usrcodper"]) if "usrcodper" in row else None,
                    "usrimagen": base64.b64encode(row["usrimagen"]).decode("utf-8") if "usrimagen" in row and row["usrimagen"] else None,
                    "usrstatus": desencriptar(row["usrstatus"]) if "usrstatus" in row else None,
                }
                for row in result
            ]

    return jsonify({"data": all_usuarios_result, "total": total_records, "page": page, "per_page": per_page, "total_pages": (total_records + per_page - 1) // per_page}), 200
