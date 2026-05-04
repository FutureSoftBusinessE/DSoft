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


@bp.route("/getAllHorariosUsuarios", methods=["GET"])
@cross_origin()
@jwt_required()
def getAllHorariosUsuarios():
    """
    Versión simple y directa
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            """
            Obtiene todos los horarios de usuarios que tienen al menos un horario asignado
            para la empresa y localidad del usuario autenticado.

            Solo retorna usuarios con horarios asignados.
            """
            query = """
            SELECT
                usrcodigo,
                usrnombre,
                locdescri,
                hrdia,
                hrsecuen,
                CONVERT(VARCHAR(5), hrhorini, 108) as inicio,
                CONVERT(VARCHAR(5), hrhorfin, 108) as fin,
                hrcupo,
                ciacodigo,
                loccodigo
            FROM rhbhorarios
            WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND hrdia IS NOT NULL
            ORDER BY usrcodigo, hrdia, hrsecuen
            """

            result = connection.execute(text(query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).mappings().fetchall()

            # Procesar resultados
            horarios_por_usuario = {}

            for row in result:
                usrcodigo_key = row["usrcodigo"]

                if usrcodigo_key not in horarios_por_usuario:
                    horarios_por_usuario[usrcodigo_key] = {"ciacodigo": row["ciacodigo"], "loccodigo": row["loccodigo"], "usrnombre": row["usrnombre"], "horariosPorDia": {}}

                dia = int(row["hrdia"])

                if dia not in horarios_por_usuario[usrcodigo_key]["horariosPorDia"]:
                    horarios_por_usuario[usrcodigo_key]["horariosPorDia"][dia] = []

                horarios_por_usuario[usrcodigo_key]["horariosPorDia"][dia].append({"inicio": row["inicio"], "fin": row["fin"], "cupo": row["hrcupo"], "secuencia": row["hrsecuen"], "locdescri": row["locdescri"]})

    # Retorna SOLO usuarios que tienen horarios
    return jsonify({"success": True, "count": len(horarios_por_usuario), "data": horarios_por_usuario}), 200
