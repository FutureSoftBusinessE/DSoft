from flask import jsonify, request, make_response
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.incSgaSolIng import incSgaSolIng
from app.models.intSgaSolIng import intSgaSolIng
from app.models.Cgpdpto import Cgpdpto
from datetime import datetime, timedelta
from app.models.inbsgamotivos import inbsgamotivos
from app.models.viewProductos import ViewProducto as view_inmart
from app.models.cxcmcli import Cxcmcli as cxcmcli
from app.models.view_cxcmcli import View_cxcmcli as view_cxcmcli
from app.models.cxpmprov import cxpmprov


@bp.route("/crearSolicitudDeIngreso", methods=["POST"])
@cross_origin()
@jwt_required()
def crearSolicitudDeIngreso():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = claims["user"]

    data = request.get_json()
    dataCodigoSolicitud = data["codigoSolicitud"]
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    db.session = get_session(clicianonBD)

    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    date_con_hora_cero = fecha_con_hora_cero.strftime("%Y-%m-%d %H:%M:%S")

    # Obtener la fecha con formato de 1900-01-01 y la hora actual
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)
    date_con_fecha_1900 = fecha_formato_1900.strftime("%Y-%m-%d %H:%M:%S")

    fechaFormatoImpresion = fecha_con_hora_cero.strftime("%d/%B/%Y")
    horaFormatoImpresion = fecha_formato_1900.strftime("%H:%M:%S")

    fechaLlegada = datetime.strptime(data["sgafecllegada"][:-1], "%Y-%m-%dT%H:%M:%S.%f")

    # correción del desplazamiento de la hora 04:56
    horaLlegada = datetime.strptime(data["sgahorllegada"][:-1], "%Y-%m-%dT%H:%M:%S.%f")
    desplazamiento_correccion = timedelta(hours=4, minutes=56)
    horaLlegada = horaLlegada - desplazamiento_correccion
    fechaLlegada = fechaLlegada - desplazamiento_correccion
    fechaLlegadaFormato = fechaLlegada.strftime("%d/%B/%Y")
    horaLlegadaFormato = horaLlegada.strftime("%H:%M:%S")

    meses_en_espanol = {
        "January": "enero",
        "February": "febrero",
        "March": "marzo",
        "April": "abril",
        "May": "mayo",
        "June": "junio",
        "July": "julio",
        "August": "agosto",
        "September": "septiembre",
        "October": "octubre",
        "November": "noviembre",
        "December": "diciembre",
    }

    for mes_en, mes_es in meses_en_espanol.items():
        fechaFormatoImpresion = fechaFormatoImpresion.replace(mes_en, mes_es)
        fechaLlegadaFormato = fechaLlegadaFormato.replace(mes_en, mes_es)

    def getFechaFormateada(fechaISO):
        fecha = datetime.fromisoformat(fechaISO)
        fecha_con_hora_cero = fecha.replace(hour=0, minute=0, second=0, microsecond=0)
        date_con_hora_cero = fecha_con_hora_cero.strftime("%Y-%m-%d %H:%M:%S")
        return datetime.strptime(date_con_hora_cero, "%Y-%m-%d %H:%M:%S")

    def getHoraFormateada(fechaISO):
        fecha = datetime.fromisoformat(fechaISO)
        fecha_formato_1900 = datetime(1900, 1, 1, fecha.hour, fecha.minute, fecha.second)
        date_con_fecha_1900 = fecha_formato_1900.strftime("%Y-%m-%d %H:%M:%S")
        return datetime.strptime(date_con_fecha_1900, "%Y-%m-%d %H:%M:%S")

    try:
        # Comenzamos una transacción
        db.session.begin()
        articulosDetalle = []
        query_result = (
            db.session.query(inbsgamotivos.motdescripcion, inbsgamotivos.motcodigo)
            .filter(
                inbsgamotivos.ciacodigo == ciacodigo,
                inbsgamotivos.motdescripcion == data.get("motivo"),
            )
            .distinct()
            .first()
        )

        clicodigo_descripcion = db.session.query(cxcmcli.clicodigo, cxcmcli.ciacodigo, cxcmcli.clinombre).filter((cxcmcli.ciacodigo == ciacodigo) & (cxcmcli.clicodigo == data.get("clicodigo"))).first()

        procodigo_descripcion = ""

        if data.get("procodigo") != "":
            procodigo_descripcion = (
                db.session.query(cxpmprov.procodigo, cxpmprov.ciacodigo, cxpmprov.pronombre)
                .filter(
                    cxpmprov.ciacodigo == ciacodigo,
                    cxpmprov.procodigo == data.get("procodigo"),
                )
                .distinct()
                .first()
            )

            procodigo_descripcion = procodigo_descripcion.pronombre

        # Insertamos la solicitud de Ingreso con su cabecera
        incSgaSolIng_instance = incSgaSolIng(
            ciacodigo=ciacodigo,
            loccodigo=loccodigo,
            sgasoling=dataCodigoSolicitud,
            sgaorigen="SOLING",
            sgagenepor="WB",
            sgadescri=data.get("descripcion"),
            motcodigo=query_result.motcodigo,
            sgaususol=usrcodigo,
            sgaestsol=ipUser,
            sgafecsol=datetime.strptime(date_con_hora_cero, "%Y-%m-%d %H:%M:%S"),
            sgahorsol=datetime.strptime(date_con_fecha_1900, "%Y-%m-%d %H:%M:%S"),
            clicodigo=data.get("clicodigo"),
            procodigo=data.get("procodigo"),
            sgafecllegada=getFechaFormateada(fechaLlegada.isoformat()),
            sgahorllegada=getHoraFormateada(horaLlegada.isoformat()),
            sgastatus=data.get("sgastatus"),
            sgausumsys=usrcodigo,
            sgaestmsys=ipUser,
            sgacomenllegada=data.get("comenllegada"),
            sgafecmsys=datetime.strptime(date_con_hora_cero, "%Y-%m-%d %H:%M:%S"),
            sgahormsys=datetime.strptime(date_con_fecha_1900, "%Y-%m-%d %H:%M:%S"),
            sgaultfecrecep=datetime.strptime(date_con_hora_cero, "%Y-%m-%d %H:%M:%S"),
            sgaulthorrecep=datetime.strptime(date_con_fecha_1900, "%Y-%m-%d %H:%M:%S"),
        )
        db.session.add(incSgaSolIng_instance)
        numSecuencia = 1
        # Recorremos todas las preguntas para escribir la cabecera y detalle de las preguntas
        for articulo in data["articulos"]:
            print(articulo)
            print(ciacodigo)
            query_result_articulo = (
                db.session.query(view_inmart.ciacodigo, view_inmart.artcodigo, view_inmart.invcodigo)
                .filter(
                    view_inmart.ciacodigo == ciacodigo,
                    view_inmart.artcodigo == articulo["artcodigo"],
                )
                .distinct()
                .first()
            )

            # Cabecera de cada solicitud
            intSgaSolIng_instance = intSgaSolIng(
                ciacodigo=ciacodigo,
                loccodigo=loccodigo,
                sgasoling=dataCodigoSolicitud,
                sgaorigen="SOLING",
                sgagenepor="WB",
                invcodigo=query_result_articulo.invcodigo,
                artcodigo=articulo["artcodigo"],
                sgasecuen=numSecuencia,
                sgacansol=articulo["cantSolicitada"],
                sgacanrec=0,
                sgastatus=data.get("sgastatus"),
                sgausumsys=usrcodigo,
                sgaestmsys=ipUser,
                sgaususol=usrcodigo,
                sgaestsol=ipUser,
                sgafecsol=datetime.strptime(date_con_hora_cero, "%Y-%m-%d %H:%M:%S"),
                sgahorsol=datetime.strptime(date_con_fecha_1900, "%Y-%m-%d %H:%M:%S"),
                sgaultfecrecep=datetime.strptime(date_con_hora_cero, "%Y-%m-%d %H:%M:%S"),
                sgaulthorrecep=datetime.strptime(date_con_fecha_1900, "%Y-%m-%d %H:%M:%S"),
                sgafecmsys=datetime.strptime(date_con_hora_cero, "%Y-%m-%d %H:%M:%S"),
                sgahormsys=datetime.strptime(date_con_fecha_1900, "%Y-%m-%d %H:%M:%S"),
            )
            db.session.add(intSgaSolIng_instance)
            articulosDetalle.append(
                {
                    "artcodigo": articulo["artcodigo"],
                    "descripcion": articulo.get("artdescri"),
                    "cantidadSolicitada": articulo["cantSolicitada"],
                    "cantidadRecibida": 0,
                    "estado": data.get("sgastatus"),
                    "posicion": numSecuencia,
                }
            )
            numSecuencia = numSecuencia + 1
        _dptoanio = datetime.now().strftime("%Y")
        _doccodigo = "SI"
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

        secuenciaActualSolicitudIngreso = cgpdpto.dptonumsec
        nuevaSecuenciaActualSolicitudIngreso = secuenciaActualSolicitudIngreso + 1
        cgpdpto.dptonumsec = nuevaSecuenciaActualSolicitudIngreso

        # Confirmamos la transacción
        db.session.commit()

        solicitud = {
            "solicitudCodigo": dataCodigoSolicitud,
            "motivo": data.get("motivo"),
            "descripcion": data.get("descripcion"),
            "cliente": clicodigo_descripcion.clinombre,
            "proveedor": procodigo_descripcion,
            "fechaLlegada": fechaLlegadaFormato,
            "horaLlegada": horaLlegadaFormato,
            "comentarioLlegada": data.get("comenllegada"),
            "articulos": articulosDetalle,
            "fechaEmision": fechaFormatoImpresion,
            "horaEmision": horaFormatoImpresion,
            "usuarioEmision": usrcodigo,
        }
        return jsonify({"data": solicitud}), 200
    except Exception as e:
        # En caso de error, deshacemos la transacción
        print(e)
        import traceback

        traceback.print_exc()
        db.session.rollback()
        return f"Error en la transacción: {e}", 500
    finally:
        # Cerramos la conexión a la base de datos
        db.session.close()
