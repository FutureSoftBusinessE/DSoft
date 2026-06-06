# flake8: noqa
from flask import jsonify, request
from app.login import bp
from app.extensions import db

from app.models.fsbsmcliusu import fsbsmcliusu, fsbsmcliusu_schema_varios, fsbsmcliusu_schema
from app.models.fsbsmclicia import fsbsmclicia, fsbsmclicia_schema_varios, fsbsmclicia_schema


# {
#   "cliciausu": "id_usuario"
# }
@bp.route("/buscar_cliciausu", methods=["POST"])
def buscar_cliciausu():
    # Obtener el JSON enviado en la solicitud
    data = request.get_json() if request.is_json else None
    # Obtener el valor de "cliciausu" del JSON
    cliciausu = data.get("cliciausu")

    # Buscar el registro en la base de datos que coincida con el valor de "cliciausu"
    cliusu = fsbsmcliusu.query.filter_by(cliciausu=cliciausu).first()

    # Comprobar si se encontró un registro
    if cliusu is not None:
        # Si se encontró un registro, obtener los grupos a los que pertenece el usuario
        cliciagrupo = db.session.query(fsbsmcliusu.cliciagrupo).filter_by(cliciausu=cliciausu).all()

        # Serializar los resultados usando el esquema
        result_grupos = fsbsmcliusu_schema_varios.dump(cliciagrupo)

        # Crear un diccionario con los datos del usuario y los grupos a los que pertenece
        response_data = {"cliciausu": cliusu.cliciausu, "grupos": result_grupos}

        # Devolver una respuesta con el estado "ok" y los datos del usuario y los grupos a los que pertenece
        response = {"status": "ok", "data": response_data}
    else:
        # Si no se encontró un registro, devolver una respuesta con el estado "error"
        response = {
            "status": "error",
            "message": "No se encontró ningÃºn registro con cliciausu = {}".format(cliciausu),
        }

    # Devolver la respuesta en formato JSON
    return jsonify(response)
