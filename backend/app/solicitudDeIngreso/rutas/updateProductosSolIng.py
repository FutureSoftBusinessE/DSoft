from flask import jsonify, request, make_response
from app.solicitudDeIngreso import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.incSgaSolIng import incSgaSolIng
from app.models.intSgaSolIng import intSgaSolIng
from app.models.Cgpdpto import Cgpdpto
from datetime import datetime
from app.models.inbsgamotivos import inbsgamotivos
from app.models.viewProductos import ViewProducto as view_inmart
from app.models.cxcmcli import Cxcmcli as cxcmcli
from app.models.view_cxcmcli import View_cxcmcli as view_cxcmcli
from app.models.cxpmprov import cxpmprov


@bp.route("/updateProductosSolIng", methods=["POST"])
@jwt_required()
def updateProductosSolIng():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = claims["user"]

    data = request.get_json()
    dataCodigoSolicitud = data["codigoSolicitud"]
    articulos = data["articulos"]
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

        for articulo in articulos:
            print(articulo)
            if articulo["prevNumSecuencia"] == 0:
                query_result_articulo = (
                    db.session.query(
                        view_inmart.ciacodigo,
                        view_inmart.artcodigo,
                        view_inmart.invcodigo,
                    )
                    .filter(
                        view_inmart.ciacodigo == ciacodigo,
                        view_inmart.artcodigo == articulo["artcodigo"],
                    )
                    .distinct()
                    .first()
                )

                # Creación de la cabecera de cada pregunta
                intSgaSolIng_instance = intSgaSolIng(
                    ciacodigo=ciacodigo,
                    loccodigo=loccodigo,
                    sgasoling=dataCodigoSolicitud,
                    sgaorigen="SOLING",
                    sgagenepor="WB",
                    invcodigo=query_result_articulo.invcodigo,
                    artcodigo=articulo["artcodigo"],
                    sgasecuen=articulo["numSecuencia"],
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
                        "descripcion": articulo["artdescri"],
                        "cantidadSolicitada": articulo["cantSolicitada"],
                        "cantidadRecibida": 0,
                        "estado": data.get("sgastatus"),
                        "posicion": articulo["numSecuencia"],
                    }
                )
            else:
                # Actualizar registro existente
                intSgaSolIng_instance = (
                    db.session.query(intSgaSolIng)
                    .filter(
                        intSgaSolIng.ciacodigo == ciacodigo,
                        intSgaSolIng.loccodigo == loccodigo,
                        intSgaSolIng.sgasoling == dataCodigoSolicitud,
                        intSgaSolIng.sgasecuen == articulo["prevNumSecuencia"],
                        intSgaSolIng.artcodigo == articulo["artcodigo"],
                    )
                    .first()
                )

                if intSgaSolIng_instance:
                    intSgaSolIng_instance.sgacansol = articulo["cantSolicitada"]
                    intSgaSolIng_instance.sgasecuen = articulo["numSecuencia"]
                    intSgaSolIng_instance.sgausumsys = usrcodigo
                    intSgaSolIng_instance.sgaestmsys = ipUser
                    intSgaSolIng_instance.sgafecmsys = datetime.strptime(date_con_fecha_1900, "%Y-%m-%d %H:%M:%S")
                    intSgaSolIng_instance.sgahormsys = datetime.strptime(date_con_hora_cero, "%Y-%m-%d %H:%M:%S")
                    db.session.add(intSgaSolIng_instance)

                    # Actualizar la descripción en incSgaSolIng
                    incSgaSolIng_instance = (
                        db.session.query(incSgaSolIng)
                        .filter(
                            incSgaSolIng.ciacodigo == ciacodigo,
                            incSgaSolIng.loccodigo == loccodigo,
                            incSgaSolIng.sgasoling == dataCodigoSolicitud,
                        )
                        .first()
                    )

                    if incSgaSolIng_instance:
                        incSgaSolIng_instance.sgadescri = data["descripcion"]
                        db.session.add(incSgaSolIng_instance)

                    articulosDetalle.append(
                        {
                            "artcodigo": articulo["artcodigo"],
                            "descripcion": articulo["artdescri"],
                            "cantidadSolicitada": articulo["cantSolicitada"],
                            "cantidadRecibida": intSgaSolIng_instance.sgacanrec,
                            "estado": articulo["estado"],
                            "posicion": intSgaSolIng_instance.sgasecuen,
                        }
                    )
                else:
                    return (
                        jsonify({"error": "No se encontró el registro para actualizar"}),
                        404,
                    )

        # Confirmamos la transacción
        db.session.commit()

        solicitud = {
            "solicitudCodigo": dataCodigoSolicitud,
            "motivo": data.get("motivo"),
            "descripcion": data.get("descripcion"),
            "cliente": data.get("clicodigo"),
            "proveedor": data.get("procodigo"),
            "fechaLlegada": data.get("sgafecllegada"),
            "horaLlegada": data.get("sgahorllegada"),
            "comentarioLlegada": data.get("comenllegada"),
            "articulos": articulosDetalle,
            "fechaEmision": fechaFormatoImpresion,
            "horaEmision": horaFormatoImpresion,
            "usuarioEmision": ipUser,
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
