from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.MarcasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos la función de validación del módulo Marcas
from app.MarcasINV.rutas.validarMarcasINVIMP import validar_marcasinv


@bp.route("/insertarMarcasINVIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarMarcasINVIMP():
    # 1. Extracción de contexto y auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    # sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

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
            rows, summary = validar_marcasinv(connection, columns, required, key_columns, rows_csv)

            # Si existen registros inválidos, frenamos el proceso y devolvemos el feedback
            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se realizó la importación: existen errores de validación",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. Preparación del lote para inserción masiva en la tabla inbmar
            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "marcodigo": str(fila.get("marcodigo", "")).strip().upper()[:5],
                        "mardescri": str(fila.get("mardescri", "")).strip().upper()[:30],
                        "marstatus": str(fila.get("marstatus", "A")).strip().upper()[:1],
                        # Auditoría de Inserción
                        "marfecisys": fecha_pura,
                        "marhorisys": hora_pura,
                        "marusuisys": sUsuario[:10],
                        # Auditoría de Modificación
                        "marfecmsys": fecha_pura,
                        "marhormsys": hora_pura,
                        "marusumsys": sUsuario[:10],
                    }
                )

            # 5. Ejecución del INSERT masivo en SQL Server
            insert_sql = text(
                """
                INSERT INTO inbmar (
                    ciacodigo, marcodigo, mardescri, marstatus,
                    marfecisys, marhorisys, marusuisys,
                    marfecmsys, marhormsys, marusumsys
                ) VALUES (
                    :ciacodigo, :marcodigo, :mardescri, :marstatus,
                    :marfecisys, :marhorisys, :marusuisys,
                    :marfecmsys, :marhormsys, :marusumsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {"data": "Marcas de inventario importadas exitosamente", "inserted": len(to_insert)}
