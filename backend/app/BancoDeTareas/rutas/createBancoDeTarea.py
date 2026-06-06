# flake8: noqa

from flask import jsonify, request, make_response
from app.BancoDeTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdocctareas import gdocctareas
from app.models.gdocttareas import gdocttareas
from app.models.Siacser import Siacser
from app.models.Cgpdpto import Cgpdpto
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


@bp.route("/createBancoDeTarea", methods=["POST"])
@jwt_required()
def createBancoDeTarea():

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

    try:
        # Inicia la transacción
        db.session.begin()

        # -----------ALGORITMO PARA GENERR SECUENCIA BANCO DE PREGUNTA---------------

        # Obtner el servidor actual
        locservidor = db.session.query(Siacser.locservidor).filter(Siacser.serstatus == "A").first()[0]

        year = datetime.now().strftime("%y")
        _dptoanio = datetime.now().strftime("%Y")
        _doccodigo = "TA"
        # registro acutal cgpdpto filtrado por parametros(Solo devuelve un registro)
        cgpdpto = (
            db.session.query(Cgpdpto)
            .filter(
                Cgpdpto.ciacodigo == ciacodigo,
                Cgpdpto.loccodigo == loccodigo,
                Cgpdpto.dptoanio == _dptoanio,
                Cgpdpto.doccodigo == _doccodigo,
            )
            .first()
        )

        if not cgpdpto:
            return jsonify({"msg": "No está creado la secuencia tarea 'TA'. Contacte al administrador"}), 404

        secuenciaActualBancoDePregunta = cgpdpto.dptonumsec
        nuevaSecuenciaActualBancoDePregunta = secuenciaActualBancoDePregunta + 1

        pregcodigoGenerated = f"TA{locservidor}{year}{secuenciaActualBancoDePregunta:06}{loccodigo}"

        # Audito la nueva secuencia pallet
        cgpdpto.dptonumsec = nuevaSecuenciaActualBancoDePregunta

        # -------------------------------------------------------------

        # Crear la cabecera
        nuevaCabecera = gdocctareas(
            ciacodigo=ciacodigo,
            pregcodigo=pregcodigoGenerated,
            pregdescri=cabecera["descripcion"],
            pregtipo=cabecera["tipoPregunta"],
            pregobligatoria=cabecera["preguntaObligatoria"],  # Puedes ajustar este valor segÃºn tus necesidades
            pregdurmin=cabecera.get("duracionTarea"),
            pregrecuren=cabecera.get("recurrenciaTarea"),
            pregstatus=cabecera["estado"],
            pregfecisys=date_con_hora_cero,
            pregorisys=date_con_fecha_1900,
            pregusuisys=usrcodigo,
            pregestisys=ipUser,
            pregfecmsys=date_con_hora_cero,
            preghormsys=date_con_fecha_1900,
            pregusumsys=usrcodigo,
            pregestmsys=ipUser,
            insticodigo=cabecera.get("insticodigo"),
            pregespresencial=cabecera.get("pregespresencial"),
        )
        db.session.add(nuevaCabecera)

        # Crea todas las preguntas asociadas a la cabecera

        for pregunta in detalle:

            nueva_pregunta = gdocttareas(
                ciacodigo=ciacodigo,
                pregcodigo=pregcodigoGenerated,
                pregsecuen=pregunta["index"],
                pregtipo=cabecera["tipoPregunta"],
                pregdescri=pregunta["respuesta"],
                pregstatus=cabecera["estado"],
                pregfecisys=date_con_hora_cero,
                pregorisys=date_con_fecha_1900,
                pregusuisys=usrcodigo,
                pregestisys=ipUser,
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
        return jsonify({"data": "Creado con Ã©xito", "pregcodigoGenerated": pregcodigoGenerated}), 200

    except Exception as e:
        # Si hay algÃºn error, realiza un rollback para deshacer los cambios
        db.session.rollback()

        print(e)
        # Maneja el error
        return make_response(jsonify({"msg": "Error al crear el banco de preguntas"}), 404)
    finally:
        # Cierra la transacción
        db.session.close()
