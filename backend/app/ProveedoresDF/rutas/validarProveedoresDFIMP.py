from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.ProveedoresDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


# Helper para validar la integridad de los proveedores antes de la importación
def validar_proveedoresdf(connection, columns: list, required: list, key_columns: list, rows: list):
    # 1. Validaciones básicas de parámetros de entrada
    if not isinstance(rows, list) or len(rows) == 0:
        raise ValidationError("rows requerido")
    if not isinstance(columns, list) or len(columns) == 0:
        raise ValidationError("columns requerido")
    if not isinstance(required, list) or len(required) == 0:
        raise ValidationError("required requerido")

    vistos = set()

    # 2. Validación fila por fila (Campos vacíos y duplicados internos del archivo)
    for i, fila in enumerate(rows):
        if not isinstance(fila, dict):
            raise ValidationError(f"Fila #{i+1} inválida: debe ser un objeto")

        fila["ok"] = True
        fila["feedback"] = ""

        # Verificar campos obligatorios vacíos (Nombre y Ruc son críticos)
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

        # Detectar duplicados dentro del mismo archivo basándose en "Cedula o Ruc" (proruc)
        # Usamos el alias o el nombre técnico si el frontend lo envía mapeado
        ruc_valor = str(fila.get("Cedula o Ruc", fila.get("proruc", ""))).strip().lower()

        if ruc_valor in vistos:
            fila["ok"] = False
            fila["feedback"] = f"R.U.C./Cédula duplicado en el archivo ({ruc_valor})"
            continue

        vistos.add(ruc_valor)

    # 3. Verificación contra Base de Datos (Multitenancy - cxpmprov)
    cia_val = rows[0]["ciacodigo"]

    # Consultamos los RUCs ya registrados para la compañía actual para evitar duplicados de identidad
    sql_get_all = text("SELECT proruc FROM cxpmprov WHERE ciacodigo = :ciacodigo")
    rows_db = connection.execute(sql_get_all, {"ciacodigo": cia_val}).mappings().all()

    existentes = {str(r["proruc"]).strip().lower() for r in rows_db}

    # Marcar registros que ya existen en la tabla cxpmprov
    for fila in rows:
        if not fila["ok"]:
            continue

        ruc_fila = str(fila.get("Cedula o Ruc", fila.get("proruc", ""))).strip().lower()

        if ruc_fila in existentes:
            fila["ok"] = False
            fila["feedback"] = "Este R.U.C./Cédula de Proveedor ya existe en la base de datos"

    valid_rows = sum(1 for fila in rows if fila["ok"])
    invalid_rows = len(rows) - valid_rows

    return rows, {"valid_rows": valid_rows, "invalid_rows": invalid_rows}


@bp.route("/validarProveedoresDFIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def validarProveedoresDFIMP():
    # Extracción de contexto de seguridad y compañía
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json()

    # Parámetros enviados por el componente de carga masiva de React
    columns = data.get("columns")
    required = data.get("required")
    # Por defecto validamos por RUC
    key_columns = data.get("key_columns", ["Cedula o Ruc"])
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Inyección de la compañía en cada fila para la validación multitenancy
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        # Llamada al helper de validación
        rows, summary = validar_proveedoresdf(connection, columns, required, key_columns, rows_csv)

    return {"rows": rows, "summary": summary}
