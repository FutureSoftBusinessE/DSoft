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

    pednumped = data.get("pednumped")
    cliente = data.get("cliente", {})
    productos = data.get("productos", [])
    formaPago = data.get("formaPago", "")
    vendedor = data.get("vendedor", {})
    observacion = data.get("observacion", "")
    cjacodigo = data.get("cjacodigo")
    info_adicional = data.get("infoAdicional", [])

    if not pednumped:
        raise ValidationError("Código de proforma requerido")

    if not productos:
        raise ValidationError("No hay productos en la proforma")

    if not cjacodigo:
        raise ValidationError("Caja SRI no seleccionada")

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
                SELECT zoncodigo, tipcodigo, regcodigo, ciucodigo, procodigo
                FROM cxcmcli
                WHERE ciacodigo = :ciacodigo
                AND clicodigo = :clicodigo
            """
            cliente_info = connection.execute(text(query_cliente), {"ciacodigo": ciacodigo, "clicodigo": cliente.get("clicodigo")}).mappings().first()

            if not cliente_info:
                raise NotFoundError(f"Cliente {cliente.get('clicodigo')} no encontrado")

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

            if not formapago_info:
                raise NotFoundError(f"Forma de pago {formaPago} no encontrada")

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
                    forcuoinigr = :forcuoinigr,
                    cjacodigo = :cjacodigo
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND pednumped = :pednumped
            """

            params_update = {
                "ciacodigo": ciacodigo,
                "loccodigo": loccodigo,
                "pednumped": pednumped,
                "cjacodigo": cjacodigo,
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
                "zoncodigo": cliente_info["zoncodigo"],
                "peddesdirecto": calculos_totales["descuentoTotalGeneral"],
                "tipcodigo": cliente_info["tipcodigo"],
                "pedporiva": globalIVA,
                "pedapliiva": calculos_totales["existeAlgunArticuloConIva"],
                "foraprocredito": formapago_info["foraprocredito"],
                "foraprologistica": formapago_info["foraprologistica"],
                "foraprocliente": formapago_info["foraprocliente"],
                "forpromocion": formapago_info["forpromocion"],
                "fordescuento": formapago_info["fordescuento"],
                "regcodigo": cliente_info["regcodigo"],
                "ciucodigo": cliente_info["ciucodigo"],
                "procodigo": cliente_info["procodigo"],
                "forintmen": formapago_info["forintmen"],
                "fordias": formapago_info["fordias"],
                "fortipo": formapago_info["fortipo"],
                "forcuotas": formapago_info["forcuotas"],
                "foraplianti": formapago_info["foraplianti"],
                "foranticipo": formapago_info["foranticipo"],
                "foraplirango": formapago_info["foraplirango"],
                "formondesde": formapago_info["formondesde"],
                "formonhasta": formapago_info["formonhasta"],
                "forapligrac": formapago_info["forapligrac"],
                "fordiasgrac": formapago_info["fordiasgrac"],
                "forcuoinigr": formapago_info["forcuoinigr"],
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
                    pedprecioori, prosecuen, artdescri, pedfecposent, peddetalleadicional
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
                    :pedprecioori, :prosecuen, :artdescri, :pedfecposent, :peddetalleadicional
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

                if not producto_info:
                    raise NotFoundError(f"Producto {producto.get('artcodigo')} no encontrado")

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
                    "invcodigo": producto_info["invcodigo"],
                    "artcodigo": producto.get("artcodigo"),
                    "peddetalleadicional": producto.get("peddetalleadicional", ""),
                    "precodigo": producto_info["precodigo"],
                    "lincodigo": producto_info["lincodigo"],
                    "vencodigo": vendedor.get("vencodigo", ""),
                    "zoncodigo": cliente_info["zoncodigo"],
                    "pedcantidad": producto.get("cantidadPedido"),
                    "pedcosto": producto_info["artcostoinicial"],
                    "pedcostodol": producto_info["artcostoactdol"],
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
                    "tipcodigo": cliente_info["tipcodigo"],
                    "pedpordesc": producto.get("descuentoPorcentaje"),
                    "pedusudesc": usrcodigo if producto.get("descuentoPorcentaje") else "",
                    "artaplipro": 0,
                    "pedvalinter": 0,
                    "medcodigo": producto_info["medcodigo"],
                    "marcodigo": producto_info["marcodigo"],
                    "artpeso": producto_info["artpeso"],
                    "artserie": producto_info["artserie"],
                    "artservicio": producto_info["artservicio"],
                    "artexpins": producto_info["artexpins"],
                    "artfaccero": producto_info["artfaccero"],
                    "integracodigo": "000",
                    "proyectocodigo": "000",
                    "pedcantfacturado": 0,
                    "pedpordescori": producto.get("descuentoPorcentaje"),
                    "pedprecioori": producto_info["artprecventa1"],
                    "prosecuen": 1,
                    "artdescri": producto.get("artdescri"),
                    "pedfecposent": fecha_con_hora_cero,
                }

                connection.execute(text(sql_insert_detalle), params_detalle)

            # 7. ELIMINAR info adicional existente
            sql_delete_info = """
                DELETE FROM pedinfoadicional
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND pednumped = :pednumped
            """

            connection.execute(text(sql_delete_info), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "pednumped": pednumped})

            # 8. INSERTAR nueva info adicional
            for info in info_adicional:
                connection.execute(
                    text(
                        """
                        INSERT INTO pedinfoadicional (
                            ciacodigo, loccodigo, pednumped, pedclave, pedvalor, pedorden,
                            pedfecisys, pedhorisys, pedusuisys, pedestisys
                        ) VALUES (
                            :ciacodigo, :loccodigo, :pednumped, :pedclave, :pedvalor, :pedorden,
                            :pedfecisys, :pedhorisys, :pedusuisys, :pedestisys
                        )
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "loccodigo": loccodigo,
                        "pednumped": pednumped,
                        "pedclave": info["pedclave"],
                        "pedvalor": info["pedvalor"],
                        "pedorden": info.get("pedorden", 1),
                        "pedfecisys": fecha_con_hora_cero,
                        "pedhorisys": fecha_formato_1900,
                        "pedusuisys": usrcodigo,
                        "pedestisys": ipUser,
                    },
                )

    return {"success": True, "message": "Proforma actualizada exitosamente", "pednumped": pednumped, "total": calculos_totales.get("totalNeto", 0), "productos": len(productos)}
