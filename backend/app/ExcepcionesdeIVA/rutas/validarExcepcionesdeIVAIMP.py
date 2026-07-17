from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.ExcepcionesdeIVA import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


# Helper para validar aquí y en el proceso de insertar[cite: 22]
def validar_excepciones_iva(connection, columns: list, required: list, key_columns: list, rows: list):

    # 1. Validaciones estructurales básicas[cite: 22]
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

    # 2. Validación fila por fila (vacíos y duplicados en el mismo archivo)[cite: 22]
    for i, fila in enumerate(rows):
        if not isinstance(fila, dict):
            raise ValidationError(f"Fila #{i+1} inválida: debe ser un objeto")

        fila["ok"] = True
        fila["feedback"] = ""

        # Campos required vacíos[cite: 22]
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

        # Duplicados en el mismo archivo (Arma una tupla con la llave compuesta)[cite: 22]
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
            fila["feedback"] = "Registro duplicado en el archivo"
            continue

        vistos.add(clave)

    # 3. Validación contra la Base de Datos (Tabla siacivaexcepcion)[cite: 22]
    cols_sql = ", ".join(key_columns)

    # Traemos las claves compuestas que ya existen en la base de datos[cite: 22]
    # No filtramos por ciacodigo porque la tabla es global por Tipo de Compañía
    sql_get_all = text(f"SELECT {cols_sql} FROM siacivaexcepcion")
    rows_db = connection.execute(sql_get_all).mappings().all()

    existentes = set()
    for r in rows_db:
        clave_db = []
        for k in key_columns:
            v = r.get(k)
            # Manejo preventivo si la BD retorna objetos datetime
            if hasattr(v, "strftime"):
                v = v.strftime("%Y-%m-%d")
            elif isinstance(v, str):
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
                # Limpiamos la hora por si el CSV manda "YYYY-MM-DD HH:MM:SS"
                v = v.split(" ")[0].strip()
                fila[k] = v
            clave_fila.append("" if v is None else str(v).strip().lower())

        if tuple(clave_fila) in existentes:
            fila["ok"] = False
            fila["feedback"] = "Esta Excepción de IVA ya existe en la base de datos"

    # 4. Cálculo del resumen[cite: 22]
    valid_rows = sum(1 for fila in rows if fila["ok"])
    invalid_rows = len(rows) - valid_rows

    return rows, {"valid_rows": valid_rows, "invalid_rows": invalid_rows}


@bp.route("/validarExcepcionesdeIVAIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def validarExcepcionesdeIVAIMP():
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
        # Ejecución del helper centralizado[cite: 22]
        rows, summary = validar_excepciones_iva(connection, columns, required, key_columns, rows_csv)

    return {"rows": rows, "summary": summary}
