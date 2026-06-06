from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.Instituciones import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


# Helper para validar la importación de Instituciones
def validar_instituciones(connection, columns: list, required: list, key_columns: list, rows: list):

    if not isinstance(rows, list) or len(rows) == 0:
        raise ValidationError("No se enviaron filas para validar (rows requerido).")
    if not isinstance(columns, list) or len(columns) == 0:
        raise ValidationError("La estructura de columnas es requerida (columns).")
    if not isinstance(required, list) or len(required) == 0:
        raise ValidationError("Las reglas de obligatoriedad son requeridas (required).")
    if not isinstance(key_columns, list) or len(key_columns) == 0:
        raise ValidationError("Las llaves primarias son requeridas (key_columns).")

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
            raise ValidationError(f"Fila #{i+1} inválida: debe ser un objeto JSON")

        fila["ok"] = True
        fila["feedback"] = ""
        errores_fila = []

        # 1. Validar campos requeridos vacíos
        faltantes = []
        for campo in required:
            valor = fila.get(campo)
            if isinstance(valor, str):
                valor = valor.strip()
                fila[campo] = valor

            if valor is None or (isinstance(valor, str) and valor == ""):
                faltantes.append(campo)

        if faltantes:
            errores_fila.append("Campos requeridos vacíos: " + ", ".join(faltantes))

        # 2. Duplicados en el mismo archivo CSV
        clave = []
        for k in key_columns:
            v = fila.get(k)
            if isinstance(v, str):
                v = v.strip().upper()
                fila[k] = v
            clave.append("" if v is None else str(v).strip().upper())

        clave = tuple(clave)

        if clave in vistos:
            errores_fila.append("El código está duplicado dentro de este mismo archivo.")
        else:
            vistos.add(clave)

        # Consolidar errores si los hay
        if errores_fila:
            fila["ok"] = False
            fila["feedback"] = " | ".join(errores_fila)

    # 3. Buscar existentes en la Base de Datos (Catálogo Global)
    cols_sql = ", ".join(key_columns)
    sql_get_all = text(f"SELECT {cols_sql} FROM gdocbinstituciones")

    # Ejecutamos la consulta sin filtro de compañía
    rows_db = connection.execute(sql_get_all).mappings().all()

    existentes = set()
    for r in rows_db:
        clave_db = []
        for k in key_columns:
            v = r.get(k)
            if isinstance(v, str):
                v = v.strip().upper()
            clave_db.append("" if v is None else str(v).strip().upper())
        existentes.add(tuple(clave_db))

    for fila in rows:
        if not fila["ok"]:
            continue  # Si ya falló por vacío o duplicado CSV, lo saltamos

        clave_fila = []
        for k in key_columns:
            v = fila.get(k)
            clave_fila.append("" if v is None else str(v).strip().upper())

        if tuple(clave_fila) in existentes:
            fila["ok"] = False
            fila["feedback"] = "Este código de Institución ya existe en el sistema."

    valid_rows = sum(1 for fila in rows if fila["ok"])
    invalid_rows = len(rows) - valid_rows

    return rows, {"valid_rows": valid_rows, "invalid_rows": invalid_rows}


@bp.route("/validarInstitucionesIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def validarInstitucionesIMP():
    claims = get_jwt()

    # 1. Validación de seguridad general
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        # No extraemos 'cliciaciacodigo' porque gdocbinstituciones es global
    except KeyError:
        raise ValidationError("Error Crítico: Sesión incompleta.")

    data = request.get_json()
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        rows, summary = validar_instituciones(connection, columns, required, key_columns, rows_csv)

    return {"rows": rows, "summary": summary}
