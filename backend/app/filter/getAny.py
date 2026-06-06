from flask import jsonify, request
from app.filter import bp
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


# esto es una api que devulve la info para los comboboxes de manera asincrona
@bp.route("/getAny", methods=["POST"])
@jwt_required()
def getAny():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    filter_label = data.get("label", "")  # Filtros enviados como un diccionario
    filter_text = data.get("text", "")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    dataReturned = {"data": None, "total": 0}

    with engine.connect() as connection:
        with connection.begin():

            if filter_label == "articulo":
                query = """
                SELECT
                    *,
                    COUNT(*) OVER() AS total
                FROM (
                    SELECT ciacodigo, artcodigo, artdescri
                    FROM inmart
                      WHERE
                        ciacodigo = :ciacodigo
                        AND (artcodigo LIKE '%' + :filter_text + '%'
                            OR artdescri LIKE '%' + :filter_text + '%')

                )  AS filtered_query
                ORDER BY
                    artcodigo
                """
            if filter_label == "presentacion":
                query = """
                SELECT
                    *,
                    COUNT(*) OVER() AS total
                FROM (
                    SELECT ciacodigo, precodigo, predescri
                    FROM inbpre
                      WHERE
                        ciacodigo = :ciacodigo
                        AND (precodigo LIKE '%' + :filter_text + '%'
                            OR predescri LIKE '%' + :filter_text + '%')

                )  AS filtered_query
                ORDER BY
                    precodigo
                """

            if filter_label == "medida":
                query = """
                SELECT
                    *,
                    COUNT(*) OVER() AS total
                FROM (
                    SELECT ciacodigo, medcodigo, meddescri
                    FROM inbmed
                        WHERE
                        ciacodigo = :ciacodigo
                        AND (medcodigo LIKE '%' + :filter_text + '%'
                            OR meddescri LIKE '%' + :filter_text + '%')

                )  AS filtered_query
                ORDER BY
                    medcodigo
                """
            if filter_label == "marca":
                query = """
                SELECT
                    *,
                    COUNT(*) OVER() AS total
                FROM (
                    SELECT ciacodigo, marcodigo, mardescri
                    FROM inbmar
                        WHERE
                        ciacodigo = :ciacodigo
                        AND (marcodigo LIKE '%' + :filter_text + '%'
                            OR mardescri LIKE '%' + :filter_text + '%')

                )  AS filtered_query
                ORDER BY
                    marcodigo
                """

            query_result = connection.execute(text(query), {"ciacodigo": ciacodigo, "filter_text": filter_text}).mappings().fetchall()

            # Si el usuario digita un codigo de barra, debe realizar la consulta en intartbarras para obtener el codigo del producto
            if filter_label == "articulo" and not query_result and filter_text.strip():
                query_codigo_barras = """
                SELECT TOP 1 im.artcodigo, im.artdescri
                FROM intartbarras ib
                JOIN inmart im ON im.ciacodigo = ib.ciacodigo AND im.artcodigo = ib.artcodigo
                WHERE ib.ciacodigo = :ciacodigo AND ib.artcodbarra = :filter_text
                ORDER BY ib.artfecmsys DESC, ib.arthormsys DESC
                """

                resultado = connection.execute(text(query_codigo_barras), {"ciacodigo": ciacodigo, "filter_text": filter_text}).mappings().fetchone()

                if resultado:
                    query_result = [{"ciacodigo": ciacodigo, "artcodigo": resultado["artcodigo"], "artdescri": resultado["artdescri"], "total": 1}]

            dataReturned["total"] = query_result[0]["total"] if query_result else 0
            dataReturned["data"] = [{key: value for key, value in dict(row).items() if key != "total"} for row in query_result]

    return jsonify(dataReturned), 200
