from flask import jsonify, request
from app.PlanificacionTareas import bp
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
from collections import defaultdict
import json


@bp.route("/getAllPaquetesYTareas", methods=["GET"])
@cross_origin()
@jwt_required()
def getAllPaquetesYTareas():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # ⭐⭐ MODIFICADO: Ahora obtenemos TODAS las tareas, y paquetes con referencias

            # 1. Obtener TODAS las tareas disponibles (individuales)
            tareas_query = """
            SELECT
                t.ciacodigo,
                t.pregcodigo,
                t.pregdescri,
                t.pregdurmin,
                t.pregrecuren,
                t.pregrecurennum,
                t.pregstatus
            FROM
                gdocctareas t
            WHERE
                t.ciacodigo = :ciacodigo
                AND t.pregstatus = 'A'
            ORDER BY
                t.pregcodigo
            """

            tareas_result = connection.execute(text(tareas_query), {"ciacodigo": ciacodigo}).mappings().fetchall()

            # 2. Obtener paquetes con sus tareas relacionadas
            paquetes_query = """
            SELECT
                f.ciacodigo,
                f.formcodigo,
                f.procesocod,
                f.formdescri,
                t.pregcodigo,
                t.pregdescri,
                t.pregdurmin,
                t.pregrecuren,
                t.pregrecurennum,
                p.formsecuen
            FROM
                gdoccpaquetes f
            JOIN
                gdoctpaquetes p
                ON f.ciacodigo = p.ciacodigo
                AND f.formcodigo = p.formcodigo
                AND f.procesocod = p.procesocod
                AND p.formstatus = 'A'
            JOIN
                gdocctareas t
                ON t.ciacodigo = p.ciacodigo
                AND t.pregcodigo = p.pregcodigo
            WHERE
                p.ciacodigo = :ciacodigo
                AND f.formstatus = 'A'
            ORDER BY
                p.formsecuen
            """

            paquetes_result = connection.execute(text(paquetes_query), {"ciacodigo": ciacodigo}).mappings().fetchall()

            # ⭐⭐ PROCESAR TAREAS - TODAS las tareas disponibles
            tareas_todas = []
            for row in tareas_result:
                tareas_todas.append({"pregcodigo": row["pregcodigo"], "pregdescri": row["pregdescri"], "pregdurmin": row["pregdurmin"], "pregrecuren": row["pregrecuren"], "pregrecurennum": row["pregrecurennum"], "pregstatus": row["pregstatus"]})

            # ⭐⭐ PROCESAR PAQUETES con referencias a tareas
            form_data = {}
            for row in paquetes_result:
                formcodigo = row["formcodigo"]

                if formcodigo not in form_data:
                    form_data[formcodigo] = {"formcodigo": row["formcodigo"], "formdescri": row["formdescri"], "procesocod": row["procesocod"], "tareasRelacionadas": []}  # Solo referencias

                # Agregar referencia a tarea en el paquete
                form_data[formcodigo]["tareasRelacionadas"].append({"pregcodigo": row["pregcodigo"], "formsecuen": row["formsecuen"]})

            paquetes_final = list(form_data.values())

            # ⭐⭐ ESTRUCTURA FINAL CORREGIDA
            response_data = {"tareas": tareas_todas, "paquetes": paquetes_final}  # ⭐⭐ TODAS las tareas disponibles  # ⭐ Paquetes con referencias a tareas

    return jsonify({"data": {**response_data}}), 200
