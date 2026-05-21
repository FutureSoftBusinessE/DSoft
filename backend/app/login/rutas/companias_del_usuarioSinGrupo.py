# flake8: noqa
from flask import jsonify, request
from app.login import bp
from app.extensions import db
from flask_cors import cross_origin
from app.models.fsbsmcliusu import fsbsmcliusu, fsbsmcliusu_schema_varios, fsbsmcliusu_schema
from app.models.fsbsmclicia import fsbsmclicia, fsbsmclicia_schema_varios, fsbsmclicia_schema
from services.encrip_desencrip import encriptar


#  recibe esta estructura
# {
#   "cliciausu": "id_usuario",
#   "cliciagrupo": "id_empresa"
# }
# devuelve codigo de compania, nombre de compania, ruta de la base de datos y nombre de la base de datos
@bp.route("/companias_del_usuarioSinGrupo", methods=["POST"])
@cross_origin()
def companias_del_usuarioSinGrupo():
    # Obtener el JSON enviado en la solicitud
    data = request.get_json() if request.is_json else None

    # Obtener el valor de "cliciausu" del JSON
    cliciausu = encriptar(data.get("cliciausu"))

    # Obtener el valor de "cliciagrupo" del JSON
    cliciagrupo = data.get("cliciagrupo")

    # hacer el query de cuando ya tienes el usuario si existe
    resultados = (
        db.session.query(fsbsmclicia.cliciaciacodigo, fsbsmclicia.cliciaidenti, fsbsmclicia.cliciacianombre, fsbsmclicia.cliciarutaBD, fsbsmclicia.clicianonBD)
        .join(
            fsbsmcliusu,
            fsbsmcliusu.cliciaidenti == fsbsmclicia.cliciaidenti and fsbsmcliusu.cliciagrupo == fsbsmcliusu.cliciagrupo,
        )
        .filter(fsbsmcliusu.cliciausu == cliciausu)
        .all()
    )

    # Comprobar si se resultados no esta vacio
    if resultados:

        # Serializar los resultados usando el esquema
        datos = fsbsmclicia_schema_varios.dump(resultados)

        # Devolver una respuesta con el estado "ok" y los datos del usuario y los grupos a los que pertenece
        response = {"status": "ok", "data": datos}
    else:
        # Si no se encontró un registro, devolver una respuesta con el estado "error"
        response = {"status": "error", "message": "ha ocurrido un error con cliciausu = {}".format(cliciausu)}

    # Devolver la respuesta en formato JSON
    return jsonify(response)
