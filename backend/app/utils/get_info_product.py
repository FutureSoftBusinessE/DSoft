from sqlalchemy import text

# Esta funcion va a retornar datos importantes de
# un articulo en especifico tales como el iva,precio de venta,
# lista de precios, descuento


def obtenerIvaArticulo(ciaivaporproducto, sysiva, codigosTarifasIva, artapliiva):
    # En el sistema para saber que iva aplica un articulo determinado, existen 2 tipos de iva
    # el que es global(que se aplica a todos los productos de una empresa)
    # y el que es personalizado(en donde cada producto tiene una tarifa especifica de iva que se puede encontrar en siacsritarifaiva)

    # Primero se tiene que determinar que iva se aplica el global o personalizado
    # Si ciaivaporproducto en siaccia es diferente de 0 entonces se va aplicar el iva personalizado
    # ese dato se encuentra en inmart en artapliiva, eso te da el codigo de tarifa que se va
    # a aplicar a ese determinado producto, y cada codigo de tarifa su respectivo porcentaje
    # se encuentra en siacsritarifaiva
    # Y si no(o sea si ciaivaporproducto es igual 0) todos los productos que tengan artapliiva !=0 van a tener el mismo
    # porcentaje de iva del campo sysiva en SiacSys, y sino (osea que artapliiva == 0) entonces su iva es 0

    iva = 0
    if ciaivaporproducto != 0:
        tarifaFound = next((tarifa for tarifa in codigosTarifasIva if tarifa["codigo"] == artapliiva), 0)
        iva = tarifaFound["porcentaje"]
    else:
        if artapliiva != "0":
            iva = sysiva
        else:
            iva = 0

    return iva


