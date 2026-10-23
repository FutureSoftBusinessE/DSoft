# flake8: noqa
import json
from flask import jsonify, request
from app.login import bp
from app.extensions import db

from app.models.DynamicLoginDB import DynamicLoginDB, DynamicLoginDBSchema
from services.encrip_desencrip import encriptar, desencriptar
from app.models.fsbsmcliusu import fsbsmcliusu, fsbsmcliusu_schema_varios, fsbsmcliusu_schema
from app.models.fsbsmclicia import fsbsmclicia, fsbsmclicia_schema_varios, fsbsmclicia_schema
from app.models.medauditoria import medauditoria, ma
import platform
from datetime import datetime
from app.db import get_session
from services.encrip_desencrip import desencriptar
from flask_jwt_extended import decode_token


#  recibe esta estructura
# {
#   "user": "Â­v}xg",
#   "password": "I4bÂªszuj",
#   "seleccion":
#       {
#           "cliciaciacodigo": "01",
#           "cliciacianombre": "PRACTICASA",
#           "clicianonBD": "SiacPracticasa",
#           "cliciarutaBD": "fsoftapptest.futuresoft-ec.com,14666"
#       },
# }
from flask import request
from flask_jwt_extended import decode_token
from datetime import datetime
import platform
from error_handling import api_endpoint, ValidationError, APIError, DatabaseError, validate_required


@bp.route("/inicio_sesion", methods=["POST"])
@api_endpoint
def inicio_sesion():
    # 1. Cuerpo JSON obligatorio
    data = request.get_json()
    if data is None:
        raise ValidationError("Se esperaba un cuerpo JSON válido")

    # 2. Validación nivel raíz
    validate_required(
        data,
        {
            "user": str,
            "password": str,
            "clicianonBD": str,
            "seleccion": dict,
            "token": str,
        },
    )

    usuario = data["user"]
    password = data["password"]
    clicianonBD = data["clicianonBD"]
    seleccion = data["seleccion"]
    cliciaidenti = seleccion.get("cliciaidenti")
    token = data["token"]

    if cliciaidenti is None:
        raise ValidationError(
            "Falta seleccion.cliciaidenti",
            details={"field": "seleccion.cliciaidenti"},
        )

    # 3. Longitud de contraseña
    if len(password) > 10:
        raise ValidationError(
            "Su contraseña no debe tener más de 10 caracteres",
            details={"field": "password", "max_length": 10},
        )

    # 4. Encriptar según SO
    if platform.system() == "Linux":
        usrcodigo = usuario
        usrclave = password
    else:
        usrcodigo = encriptar(usuario)
        usrclave = encriptar(password)

    # 5. Sesión
    session = get_session(clicianonBD)
    try:
        result = session.query(DynamicLoginDB).filter(DynamicLoginDB.usrcodigo == usrcodigo).first()

        if result is None:
            raise APIError("Usuario o contraseña incorrectos")

        tabla_dict = result.__dict__

        # 6. Usuario caducado
        fecha_caducidad = tabla_dict.get("usrfeccad")
        if fecha_caducidad is not None and fecha_caducidad < datetime.now():
            raise APIError("Su usuario ha caducado", 400, "USER_EXPIRED")

        # 7. Usuario inactivo
        usrstatus = desencriptar(tabla_dict.get("usrstatus", ""))
        if usrstatus != "A":
            raise APIError("Su usuario no está activo", 400, "USER_INACTIVE")

        # 8. Validar credenciales
        if tabla_dict["usrcodigo"] != usrcodigo or tabla_dict["usrclave"] != usrclave:
            raise APIError("Usuario o contraseña incorrectos")

        # 9. Extraer jti del token
        try:
            jti_actual = decode_token(token)["jti"]
        except Exception:
            raise ValidationError(
                "Token inválido, hace falta el jti",
                details={"field": "token"},
            )

        # 10. Registrar auditoría
        ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)
        usrcodigo_plano = desencriptar(tabla_dict["usrcodigo"])
        usrnombre = desencriptar(tabla_dict["usrnombre"])

        datosNuevoInicioSesion = {
            "usrcodigo": usrcodigo_plano,
            "usrnombre": usrnombre,
            "hostname": ipUser,
            "hostip": ipUser,
            "fecisys": datetime.now(),
            "modcodigo": "WEB",
            "jti": jti_actual,
            "cliciaidenti": cliciaidenti,
        }
        nuevoInicioSession = medauditoria(**datosNuevoInicioSesion)

        session.add(nuevoInicioSession)
        session.commit()

    except (ValidationError, APIError):
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise DatabaseError(
            "registro de inicio de sesión",
            details={"error": str(e)},
        )
    finally:
        session.close()

    # 11. Respuesta
    return {
        "status": "ok",
        "message": "Iniciaste sesión",
        "data": {"user": usuario, "seleccion": seleccion},
    }
