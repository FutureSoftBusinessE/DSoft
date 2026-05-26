from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.TipoDeCredenciales import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

# Importamos el helper de validación creado anteriormente
from app.TipoDeCredenciales.rutas.validarTipoDeCredencialesIMP import validar_tipocredenciales


@bp.route("/insertarTipoDeCredencialesIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarTipoDeCredencialesIMP():
    claims = get_jwt()

    # 1. VALIDACIÓN DE SEGURIDAD
    try:
        clicianonBD = claims["seleccion"]["clicianonBD"]
    except KeyError:
        raise ValidationError("Error Crítico: Sesión incompleta.")

    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar al usuario en la sesión actual.")

    sUsuario = str(sUsuario)[:10]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr) or "FSOFTAPP"
    sNomEst = str(sNomEst)[:40]

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

    with engine.connect() as connection:
        with connection.begin():
            # 3. VALIDACIÓN (Usa el helper importado)
            rows, summary = validar_tipocredenciales(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. MAPEO E INSERCIÓN
            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "clacodigo": str(fila.get("clacodigo", ""))[:3].upper(),
                        "cladescri": str(fila.get("cladescri", ""))[:60].upper(),
                        "clastatus": str(fila.get("clastatus", "A")).strip().upper()[:1],
                        "clafecisys": fecha_pura,
                        "clahorisys": hora_pura,
                        "clausuisys": sUsuario,
                        "claestisys": sNomEst,
                        "clafecmsys": fecha_pura,
                        "clahormsys": hora_pura,
                        "clausumsys": sUsuario,
                        "claestmsys": sNomEst,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO gdocbTipoClaves (
                    clacodigo, cladescri, clastatus,
                    clafecisys, clahorisys, clausuisys, claestisys,
                    clafecmsys, clahormsys, clausumsys, claestmsys
                ) VALUES (
                    :clacodigo, :cladescri, :clastatus,
                    :clafecisys, :clahorisys, :clausuisys, :claestisys,
                    :clafecmsys, :clahormsys, :clausumsys, :claestmsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {"data": "Tipos de credencial insertados exitosamente", "inserted": len(to_insert)}
