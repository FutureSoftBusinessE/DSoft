from flask import jsonify, request
from app.FacturaDesdeArticulos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from app.utils.calcular_metricas_productos import calcular_metricas_productos
from datetime import datetime


@bp.route("/guardarPedido", methods=["POST"])
@cross_origin()
@jwt_required()
def guardarPedido():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = claims["user"]

    data = request.get_json()

    cliente = data.get("cliente", {})
    productos = data.get("productos", [])
    # formaPago = data.get("formaPago", "")
    vendedor = data.get("vendedor", {})
    observacion = data.get("observacion", "")

    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Obtener la fecha con formato de 1900-01-01 y la hora actual
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

    try:
        with engine.connect() as connection:
            with connection.begin():
                # 1. Preparar productos para calcular_metricas_productos
                productos_para_calculo = []
                for producto in productos:
                    productos_para_calculo.append({"cantidad": str(producto.get("cantidadPedido", 1)), "precioUnitario": str(producto.get("precioUnitario", 0)), "porcentajeIva": str(producto.get("ivaPorcentaje", 0)), "porcentajeDescuento": str(producto.get("descuentoPorcentaje", 0))})

                # 2. Configuración para calcular_metricas_productos
                config_claves = {"cantidad": "cantidad", "precioUnitario": "precioUnitario", "porcentajeIva": "porcentajeIva", "porcentajeDescuento": "porcentajeDescuento"}

                # 3. Calcular métricas
                productos_calculados, calculos_totales = calcular_metricas_productos(productos=productos_para_calculo, config_claves=config_claves)

                # 4) ----- --------ALGORITMO PARA GENERAR SECUENCIA PEDIDO ------------
                # Obtener el servidor actual
                locservidor_query = """
                SELECT locservidor
                FROM siacser
                WHERE serstatus = 'A'
                """
                locservidor_result = connection.execute(text(locservidor_query)).mappings().fetchone()
                locservidor = locservidor_result["locservidor"]

                year = datetime.now().strftime("%y")
                _dptoanio = datetime.now().strftime("%Y")
                _doccodigo = "PED"

                # Obtener el registro actual en cgpdpto filtrado por los parámetros
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
                    raise Exception("No se ha configurado en el sistema la secuencia PED")
                # Obtener y actualizar la secuencia actual
                secuenciaActualPedido = cgpdpto_result["dptonumsec"]
                nuevaSecuenciaActualPedido = secuenciaActualPedido + 1

                # Generar el código del Pedido concatenando los valores
                pedidoCodigoGenerated = f"PE{locservidor}{year}{nuevaSecuenciaActualPedido:06}{loccodigo}"

                # Auditar la nueva secuencia actualizando el valor en la base de datos
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

                # 5. Insertar cabecera en facpedweb
                sSql_cabecera = """
                    INSERT INTO facpedweb (
                        ciacodigo, pednumped, loccodigo, vencodigo, nickname,
                        pedfecemi, pedfecven, pedtivacer, pedtivapor, pedsubtot,
                        pedpordes, peddesglobal, peddesdirecto, pedporiva, pedapliiva,
                        pediva, pedtotal, pedstatus, pedfecisys, pedhorisys,
                        pedusuisys, pedestisys, comentario
                    ) VALUES (
                        :ciacodigo, :pednumped, :loccodigo, :vencodigo, :nickname,
                        :pedfecemi, :pedfecven, :pedtivacer, :pedtivapor, :pedsubtot,
                        :pedpordes, :peddesglobal, :peddesdirecto, :pedporiva, :pedapliiva,
                        :pediva, :pedtotal, :pedstatus, :pedfecisys, :pedhorisys,
                        :pedusuisys, :pedestisys, :comentario
                    )
                """

                params_cabecera = {
                    "ciacodigo": ciacodigo,
                    "pednumped": pedidoCodigoGenerated,
                    "loccodigo": loccodigo,
                    "vencodigo": vendedor.get("vencodigo", ""),
                    "nickname": cliente.get("clicodigo", ""),
                    "pedfecemi": fecha_con_hora_cero,
                    "pedfecven": fecha_con_hora_cero,  # Puedes calcular fecha de vencimiento según forma de pago
                    "pedtivacer": calculos_totales.get("totalBaseSinIvaYDescuento", 0),
                    "pedtivapor": calculos_totales.get("totalBaseConIvaYDescuento", 0),
                    "pedsubtot": calculos_totales.get("subtotalBrutoTotal", 0),
                    "pedpordes": 0,  # Descuento global por pedido (si aplica)
                    "peddesglobal": 0,  # Descuento global
                    "peddesdirecto": calculos_totales.get("descuentoTotalGeneral", 0),
                    "pedporiva": 0,  # Porcentaje de IVA global (0 porque cada producto tiene su propio IVA)
                    "pedapliiva": calculos_totales.get("existeAlgunArticuloConIva", 0),
                    "pediva": calculos_totales.get("ivaTotalGeneralConDescuento", 0),
                    "pedtotal": calculos_totales.get("totalNeto", 0),
                    "pedstatus": "P",  # P = Pendiente
                    "pedfecisys": fecha_con_hora_cero,
                    "pedhorisys": fecha_formato_1900.time().strftime("%H:%M:%S"),
                    "pedusuisys": usrcodigo,
                    "pedestisys": ipUser,
                    "comentario": observacion,
                }

                connection.execute(text(sSql_cabecera), params_cabecera)

                # 6. Insertar detalles en fatpedweb
                sSql_detalle = """
                    INSERT INTO fatpedweb (
                        ciacodigo, pednumped, loccodigo, vencodigo, pedsecuen,
                        pedfecemi, pedstatus, invcodigo, bodcodigo, artcodigo,
                        artdescri, pedapliiva, pedcantidad, pedcantfacturado,
                        pedpreven, pedpordesc, pedvaldesglo, pedvaldesc,
                        pediva, pedvaliva, pedvalor, pedvaltot,
                        pedfecisys, pedhorisys, pedusuisys, pedestisys
                    ) VALUES (
                        :ciacodigo, :pednumped, :loccodigo, :vencodigo, :pedsecuen,
                        :pedfecemi, :pedstatus, :invcodigo, :bodcodigo, :artcodigo,
                        :artdescri, :pedapliiva, :pedcantidad, :pedcantfacturado,
                        :pedpreven, :pedpordesc, :pedvaldesglo, :pedvaldesc,
                        :pediva, :pedvaliva, :pedvalor, :pedvaltot,
                        :pedfecisys, :pedhorisys, :pedusuisys, :pedestisys
                    )
                """

                for i, producto in enumerate(productos):
                    # Obtener los valores calculados para este producto
                    producto_calculado = productos_calculados[i] if i < len(productos_calculados) else {}

                    # Obtener invcodigo y bodcodigo del producto
                    sSql_info_producto = """
                        SELECT invcodigo
                        FROM inmart
                        WHERE ciacodigo = :ciacodigo AND artcodigo = :artcodigo
                    """

                    info_producto = connection.execute(text(sSql_info_producto), {"ciacodigo": ciacodigo, "artcodigo": producto.get("artcodigo")}).mappings().first()

                    invcodigo = info_producto["invcodigo"] if info_producto else ""
                    bodcodigo = "01"  # Bodega por defecto

                    params_detalle = {
                        "ciacodigo": ciacodigo,
                        "pednumped": pedidoCodigoGenerated,
                        "loccodigo": loccodigo,
                        "vencodigo": vendedor.get("vencodigo", ""),
                        "pedsecuen": i + 1,
                        "pedfecemi": fecha_con_hora_cero,  # TODO: Se necesito poner la fecha de emmision del frontend
                        "pedstatus": "P",
                        "invcodigo": invcodigo,
                        "bodcodigo": bodcodigo,
                        "artcodigo": producto.get("artcodigo"),
                        "artdescri": producto.get("artdescri", ""),
                        "pedapliiva": 1 if producto.get("ivaPorcentaje", 0) > 0 else 0,
                        "pedcantidad": producto.get("cantidadPedido", 1),
                        "pedcantfacturado": 0,
                        "pedpreven": producto.get("precioUnitario", 0),
                        "pedpordesc": producto.get("descuentoPorcentaje", 0),
                        "pedvaldesglo": 0,
                        "pedvaldesc": producto_calculado.get("pedDescuentoTotal", 0),
                        "pediva": producto.get("ivaPorcentaje", 0),
                        "pedvaliva": producto_calculado.get("pedIvaTotal", 0),
                        "pedvalor": producto_calculado.get("pedPrecioTotalSinAjustes", 0),
                        "pedvaltot": producto_calculado.get("pedPrecioTotalConAjustes", 0),
                        "pedfecisys": fecha_con_hora_cero,
                        "pedhorisys": fecha_formato_1900,
                        "pedusuisys": usrcodigo,
                        "pedestisys": ipUser,
                    }

                    connection.execute(text(sSql_detalle), params_detalle)

                return jsonify({"success": True, "message": "Pedido guardado exitosamente", "data": {"pednumped": pedidoCodigoGenerated, "total": calculos_totales.get("totalNeto", 0), "productos": len(productos)}}), 200

    except Exception as e:
        print(f"Error al guardar pedido: {str(e)}")
        return jsonify({"error": str(e)}), 500
