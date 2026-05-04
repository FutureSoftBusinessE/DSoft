# flake8: noqa
from flask import jsonify, request, render_template
from app.login import bp
from app.extensions import db
from flask_cors import cross_origin
from app.models.fsbsmcliusu import fsbsmcliusu, fsbsmcliusu_schema_varios, fsbsmcliusu_schema
from app.models.fsbsmclicia import fsbsmclicia, fsbsmclicia_schema_varios, fsbsmclicia_schema


@bp.route("/")
@cross_origin()
def index():
    return "login/"  # render_template('login/index.html')


# #  recive esta estructura
# # {
# #   "cliciausu": "id_usuario"
# # }
# # devuelve los grupos del usuario
# @bp.route('/buscar_cliciausu', methods=['POST'])
# def buscar_cliciausu():
#     # Obtener el JSON enviado en la solicitud
#     data = request.get_json()

#     # Obtener el valor de "cliciausu" del JSON
#     cliciausu = data.get('cliciausu')

#     # Buscar el registro en la base de datos que coincida con el valor de "cliciausu"
#     cliusu = fsbsmcliusu.query.filter_by(cliciausu=cliciausu).first()

#     # Comprobar si se encontró un registro
#     if cliusu is not None:
#         # Si se encontró un registro, obtener los grupos a los que pertenece el usuario
#         cliciagrupo = db.session.query(fsbsmcliusu.cliciagrupo).filter_by(cliciausu=cliciausu).all()

#         # Serializar los resultados usando el esquema
#         result_grupos = fsbsmcliusu_schema_varios.dump(cliciagrupo)

#         # Crear un diccionario con los datos del usuario y los grupos a los que pertenece
#         response_data = {
#             'cliciausu': cliusu.cliciausu,
#             'grupos': result_grupos
#         }


#         # Devolver una respuesta con el estado "ok" y los datos del usuario y los grupos a los que pertenece
#         response = {
#             'status': 'ok',
#             'data': response_data
#         }
#     else:
#         # Si no se encontró un registro, devolver una respuesta con el estado "error"
#         response = {
#             'status': 'error',
#             'message': 'No se encontró ningÃºn registro con cliciausu = {}'.format(cliciausu)
#         }

#     # Devolver la respuesta en formato JSON
#     return jsonify(response)


@bp.route("/buscar_grupos_de_cliciausu", methods=["POST"])
@cross_origin()
def login():
    # Obtener el JSON enviado en la solicitud
    data = request.get_json()

    # Obtener el valor de "cliciausu" del JSON
    cliciausu = data.get("cliciausu")

    # Obtener el valor de "cliciagrupo" del JSON
    cliciagrupo = data.get("cliciagrupo")

    # hacer el query de cuando ya tienes el usuario si existe
    consulta = (
        db.session.query(fsbsmclicia.cliciaciacodigo, fsbsmclicia.cliciacianombre, fsbsmclicia.cliciarutaBD, fsbsmclicia.clicianonBD)
        .join(
            fsbsmcliusu,
            fsbsmcliusu.cliciaidenti == fsbsmclicia.cliciaidenti and fsbsmcliusu.cliciagrupo == fsbsmcliusu.cliciagrupo,
        )
        .filter(fsbsmcliusu.cliciausu == cliciausu, fsbsmcliusu.cliciagrupo == cliciagrupo)
    )

    # Obtener los resultados de la consulta
    resultados = consulta.all()
    print("resultados: ", resultados)

    # Comprobar si se resultados no esta vacio
    if resultados:

        # Serializar los resultados usando el esquema
        datos = fsbsmclicia_schema_varios.dump(resultados)

        # si el join no hace match con una parte del esquema, asi se hace json de manera manual
        # datos = []
        # for resultado in resultados:
        #     datos.append({
        #         'cliciaciacodigo': resultado[0],
        #         'cliciacianombre': resultado[1],
        #         'cliciarutaBD': resultado[2],
        #         'clicianonBD': resultado[3]
        #     })

        # Devolver una respuesta con el estado "ok" y los datos del usuario y los grupos a los que pertenece
        response = {"status": "ok", "data": datos}
    else:
        # Si no se encontró un registro, devolver una respuesta con el estado "error"
        response = {"status": "error", "message": "ha ocurrido un error con cliciausu = {}".format(cliciausu)}

    # Devolver la respuesta en formato JSON
    return jsonify(response)


@bp.route("/fsbsmcliusu/")
@cross_origin()
def all_users():

    users = fsbsmcliusu.query.all()
    result = fsbsmcliusu_schema_varios.dump(users)
    return fsbsmcliusu_schema_varios.jsonify(result)


@bp.route("/fsbsmclicia/")
@cross_origin()
def all_otros():

    otros = fsbsmclicia.query.all()
    result = fsbsmclicia_schema_varios.dump(otros)
    return fsbsmclicia_schema_varios.jsonify(result)
