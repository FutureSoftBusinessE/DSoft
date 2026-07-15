from sqlalchemy import text


def obtenerIvaArticulo(ciaivaporproducto, sysiva, codigosTarifasIva, artapliiva, excepcionIVA=None):
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

    # Si hay una excepcion de IVA activa por tipo de compania, tiene prioridad absoluta. La variable excepcionIVA es todo el registro encontrado de la tabla siacivaexcepcion
    if excepcionIVA is not None:
        return excepcionIVA["iveporcentajeresolucion"]

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


def get_iva_product(conn, ciacodigo, artcodigo):
    # ----------------------------------------------------
    # OBTENER INFO DEL PRODUCTO
    # ----------------------------------------------------
    query_producto = """
        SELECT
            artapliiva
        FROM inmart
        WHERE ciacodigo = :ciacodigo
        AND artcodigo = :artcodigo
    """
    producto = conn.execute(text(query_producto), {"ciacodigo": ciacodigo, "artcodigo": artcodigo}).mappings().first()

    if producto is None:
        raise ValueError(f"No se encontró el producto con artcodigo {artcodigo} y ciacodigo {ciacodigo}")

    producto = dict(producto)

    # ----------------------------------------------------
    # OBTENER EXCEPCION DE IVA POR TIPO DE COMPANIA
    # ----------------------------------------------------
    excepcionIVA = None
    try:
        query_tipoCompania = """
            SELECT ciatipocompania
            FROM siaccia
            WHERE ciacodigo = :ciacodigo
        """
        tipoCompania_result = conn.execute(text(query_tipoCompania), {"ciacodigo": ciacodigo}).mappings().first()

        if tipoCompania_result and tipoCompania_result["ciatipocompania"]:
            query_excepcionIva = """
                SELECT iveporcentajeresolucion
                FROM siacivaexcepcion
                WHERE ivetipocompania = :tipoCompania
                AND ivestatus = 'A'
                AND GETDATE() BETWEEN ivefecinicio AND ivefectermino
            """
            excepcionIVA_result = conn.execute(text(query_excepcionIva), {"tipoCompania": tipoCompania_result["ciatipocompania"]}).mappings().first()
            excepcionIVA = dict(excepcionIVA_result) if excepcionIVA_result else None
    except Exception:
        excepcionIVA = None

    # ----------------------------------------------------
    #       OBTENER EL IVA
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
            raise ValueError(f"No se encontraron tarifas de IVA para ciacodigo {ciacodigo}")

        # Obtener IVA del producto
        ivaProducto = obtenerIvaArticulo(tipoIVA, globalIVA, tarifasIVA, str(producto["artapliiva"]), excepcionIVA)
        return {"tipoIVA": tipoIVA, "globalIVA": globalIVA, "tarifasIVA": tarifasIVA, "ivaProducto": ivaProducto}

    except Exception as error:
        raise ValueError(f"Error retrieving IVA: {error}")
