from flask import jsonify, request, make_response
from app.Pasillos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.inbpasillos import InbPasillo
from app.models.inbpasillos import InbPasilloSchema
from services.encrip_desencrip import encriptar
from datetime import datetime


@bp.route("/updatePasillo/<string:pasillo_codigo>", methods=["PUT"])
@cross_origin()
@jwt_required()
def updatePasillo(pasillo_codigo):

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    usrcodigo = claims["user"]

    data = request.get_json()
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)
    descripcion_pasillo = data.get("descripcion_pasillo")
    estado_pasillo = data.get("estado_pasillo")

    db.session = get_session(clicianonBD)

    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    date_con_hora_cero = fecha_con_hora_cero.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    # Obtener la fecha con formato de 1900-01-01 09:10:11.000
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second, datetime.now().microsecond)
    date_con_fecha_1900 = fecha_formato_1900.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    # Realiza la consulta

    try:
        # Inicia la transacciÃ³n
        db.session.begin()
        pasillo = db.session.query(InbPasillo).filter_by(ciacodigo=ciacodigo, pascodigo=pasillo_codigo).first()
        if pasillo:
            pasillo.pasdescripcion = descripcion_pasillo if descripcion_pasillo else pasillo.pasdescripcion
            pasillo.passtatus = estado_pasillo if estado_pasillo else pasillo.passtatus
            pasillo.pasfecmsys = date_con_hora_cero
            pasillo.pashormsys = date_con_fecha_1900
            pasillo.pasusumsys = usrcodigo
            pasillo.pasestmsys = ipUser
            db.session.commit()
            return jsonify({"data": "Pasillo editado"}), 200

        else:
            return make_response(jsonify({"msg": "El pasillo no existe"}), 404)

    except Exception as e:
        # Si hay algÃºn error, realiza un rollback para deshacer los cambios
        db.session.rollback()

        print(e)
        # Maneja el error
        return make_response(jsonify({"msg": "Error al actualizar el pasillo seleccionado"}), 404)
    finally:
        # Cierra la transacciÃ³n
        db.session.close()
