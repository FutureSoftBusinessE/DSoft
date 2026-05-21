from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.SectorialesIess import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos la función de validación del módulo Sectoriales
from app.SectorialesIess.rutas.validarSectorialesIessIMP import validar_sectorialesiess


@bp.route("/insertarSectorialesIessIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarSectorialesIessIMP():
    # 1. Extracción de contexto y auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora pura
    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')

    data = request.get_json()
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Inyectamos la compañía antes de validar
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            # 3. Validación previa a la inserción
            rows, summary = validar_sectorialesiess(connection, columns, required, key_columns, rows_csv)

            # Si existen registros inválidos, frenamos el proceso y devolvemos el feedback
            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se realizó la importación: existen errores de validación",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. Preparación del lote para inserción masiva
            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "seccodigo": str(fila.get("seccodigo", "")).strip().upper()[:15],
                        "secanio": int(fila.get("secanio", 0)),
                        "seccargo": str(fila.get("seccargo", "")).strip().upper()[:200],
                        "secestruc": str(fila.get("secestruc", "")).strip().upper()[:10],
                        "secdetalle": str(fila.get("secdetalle", "")).strip().upper()[:500],
                        "secsalario": float(fila.get("secsalario", 0)),
                        "secstatus": str(fila.get("secstatus", "A")).strip().upper()[:1],

                        # Auditoría de Inserción
                        "secfecisys": fecha_pura,
                        "sechorisys": hora_pura,
                        "secusuisys": sUsuario,
                        "secestisys": sNomEst,

                        # Auditoría de Modificación
                        "secfecmsys": fecha_pura,
                        "sechormsys": hora_pura,
                        "secusumsys": sUsuario,
                        "secestmsys": sNomEst,
                    }
                )

            # 5. Ejecución del INSERT masivo en SQL Server
            insert_sql = text(
                """
                INSERT INTO nomsectorialiess (
                    ciacodigo, seccodigo, secanio, seccargo, secestruc,
                    secdetalle, secsalario, secstatus,
                    secfecisys, sechorisys, secusuisys, secestisys,
                    secfecmsys, sechormsys, secusumsys, secestmsys
                ) VALUES (
                    :ciacodigo, :seccodigo, :secanio, :seccargo, :secestruc,
                    :secdetalle, :secsalario, :secstatus,
                    :secfecisys, :sechorisys, :secusuisys, :secestisys,
                    :secfecmsys, :sechormsys, :secusumsys, :secestmsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {"data": "Sectoriales del IESS importados exitosamente", "inserted": len(to_insert)}
