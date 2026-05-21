from flask import jsonify, request
from app.FacturaDesdeArticulos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from app.utils.calcular_metricas_productos import calcular_metricas_productos
from datetime import datetime
from error_handling import api_endpoint, ValidationError, validate_required, NotFoundError, APIError


@bp.route("/guardarPedido", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def guardarPedido():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = claims["user"]

    data = request.get_json()

    cliente = data.get("cliente", {})
    productos = data.get("productos", [])
    formaPago = data.get("formaPago", "")
    vendedor = data.get("vendedor", {})
    observacion = data.get("observacion", "")

    moncodigo = "D"  # Valor constante siempre 'D'

    # Obtener la fecha actual
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Validaciones básicas
    if not productos:
        return jsonify({"error": "No hay productos en el pedido"}), 400

    if not cliente.get("clicodigo"):
        return jsonify({"error": "Cliente no seleccionado"}), 400

    # Obtener la sesión y el engine
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 1. Preparar productos para calcular_metricas_productos
            productos_para_calculo = []
            for producto in productos:
                productos_para_calculo.append({"cantidad": str(producto.get("cantidadPedido")), "precioUnitario": str(producto.get("precioUnitario")), "porcentajeIva": str(producto.get("ivaPorcentaje")), "porcentajeDescuento": str(producto.get("descuentoPorcentaje"))})

            # 2. Configuración para calcular_metricas_productos
            config_claves = {"cantidad": "cantidad", "precioUnitario": "precioUnitario", "porcentajeIva": "porcentajeIva", "porcentajeDescuento": "porcentajeDescuento"}

            # 3. Calcular métricas
            productos_calculados, calculos_totales = calcular_metricas_productos(productos=productos_para_calculo, config_claves=config_claves)

            # 4. Generar secuencia del pedido
            locservidor_query = """
            SELECT locservidor
            FROM siacser
            WHERE serstatus = 'A'
            """
            locservidor_result = connection.execute(text(locservidor_query)).mappings().fetchone()
            locservidor = locservidor_result["locservidor"]

            year = datetime.now().strftime("%y")
            _dptoanio = datetime.now().strftime("%Y")
            _doccodigo = "PRO"

            # Obtener y actualizar secuencia
            cgpdpto_query = """
            SELECT dptonumsec
            FROM cgpdpto
            WHERE ciacodigo = :ciacodigo
            AND loccodigo = :loccodigo
            AND dptoanio = :dptoanio
            AND doccodigo = :doccodigo
            """
            cgpdpto_result = (
                connection.execute(
                    text(cgpdpto_query),
                    {
                        "ciacodigo": ciacodigo,
                        "loccodigo": loccodigo,
                        "dptoanio": _dptoanio,
                        "doccodigo": _doccodigo,
                    },
                )
                .mappings()
                .fetchone()
            )
            if not cgpdpto_result:
                raise APIError("No se ha configurado en el sistema la secuencia PRO")

            secuenciaActualPedido = cgpdpto_result["dptonumsec"]
            nuevaSecuenciaActualPedido = secuenciaActualPedido + 1

            # Generar el código del Pedido
            pedidoCodigoGenerated = f"PR{locservidor}{year}{nuevaSecuenciaActualPedido:06}{loccodigo}"

            # Actualizar secuencia
            update_cgpdpto_query = """
            UPDATE cgpdpto
            SET dptonumsec = :nuevaSecuencia
            WHERE ciacodigo = :ciacodigo
            AND loccodigo = :loccodigo
            AND dptoanio = :dptoanio
            AND doccodigo = :doccodigo
            """
            connection.execute(
                text(update_cgpdpto_query),
                {
                    "nuevaSecuencia": nuevaSecuenciaActualPedido,
                    "ciacodigo": ciacodigo,
                    "loccodigo": loccodigo,
                    "dptoanio": _dptoanio,
                    "doccodigo": _doccodigo,
                },
            )

            # 5. Obtener información adicional necesaria
            # Obtener datos del cliente desde cxcmcli
            query_cliente = """
                SELECT zoncodigo, tipcodigo, regcodigo, ciucodigo, procodigo
                FROM cxcmcli
                WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
            """
            cliente_info = connection.execute(text(query_cliente), {"ciacodigo": ciacodigo, "clicodigo": cliente.get("clicodigo")}).mappings().first()

            if not cliente_info:
                raise APIError(f"No se encontró el cliente {cliente.get('clicodigo')}")

            # Obtener información de la forma de pago
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
                raise APIError(f"No se enontró informacioón de la forma de pago {formaPago}")

            # Obtener IVA global
            query_sysIVA = """
                SELECT sysiva
                FROM siacsys
            """
            globalIVA = connection.execute(text(query_sysIVA)).mappings().first()
            globalIVA = int(globalIVA["sysiva"])
            if globalIVA is None:
                raise APIError(f"No se encontró el IVA global para ciacodigo {ciacodigo}")

            # 6. Insertar cabecera en facped
            sql_insert_cabecera = """
                INSERT INTO facped (
                    ciacodigo, pednumped, loccodigo, facnumfac, pedtipo, factippag,
                    moncodigo, clicodigo, garcodigo, peddirent, pedcambio, pedfecemi,
                    pedfecven, pedtivacer, pedtivapor, pedsubtot, pediva, pedtotal,
                    pedstatus, peddetalle, pedfecisys, pedhorisys, pedusuisys,
                    pedestisys, pedfecmsys, pedhormsys, pedusumsys, pedestmsys,
                    vencodigo, zoncodigo, pedpordes, peddesglobal, peddesdirecto,
                    pedrecargo, tipcodigo, pedporrec, pedporiva, pedapliiva,
                    integracodigo, proyectocodigo, foraprocredito, foraprologistica,
                    foraprocliente, forpromocion, fordescuento, regcodigo, ciucodigo,
                    procodigo, pedcierre, prosecuen, pedvallincre, pedwip,
                    pedforent, pedvalantici, forintmen, pedvalinter, fordias,
                    fortipo, forcuotas, foraplianti, foranticipo, foraplirango,
                    formondesde, formonhasta, forapligrac, fordiasgrac, forcuoinigr,
                    pednumadi, pedvaladi, pedconser, pedvehi, pedsolsinstock,
                    pedsinstock, pedproyecto, pedaprocredito, pedaprologistica,
                    pedaprocliente
                ) VALUES (
                    :ciacodigo, :pednumped, :loccodigo, NULL, :pedtipo, :factippag,
                    :moncodigo, :clicodigo, :garcodigo, :peddirent, :pedcambio, :pedfecemi,
                    :pedfecven, :pedtivacer, :pedtivapor, :pedsubtot, :pediva, :pedtotal,
                    :pedstatus, :peddetalle, :pedfecisys, :pedhorisys, :pedusuisys,
                    :pedestisys, :pedfecmsys, :pedhormsys, :pedusumsys, :pedestmsys,
                    :vencodigo, :zoncodigo, :pedpordes, :peddesglobal, :peddesdirecto,
                    :pedrecargo, :tipcodigo, :pedporrec, :pedporiva, :pedapliiva,
                    :integracodigo, :proyectocodigo, :foraprocredito, :foraprologistica,
                    :foraprocliente, :forpromocion, :fordescuento, :regcodigo, :ciucodigo,
                    :procodigo, :pedcierre, :prosecuen, :pedvallincre, :pedwip,
                    :pedforent, :pedvalantici, :forintmen, :pedvalinter, :fordias,
                    :fortipo, :forcuotas, :foraplianti, :foranticipo, :foraplirango,
                    :formondesde, :formonhasta, :forapligrac, :fordiasgrac, :forcuoinigr,
                    :pednumadi, :pedvaladi, :pedconser, :pedvehi, :pedsolsinstock,
                    :pedsinstock, :pedproyecto, :pedaprocredito, :pedaprologistica,
                    :pedaprocliente
                )
            """

            params_cabecera = {
                "ciacodigo": ciacodigo,
                "pednumped": pedidoCodigoGenerated,
                "loccodigo": loccodigo,
                "pedtipo": "PE",
                "factippag": formaPago,
                "moncodigo": moncodigo,
                "clicodigo": cliente.get("clicodigo"),
                "garcodigo": cliente.get("clicodigo"),  # Garante es el mismo cliente
                "peddirent": cliente.get("clidirec", ""),
                "pedcambio": 0,
                "pedfecemi": fecha_con_hora_cero,
                "pedfecven": fecha_con_hora_cero,  # Fecha de vencimiento misma que fecha de emisión
                "pedtivacer": calculos_totales["totalBaseSinIvaYDescuento"],
                "pedtivapor": calculos_totales["totalBaseConIvaYDescuento"],
                "pedsubtot": calculos_totales["subtotalBrutoTotalConDescuento"],
                "pediva": calculos_totales["ivaTotalGeneralConDescuento"],
                "pedtotal": calculos_totales["totalNeto"],
                "pedstatus": "P",  # TODO: NOS E QUE VALOR ES
                "peddetalle": observacion,
                "pedfecisys": fecha_con_hora_cero,
                "pedhorisys": fecha_formato_1900,
                "pedusuisys": usrcodigo,
                "pedestisys": ipUser,
                "pedfecmsys": fecha_con_hora_cero,
                "pedhormsys": fecha_formato_1900,
                "pedusumsys": usrcodigo,
                "pedestmsys": ipUser,
                "vencodigo": vendedor.get("vencodigo", ""),
                "zoncodigo": cliente_info["zoncodigo"],
                "pedpordes": 0,  # Descuento porcentual global
                "peddesglobal": 0,  # Descuento global en valor
                "peddesdirecto": calculos_totales["descuentoTotalGeneral"],
                "pedrecargo": 0,  # Recargo
                "tipcodigo": cliente_info["tipcodigo"],
                "pedporrec": 0,  # Porcentaje de recargo
                "pedporiva": globalIVA,  # IVA global del sistema
                "pedapliiva": calculos_totales["existeAlgunArticuloConIva"],
                "integracodigo": "000",  # TODO: Configurar según necesidad
                "proyectocodigo": "000",  # TODO: Configurar según necesidad
                "foraprocredito": formapago_info["foraprocredito"],
                "foraprologistica": formapago_info["foraprologistica"],
                "foraprocliente": formapago_info["foraprocliente"],
                "forpromocion": formapago_info["forpromocion"],
                "fordescuento": formapago_info["fordescuento"],
                "regcodigo": cliente_info["regcodigo"],
                "ciucodigo": cliente_info["ciucodigo"],
                "procodigo": cliente_info["procodigo"],
                "pedcierre": 0,
                "prosecuen": 1,
                "pedvallincre": 0,
                "pedwip": "WB",  # Para saber ques esta proforma se hizo en siac web
                "pedforent": "D",
                "pedvalantici": 0,
                "forintmen": formapago_info["forintmen"] if formapago_info else 0,
                "pedvalinter": 0,
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
                "pednumadi": 0,
                "pedvaladi": 0,
                "pedconser": 0,
                "pedvehi": 0,
                "pedsolsinstock": 0,
                "pedsinstock": 0,
                "pedproyecto": 0,
                "pedaprocredito": 0,
                "pedaprologistica": 0,
                "pedaprocliente": 0,
            }

            connection.execute(text(sql_insert_cabecera), params_cabecera)

            # 7. Insertar detalles en fatped
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
                # Obtener el producto calculado correspondiente
                producto_calculado = productos_calculados[i] if i < len(productos_calculados) else {}

                # Obtener información completa del producto
                query_producto = """
                    SELECT
                        im.invcodigo,
                        im.artdescri,
                        im.precodigo,
                        im.lincodigo,
                        im.medcodigo,
                        im.marcodigo,
                        im.artpeso,
                        im.artserie,
                        im.artservicio,
                        im.artexpins,
                        im.artfaccero,
                        im.artcostoinicial,
                        im.artcostoactdol,
                        im.artprecventa1
                    FROM inmart im
                    WHERE im.ciacodigo = :ciacodigo
                    AND im.artcodigo = :artcodigo
                """

                producto_info = connection.execute(text(query_producto), {"ciacodigo": ciacodigo, "artcodigo": producto.get("artcodigo")}).mappings().first()

                if not producto_info:
                    raise APIError(f"No se encontró el producto {producto.get('artcodigo')}")

                params_detalle = {
                    "ciacodigo": ciacodigo,
                    "pednumped": pedidoCodigoGenerated,
                    "loccodigo": loccodigo,
                    "pedsecuen": i + 1,
                    "pedtipo": "PE",
                    "pedapliiva": producto.get("artapliiva"),
                    "factippag": formaPago,
                    "moncodigo": moncodigo,
                    "pedcambio": 0,
                    "pedfecemi": fecha_con_hora_cero,
                    "clicodigo": cliente.get("clicodigo"),
                    "cliprecio": 1,
                    "pedstatus": "C",
                    "bodcodigo": "",  # Esto producto no tiene bodega ya que siempre es un servicio de dsoft, esto fue un requerimiento
                    "invcodigo": producto_info["invcodigo"],
                    "artcodigo": producto.get("artcodigo"),
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

            return {"success": True, "message": "Pedido guardado exitosamente", "pednumped": pedidoCodigoGenerated, "total": calculos_totales.get("totalNeto", 0), "productos": len(productos)}
