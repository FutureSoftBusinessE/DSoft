from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.Integradora import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


# Helper para validar aqui y en insertar
def validar_integradora(connection, columns: list, required: list, key_columns: list, rows: list):

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
            "integracodigo": 3,
            "integradescri": 60,
            "integradirecc": 100,
            "integrafono": 30,
            "integrastatus": 1,
            "integraruc": 13,
            "integraidentifica": 1,
            "integratipo": 1,
            "sectorcodigo": 3,
        }

        tamanio_errores = []
        for col, maxlen in max_lengths.items():
            if col in fila and fila.get(col) is not None:
                val = fila.get(col)
                # Si es un objeto con 'codigo', extraer el codigo
                if isinstance(val, dict):
                    val = val.get("codigo", "")
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

            # Si es un objeto con 'codigo', extraer el codigo
            if isinstance(v, dict):
                v = v.get("codigo")
                fila[k] = v
            elif isinstance(v, str):
                v = v.strip()
                fila[k] = v

            clave.append("" if v is None else str(v).strip().lower())

        clave = tuple(clave)

        if clave in vistos:
            fila["ok"] = False
            fila["feedback"] = "Registro duplicado en el archivo"
            continue

        vistos.add(clave)

    # Existentes en DB
    cols_sql = ", ".join(key_columns)

    sql_get_all = text(f"SELECT {cols_sql} FROM fabintegra")
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
                fila[k] = v

            clave_fila.append("" if v is None else str(v).strip().lower())

        if tuple(clave_fila) in existentes:
            fila["ok"] = False
            fila["feedback"] = "Integradora ya existe"

    valid_rows = sum(1 for fila in rows if fila["ok"])
    invalid_rows = len(rows) - valid_rows

    return rows, {"valid_rows": valid_rows, "invalid_rows": invalid_rows}


@bp.route("/validarIntegradoraIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def validarIntegradoraIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json()

    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        rows, summary = validar_integradora(connection, columns, required, key_columns, rows_csv)

    return {"rows": rows, "summary": summary}
