from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.PlanesServicios import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


# Helper para validar aqui y en insertar
def validar_planes_servicios(connection, columns: list, required: list, key_columns: list, rows: list):

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

        # Validaciones de tamaño y tipo
        max_lengths = {
            "ciacodigo": 2,
            "invcodigo": 2,
            "artcodigo": 15,
            "artdescri": 250,
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

        # Validar precio
        if fila.get("artprecventa1") is not None:
            try:
                precio = float(fila.get("artprecventa1"))
                if precio < 0:
                    fila["ok"] = False
                    fila["feedback"] = "El precio no puede ser negativo"
                    continue
            except (ValueError, TypeError):
                fila["ok"] = False
                fila["feedback"] = "El precio debe ser un número válido"
                continue

        # MODIFICADO: Validar artapliiva contra siacsritarifaiva
        if fila.get("artapliiva") is not None:
            artapliiva_valor = str(fila.get("artapliiva")).strip()

            # Verificar que la tarifa existe y está disponible
            query_tarifa = text(
                """
                SELECT codigo
                FROM siacsritarifaiva
                WHERE codigo = :codigo AND disponible = 1
            """
            )
            tarifa_existe = connection.execute(query_tarifa, {"codigo": artapliiva_valor}).fetchone()

            if not tarifa_existe:
                fila["ok"] = False
                fila["feedback"] = f"La tarifa de IVA '{artapliiva_valor}' no existe o no está disponible"
                continue

            # Guardar el código como string para luego convertir a INT en la inserción
            fila["artapliiva"] = artapliiva_valor

        # Validar FK invcodigo existe
        ciacodigo = fila.get("ciacodigo")
        invcodigo = fila.get("invcodigo")

        check_inv = text("SELECT invcodigo FROM inbinv WHERE ciacodigo = :cia AND invcodigo = :inv")
        inv_exists = connection.execute(check_inv, {"cia": ciacodigo, "inv": invcodigo}).fetchone()

        if not inv_exists:
            fila["ok"] = False
            fila["feedback"] = "El código de inventario no existe"
            continue

        # Validar clave primaria no exista
        artcodigo = fila.get("artcodigo")
        check_pk = text("SELECT artcodigo FROM inmart WHERE ciacodigo = :cia AND invcodigo = :inv AND artcodigo = :art")
        pk_exists = connection.execute(check_pk, {"cia": ciacodigo, "inv": invcodigo, "art": artcodigo}).fetchone()

        if pk_exists:
            fila["ok"] = False
            fila["feedback"] = "El código de artículo ya existe"
            continue

        # Validar duplicados en el mismo CSV
        key_values = tuple(fila.get(col) for col in key_columns)
        if key_values in vistos:
            fila["ok"] = False
            fila["feedback"] = "Registro duplicado en el archivo CSV"
            continue
        vistos.add(key_values)

    # Resumen
    invalid_rows = sum(1 for f in rows if not f.get("ok", True))
    valid_rows = len(rows) - invalid_rows

    summary = {
        "total_rows": len(rows),
        "valid_rows": valid_rows,
        "invalid_rows": invalid_rows,
    }

    return rows, summary


@bp.route("/validarPlanesServiciosIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def validarPlanesServiciosIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json()

    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Inyectar ciacodigo desde JWT si la tabla lo usa como clave
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        rows, summary = validar_planes_servicios(connection, columns, required, key_columns, rows_csv)

    return {
        "rows": rows,
        "summary": summary,
    }
