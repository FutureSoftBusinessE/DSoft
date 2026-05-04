from flask import jsonify, request
from app.Pasillos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from services.encrip_desencrip import encriptar
from app.models.inbpasillos import InbPasillo, InbPasilloSchema
from datetime import datetime


@bp.route("/createPasillo", methods=["POST"])
@cross_origin()
@jwt_required()
def createPasillo():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    # ciacodigo
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    usrcodigo = claims["user"]
    data = request.get_json()
    codigoPasillo = data["codigoPasillo"]
    descripcionPasillo = data["descripcionPasillo"]
    estadoPasillo = data["estadoPasillo"]
    db.session = get_session(clicianonBD)
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    date_con_hora_cero = fecha_con_hora_cero.strftime("%Y-%m-%d %H:%M:%S")
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)
    # Obtener la fecha con formato de 1900-01-01 y la hora actual
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)
    date_con_fecha_1900 = fecha_formato_1900.strftime("%Y-%m-%d %H:%M:%S")
    try:
        # comienza la trasaccion
        db.session.begin()
        nuevo_pasillo = InbPasillo(
            ciacodigo=ciacodigo,
            pascodigo=codigoPasillo,
            pasdescripcion=descripcionPasillo,
            passtatus=estadoPasillo,
            pasfecisys=date_con_hora_cero,
            # hora ingreso al sistema
            pashorisys=date_con_fecha_1900,  # Hora actual
            pasusuisys=usrcodigo,
            # ipuser
            pasestisys=ipUser,
            pasfecmsys=date_con_hora_cero,
            pashormsys=date_con_fecha_1900,
            pasusumsys=usrcodigo,
            # ipuser
            pasestmsys=ipUser,
        )
        db.session.add(nuevo_pasillo)
        db.session.commit()

        return jsonify({"data": "Pasillo creado con éxito"}), 200

    except Exception as e:
        # En caso de error, deshacemos la transacción
        print(e)
        import traceback

        traceback.print_exc()
        db.session.rollback()
        return f"Error en la transacción: {e}", 500
    finally:
        # Cerramos la conexión a la base de datos
        db.session.close()
