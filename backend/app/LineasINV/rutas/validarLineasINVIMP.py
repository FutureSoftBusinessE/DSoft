from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.LineasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

def validar_lineasinv(connection, rows: list, sCodCia: str):
    # 1. Obtener configuración de niveles de la empresa
    res_cia = connection.execute(text("SELECT ciaforlin, cianiveleslin FROM siaccia WHERE ciacodigo = :cia"), {"cia": sCodCia}).mappings().fetchone()
    if not res_cia:
        raise ValidationError("No se encontró configuración de niveles (siaccia) para la empresa.")
    
    formato = res_cia["ciaforlin"] or "##-##-##"
    max_niveles = int(res_cia["cianiveleslin"] or 3)
    separador = "".join([c for c in formato if c not in "0123456789#X"])[0] if any(c not in "0123456789#X" for c in formato) else "-"
    segs_len = [len(s) for s in formato.split(separador)]
    total_len = sum(segs_len)

    # 2. Registros existentes en BD para evitar duplicados
    rows_db = connection.execute(text("SELECT lincodigo FROM inblin WHERE ciacodigo = :cia"), {"cia": sCodCia}).mappings().all()
    existentes_db = {str(r["lincodigo"]).strip().upper() for r in rows_db}

    vistos_csv = set()

    for fila in rows:
        fila["ok"] = True
        fila["feedback"] = ""

        # Limpieza de código
        raw_code = str(fila.get("lincodigo", "")).replace("-", "").replace(".", "").strip().upper()
        descri = str(fila.get("lindescri", "")).strip().upper()

        if not raw_code or not descri:
            fila["ok"] = False
            fila["feedback"] = "Código y Descripción son requeridos."
            continue

        # Formatear código según el largo de la empresa para validar existencia
        full_code = raw_code.ljust(total_len, '0')[:total_len]

        if full_code in vistos_csv:
            fila["ok"] = False
            fila["feedback"] = f"Código {full_code} repetido en el archivo."
            continue
        vistos_csv.add(full_code)

        if full_code in existentes_db:
            fila["ok"] = False
            fila["feedback"] = "Este código ya existe en el sistema."
            continue

        # Validar nivel matemáticamente
        idx = 0
        nivel_detectado = 1
        for i, length in enumerate(segs_len):
            segmento = full_code[idx : idx + length]
            if segmento != ("0" * length):
                nivel_detectado = i + 1
            idx += length

        if nivel_detectado > max_niveles:
            fila["ok"] = False
            fila["feedback"] = f"El código excede los {max_niveles} niveles permitidos."

    valid_rows = sum(1 for fila in rows if fila["ok"])
    return rows, {"valid_rows": valid_rows, "invalid_rows": len(rows) - valid_rows}

@bp.route("/validarLineasINVIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def validarLineasINVIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json()
    rows_csv = data.get("rows", [])

    db.session = get_session(clicianonBD)
    # CORRECCIÓN: Se eliminaron los argumentos sobrantes en el llamado
    with db.session.bind.connect() as connection:
        rows, summary = validar_lineasinv(connection, rows_csv, sCodCia)

    return {"rows": rows, "summary": summary}