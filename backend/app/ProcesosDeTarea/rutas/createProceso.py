# flake8: noqa

from flask import jsonify, request, make_response
from app.ProcesosDeTarea import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdocbprocesos import gdocbprocesos
from services.encrip_desencrip import encriptar
from datetime import datetime

# {
#     "proceso": "nuevo Proceso",
#     "estado": "A"
# }


@bp.route("/createProceso", methods=["POST"])
@cross_origin()
@jwt_required()
def createProceso():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = claims["user"]

    data = request.get_json()
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)
    procesocod = data["proceso"]
    procesosta = data["estado"]

    db.session = get_session(clicianonBD)

    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    date_con_hora_cero = fecha_con_hora_cero.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    # Obtener la fecha con formato de 1900-01-01 09:10:11.000
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second, datetime.now().microsecond)
    date_con_fecha_1900 = fecha_formato_1900.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    try:
        # Inicia la transacción
        db.session.begin()

        # Crear la cabecera
        nuevaProceso = gdocbprocesos(
            ciacodigo=ciacodigo,
            procesocod=procesocod,
            espcodigo=None,
            invcodigo=None,
            artcodigo=None,
            procesosta=procesosta,
            procesofisys=date_con_hora_cero,
            procesohisys=date_con_fecha_1900,
            procesouisys=usrcodigo,
            procesoeisys=ipUser,
            procesofmsys=date_con_hora_cero,
            procesohmsys=date_con_fecha_1900,
            procesoumsys=usrcodigo,
            procesoemsys=ipUser,
        )
        db.session.add(nuevaProceso)

        # Confirma la transacción
        db.session.commit()
        return jsonify({"data": "Creado con Ã©xito"}), 200

    except Exception as e:
        # Si hay algÃºn error, realiza un rollback para deshacer los cambios
        db.session.rollback()

        print(e)
        # Maneja el error
        return make_response(jsonify({"msg": "Error al crear el proceso"}), 404)
    finally:
        # Cierra la transacción
        db.session.close()
