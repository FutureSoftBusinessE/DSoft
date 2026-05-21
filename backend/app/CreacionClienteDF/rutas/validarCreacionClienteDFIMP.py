from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CreacionClienteDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


# Helper para validar la integridad de los clientes antes de la importación
def validar_creacionclientedf(connection, columns: list, required: list, key_columns: list, rows: list, sCodCia: str):
    # 1. Validaciones básicas de parámetros
    if not isinstance(rows, list) or len(rows) == 0:
        raise ValidationError("rows requerido")
    # 2. Obtener valores por defecto de la Localidad (cgblocal)
    # Según requerimiento: activicodigo, regcodigo, sectorcodigo, tipcodigo, zoncodigo, procodigo, ciucodigo, parrocodigo
    sql_local = text(
        """
        SELECT activicodigo, regcodigo, sectorcodigo, tipcodigo, zoncodigo, procodigo, ciucodigo, parrocodigo
        FROM cgblocal
        WHERE ciacodigo = :ciacodigo AND loccodigo = '01'
    """
    )
    localidad = connection.execute(sql_local, {"ciacodigo": sCodCia}).mappings().fetchone()
    if not localidad:
        raise ValidationError("No se encontró la configuración de localidad (01) para obtener códigos por defecto.")

    # 3. Consultar secuencia actual de Clientes (siacsec)
    sql_sec = text("SELECT secnumero FROM siacsec WHERE ciacodigo = :ciacodigo AND seccodigo = 'CLI'")
    res_sec = connection.execute(sql_sec, {"ciacodigo": sCodCia}).mappings().fetchone()
    if not res_sec:
        raise ValidationError("No se encontró la secuencia 'CLI' en siacsec para esta compañía.")
    proxima_secuencia = int(res_sec["secnumero"]) + 1
    # 4. Obtener RUCs existentes en base de datos para evitar duplicados reales
    sql_existentes = text("SELECT cliruc FROM cxcmcli WHERE ciacodigo = :ciacodigo")
    rows_db = connection.execute(sql_existentes, {"ciacodigo": sCodCia}).mappings().all()
    rucs_en_db = {str(r["cliruc"]).strip().lower() for r in rows_db if r["cliruc"]}

    vistos_en_archivo = set()

    # 5. Validación fila por fila
    for i, fila in enumerate(rows):
        fila["ok"] = True
        fila["feedback"] = ""

        # Mapeo de campos solicitados y limpieza
        cliruc = str(fila.get("cliruc", "")).strip()
        clinombre = str(fila.get("clinombre", "")).strip()
        # cliidentifica = str(fila.get("cliidentifica", "C")).strip().upper()[:1]

        # Inyectar valores por defecto de localidad y secuencia
        fila["clicodigo"] = str(proxima_secuencia + i).zfill(6)
        fila["activicodigo"] = localidad["activicodigo"]
        fila["regcodigo"] = localidad["regcodigo"]
        fila["sectorcodigo"] = localidad["sectorcodigo"]
        fila["tipcodigo"] = localidad["tipcodigo"]
        fila["zoncodigo"] = localidad["zoncodigo"]
        fila["procodigo"] = localidad["procodigo"]
        fila["ciucodigo"] = localidad["ciucodigo"]
        fila["parrocodigo"] = localidad["parrocodigo"]

        # Validar campos obligatorios (RUC y Nombre)
        if not cliruc:
            fila["ok"] = False
            fila["feedback"] = "Cédula o RUC es obligatorio"
            continue
        if not clinombre:
            fila["ok"] = False
            fila["feedback"] = "Nombre del Cliente es obligatorio"
            continue

        # Detectar duplicados dentro del mismo archivo (por RUC)
        cliruc_key = cliruc.lower()
        if cliruc_key in vistos_en_archivo:
            fila["ok"] = False
            fila["feedback"] = f"RUC duplicado en el archivo: {cliruc}"
            continue
        vistos_en_archivo.add(cliruc_key)

        # Verificar contra Base de Datos (RUC duplicado)
        if cliruc_key in rucs_en_db:
            fila["ok"] = False
            fila["feedback"] = "Este RUC ya está registrado en el sistema"
            continue

    valid_rows = sum(1 for fila in rows if fila["ok"])
    invalid_rows = len(rows) - valid_rows

    return rows, {"valid_rows": valid_rows, "invalid_rows": invalid_rows}


@bp.route("/validarCreacionClienteDFIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def validarCreacionClienteDFIMP():
    # Extracción de contexto de seguridad
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json()

    # Parámetros del componente React
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Inyección de la compañía para multitenancy
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        # Llamada al helper con lógica de secuencias y localidad
        rows, summary = validar_creacionclientedf(connection, columns, required, key_columns, rows_csv, sCodCia)

    return {"rows": rows, "summary": summary}
