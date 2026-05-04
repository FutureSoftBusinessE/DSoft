from flask import jsonify, request
from app.ActualizaClaveFechaCaducidadLote import bp
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


@bp.route("/saveFechaCaducidadLote", methods=["POST"])
@cross_origin()
@jwt_required()
def saveFechaCaducidadLote():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # CONSTANTES
    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    sFecISys = fecha_con_hora_cero

    # Obtener la fecha con formato de 1900-01-01 y la hora actual
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)
    sHorISys = fecha_formato_1900

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    usuarios = data.get("usuarios", [])
    nueva_fecha_vencimiento = data.get("nuevaFechaVencimiento")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                for usuario in usuarios:
                    usrcodigo = encriptar(usuario.get("usrcodigo"))

                    # Actualizar la fecha de vencimiento del usuario
                    update_query = """
                    UPDATE siaccusr
                    SET usrfeccad = :nueva_fecha_vencimiento,
                        usrfecmsys = :sFecISys,
                        usrhormsys = :sHorISys,
                        usrusumsys = :sUsuario,
                        usrestmsys = :sNomEst
                    WHERE usrcodigo = :usrcodigo
                    """

                    connection.execute(
                        text(update_query),
                        {"nueva_fecha_vencimiento": nueva_fecha_vencimiento, "usrcodigo": usrcodigo, "sFecISys": sFecISys, "sHorISys": sHorISys, "sUsuario": sUsuario, "sNomEst": sNomEst},
                    )
        return jsonify({"data": {"msg": "Guardado con éxito"}}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": {"msg": str(e)}}), 400
