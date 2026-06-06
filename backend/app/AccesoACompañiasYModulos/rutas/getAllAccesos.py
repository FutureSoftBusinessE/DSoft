from flask import jsonify, request
from app.AccesoACompañiasYModulos import bp
from app.extensions import db

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


@bp.route("/getAllAccesos", methods=["POST"])
@jwt_required()
def getAllAccesos():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    page = int(data.get("page", 1))  # Página actual
    per_page = int(data.get("perPage", 10))  # Registros por página
    filters = data.get("filters", {})  # Filtros enviados como un diccionario
    extra_filters = data.get("extraFilters", {})
    usrcodigo = encriptar(extra_filters.get("usrcodigo", ""))

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
            ]

            base_query = """
            SELECT
                siactusr.usrcodigo,
                siactusr.ciacodigo,
                siactusr.modcodigo,
                siactusr.usraccion,
                siactusr.usrfecisys,
                siactusr.usrhorisys,
                CONCAT(siactusr.ciacodigo, ' ', siaccia.ciadescri) AS cia_descri,
                CONCAT(siactusr.modcodigo, ' ', siacmod.moddescri) AS mod_descri
            FROM siactusr
            INNER JOIN siacmod ON siactusr.modcodigo = siacmod.modcodigo
            INNER JOIN siaccia ON siactusr.ciacodigo = siaccia.ciacodigo
            WHERE usrcodigo = :usrcodigo
            """

            # Construir consulta paginada con filtros usando la función auxiliar
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "usrfecisys DESC",
                    "usrhorisys DESC",
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            # Añadir parámetros fijos relacionados al base_query
            params.update({"usrcodigo": usrcodigo})

            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Procesar resultado
            total_records = result[0]["total"] if result else 0
            # Crear lista de diccionarios excluyendo "total" directamente
            all_usuarios_result = [
                {
                    **{key: value for key, value in dict(row).items() if key != "total"},
                    "usrcodigo": desencriptar(row["usrcodigo"]) if "usrcodigo" in row else None,
                }
                for row in result
            ]

    return jsonify({"data": all_usuarios_result, "total": total_records, "page": page, "per_page": per_page, "total_pages": (total_records + per_page - 1) // per_page}), 200
