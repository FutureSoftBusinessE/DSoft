# flake8: noqa
from flask import jsonify, request
from app.login import bp
from app.extensions import db
from flask_cors import cross_origin
from services.encrip_desencrip import encriptar, desencriptar
from app.models.fsbsmcliusu import fsbsmcliusu, fsbsmcliusu_schema_varios, fsbsmcliusu_schema
from app.models.fsbsmclicia import fsbsmclicia, fsbsmclicia_schema_varios, fsbsmclicia_schema
from app.db import get_session


#  recibe esta estructura
# {
#   "user": "id_usuario@id_empresa" # cliciausu@cliciagrupo
# }
# devuelve si el usuario existe o no
@bp.route("/usuario_existe", methods=["POST"])
@cross_origin()
def usuario_existe():
    # Obtener el JSON enviado en la solicitud
    data = request.get_json() if request.is_json else None

    # separar el usuario de la empresa
    user = data.get("user")
    user = user.split("@")
    usuario = user[0]
    cliciagrupo = user[1]

    # encriptar usuario
    cliciausu = encriptar(usuario)
    # cliciausu = "Â­v}xg"
    # busca en la base de datos si existen registros con el usuario y la empresa

    db.session = get_session()
    print("nameeee")
    print(db.session)
    cliusu = db.session.query(fsbsmcliusu.cliciausu, fsbsmcliusu.cliciagrupo).filter(fsbsmcliusu.cliciausu == cliciausu, fsbsmcliusu.cliciagrupo == cliciagrupo).first()
    # print(cliusu)

    # result = [
    #     {
    #         cliusu: row.cliusu,
    #         cliciagrupo: row.cliciagrupo

    #     }
    #     for row in cliusu
    # ]
    # print(result)

    us = fsbsmcliusu_schema.dump(cliusu)

    # Comprobar si se encontró un registro
    if cliusu is not None and us["cliciausu"] == cliciausu:
        # Si se encontró un registro, devolver una respuesta con el estado "ok"
        response = {
            "status": "ok",
            "message": "El usuario existe",
            "usuario": {"cliciausu": usuario, "cliciagrupo": cliciagrupo},
        }
    else:
        # Si no se encontró un registro, devolver una respuesta con el estado "error"
        response = {"status": "error", "message": "No se encontró ningÃºn registro con cliciausu = {}".format(user)}

    # Devolver la respuesta en formato JSON
    return jsonify(response)
