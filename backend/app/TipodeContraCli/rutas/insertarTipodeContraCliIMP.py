from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.TipodeContraCli import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

# Importamos la función helper de validación estricta
from app.TipodeContraCli.rutas.validarTipodeContraCliIMP import validar_tipocontrato


@bp.route("/insertarTipodeContraCliIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarTipodeContraCliIMP():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        sCodCia = seleccion["cliciaciacodigo"]
    except KeyError:
        raise ValidationError("Error Crítico: Sesión incompleta. No se pudo verificar la compañía.")

    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar al usuario en la sesión actual.")

    # Truncamos el usuario a 10 caracteres por límite de la tabla
    sUsuario = str(sUsuario)[:10]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr) or "FSOFTAPP"
    # Truncamos la estación a 50 caracteres por límite de la tabla
    sNomEst = str(sNomEst)[:50]

    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    # 2. OBTENER PARÁMETROS DEL MODAL
    data = request.get_json()
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Inyectar la compañía para la validación
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            # 3. DOBLE VALIDACIÓN (Evita inyecciones si se salta el frontend)
            rows, summary = validar_tipocontrato(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. MAPEO PARA INSERCIÓN
            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "concodigo": str(fila.get("concodigo", ""))[:3].upper(),  # Límite varchar(3)
                        "condescri": str(fila.get("condescri", ""))[:60].upper(),  # Límite varchar(60)
                        "confrecuencia": str(fila.get("confrecuencia", "")).strip().upper()[:10],
                        "constatus": str(fila.get("constatus", "A")).strip().upper()[:1],
                        "confecisys": fecha_pura,
                        "conhorisys": hora_pura,
                        "conusuisys": sUsuario,
                        "conestisys": sNomEst,
                        "confecmsys": fecha_pura,
                        "conhormsys": hora_pura,
                        "conusumsys": sUsuario,
                        "conestmsys": sNomEst,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO cxcbtipcon (
                    ciacodigo, concodigo, condescri, confrecuencia, constatus,
                    confecisys, conhorisys, conusuisys, conestisys,
                    confecmsys, conhormsys, conusumsys, conestmsys
                ) VALUES (
                    :ciacodigo, :concodigo, :condescri, :confrecuencia, :constatus,
                    :confecisys, :conhorisys, :conusuisys, :conestisys,
                    :confecmsys, :conhormsys, :conusumsys, :conestmsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {"data": "Tipos de contrato insertados exitosamente", "inserted": len(to_insert)}
