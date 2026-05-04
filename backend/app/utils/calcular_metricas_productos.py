from typing import List, Dict, Tuple, Any


def calcular_metricas_productos(productos: List[Dict[str, str]], config_claves: Dict[str, str] = None) -> Tuple[List[Dict[str, Any]], Dict[str, float]]:
    """
    Calcula valores de cada producto y valores de todos los productos. Como iva, descuento, etc

    Parámetros:
    -----------
    productos : List[Dict[str, str]]
        Un arreglo de diccionarios en donde cada diccionario representa un producto.

    config_claves : Dict[str, str]
        Un diccionario que mapea las claves esperadas en `productos`. Debe mandarse con este formato
        {
            "cantidad": str,
            "precioUnitario": str,
            "porcentajeIva": str,
            "porcentajeDescuento": str
        }

    Retorna:
    --------
    Tuple[List[Dict[str, Any]], Dict[str, float]]
        Una tupla con dos elementos:
        - productos_actualizados: Lista de diccionarios con los productos actualizados.
        - calculos_totales: Diccionario de métricas finales.
    """
    # ---------- Valores totales finales -----------
    # Valores que acumulan el valor de precio_total_sin_ajustes separandolos para productos con y sin iva
    total_base_con_iva = 0
    total_base_sin_iva = 0
    # Valores que acumulan el valor de precio_total_sin_ajustes-descuento_total separandolos para productos con y sin iva
    total_base_con_iva_y_descuento = 0
    total_base_sin_iva_y_descuento = 0

    # Valores totales generales
    subtotal_bruto_total = 0
    subtotal_bruto_total_con_descuento = 0
    iva_total_general = 0
    iva_total_general_con_descuento = 0
    descuento_total_general = 0

    # Valores totales finales
    # total_neto = 0

    # Si algun articulo dentro del arreglo tiene IVA mayor a 0
    # entonces esta variable sera -1 (verdadero true)
    existe_algun_articulo_con_iva = 0

    # ---------- Variables de retorno -----------
    productos_actualizados = []
    calculos_totales = {}

    # Iterar sobre cada producto en el arreglo para calcular nuevos valores
    for producto in productos:
        # Esto es un flag para saber si este artiuculo tiene iva
        articulo_con_iva = 0
        try:
            # --- Cálculos individuales para cada producto ---
            # Convertir valores base a float para operaciones matemáticas
            cantidad_comprar = float(producto[config_claves["cantidad"]])  # Cantidad de unidades a comprar (pedcantidad)
            precio_unitario = float(producto[config_claves["precioUnitario"]])  # Precio por unidad sin descuento ni IVA (pedpreven)
            iva_porcentaje = float(producto[config_claves["porcentajeIva"]])  # Porcentaje de IVA aplicable (ej: 19%) (pediva)
            descuento_porcentaje = float(producto[config_claves["porcentajeDescuento"]])  # Porcentaje de descuento (ej: 10%) (pedpordesc)

            # Calcular descuentos
            descuento_por_unidad = precio_unitario * (descuento_porcentaje / 100)  # Valor del descuento por unidad
            descuento_total = cantidad_comprar * descuento_por_unidad  # Descuento total aplicado (pedvaldesc)

            # Calcular impuestos
            iva_por_unidad = precio_unitario * (iva_porcentaje / 100)  # Valor del IVA por unidad
            iva_total = iva_por_unidad * cantidad_comprar  # IVA total aplicado

            # Calcular precios base
            precio_total_sin_ajustes = precio_unitario * cantidad_comprar  # Precio sin descuentos ni IVA (pedvalor)

            # Calcular subtotales
            precio_total_sin_ajustes_con_descuento = precio_total_sin_ajustes - descuento_total  # Precio con descuento pero sin IVA
            iva_sobre_precio_total_sin_ajustes_con_descuento = precio_total_sin_ajustes_con_descuento * (iva_porcentaje / 100)  # (pedvaliva)

            # Calcular precio final con descuento e IVA aplicado al nuevo monto
            # subtotal_neto = precio_con_descuento * (1 + iva_porcentaje / 100)  # Precio con descuento + IVA
            precio_total_con_ajustes = precio_total_sin_ajustes + iva_sobre_precio_total_sin_ajustes_con_descuento  # pedvaltot

            # Validar que no existan valores negativos en los cálculos
            if any(valor < 0 for valor in [iva_por_unidad, iva_total, precio_total_sin_ajustes, precio_total_con_ajustes]):
                return "No se permiten valores negativos en los cálculos", 500

            if iva_porcentaje > 0:
                articulo_con_iva = -1

            # Agregar nuevos valores calculados al diccionario del producto
            productos_actualizados.append(
                {
                    **producto,
                    "articulo_con_iva": articulo_con_iva,  # pedapliiva
                    "pedcantidad": cantidad_comprar,  # pedcantidad
                    "pedPrecioUnitario": precio_unitario,  # pedpreven
                    "pedDescuentoTotal": descuento_total,  # pedvaldesc
                    "pedIvaPorcentaje": iva_porcentaje,  # pediva
                    "pedIvaSobrePrecioTotalSinAjustesConDescuento": iva_sobre_precio_total_sin_ajustes_con_descuento,  # pedvaliva
                    "pedPrecioTotalSinAjustes": precio_total_sin_ajustes,  # pedvalor
                    "pedPrecioTotalConAjustes": precio_total_con_ajustes,  # pedvaltotal
                    "pedDescuentoPorcentaje": descuento_porcentaje,  # pedpordesc
                    "pedDescuentoPorUnidad": descuento_por_unidad,
                    "pedIvaPorUnidad": iva_por_unidad,
                    "pedIvaTotal": iva_total,
                    "pedPrecioTotalSinAjustesConDescuento": precio_total_sin_ajustes_con_descuento,
                }
            )

            # --- Acumular totales para la cabecera ---
            # Clasificar productos por tipo de IVA
            if iva_porcentaje > 0:
                total_base_con_iva += precio_total_sin_ajustes
                total_base_con_iva_y_descuento += precio_total_sin_ajustes - descuento_total
                existe_algun_articulo_con_iva = -1
            else:
                total_base_sin_iva += precio_total_sin_ajustes
                total_base_sin_iva_y_descuento += precio_total_sin_ajustes - descuento_total

            # Acumular totales generales
            subtotal_bruto_total += precio_total_sin_ajustes
            subtotal_bruto_total_con_descuento += precio_total_sin_ajustes - descuento_total

            iva_total_general += iva_total
            iva_total_general_con_descuento += iva_sobre_precio_total_sin_ajustes_con_descuento

            descuento_total_general += descuento_total

            # --- Calcular totales finales para la cabecera ---
            # Cuando algun articulo tiene descuento eso se le aplica al producto y al iva
            # total_neto += (precio_total_sin_ajustes - descuento_total) + (iva_sobre_precio_total_sin_ajustes_con_descuento)  #Esto no esta considerando el redondeo

        except KeyError as e:
            return f"Falta campo obligatorio en el producto: {str(e)}", 500
        except ValueError as e:
            return f"Error en formato numérico: {str(e)}", 500

    calculos_totales = {
        "totalBaseSinIvaYDescuento": total_base_sin_iva_y_descuento,  # pedtivacer
        "totalBaseConIvaYDescuento": total_base_con_iva_y_descuento,  # pedtivapor
        "subtotalBrutoTotalConDescuento": subtotal_bruto_total_con_descuento,  # pedsubtot. Observacion: Aqui no se esta redondeando pero en la base ya se redondea a 2 decimales
        "ivaTotalGeneralConDescuento": iva_total_general_con_descuento,  # pediva. Observacion: Aqui no se esta redondeando pero en la base ya se redondea a 2 decimales
        "totalNeto": subtotal_bruto_total_con_descuento + iva_total_general_con_descuento,  # pedtotal; (subtotal_bruto_total_con_descuento + iva_total_general_con_descuento);  Observacion: Aqui no se esta redondeando pero en la base ya se redondea a 2 decimales
        "descuentoTotalGeneral": descuento_total_general,  # peddesdirecto
        "existeAlgunArticuloConIva": existe_algun_articulo_con_iva,  # pedapliiva
        "totalBaseConIva": total_base_con_iva,
        "totalBaseSinIva": total_base_sin_iva,
        "subtotalBrutoTotal": subtotal_bruto_total,
        "ivaTotalGeneral": iva_total_general,
    }

    return productos_actualizados, calculos_totales
