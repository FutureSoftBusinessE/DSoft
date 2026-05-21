from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.PresentacionesINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos la función de validación del módulo Presentaciones
from app.PresentacionesINV.rutas.validarPresentacionesINVIMP import validar_presentacionesinv


@bp.route("/insertarPresentacionesINVIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarPresentacionesINVIMP():
    # 1. Extracción de contexto y auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # 2. Lógica de separación de Fecha y Hora pura para SQL Server
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Inyectamos la compañía antes de validar para el cumplimiento Multitenancy
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            # 3. Validación previa a la inserción
            rows, summary = validar_presentacionesinv(connection, columns, required, key_columns, rows_csv)

            # Si existen registros inválidos, frenamos el proceso y devolvemos el feedback
            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se realizó la importación: existen errores de validación",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. Preparación del lote para inserción masiva en la tabla inbpre
            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "precodigo": str(fila.get("precodigo", "")).strip().upper()[:2],
                        "predescri": str(fila.get("predescri", "")).strip().upper()[:30],
                        "prestatus": str(fila.get("prestatus", "A")).strip().upper()[:1],
                        # Auditoría de Inserción (Truncado a varchar(10) según inbpre)
                        "prefecisys": fecha_pura,
                        "prehorisys": hora_pura,
                        "preusuisys": sUsuario[:10],
                        # Auditoría de Modificación
                        "prefecmsys": fecha_pura,
                        "prehormsys": hora_pura,
                        "preusumsys": sUsuario[:10],
                    }
                )

            # 5. Ejecución del INSERT masivo en SQL Server
            insert_sql = text(
                """
                INSERT INTO inbpre (
                    ciacodigo, precodigo, predescri, prestatus,
                    prefecisys, prehorisys, preusuisys,
                    prefecmsys, prehormsys, preusumsys
                ) VALUES (
                    :ciacodigo, :precodigo, :predescri, :prestatus,
                    :prefecisys, :prehorisys, :preusuisys,
                    :prefecmsys, :prehormsys, :preusumsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {"data": "Presentaciones de inventario importadas exitosamente", "inserted": len(to_insert)}
