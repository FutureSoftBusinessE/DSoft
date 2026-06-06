from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.Pais import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


# Helper para validar aqui y en insertar
def validar_pais(connection, columns: list, required: list, key_columns: list, rows: list):

    if not isinstance(rows, list) or len(rows) == 0:
        raise ValidationError("rows requerido")
    if not isinstance(columns, list) or len(columns) == 0:
        raise ValidationError("columns requerido")
    if not isinstance(required, list) or len(required) == 0:
        raise ValidationError("required requerido")
    if not isinstance(key_columns, list) or len(key_columns) == 0:
        raise ValidationError("key_columns requerido")

    for col in key_columns:
        if col not in columns:
            raise ValidationError(f"key_columns inválido: {col} no está en columns")
        if col not in required:
            raise ValidationError(f"key_columns inválido: {col} debe estar en required")

    for col in required:
        if col not in columns:
            raise ValidationError(f"required inválido: {col} no está en columns")

    vistos = set()

    for i, fila in enumerate(rows):
        if not isinstance(fila, dict):
            raise ValidationError(f"Fila #{i+1} inválida: debe ser un objeto")

        fila["ok"] = True
        fila["feedback"] = ""

        # Campos required vacios
        faltantes = []
        for campo in required:
            valor = fila.get(campo)

            if isinstance(valor, str):
                valor = valor.strip()
                fila[campo] = valor

            if valor is None or (isinstance(valor, str) and valor == ""):
                faltantes.append(campo)

        if faltantes:
            fila["ok"] = False
            fila["feedback"] = "Campos requeridos vacíos: " + ", ".join(faltantes)
            continue

        # Validaciones de tamaño por columna
        max_lengths = {
            "paiscodigo": 3,
            "paisdescri": 20,
            "paisstatus": 1,
            "paisususys": 10,
        }

        tamanio_errores = []
        for col, maxlen in max_lengths.items():
            if col in fila and fila.get(col) is not None:
                val = fila.get(col)
                if not isinstance(val, str):
                    val = str(val)
                if len(val) > maxlen:
                    tamanio_errores.append(f"{col} excede {maxlen} caracteres")

        if tamanio_errores:
            fila["ok"] = False
            fila["feedback"] = "; ".join(tamanio_errores)
            continue

        # Duplicados en el mismo archivo
        clave = []
        for k in key_columns:
            v = fila.get(k)

            if isinstance(v, str):
                v = v.strip()
                fila[k] = v  # preserva el original sin lower

            clave.append("" if v is None else str(v).strip().lower())

        clave = tuple(clave)

        if clave in vistos:
            fila["ok"] = False
            fila["feedback"] = "Registro duplicado en el archivo"
            continue

        vistos.add(clave)

    # Existentes en DB
    cols_sql = ", ".join(key_columns)

    sql_get_all = text(f"SELECT {cols_sql} FROM hotbpais")
    rows_db = connection.execute(sql_get_all).mappings().all()

    existentes = set()
    for r in rows_db:
        clave_db = []
        for k in key_columns:
            v = r.get(k)
            if isinstance(v, str):
                v = v.strip().lower()
            clave_db.append("" if v is None else str(v).strip().lower())
        existentes.add(tuple(clave_db))

    for fila in rows:
        if not fila["ok"]:
            continue

        clave_fila = []
        for k in key_columns:
            v = fila.get(k)

            if isinstance(v, str):
                v = v.strip()
                fila[k] = v  # preserva el original sin lower

            clave_fila.append("" if v is None else str(v).strip().lower())

        if tuple(clave_fila) in existentes:
            fila["ok"] = False
            fila["feedback"] = "País ya existe"

    valid_rows = sum(1 for fila in rows if fila["ok"])
    invalid_rows = len(rows) - valid_rows

    return rows, {"valid_rows": valid_rows, "invalid_rows": invalid_rows}


@bp.route("/validarPaisIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def validarPaisIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json()

    # Son las columnas de la tabla
    columns = data.get("columns")

    # Son las columnas que no pueden estar vacías (obligatorias)
    required = data.get("required")

    # Son las columnas que forman la clave (para las validaciones)
    key_columns = data.get("key_columns")

    # Son las filas con los datos del csv
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        rows, summary = validar_pais(connection, columns, required, key_columns, rows_csv)

    return {"rows": rows, "summary": summary}
