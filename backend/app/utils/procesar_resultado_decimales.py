from decimal import Decimal


def procesar_resultado_decimales(resultado_db, campos_decimal: list[str]):
    """
    Procesa resultados de la base de datos convirtiendo Decimal a strings
    para evitar notación científica.

    Args:
        resultado_db (Result | list): Resultado de SQLAlchemy (fetchone, fetchall)
        campos_decimal (list[str]): Lista de nombres de campos a procesar

    Returns:
        dict | list: Datos procesados listos para JSON
    """

    def procesar_fila(fila):
        if isinstance(fila, dict):
            fila_dict = fila
        else:
            fila_dict = dict(fila)

        for campo in campos_decimal:
            valor = fila_dict.get(campo)
            if isinstance(valor, Decimal):
                # Convertir a string con formato fijo (0.00000000)
                fila_dict[campo] = format(valor, "f")
        return fila_dict

    if isinstance(resultado_db, list):
        return [procesar_fila(fila) for fila in resultado_db]
    elif resultado_db is not None:
        return procesar_fila(resultado_db)
    return None
