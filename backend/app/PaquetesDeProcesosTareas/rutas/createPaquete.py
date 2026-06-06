# flake8: noqa

from flask import jsonify, request, make_response
from app.PaquetesDeProcesosTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdoccpaquetes import gdoccpaquetes
from app.models.gdoctpaquetes import gdoctpaquetes
from app.models.Siacser import Siacser
from app.models.Cgpdpto import Cgpdpto
from services.encrip_desencrip import encriptar
from datetime import datetime


# {
#     "cabecera":{
#         "descripcion": "Nuevo formulario",
#         "estado": "A",
#         "procesocod": "nuevo"
#     }
#     "detalle":[
#         {
#             "preghormsys": "1900-01-01T02:43:20.590000",
#             "pregestmsys": "127.0.0.1",
#             "pregdescri": "Ultima prueba",
#             "pregusuisys": "fsbs",
#             "pregtipo": "M",
#             "pregobligatoria": -1,
#             "pregusumsys": "fsbs",
#             "pregstatus": "I",
#             "pregcodigo": "OPA2300001601",
#             "ciacodigo": "01",
#             "pregfecisys": "2023-11-06T00:00:00",
#             "pregorisys": "1900-01-01T02:36:41.333000",
#             "pregfecmsys": "2023-11-06T00:00:00",
#             "pregestisys": "127.0.0.1"
#         },
#         {
#             "preghormsys": "1900-01-01T09:10:11",
#             "pregestmsys": "192.168.20.2",
#             "pregdescri": "Cual es su madre?",
#             "pregusuisys": "fsbs",
#             "pregtipo": "U",
#             "pregobligatoria": -1,
#             "pregusumsys": "fsbs",
#             "pregstatus": "A",
#             "pregcodigo": "OPA1900000807",
#             "ciacodigo": "01",
#             "pregfecisys": "2021-01-01T00:00:00",
#             "pregorisys": "1900-01-01T09:10:11",
#             "pregfecmsys": "2021-01-01T00:00:00",
#             "pregestisys": "192.168.20.2"
#         }
#     ]
# }
@bp.route("/createPaquete", methods=["POST"])
@jwt_required()
def createPaquete():

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

        # -----------ALGORITMO PARA GENERR SECUENCIA FORMULARIO---------------

        # Obtner el servidor actual
        locservidor = db.session.query(Siacser.locservidor).filter(Siacser.serstatus == "A").first()[0]

        year = datetime.now().strftime("%y")
        _dptoanio = datetime.now().strftime("%Y")
        _doccodigo = "PA"
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

        secuenciaActualFormulario = cgpdpto.dptonumsec
        nuevaSecuenciaActualFormulario = secuenciaActualFormulario + 1

        formcodigoGenerated = f"PA{locservidor}{year}{secuenciaActualFormulario:06}{loccodigo}"

        # Audito la nueva secuencia pallet
        cgpdpto.dptonumsec = nuevaSecuenciaActualFormulario

        # -------------------------------------------------------------

        # Crear la cabecera
        nuevaCabecera = gdoccpaquetes(
            ciacodigo=ciacodigo,
            formcodigo=formcodigoGenerated,
            procesocod=cabecera["procesocod"],
            formdescri=cabecera["descripcion"],
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
        db.session.add(nuevaCabecera)

        # Crea todas las preguntas asociadas a la cabecera

        for indice, pregunta in enumerate(detalle, start=1):

            nueva_pregunta = gdoctpaquetes(
                ciacodigo=ciacodigo,
                formcodigo=formcodigoGenerated,
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
        return jsonify({"data": "Creado con Ã©xito", "formcodigoGenerated": formcodigoGenerated}), 200

    except Exception as e:
        # Si hay algÃºn error, realiza un rollback para deshacer los cambios
        db.session.rollback()

        print(e)
        # Maneja el error
        return make_response(jsonify({"msg": "Error al crear el formulario"}), 404)
    finally:
        # Cierra la transacción
        db.session.close()
