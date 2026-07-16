from flask import request
from app.FacturaDesdeArticulosDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from app.utils.calcular_metricas_productos import calcular_metricas_productos
from datetime import datetime
from error_handling import api_endpoint, ValidationError, NotFoundError


@bp.route("/editarPedido", methods=["POST"])
@jwt_required()
@api_endpoint
def editarPedido():
    """Actualizar un pedido/proforma existente desde el módulo DF"""
    claims = get_jwt()

    # 1. Validación de seguridad y extracción de variables de sesión
    try:
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]
    except KeyError:
        raise ValidationError("Sesión inválida o incompleta. Faltan datos de la compañía o localidad.")

    usrcodigo = str(claims.get("user", "WEB"))[:10]
    ipUser = str(request.headers.get("X-Forwarded-For", request.remote_addr) or "WEB")[:50]

    data = request.get_json()

    # 2. Extracción del payload del frontend
    pednumped = data.get("pednumped")
    cliente = data.get("cliente", {})
    productos = data.get("productos", [])
    formaPago = data.get("formaPago", "")
    vendedor = data.get("vendedor", {})
    observacion = str(data.get("observacion", ""))[:200]
    cjacodigo = data.get("cjacodigo")
    info_adicional = data.get("infoAdicional", [])

    if not pednumped:
        raise ValidationError("El código del documento (pednumped) es requerido para la edición.")

    if not productos:
        raise ValidationError("No hay productos válidos en el documento para guardar.")

    if not cjacodigo:
        raise ValidationError("Caja SRI no seleccionada")

    # Obtener la sesión de base de datos
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Fechas estándar para auditoría en SIAC
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    with engine.connect() as connection:
        with connection.begin():
            # 3. Verificar que el pedido exista y esté pendiente (Status 'P')
            query_verificar = text(
                """
                SELECT pedstatus, pednumped
                FROM facped
                WHERE ciacodigo = :ciacodigo
                  AND loccodigo = :loccodigo
                  AND pednumped = :pednumped
            """
            )

            proforma_existente = connection.execute(query_verificar, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "pednumped": pednumped}).mappings().first()

            if not proforma_existente:
                raise NotFoundError(f"El documento {pednumped} no fue encontrado en la base de datos.")

            if proforma_existente["pedstatus"] != "P":
                raise ValidationError("Solo se pueden editar documentos que se encuentren en estado Pendiente (P).")

            # 4. Calcular métricas financieras de los productos
            productos_para_calculo = []
            for producto in productos:
                productos_para_calculo.append({"cantidad": str(producto.get("cantidadPedido", 1)), "precioUnitario": str(producto.get("precioUnitario", 0)), "porcentajeIva": str(producto.get("ivaPorcentaje", 0)), "porcentajeDescuento": str(producto.get("descuentoPorcentaje", 0))})

            config_claves = {"cantidad": "cantidad", "precioUnitario": "precioUnitario", "porcentajeIva": "porcentajeIva", "porcentajeDescuento": "porcentajeDescuento"}

            productos_calculados, calculos_totales = calcular_metricas_productos(productos=productos_para_calculo, config_claves=config_claves)

            # 5. Obtener metadatos auxiliares (Cliente, Forma de Pago, IVA Global)
            query_cliente = text(
                """
                SELECT zoncodigo, tipcodigo, regcodigo, ciucodigo, procodigo
                FROM cxcmcli
                WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
            """
            )
            cliente_info = connection.execute(query_cliente, {"ciacodigo": ciacodigo, "clicodigo": cliente.get("clicodigo")}).mappings().first()

            if not cliente_info:
                raise NotFoundError(f"Cliente {cliente.get('clicodigo')} no encontrado")

            query_formapago = text(
                """
                SELECT
                    factippag, fordescri, fordias, fortipo, forcuotas,
                    foraprocredito, foranticipo, forintmen, foraplianti,
                    foraplirango, formondesde, formonhasta, forapligrac,
                    fordiasgrac, forcuoinigr, forpromocion, fordescuento,
                    foraprologistica, foraprocliente
                FROM cxcbformapag
                WHERE ciacodigo = :ciacodigo AND factippag = :factippag
            """
            )
            formapago_info = connection.execute(query_formapago, {"ciacodigo": ciacodigo, "factippag": formaPago}).mappings().first()

            if not formapago_info:
                raise NotFoundError(f"Forma de pago {formaPago} no encontrada")

            query_sysIVA = text("SELECT sysiva FROM siacsys")
            globalIVA = connection.execute(query_sysIVA).mappings().first()
            globalIVA = int(globalIVA["sysiva"]) if globalIVA else 12

            # 6. ACTUALIZAR cabecera en facped
            sql_update_cabecera = text(
                """
                UPDATE facped SET
                    factippag = :factippag, clicodigo = :clicodigo, garcodigo = :garcodigo,
                    peddirent = :peddirent, pedfecemi = :pedfecemi, pedfecven = :pedfecven,
                    pedtivacer = :pedtivacer, pedtivapor = :pedtivapor, pedsubtot = :pedsubtot,
                    pediva = :pediva, pedtotal = :pedtotal, peddetalle = :peddetalle,
                    pedfecmsys = :pedfecmsys, pedhormsys = :pedhormsys, pedusumsys = :pedusumsys,
                    pedestmsys = :pedestmsys, vencodigo = :vencodigo, zoncodigo = :zoncodigo,
                    peddesdirecto = :peddesdirecto, tipcodigo = :tipcodigo, pedporiva = :pedporiva,
                    pedapliiva = :pedapliiva, foraprocredito = :foraprocredito,
                    foraprologistica = :foraprologistica, foraprocliente = :foraprocliente,
                    forpromocion = :forpromocion, fordescuento = :fordescuento, regcodigo = :regcodigo,
                    ciucodigo = :ciucodigo, procodigo = :procodigo, forintmen = :forintmen,
                    fordias = :fordias, fortipo = :fortipo, forcuotas = :forcuotas,
                    foraplianti = :foraplianti, foranticipo = :foranticipo, foraplirango = :foraplirango,
                    formondesde = :formondesde, formonhasta = :formonhasta, forapligrac = :forapligrac,
                    fordiasgrac = :fordiasgrac, forcuoinigr = :forcuoinigr, cjacodigo = :cjacodigo
                WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo AND pednumped = :pednumped
            """
            )

            params_update = {
                "ciacodigo": ciacodigo,
                "loccodigo": loccodigo,
                "pednumped": pednumped,
                "cjacodigo": cjacodigo,
                "factippag": formaPago,
                "clicodigo": cliente.get("clicodigo"),
                "garcodigo": cliente.get("clicodigo"),
                "peddirent": str(cliente.get("clidirec", ""))[:150],
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

            connection.execute(sql_update_cabecera, params_update)

            # 7. ELIMINAR detalles existentes (Limpieza antes de reinsertar)
            sql_delete_detalles = text(
                """
                DELETE FROM fatped
                WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo AND pednumped = :pednumped
            """
            )
            connection.execute(sql_delete_detalles, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "pednumped": pednumped})

            # 8. INSERTAR nuevos detalles
            sql_insert_detalle = text(
                """
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
            )

            for i, producto in enumerate(productos):
                producto_calculado = productos_calculados[i] if i < len(productos_calculados) else {}

                query_producto = text(
                    """
                    SELECT
                        invcodigo, artdescri, precodigo, lincodigo, medcodigo, marcodigo,
                        artpeso, artserie, artservicio, artexpins, artfaccero,
                        artcostoinicial, artcostoactdol, artprecventa1
                    FROM inmart
                    WHERE ciacodigo = :ciacodigo AND artcodigo = :artcodigo
                """
                )

                producto_info = connection.execute(query_producto, {"ciacodigo": ciacodigo, "artcodigo": producto.get("artcodigo")}).mappings().first()

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
                    "artcodigo": producto.get("artcodigo"),  # ✅ ESTA ES LA LÍNEA QUE FALTABA
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
                    "artdescri": str(producto.get("artdescri", ""))[:150],
                    "pedfecposent": fecha_con_hora_cero,
                    "peddetalleadicional": producto.get("peddetalleadicional", ""),
                }

                connection.execute(sql_insert_detalle, params_detalle)

            # 9. ELIMINAR info adicional existente
            sql_delete_info = text(
                """
                DELETE FROM pedinfoadicional
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND pednumped = :pednumped
            """
            )

            connection.execute(sql_delete_info, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "pednumped": pednumped})

            # 10. INSERTAR nueva info adicional
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
