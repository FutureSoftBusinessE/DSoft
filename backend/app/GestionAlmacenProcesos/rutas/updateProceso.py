# flake8: noqa
from flask import jsonify, request, make_response
from app.GestionAlmacenProcesos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.siacprocesos import siacprocesos
from services.encrip_desencrip import encriptar
from datetime import datetime

# {
#     "oldProceso": "viegoCodigo",
#     "proceso": "dfs",
#     "estado": "A"

# }


@bp.route("/updateProceso", methods=["PUT"])
@cross_origin()
@jwt_required()
def updateGestionAlmacenProceso():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = claims["user"]

    data = request.get_json()
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)
    oldprocesocod = data["oldProceso"]
    procesocod = data["proceso"]
    procesosta = data["estado"]

    db.session = get_session(clicianonBD)

    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    date_con_hora_cero = fecha_con_hora_cero.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    # Obtener la fecha con formato de 1900-01-01 09:10:11.000
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second, datetime.now().microsecond)
    date_con_fecha_1900 = fecha_formato_1900.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    # Realiza la consulta

    try:
        # Inicia la transacción
        db.session.begin()

        # Encontrar el proceso
        queryProceso = (
            db.session.query(siacprocesos)
            .filter(
                siacprocesos.ciacodigo == ciacodigo,
                siacprocesos.procesocod == oldprocesocod,
            )
            .first()
        )

        # # Actualiza el proceso con los nuevos valores
        queryProceso.procesocod = procesocod
        queryProceso.procesosta = procesosta
        queryProceso.procesofmsys = date_con_fecha_1900
        queryProceso.procesohmsys = date_con_hora_cero
        queryProceso.procesoumsys = usrcodigo
        queryProceso.procesoemsys = ipUser
        db.session.commit()
        return jsonify({"data": "Actualizado con Ã©xito"}), 200

    except Exception as e:
        # Si hay algÃºn error, realiza un rollback para deshacer los cambios
        db.session.rollback()

        print(e)
        # Maneja el error
        return make_response(jsonify({"msg": "Error al actualizar el proceso"}), 404)
    finally:
        # Cierra la transacción
        db.session.close()
