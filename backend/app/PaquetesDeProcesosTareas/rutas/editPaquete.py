# flake8: noqa
from flask import jsonify, request, make_response
from app.PaquetesDeProcesosTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdoctpaquetes import gdoctpaquetes
from app.models.gdoccpaquetes import gdoccpaquetes
from services.encrip_desencrip import encriptar
from datetime import datetime

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
#         },
#         {
#             "index": 2,
#             "respuesta": "dos"
#         },
#         {
#             "index": 3,
#             "respuesta": "tres"
#         }
#     ]
# }


@bp.route("/editPaquete/<string:formcodigo>", methods=["PUT"])
@jwt_required()
def editPaquete(formcodigo):

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
        db.session.query(gdoctpaquetes).filter(gdoctpaquetes.ciacodigo == ciacodigo, gdoctpaquetes.formcodigo == formcodigo).delete()

        queryCabecera = db.session.query(gdoccpaquetes).filter(gdoccpaquetes.ciacodigo == ciacodigo, gdoccpaquetes.formcodigo == formcodigo).first()

        # # Actualiza la cabecera con los nuevos valores
        queryCabecera.formdescri = cabecera["descripcion"]
        queryCabecera.formstatus = cabecera["estado"]
        queryCabecera.formfecmsys = date_con_hora_cero
        queryCabecera.formhormsys = date_con_fecha_1900
        queryCabecera.formusumsys = usrcodigo
        queryCabecera.formestmsys = ipUser
        # Crear el detalle con los nuevos valores
        # Crea todas las preguntas asociadas a la cabecera

        for indice, pregunta in enumerate(detalle, start=1):

            nueva_pregunta = gdoctpaquetes(
                ciacodigo=ciacodigo,
                formcodigo=formcodigo,
                procesocod=cabecera["procesocod"],
                pregcodigo=pregunta["pregcodigo"],
                formsecuen=indice,
                formstatus=cabecera["estado"],
                formfecisys=date_con_hora_cero,
                formhorisys=date_con_fecha_1900,
                formusuisys=usrcodigo,
                formestisys=ipUser,
                formfecmsys=date_con_hora_cero,
                formhormsys=date_con_fecha_1900,
                formusumsys=usrcodigo,
                formestmsys=ipUser,
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
        return make_response(jsonify({"msg": "Error al actualizar el formulario"}), 404)
    finally:
        # Cierra la transacción
        db.session.close()