def get_info_product(conn, ciacodigo, loccodigo, artcodigo, clicodigo="000001", factippag=""):
    try:
        # Inicialización de variables
        cliente = None
        producto = None
        listaDePrecios = None
        numPrecioDescuento = None
        precioUnitario = None
        tipoIVA = None
        globalIVA = None
        tarifasIVA = None
        ivaProducto = None
        descuentoValor = 0

        # ----------------------------------------------------
        # OBTENER INFO DEL CLIENTE
        # ----------------------------------------------------
        query_cliente = """
            SELECT
                zoncodigo,
                tipcodigo,
                regcodigo,
                ciucodigo,
                procodigo,
                clidirec,
                cliprefac,
                cliruc,
                clitelef1
            FROM Cxcmcli
            WHERE clicodigo = :clicodigo
            AND ciacodigo = :ciacodigo
        """
        cliente = conn.execute(text(query_cliente), {"ciacodigo": ciacodigo, "clicodigo": clicodigo}).mappings().first()

        cliente = dict(cliente)

        if cliente is None:
            raise ValueError(f"No se encontró el cliente con clicodigo {clicodigo} y ciacodigo {ciacodigo}")

        # ----------------------------------------------------
        # OBTENER INFO DEL PRODUCTO
        # ----------------------------------------------------
        query_producto = """
            SELECT
                artapliiva,
                invcodigo,
                artprecventa1,
                artprecventa2,
                artprecventa3,
                artprecventa4,
                artprecventa5,
                artprecventa6
            FROM inmart
            WHERE ciacodigo = :ciacodigo
            AND artcodigo = :artcodigo
        """
        producto = conn.execute(text(query_producto), {"ciacodigo": ciacodigo, "artcodigo": artcodigo}).mappings().first()

        producto = dict(producto)
        if producto is None:
            raise ValueError(f"No se encontró el producto con artcodigo {artcodigo} y ciacodigo {ciacodigo}")

        listaDePrecios = [
            producto["artprecventa1"],
            producto["artprecventa2"],
            producto["artprecventa3"],
            producto["artprecventa4"],
            producto["artprecventa5"],
            producto["artprecventa6"],
        ]

        numPrecioDescuento = cliente["cliprefac"]  # Este valor devuelve un num que define que precio de lista de precio se selecciona y tambien el descuento
        if numPrecioDescuento is None:
            raise ValueError(f"El cliente con clicodigo {clicodigo} no tiene referencia de factura (cliprefac).")

        precioUnitario = listaDePrecios[numPrecioDescuento - 1]

        # ----------------------------------------------------
        # OBTENER EL IVA
        # ----------------------------------------------------
        try:
            query_tipoIVA = """
                SELECT ciaivaporproducto
                FROM siaccia
                WHERE ciacodigo = :ciacodigo
            """
            # saca que tipo de iva es
            tipoIVA = conn.execute(text(query_tipoIVA), {"ciacodigo": ciacodigo}).mappings().first()
            tipoIVA = dict(tipoIVA)
            if tipoIVA is None:
                raise ValueError(f"No se encontró el tipo de IVA para ciacodigo {ciacodigo}")

            tipoIVA = tipoIVA["ciaivaporproducto"]

            # saca el iva configurado en la tabla siacsys (GLOBAL)
            query_sysIVA = """
                SELECT sysiva
                FROM siacsys
            """
            globalIVA = conn.execute(text(query_sysIVA), {"ciacodigo": ciacodigo}).mappings().first()
            globalIVA = dict(globalIVA)
            if globalIVA is None:
                raise ValueError(f"No se encontró el IVA global para ciacodigo {ciacodigo}")

            globalIVA = int(globalIVA["sysiva"])

            # saca las tarifas de ivas configurado en la tabla  siacsritarifaiva (PERSONALIZADO)
            query_tarifasIVA = """
                SELECT *
                FROM siacsritarifaiva
            """
            tarifasIVA = conn.execute(text(query_tarifasIVA)).mappings().fetchall()
            tarifasIVA = [dict(row) for row in tarifasIVA]
            if not tarifasIVA:
                print(f"No se encontraron tarifas de IVA para ciacodigo {ciacodigo}")  # Hay empresas que no tienen iva personalizado, asi que siempre usan el global

            # Obtener IVA del producto
            ivaProducto = obtenerIvaArticulo(tipoIVA, globalIVA, tarifasIVA, str(producto["artapliiva"]))

        except Exception as error:
            raise ValueError(f"Error retrieving IVA: {error}")
        # ----------------------------------------------------
        # OBTENER EL DESCUENTO
        # ----------------------------------------------------
        # La lógica para obtener el descuento se basa en el valor de 'cliprefac',
        # que está asociado al cliente. Este valor determina cuál será la promoción
        # aplicada, dado que existe una lista de promociones disponibles.
        #
        # Existen dos tipos de promociones:
        # 1. Descuento por artículo (tambien conocido como descuento por localidad)
        # 2. Descuento por forma de pago
        #
        # El campo 'artflagpromocion' en la tabla 'fatartpromocion' indica cuál de
        # los dos tipos de promoción se debe aplicar en cada caso.
        artpordes_campo = f"artpordes{numPrecioDescuento}"

        query_promocionXArticulo = """
            SELECT
                fatartpromocion.artflagpromocion,
                fatartpromocion.ciacodigo,
                fatartpromocion.invcodigo,
                fatartpromocion.loccodigo,
                fatartpromocion.artcodigo,
                fatartpromocion.artfecinipro,
                fatartpromocion.arthorinipro,
                fatartpromocion.artfecfinpro,
                fatartpromocion.arthorfinpro,
                fatartpromocion.{artpordes_campo}
            FROM fatartpromocion
            WHERE fatartpromocion.ciacodigo = :ciacodigo
            AND fatartpromocion.invcodigo = :invcodigo
            AND fatartpromocion.loccodigo = :loccodigo
            AND fatartpromocion.artcodigo = :artcodigo
            AND GETDATE() BETWEEN
                CONVERT(DATETIME, artfecinipro + ' ' + arthorinipro)
                AND CONVERT(DATETIME, artfecfinpro + ' ' + arthorfinpro)
        """.format(
            artpordes_campo=artpordes_campo
        )

        # Ejecutamos la consulta para obtener la promoción por artículo
        promocionXArticulo = conn.execute(text(query_promocionXArticulo), {"ciacodigo": ciacodigo, "invcodigo": producto["invcodigo"], "loccodigo": loccodigo, "artcodigo": artcodigo}).mappings().fetchone()

        promocionXArticulo = dict(promocionXArticulo) if promocionXArticulo else None

        if promocionXArticulo:
            forpordes_campo = f"forpordes{numPrecioDescuento}"

            if promocionXArticulo["artflagpromocion"] != 0:
                # Se aplica el descuento por forma de pago
                query_promocionXFormaPago = """
                    SELECT
                        fatartpromocionfp.ciacodigo,
                        fatartpromocionfp.invcodigo,
                        fatartpromocionfp.loccodigo,
                        fatartpromocionfp.artcodigo,
                        fatartpromocionfp.factippag,
                        fatartpromocionfp.forfecinipro,
                        fatartpromocionfp.forhorinipro,
                        fatartpromocionfp.forfecfinpro,
                        fatartpromocionfp.forhorfinpro,
                        fatartpromocionfp.{forpordes_campo}
                    FROM fatartpromocionfp
                    WHERE fatartpromocionfp.ciacodigo = :ciacodigo
                    AND fatartpromocionfp.invcodigo = :invcodigo
                    AND fatartpromocionfp.loccodigo = :loccodigo
                    AND fatartpromocionfp.artcodigo = :artcodigo
                    AND fatartpromocionfp.factippag = :factippag
                    AND GETDATE() BETWEEN
                        CONVERT(DATETIME, forfecinipro + ' ' + forhorinipro)
                        AND CONVERT(DATETIME, forfecfinpro + ' ' + forhorfinpro)
                """.format(
                    forpordes_campo=forpordes_campo
                )

                # Ejecutamos la consulta para obtener el descuento por forma de pago
                promocionXFormaPago = conn.execute(text(query_promocionXFormaPago), {"ciacodigo": ciacodigo, "invcodigo": producto["invcodigo"], "loccodigo": loccodigo, "artcodigo": artcodigo, "factippag": factippag}).mappings().fetchone()

                promocionXFormaPago = dict(promocionXFormaPago) if promocionXFormaPago else None

                # Se aplica el descuento por forma de pago
                if promocionXFormaPago:
                    descuentoValor = promocionXFormaPago.get(forpordes_campo)
            else:
                # Se aplica el descuento por localidad que es la consulta que ya se hizo al principio
                descuentoValor = promocionXArticulo.get(artpordes_campo)
        else:
            descuentoValor = 0  # Si no hay promoción, el descuento es 0

        # ----------------------------------------------------
        # Retornar todo como un diccionario
        # ----------------------------------------------------
        return {
            "cliente": cliente,
            "producto": producto,
            "listaDePrecios": listaDePrecios,
            "numPrecioDescuento": numPrecioDescuento,
            "precioUnitario": precioUnitario,
            "tipoIVA": tipoIVA,
            "globalIVAPorcentaje": globalIVA,
            "tarifasIVA": tarifasIVA,
            "ivaProductoPorcentaje": ivaProducto,
            "descuentoPorcentaje": descuentoValor,
        }

    except Exception as error:
        raise ValueError(f"{error}")
