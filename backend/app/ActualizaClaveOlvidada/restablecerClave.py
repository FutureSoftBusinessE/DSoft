from flask import jsonify, request
from app.ActualizaClaveOlvidada import bp
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


@bp.route("/restablecerClave", methods=["POST"])
@jwt_required()
def restablecerClave():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    usrcodigo = claims["user"]

    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Obtener la fecha con formato de 1900-01-01 y la hora actual
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    txtUsrCodigo = data.get("txtUsrCodigo")
    nueva_clave = encriptar(txtUsrCodigo)

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            try:
                update_query = text(
                    """
                    UPDATE siaccusr
                    SET
                        usrclave = :nueva_clave,
                        usrfecmsys = :fecha_actual,
                        usrhormsys = :hora_actual,
                        usrusumsys = :usrusumsys,
                        usrflagnuevmodi = 0,
                        usrfecactuclave = :fecha_actual
                    WHERE usrcodigo = :usrcodigo
                """
                )
                connection.execute(update_query, {"nueva_clave": nueva_clave, "fecha_actual": fecha_con_hora_cero, "hora_actual": fecha_formato_1900, "usrusumsys": encriptar(usrcodigo), "usrcodigo": encriptar(txtUsrCodigo)})

                return jsonify({"data": {"msg": "Guardado con éxito"}}), 200
            except Exception as e:
                return jsonify({"error": {"msg": str(e)}}), 500
