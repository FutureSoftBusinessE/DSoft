# flake8: noqa
import json
from flask import jsonify, request
from app.login import bp
from app.extensions import db
from flask_cors import cross_origin
from app.models.DynamicLoginDB import DynamicLoginDB, DynamicLoginDBSchema
from services.encrip_desencrip import encriptar, desencriptar
from app.models.fsbsmcliusu import fsbsmcliusu, fsbsmcliusu_schema_varios, fsbsmcliusu_schema
from app.models.fsbsmclicia import fsbsmclicia, fsbsmclicia_schema_varios, fsbsmclicia_schema
from app.models.medauditoria import medauditoria, ma
import platform
from datetime import datetime
from app.db import get_session
from services.encrip_desencrip import desencriptar


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
@bp.route("/inicio_sesion", methods=["POST"])
@cross_origin()
def inicio_sesion():
    data = request.get_json() if request.is_json else None
    usuario = data["user"]
    password = data["password"]
    clicianonBD = data["clicianonBD"]

    # encripta usuario y clave

    my_os = platform.system()
    if my_os == "Linux":
        usrcodigo = usuario
        usrclave = password

    else:
        usrcodigo = encriptar(usuario)
        usrclave = encriptar(password)

    db.session = get_session(clicianonBD)
    result = db.session.query(DynamicLoginDB).filter(DynamicLoginDB.usrcodigo == usrcodigo).first()

    tabla = result.__dict__
    tabla_dict = tabla
    # usrcodigo = tabla_dict['usrcodigo']

    if len(password) > 10:
        return jsonify({"status": "error", "message": "Su contraseña no debe tener mas de 10 caracteres"})

    if tabla_dict["usrcodigo"] == usrcodigo and tabla_dict["usrclave"] == usrclave:
        ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)
        usrcodigo = desencriptar(tabla_dict["usrcodigo"])
        usrnombre = desencriptar(tabla_dict["usrnombre"])
        datosNuevoInicioSesion = {
            "usrcodigo": usrcodigo,
            "usrnombre": usrnombre,
            "hostname": ipUser,
            "hostip": ipUser,
            "fecisys": datetime.now(),
            "modcodigo": "WEB",
        }
        nuevoInicioSession = medauditoria(**datosNuevoInicioSesion)

        db.session.add(nuevoInicioSession)
        db.session.commit()
        try:
            response = {
                "status": "ok",
                "message": "Iniciaste sesion",
                "data": {"user": usuario, "seleccion": data["seleccion"]},
            }
        except Exception as e:
            response = {"status": "error", "message": "No se pudo registar su inicio de sesion"}
            return response
        finally:
            db.session.close()
    else:
        response = {"status": "error", "message": "datos incorrectos"}

    return jsonify(response)
