from flask import jsonify, request
from app.FacturaDesdeArticulos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from app.utils.calcular_metricas_productos import calcular_metricas_productos
from datetime import datetime
from error_handling import api_endpoint, ValidationError, validate_required, NotFoundError, APIError


@bp.route("/editarProforma", methods=["POST"])
@jwt_required()
@api_endpoint
def editarProforma():
    """Actualizar una proforma existente"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = claims["user"]

    data = request.get_json()

    pednumped = data.get("pednumped")  # Código de proforma a editar
    cliente = data.get("cliente", {})
    productos = data.get("productos", [])
    formaPago = data.get("formaPago", "")
    vendedor = data.get("vendedor", {})
    observacion = data.get("observacion", "")

    if not pednumped:
        raise ValidationError("Código de proforma requerido")

    if not productos:
        raise ValidationError("No hay productos en la proforma")

    # Obtener la sesión
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Fechas para auditoría
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    with engine.connect() as connection:
        with connection.begin():
            # 1. Verificar que la proforma exista y esté pendiente
            query_verificar = """
                SELECT pedstatus, pednumped
                FROM facped
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND pednumped = :pednumped
            """

            proforma_existente = connection.execute(text(query_verificar), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "pednumped": pednumped}).mappings().first()

            if not proforma_existente:
                raise NotFoundError(f"Proforma {pednumped} no encontrada")

            if proforma_existente["pedstatus"] != "P":
                raise ValidationError("Solo se pueden editar proformas pendientes")

            # 2. Calcular métricas de productos
            productos_para_calculo = []
            for producto in productos:
                productos_para_calculo.append({"cantidad": str(producto.get("cantidadPedido")), "precioUnitario": str(producto.get("precioUnitario")), "porcentajeIva": str(producto.get("ivaPorcentaje")), "porcentajeDescuento": str(producto.get("descuentoPorcentaje"))})

            config_claves = {"cantidad": "cantidad", "precioUnitario": "precioUnitario", "porcentajeIva": "porcentajeIva", "porcentajeDescuento": "porcentajeDescuento"}

            productos_calculados, calculos_totales = calcular_metricas_productos(productos=productos_para_calculo, config_claves=config_claves)

            # 3. Obtener información necesaria
            query_cliente = """
               SELECT
                    zoncodigo, tipcodigo, regcodigo, ciucodigo, procodigo
                FROM cxcmcli
                WHERE cxcmcli.ciacodigo = :ciacodigo
                AND cxcmcli.clicodigo = :clicodigo
            """
            cliente_info = connection.execute(text(query_cliente), {"ciacodigo": ciacodigo, "clicodigo": cliente.get("clicodigo")}).mappings().first()

            query_formapago = """
                SELECT factippag, fordescri, fordias, fortipo, forcuotas,
                       foraprocredito, foranticipo, forintmen, foraplianti,
                       foraplirango, formondesde, formonhasta, forapligrac,
                       fordiasgrac, forcuoinigr, forpromocion, fordescuento,
                       foraprologistica, foraprocliente
                FROM cxcbformapag
                WHERE ciacodigo = :ciacodigo AND factippag = :factippag
            """
            formapago_info = connection.execute(text(query_formapago), {"ciacodigo": ciacodigo, "factippag": formaPago}).mappings().first()

            query_sysIVA = """
                SELECT sysiva FROM siacsys
            """
            globalIVA = connection.execute(text(query_sysIVA)).mappings().first()
            globalIVA = int(globalIVA["sysiva"]) if globalIVA else 12

            # 4. ACTUALIZAR cabecera en facped
            sql_update_cabecera = """
                UPDATE facped SET
                    factippag = :factippag,
                    clicodigo = :clicodigo,
                    garcodigo = :garcodigo,
                    peddirent = :peddirent,
                    pedfecemi = :pedfecemi,
                    pedfecven = :pedfecven,
                    pedtivacer = :pedtivacer,
                    pedtivapor = :pedtivapor,
                    pedsubtot = :pedsubtot,
                    pediva = :pediva,
                    pedtotal = :pedtotal,
                    peddetalle = :peddetalle,
                    pedfecmsys = :pedfecmsys,
                    pedhormsys = :pedhormsys,
                    pedusumsys = :pedusumsys,
                    pedestmsys = :pedestmsys,
                    vencodigo = :vencodigo,
                    zoncodigo = :zoncodigo,
                    peddesdirecto = :peddesdirecto,
                    tipcodigo = :tipcodigo,
                    pedporiva = :pedporiva,
                    pedapliiva = :pedapliiva,
                    foraprocredito = :foraprocredito,
                    foraprologistica = :foraprologistica,
                    foraprocliente = :foraprocliente,
                    forpromocion = :forpromocion,
                    fordescuento = :fordescuento,
                    regcodigo = :regcodigo,
                    ciucodigo = :ciucodigo,
                    procodigo = :procodigo,
                    forintmen = :forintmen,
                    fordias = :fordias,
                    fortipo = :fortipo,
                    forcuotas = :forcuotas,
                    foraplianti = :foraplianti,
                    foranticipo = :foranticipo,
                    foraplirango = :foraplirango,
                    formondesde = :formondesde,
                    formonhasta = :formonhasta,
                    forapligrac = :forapligrac,
                    fordiasgrac = :fordiasgrac,
                    forcuoinigr = :forcuoinigr
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND pednumped = :pednumped
            """

            params_update = {
                "ciacodigo": ciacodigo,
                "loccodigo": loccodigo,
                "pednumped": pednumped,
                "factippag": formaPago,
                "clicodigo": cliente.get("clicodigo"),
                "garcodigo": cliente.get("clicodigo"),
                "peddirent": cliente.get("clidirec", ""),
                "pedfecemi": fecha_con_hora_cero,
                "pedfecven": fecha_con_hora_cero,
                "pedtivacer": calculos_totales["totalBaseSinIvaYDescuento"],
                "pedtivapor": calculos_totales["totalBaseConIvaYDescuento"],
                "pedsubtot": calculos_totales["subtotalBrutoTotalConDescuento"],
                "pediva": calculos_totales["ivaTotalGeneralConDescuento"],
                "pedtotal": calculos_totales["totalNeto"],
                "peddetalle": observacion,
                "pedfecmsys": fecha_con_hora_cero,
                "pedhormsys": fecha_formato_1900,
                "pedusumsys": usrcodigo,
                "pedestmsys": ipUser,
                "vencodigo": vendedor.get("vencodigo", ""),
                "zoncodigo": cliente_info["zoncodigo"] if cliente_info else "",
                "peddesdirecto": calculos_totales["descuentoTotalGeneral"],
                "tipcodigo": cliente_info["tipcodigo"] if cliente_info else "",
                "pedporiva": globalIVA,
                "pedapliiva": calculos_totales["existeAlgunArticuloConIva"],
                "foraprocredito": formapago_info["foraprocredito"] if formapago_info else 0,
                "foraprologistica": formapago_info["foraprologistica"] if formapago_info else 0,
                "foraprocliente": formapago_info["foraprocliente"] if formapago_info else 0,
                "forpromocion": formapago_info["forpromocion"] if formapago_info else 0,
                "fordescuento": formapago_info["fordescuento"] if formapago_info else 0,
                "regcodigo": cliente_info["regcodigo"] if cliente_info else "",
                "ciucodigo": cliente_info["ciucodigo"] if cliente_info else "",
                "procodigo": cliente_info["procodigo"] if cliente_info else "",
                "forintmen": formapago_info["forintmen"] if formapago_info else 0,
                "fordias": formapago_info["fordias"] if formapago_info else 0,
                "fortipo": formapago_info["fortipo"] if formapago_info else "",
                "forcuotas": formapago_info["forcuotas"] if formapago_info else 0,
                "foraplianti": formapago_info["foraplianti"] if formapago_info else 0,
                "foranticipo": formapago_info["foranticipo"] if formapago_info else 0,
                "foraplirango": formapago_info["foraplirango"] if formapago_info else 0,
                "formondesde": formapago_info["formondesde"] if formapago_info else 0,
                "formonhasta": formapago_info["formonhasta"] if formapago_info else 0,
                "forapligrac": formapago_info["forapligrac"] if formapago_info else 0,
                "fordiasgrac": formapago_info["fordiasgrac"] if formapago_info else 0,
                "forcuoinigr": formapago_info["forcuoinigr"] if formapago_info else 0,
            }

            connection.execute(text(sql_update_cabecera), params_update)

            # 5. ELIMINAR detalles existentes
            sql_delete_detalles = """
                DELETE FROM fatped
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND pednumped = :pednumped
            """

            connection.execute(text(sql_delete_detalles), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "pednumped": pednumped})

            # 6. INSERTAR nuevos detalles
            sql_insert_detalle = """
                INSERT INTO fatped (
                    ciacodigo, pednumped, loccodigo, pedsecuen, pedtipo, pedapliiva,
                    factippag, moncodigo, pedcambio, pedfecemi, clicodigo, cliprecio,
                    pedstatus, bodcodigo, invcodigo, artcodigo, precodigo, lincodigo,
                    vencodigo, zoncodigo, pedcantidad, pedcosto, pedcostodol, pedpreven,
                    pedvaldesglo, pedvaldesc, pedvalrec, pediva, pedvaliva, pedvalor,
                    pedvaltot, pedfecisys, pedhorisys, pedusuisys, pedestisys,
                    pedfecmsys, pedhormsys, pedusumsys, pedestmsys, tipcodigo,
                    pedpordesc, pedusudesc, artaplipro, pedvalinter, medcodigo,
                    marcodigo, artpeso, artserie, artservicio, artexpins, artfaccero,
                    integracodigo, proyectocodigo, pedcantfacturado, pedpordescori,
                    pedprecioori, prosecuen, artdescri, pedfecposent
                ) VALUES (
                    :ciacodigo, :pednumped, :loccodigo, :pedsecuen, :pedtipo, :pedapliiva,
                    :factippag, :moncodigo, :pedcambio, :pedfecemi, :clicodigo, :cliprecio,
                    :pedstatus, :bodcodigo, :invcodigo, :artcodigo, :precodigo, :lincodigo,
                    :vencodigo, :zoncodigo, :pedcantidad, :pedcosto, :pedcostodol, :pedpreven,
                    :pedvaldesglo, :pedvaldesc, :pedvalrec, :pediva, :pedvaliva, :pedvalor,
                    :pedvaltot, :pedfecisys, :pedhorisys, :pedusuisys, :pedestisys,
                    :pedfecmsys, :pedhormsys, :pedusumsys, :pedestmsys, :tipcodigo,
                    :pedpordesc, :pedusudesc, :artaplipro, :pedvalinter, :medcodigo,
                    :marcodigo, :artpeso, :artserie, :artservicio, :artexpins, :artfaccero,
                    :integracodigo, :proyectocodigo, :pedcantfacturado, :pedpordescori,
                    :pedprecioori, :prosecuen, :artdescri, :pedfecposent
                )
            """

            for i, producto in enumerate(productos):
                producto_calculado = productos_calculados[i] if i < len(productos_calculados) else {}

                query_producto = """
                    SELECT
                        im.invcodigo, im.artdescri, im.precodigo, im.lincodigo,
                        im.medcodigo, im.marcodigo, im.artpeso, im.artserie,
                        im.artservicio, im.artexpins, im.artfaccero,
                        im.artcostoinicial, im.artcostoactdol, im.artprecventa1
                    FROM inmart im
                    WHERE im.ciacodigo = :ciacodigo AND im.artcodigo = :artcodigo
                """

                producto_info = connection.execute(text(query_producto), {"ciacodigo": ciacodigo, "artcodigo": producto.get("artcodigo")}).mappings().first()

                params_detalle = {
                    "ciacodigo": ciacodigo,
                    "pednumped": pednumped,
                    "loccodigo": loccodigo,
                    "pedsecuen": i + 1,
                    "pedtipo": "PE",
                    "pedapliiva": producto.get("artapliiva"),
                    "factippag": formaPago,
                    "moncodigo": "D",
                    "pedcambio": 0,
                    "pedfecemi": fecha_con_hora_cero,
                    "clicodigo": cliente.get("clicodigo"),
                    "cliprecio": 1,
                    "pedstatus": "C",
                    "bodcodigo": "",
                    "invcodigo": producto_info["invcodigo"] if producto_info else "",
                    "artcodigo": producto.get("artcodigo"),
                    "precodigo": producto_info["precodigo"] if producto_info else "",
                    "lincodigo": producto_info["lincodigo"] if producto_info else "",
                    "vencodigo": vendedor.get("vencodigo", ""),
                    "zoncodigo": cliente_info["zoncodigo"] if cliente_info else "",
                    "pedcantidad": producto.get("cantidadPedido"),
                    "pedcosto": producto_info["artcostoinicial"] if producto_info else 0,
                    "pedcostodol": producto_info["artcostoactdol"] if producto_info else 0,
                    "pedpreven": producto.get("precioUnitario"),
                    "pedvaldesglo": 0,
                    "pedvaldesc": producto_calculado.get("pedDescuentoTotal"),
                    "pedvalrec": 0,
                    "pediva": producto.get("ivaPorcentaje"),
                    "pedvaliva": producto_calculado.get("pedIvaTotal"),
                    "pedvalor": producto_calculado.get("pedPrecioTotalSinAjustes"),
                    "pedvaltot": producto_calculado.get("pedPrecioTotalConAjustes"),
                    "pedfecisys": fecha_con_hora_cero,
                    "pedhorisys": fecha_formato_1900,
                    "pedusuisys": usrcodigo,
                    "pedestisys": ipUser,
                    "pedfecmsys": fecha_con_hora_cero,
                    "pedhormsys": fecha_formato_1900,
                    "pedusumsys": usrcodigo,
                    "pedestmsys": ipUser,
                    "tipcodigo": cliente_info["tipcodigo"] if cliente_info else "",
                    "pedpordesc": producto.get("descuentoPorcentaje"),
                    "pedusudesc": usrcodigo if producto.get("descuentoPorcentaje") else "",
                    "artaplipro": 0,
                    "pedvalinter": 0,
                    "medcodigo": producto_info["medcodigo"] if producto_info else "",
                    "marcodigo": producto_info["marcodigo"] if producto_info else "",
                    "artpeso": producto_info["artpeso"] if producto_info else 0,
                    "artserie": producto_info["artserie"] if producto_info else "",
                    "artservicio": producto_info["artservicio"] if producto_info else "",
                    "artexpins": producto_info["artexpins"] if producto_info else "",
                    "artfaccero": producto_info["artfaccero"] if producto_info else "",
                    "integracodigo": "000",
                    "proyectocodigo": "000",
                    "pedcantfacturado": 0,
                    "pedpordescori": producto.get("descuentoPorcentaje"),
                    "pedprecioori": producto_info["artprecventa1"] if producto_info else 0,
                    "prosecuen": 1,
                    "artdescri": producto.get("artdescri"),
                    "pedfecposent": fecha_con_hora_cero,
                }

                connection.execute(text(sql_insert_detalle), params_detalle)

            return {"success": True, "message": "Proforma actualizada exitosamente", "pednumped": pednumped, "total": calculos_totales.get("totalNeto", 0), "productos": len(productos)}
