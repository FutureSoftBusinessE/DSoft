from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from services.encrip_desencrip import encriptar


# Función para procesar la estructura de allowed_columns
# con el fin agregarles su tipo de dato
def process_allowed_columns(allowed_columns):
    processed = {}
    for item in allowed_columns:
        if isinstance(item, dict):
            for col_name, col_type in item.items():
                processed[col_name] = {"type": col_type}
        else:
            processed[item] = {"type": FILTER_VALUE_TYPE.STRING}  # Default type
    return processed


def build_paginated_query(base_query, order_by, filters, page, per_page, allowed_columns):
    """
    Construye una consulta SQL con paginación, filtros y total de registros.

    Args:
        base_query (str): Consulta SQL base sin paginación ni filtros.
        filters (dict): Diccionario de filtros {columna: valor}.
        page (int): Número de página.
        per_page (int): Registros por página.
        allowed_columns (list): Columnas permitidas para filtrar (evita inyección SQL).

    Returns:
        tuple: (query_final, params) Consulta SQL y parámetros.
    """
    # Procesar estructura de columnas
    column_config = process_allowed_columns(allowed_columns)  # {column1: dataType, column2: dataType, ...}

    # Valores de paginación
    offset = (page - 1) * per_page
    params = {"per_page": per_page, "offset": offset}

    # Agregar cada criterio de ORDER BY
    order_by_clauses = []
    for order_item in order_by:
        order_parts = order_item.strip().split()
        column, direction = order_parts
        direction = direction.upper()
        order_by_clauses.append(f"{column} {direction}")  # Ej: "pedfecemi DESC"

    # Construir cláusula ORDER BY segura
    order_by_statement = ", ".join(order_by_clauses)  # Ej: "pedfecemi DESC, artcodigo ASC"

    # Añadir filtros dinámicos (validados contra allowed_columns)
    where_clauses = []
    for column, value in filters.items():
        if column in column_config:
            col_type = column_config[column]["type"]
            param_name = f"filtro_{column}"

            # Manejo por tipo de dato
            if col_type == FILTER_VALUE_TYPE.DATETIME:
                where_clauses.append(f"CONVERT(VARCHAR, {column}, 103) LIKE :{param_name}")  # formato 103: day/month/year
                params[param_name] = f"%{value}%"
            elif col_type == FILTER_VALUE_TYPE.ENCRYPTED:
                where_clauses.append(f"{column} LIKE :{param_name}")
                params[param_name] = f"%{encriptar(value)}%"
            else:  # string por defecto
                where_clauses.append(f"{column} LIKE :{param_name}")
                params[param_name] = f"%{value}%"

    # Construir WHERE dinámico (para filtrar sobre lo filtrado en el base query y no sobreescriba esas condiciones padre)
    where_statement = ""
    if where_clauses:
        where_statement = "WHERE " + " AND ".join(where_clauses)

    # Construir consulta final
    query_final = f"""
    SELECT
        *,
        COUNT(*) OVER() AS total
    FROM (
        {base_query}
    ) AS filtered_query
    {where_statement}
    ORDER BY {order_by_statement}
    OFFSET :offset ROWS
    FETCH NEXT :per_page ROWS ONLY
    """
    return query_final, params
