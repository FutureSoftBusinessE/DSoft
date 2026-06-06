from flask import jsonify, request
from app.AsignacionHorariosAUsuarios import bp
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


@bp.route("/getAllUsuarios", methods=["GET"])
@jwt_required()
def getAllUsuarios():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                # OBTENER TODOS LOS USUARIOS QUE AUN NO TENGAN HORARIOS ASIGNAODS
                base_query = """
                    SELECT
                        u.usrcodigo,
                        u.usrnombre,
                        u.usremail,
                        u.usrstatus
                    FROM siaccusr u
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM rhbhorarios h
                        WHERE h.usrcodencrip = u.usrcodigo
                    )
                    ORDER BY u.usrnombre
                """
                # Ejecutar la consulta con parámetros
                result = connection.execute(text(base_query)).mappings().fetchall()

                all_usuarios_result = [
                    {
                        "value": desencriptar(row["usrcodigo"]),
                        "label": f"{desencriptar(row['usrnombre'])} [{desencriptar(row['usrcodigo'])}]",
                        "usrcodigo": desencriptar(row["usrcodigo"]) if "usrcodigo" in row else None,
                        "usrnombre": desencriptar(row["usrnombre"]) if "usrnombre" in row else None,
                        "usrstatus": desencriptar(row["usrstatus"]) if "usrstatus" in row else None,
                    }
                    for row in result
                ]

        return jsonify({"data": all_usuarios_result}), 200
    except Exception as e:
        return jsonify({"error": {"msg": str(e)}}), 400
