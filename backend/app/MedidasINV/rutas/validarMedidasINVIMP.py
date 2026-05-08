from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.MedidasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

# Helper para validar la integridad de las unidades de medida antes de la importación
def validar_medidasinv(connection, columns: list, required: list, key_columns: list, rows: list):
    # 1. Validaciones básicas de parámetros de entrada
    if not isinstance(rows, list) or len(rows) == 0:
        raise ValidationError("rows requerido")
    if not isinstance(columns, list) or len(columns) == 0:
        raise ValidationError("columns requerido")
    if not isinstance(required, list) or len(required) == 0:
        raise ValidationError("required requerido")
    if not isinstance(key_columns, list) or len(key_columns) == 0:
        raise ValidationError("key_columns requerido")

    # Validar que las columnas clave (medcodigo) estén configuradas correctamente
    for col in key_columns:
        if col not in columns:
            raise ValidationError(f"key_columns inválido: {col} no está en columns")
        if col not in required:
            raise ValidationError(f"key_columns inválido: {col} debe estar en required")

    vistos = set()

    # 2. Validación fila por fila (Campos vacíos y duplicados internos del CSV)
    for i, fila in enumerate(rows):
        if not isinstance(fila, dict):
            raise ValidationError(f"Fila #{i+1} inválida: debe ser un objeto")

        fila["ok"] = True
        fila["feedback"] = ""

        # Verificar campos obligatorios vacíos (medcodigo, meddescri)
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

        # Detectar duplicados dentro del mismo archivo basándose en medcodigo
        clave = []
        for k in key_columns:
            v = fila.get(k)
            if isinstance(v, str):
                v = v.strip()
                fila[k] = v 
            clave.append("" if v is None else str(v).strip().lower())

        clave = tuple(clave)

        if clave in vistos:
            fila["ok"] = False
            fila["feedback"] = f"Registro duplicado en el archivo (Medida {clave[0]})"
            continue

        vistos.add(clave)

    # 3. Verificación contra Base de Datos (Multitenancy - inbmed)
    cols_sql = ", ".join(key_columns)
    cia_val = rows[0]["ciacodigo"]
    
    # Consultamos las medidas ya registradas para la compañía actual
    sql_get_all = text(f"SELECT {cols_sql} FROM inbmed WHERE ciacodigo = :ciacodigo")
    rows_db = connection.execute(sql_get_all, {"ciacodigo": cia_val}).mappings().all()

    existentes = set()
    for r in rows_db:
        clave_db = []
        for k in key_columns:
            v = r.get(k)
            if isinstance(v, str):
                v = v.strip().lower()
            clave_db.append("" if v is None else str(v).strip().lower())
        existentes.add(tuple(clave_db))

    # Marcar registros que ya existen en la tabla inbmed
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
            fila["feedback"] = "Esta Unidad de Medida ya existe en la base de datos"

    valid_rows = sum(1 for fila in rows if fila["ok"])
    invalid_rows = len(rows) - valid_rows

    return rows, {"valid_rows": valid_rows, "invalid_rows": invalid_rows}


@bp.route("/validarMedidasINVIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def validarMedidasINVIMP():
    # Extracción de contexto de seguridad y compañía
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json()

    # Parámetros enviados por el componente de carga masiva
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Inyección de la compañía en cada fila para la validación multitenancy
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        rows, summary = validar_medidasinv(connection, columns, required, key_columns, rows_csv)

    return {"rows": rows, "summary": summary}