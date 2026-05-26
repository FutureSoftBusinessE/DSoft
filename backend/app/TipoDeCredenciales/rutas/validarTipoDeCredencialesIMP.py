from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.TipoDeCredenciales import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


# Helper para validar Tipo de Credenciales
def validar_tipocredenciales(connection, columns: list, required: list, key_columns: list, rows: list):
    if not isinstance(rows, list) or len(rows) == 0:
        raise ValidationError("No se enviaron filas para validar.")
    if not isinstance(columns, list) or not isinstance(required, list) or not isinstance(key_columns, list):
        raise ValidationError("Estructura de validación incompleta (columns, required, key_columns).")

    # Validación de llaves y campos requeridos
    for col in key_columns:
        if col not in columns or col not in required:
            raise ValidationError(f"La columna llave {col} es inválida o no está en required.")

    vistos = set()

    for i, fila in enumerate(rows):
        if not isinstance(fila, dict):
            raise ValidationError(f"Fila #{i+1} inválida: debe ser un objeto JSON")

        fila["ok"] = True
        fila["feedback"] = ""
        errores_fila = []

        # 1. Validar campos requeridos
        faltantes = [campo for campo in required if not str(fila.get(campo, "")).strip()]
        if faltantes:
            errores_fila.append("Campos requeridos vacíos: " + ", ".join(faltantes))

        # 2. Duplicados en el archivo CSV
        clave = tuple(str(fila.get(k, "")).strip().upper() for k in key_columns)
        if clave in vistos:
            errores_fila.append("El código está duplicado dentro de este archivo.")
        else:
            vistos.add(clave)

        if errores_fila:
            fila["ok"] = False
            fila["feedback"] = " | ".join(errores_fila)

    # 3. Buscar existentes en Base de Datos (Global, sin filtrar por ciacodigo)
    cols_sql = ", ".join(key_columns)
    sql_get_all = text(f"SELECT {cols_sql} FROM gdocbTipoClaves")
    rows_db = connection.execute(sql_get_all).mappings().all()

    existentes = {tuple(str(r.get(k, "")).strip().upper() for k in key_columns) for r in rows_db}

    for fila in rows:
        if not fila["ok"]:
            continue
        clave_fila = tuple(str(fila.get(k, "")).strip().upper() for k in key_columns)
        if clave_fila in existentes:
            fila["ok"] = False
            fila["feedback"] = "Este código de credencial ya existe en el sistema."

    return rows, {"valid_rows": sum(1 for f in rows if f["ok"]), "invalid_rows": sum(1 for f in rows if not f["ok"])}


@bp.route("/validarTipoDeCredencialesIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def validarTipoDeCredencialesIMP():
    claims = get_jwt()
    try:
        clicianonBD = claims["seleccion"]["clicianonBD"]
    except KeyError:
        raise ValidationError("Error Crítico: Sesión incompleta.")

    data = request.get_json()
    rows, summary = validar_tipocredenciales(get_session(clicianonBD).bind.connect(), data.get("columns"), data.get("required"), data.get("key_columns"), data.get("rows"))
    return {"rows": rows, "summary": summary}
