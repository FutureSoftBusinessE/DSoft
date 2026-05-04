from flask import jsonify, request
from app.EjecucionTareas import bp
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


@bp.route("/getAllUsuariosAsignados", methods=["GET"])
@cross_origin()
@jwt_required()
def getAllUsuarios():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    usrcodigo = claims["user"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            all_usrcodigos = []

            # Verificar que el usuario es administrador de local, si lo es entonces traera todos los usuarios
            is_gerente_flag = False
            is_gerente_query = """
            SELECT
                usrcodigo, usrflagger
            FROM
                siactloc
            WHERE
                usrcodigo = :usrcodigo
                AND ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
            """
            is_gerente_result = connection.execute(text(is_gerente_query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "usrcodigo": encriptar(usrcodigo)}).mappings().fetchone()

            if is_gerente_result:
                is_gerente_result = dict(is_gerente_result)
                if is_gerente_result["usrflagger"] != 0:
                    is_gerente_flag = True

            # Si el usuario NO es gerente
            if not is_gerente_flag:
                query_allusr = """
                    SELECT usrcodigo
                    FROM siaccusr
                    WHERE usrcodigoreporta = :usrcodigo
                """
                result_allusr = connection.execute(text(query_allusr), {"usrcodigo": usrcodigo}).mappings().fetchall()

                # Obtener todos los usrcodigo de los resultados y desencriptarlos
                all_usrcodigos = [str(row["usrcodigo"]) for row in result_allusr]

            all_usrcodigos.append(encriptar(usrcodigo))

            base_query = """
            SELECT
                usrcodigo,
                usrnombre,
                usrfeccad,
                usrstatus,
                usrflagperfil,
                usrfecmsys,
                usrhormsys
            FROM siaccusr
                WHERE usrflagperfil != -1
            """
            # Agregar la condición 'IN :all_usrcodigos' solo si el usuario NO es gerente
            if not is_gerente_flag:
                base_query += " AND usrcodigo IN :all_usrcodigos"

            result = connection.execute(text(base_query), {"all_usrcodigos": tuple(all_usrcodigos)}).mappings().fetchall()

            empleados_result = [
                {
                    **row,
                    "usrcodigo": desencriptar(row["usrcodigo"]) if "usrcodigo" in row else None,
                    "usrnombre": desencriptar(row["usrnombre"]) if "usrnombre" in row else None,
                    "usrstatus": desencriptar(row["usrstatus"]) if "usrstatus" in row else None,
                }
                for row in result
            ]

    return jsonify({"data": empleados_result}), 200
