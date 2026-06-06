# flake8: noqa
from flask import jsonify, request, make_response
from app.BancoDeTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdocctareas import gdocctareas
from app.models.gdocttareas import gdocttareas
from services.encrip_desencrip import encriptar
from datetime import datetime

# {
#     "cabecera": {
#         "descripcion": "Nueva pregunta",
#         "estado": "A",
#         "tipoPregunta": "U",
#         "preguntaObligatoria": -1
#     },
#     "detalle": [
#         {
#             "index": 1,
#             "respuesta": "Cual es su matricula?",
#             "esRespuestaPredeterminada":0                     !!!Key opcional. Esta key solo lo tiene las preguntas tipo L (lista de opciones)
#         },
#         {
#             "index": 2,
#             "respuesta": "Cual es su nombre?",
#             "esRespuestaPredeterminada":1                     0: no es la repuesta; 1: es la respuesta
#         }
#     ]
# }
# {
#     "cabecera": {
#         "codigo": "OPA2300001601",
#         "descripcion": "Ultima prueba",
#         "estado": "A",
#         "tipoPregunta": "M",
#         "preguntaObligatoria": -1
#     },
#     "detalle": [
#         {
#             "index": 1,
#             "respuesta": "uno",
#             "estado": "A"
#             "esRespuestaPredeterminada":0
#         },
#         {
#             "index": 2,
#             "respuesta": "dos"
#             "estado": "A"
#             "esRespuestaPredeterminada":1
#         },
#         {
#             "index": 3,
#             "respuesta": "tres"
#             "estado": "A"
#         }
#     ]
# }


@bp.route("/editarSpecificBancoDeTarea/<string:pregcodigo>", methods=["PUT"])
@jwt_required()
def editarSpecificBancoDeTarea(pregcodigo):

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = claims["user"]

    data = request.get_json()
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)
    cabecera = data["cabecera"]
    detalle = data["detalle"]

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

        # Realiza la consulta para eliminar y luego crear el detalle (todas las preguntas) y editar la cabecera del banco de preguntas
        db.session.query(gdocttareas).filter(gdocttareas.ciacodigo == ciacodigo, gdocttareas.pregcodigo == pregcodigo).delete()

        queryCabecera = db.session.query(gdocctareas).filter(gdocctareas.ciacodigo == ciacodigo, gdocctareas.pregcodigo == pregcodigo).first()

        # # Actualiza la cabecera con los nuevos valores
        queryCabecera.ciacodigo = ciacodigo
        queryCabecera.pregdescri = cabecera["descripcion"]
        queryCabecera.pregtipo = cabecera["tipoPregunta"]
        queryCabecera.pregobligatoria = cabecera["preguntaObligatoria"]  # Puedes ajustar este valor segÃºn tus necesidades
        queryCabecera.pregstatus = cabecera["estado"]
        queryCabecera.pregfecmsys = date_con_hora_cero
        queryCabecera.preghormsys = date_con_fecha_1900
        queryCabecera.pregusumsys = usrcodigo
        queryCabecera.pregestmsys = ipUser
        queryCabecera.pregdurmin = cabecera["pregdurmin"]
        queryCabecera.pregrecuren = cabecera["pregrecuren"]
        queryCabecera.insticodigo = cabecera.get("insticodigo")
        queryCabecera.pregespresencial = cabecera.get("pregespresencial")

        # Crear el detalle con los nuevos valores
        # Crea todas las preguntas asociadas a la cabecera

        for pregunta in detalle:
            nueva_pregunta = gdocttareas(
                ciacodigo=ciacodigo,
                pregcodigo=cabecera["codigo"],
                pregsecuen=pregunta["index"],
                pregtipo=cabecera["tipoPregunta"],
                pregdescri=pregunta["respuesta"],
                pregstatus=cabecera["estado"],
                pregfecisys=queryCabecera.pregfecisys,
                pregorisys=queryCabecera.pregorisys,
                pregusuisys=queryCabecera.pregusuisys,
                pregestisys=queryCabecera.pregestisys,
                pregfecmsys=date_con_hora_cero,
                preghormsys=date_con_fecha_1900,
                pregusumsys=usrcodigo,
                pregestmsys=ipUser,
                pregRespuesta=pregunta.get("esRespuestaPredeterminada", 0),
            )
            # Agregar el nuevo registro
            db.session.add(nueva_pregunta)

        # Confirma la transacción
        db.session.commit()
        return jsonify({"data": "Actualizado con Ã©xito"}), 200

    except Exception as e:
        # Si hay algÃºn error, realiza un rollback para deshacer los cambios
        db.session.rollback()

        print(e)
        # Maneja el error
        return make_response(jsonify({"msg": "Error al actualizar el banco de preguntas"}), 404)
    finally:
        # Cierra la transacción
        db.session.close()
