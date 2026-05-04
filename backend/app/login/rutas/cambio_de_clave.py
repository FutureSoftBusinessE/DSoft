from flask import jsonify, request
from app.login import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import text
from datetime import datetime


@bp.route("/cambioDeClave", methods=["POST"])
@cross_origin()
@jwt_required()
def cambioDeClave():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    usrcodigo = claims["user"]

    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Obtener la fecha con formato de 1900-01-01 y la hora actual
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    usrclave_actual = data.get("usrclave")
    nueva_clave = data.get("nuevaClave")
    confirmacion_clave = data.get("confirmacionClave")

    # Validación básica de campos
    required_fields = [usrcodigo, usrclave_actual, nueva_clave, confirmacion_clave]
    if not all(required_fields):
        return jsonify({"error": {"msg": "Faltan campos requeridos"}}), 400

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    try:
        with engine.connect() as connection:
            with connection.begin():
                # Obtener usuario
                usuario_query = text(
                    """
                    SELECT usrcodigo, usrclave
                    FROM siaccusr
                    WHERE usrcodigo = :usrcodigo
                """
                )

                usuario_result = connection.execute(usuario_query, {"usrcodigo": encriptar(usrcodigo)}).mappings().fetchone()

                print(usuario_result)

                if not usuario_result:
                    return jsonify({"error": {"msg": "Usuario no encontrado"}}), 404

                if len(nueva_clave) > 10:
                    return jsonify({"error": {"msg": "La contraseña no debe tener mas de 10 caracteres"}}), 400

                # Verificar contraseña actual
                if encriptar(usrclave_actual) != usuario_result["usrclave"]:
                    return jsonify({"error": {"msg": "Contraseña actual incorrecta"}}), 401

                # Validar coincidencia de nuevas contraseñas
                if nueva_clave != confirmacion_clave:
                    return jsonify({"error": {"msg": "Las nuevas contraseñas no coinciden"}}), 400

                # Validar que la nueva contraseña sea diferente del usrcodigo
                if encriptar(nueva_clave) == usuario_result["usrcodigo"]:
                    return jsonify({"error": {"msg": "La contraseña no puede ser igual al usuario"}}), 400

                # Validar que la nueva contraseña sea diferente de la clave actual que esta intentando cambiar
                if encriptar(nueva_clave) == usuario_result["usrclave"]:
                    return jsonify({"error": {"msg": "La nueva contraseña debe ser diferente a la actual"}}), 400

                # Actualizar contraseña
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

                connection.execute(update_query, {"nueva_clave": encriptar(nueva_clave), "fecha_actual": fecha_con_hora_cero, "hora_actual": fecha_formato_1900, "usrusumsys": encriptar(usrcodigo), "usrcodigo": encriptar(usrcodigo)})

            return jsonify({"data": "Contraseña actualizada exitosamente"}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": {"msg": "Contraseña no actualizada, error en la peticion"}}), 400
