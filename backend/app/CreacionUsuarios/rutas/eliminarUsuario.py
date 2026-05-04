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
from app.utils.get_info_product import get_info_product
import base64
from decimal import Decimal, getcontext
from app.utils.calcular_metricas_productos import calcular_metricas_productos


def obtener_fecha_sin_hora(fecha_str):
    """
    Convierte una fecha en formato ISO 8601 (con hora) a solo la fecha (sin la hora).
    Ejemplo: "2025-02-19T03:47:59.371Z" -> "2025-02-19"

    :param fecha_str: Fecha en formato ISO 8601 (ej. "2025-02-19T03:47:59.371Z")
    :return: Fecha en formato 'YYYY-MM-DD'
    """
    # Reemplazar 'Z' por '+00:00' para que sea un formato válido para fromisoformat
    fecha_obj = datetime.fromisoformat(fecha_str.replace("Z", "+00:00"))

    # Devolver solo la fecha (sin hora)
    return fecha_obj.date()


@bp.route("/eliminarUsuario", methods=["POST"])
@cross_origin()
@jwt_required()
def eliminarUsuario():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    usrcodigo = claims["user"]
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    usrcodigo = data.get("usrcodigo")

    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Obtener la fecha con formato de 1900-01-01 y la hora actual
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                # Encontrar el usuario a editar
                query_user_to_edit = """
                    SELECT * FROM siaccusr
                    WHERE usrcodigo = :usrcodigo
                """
                result_user_to_edit = connection.execute(text(query_user_to_edit), {"usrcodigo": encriptar(usrcodigo)}).mappings().fetchone()

                if not result_user_to_edit:
                    raise Exception("Ese usuario no existe")

                result_user_to_edit = dict(result_user_to_edit)

                # editar en siaccusr
                data_siaccusr = {
                    "usrstatus": encriptar("I"),
                    "usrfecmsys": fecha_con_hora_cero,
                    "usrhormsys": fecha_formato_1900,
                    "usrusumsys": usrcodigo,
                    "usrestmsys": ipUser,
                }
                update_query = text(
                    """
                    UPDATE siaccusr
                    SET
                        usrstatus = :usrstatus,
                        usrfecmsys = :usrfecmsys,
                        usrhormsys = :usrhormsys,
                        usrusumsys = :usrusumsys,
                        usrestmsys = :usrestmsys
                    WHERE usrcodigo = :usrcodigo
                    """
                )

                data_siaccusr["usrcodigo"] = encriptar(usrcodigo.strip())

                connection.execute(update_query, data_siaccusr)

        return jsonify({"data": "Usuario eliminado exitosamente"}), 200
    except Exception as error:
        return jsonify({"error": {"msg": str(error)}}), 500
