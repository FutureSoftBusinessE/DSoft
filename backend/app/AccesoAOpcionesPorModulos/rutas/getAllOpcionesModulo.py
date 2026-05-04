from flask import jsonify, request
from app.AccesoAOpcionesPorModulos import bp
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


# Obtener todas las opciones de un modulo (en este api siempre WEB)asignadas un usuario
# En app/AccesoAOpcionesPorModulos/bp.py - Modificar getAllOpcionesModulo
@bp.route("/getAllOpcionesModuloOptimizado", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllOpcionesModuloOptimizado():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json()
    usrcodigo = data.get("usrcodigo")
    modcodigo = data.get("modcodigo")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Query básica (igual a la original)
            query = """
            SELECT
                siacopc.opccaption,
                siacopc.opctag,
                siacopc.opccontroller,
                CASE
                    WHEN Siactusrweb.opctag IS NOT NULL THEN 1
                    ELSE 0
                END as permiso
            FROM siacopc
            LEFT JOIN Siactusrweb ON
                Siactusrweb.opctag = siacopc.opctag
                AND Siactusrweb.modcodigo = siacopc.modcodigo
                AND Siactusrweb.ciacodigo = :ciacodigo
                AND Siactusrweb.usrcodigo = :usrcodigo
            WHERE siacopc.modcodigo = :modcodigo
            ORDER BY siacopc.opctag ASC
            """

            result = connection.execute(text(query), {"ciacodigo": ciacodigo, "usrcodigo": encriptar(usrcodigo), "modcodigo": modcodigo}).mappings().fetchall()

            opciones = []
            for row in result:
                row_dict = dict(row)
                row_dict["permiso"] = True if row_dict["permiso"] == 1 else False
                opciones.append(row_dict)

            # -------------------------------------------------
            # LÓGICA SIMPLIFICADA PARA ESTRUCTURA JERÁRQUICA
            # -------------------------------------------------

            # 1. Agregar nivel y determinar hoja
            all_tags = [op["opctag"] for op in opciones]

            for opcion in opciones:
                # Calcular nivel
                opcion["nivel"] = opcion["opctag"].count(".")

                # Determinar si es hoja
                # Buscar si algún otro tag empieza con este tag + "."
                opcion["esHoja"] = not any(tag.startswith(opcion["opctag"] + ".") for tag in all_tags if tag != opcion["opctag"])

            # 2. Calcular relaciones padre-hijo
            relaciones = {"root": []}

            for opcion in opciones:
                opctag = opcion["opctag"]
                nivel = opcion["nivel"]

                if nivel == 0:
                    # Es hijo directo de root
                    if opctag not in relaciones["root"]:
                        relaciones["root"].append(opctag)
                else:
                    # Encontrar padre (todo antes del último punto)
                    partes = opctag.split(".")
                    padre = ".".join(partes[:-1])

                    if padre not in relaciones:
                        relaciones[padre] = []

                    if opctag not in relaciones[padre]:
                        relaciones[padre].append(opctag)

            # 3. Ordenar todo alfabéticamente
            for key in relaciones:
                relaciones[key].sort()

            # Ordenar opciones por nivel y tag
            opciones.sort(key=lambda x: (x["nivel"], x["opctag"]))

            return jsonify({"data": {"opciones": opciones, "relaciones": relaciones, "raiz": "root"}, "status": "ok"}), 200
