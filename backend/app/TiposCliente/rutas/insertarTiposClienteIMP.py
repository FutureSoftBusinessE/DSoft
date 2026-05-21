from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.TiposCliente import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos la función de validación del módulo Tipos de Cliente
from app.TiposCliente.rutas.validarTiposClienteIMP import validar_tiposcliente


@bp.route("/insertarTiposClienteIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarTiposClienteIMP():
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
            rows, summary = validar_tiposcliente(connection, columns, required, key_columns, rows_csv)

            # Si existen registros inválidos, frenamos el proceso y devolvemos el feedback
            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se realizó la importación: existen errores de validación",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. Preparación del lote para inserción masiva en la tabla cxcbtipcli
            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "tipcodigo": str(fila.get("tipcodigo", "")).strip().upper()[:3],
                        "tipdescri": str(fila.get("tipdescri", "")).strip().upper()[:40],
                        "tipcobdir": int(fila.get("tipcobdir", 0)),
                        "tipstatus": str(fila.get("tipstatus", "A")).strip().upper()[:1],
                        "tipdefacr": float(fila.get("tipdefacr", 0)),
                        # Auditoría de Inserción (Truncado a varchar(10) según cxcbtipcli)
                        "tipfecisys": fecha_pura,
                        "tiphorisys": hora_pura,
                        "tipusuisys": sUsuario[:10],
                        # Auditoría de Modificación
                        "tipfecmsys": fecha_pura,
                        "tiphormsys": hora_pura,
                        "tipusumsys": sUsuario[:10],
                    }
                )

            # 5. Ejecución del INSERT masivo en SQL Server
            insert_sql = text(
                """
                INSERT INTO cxcbtipcli (
                    ciacodigo, tipcodigo, tipdescri, tipcobdir, tipstatus, tipdefacr,
                    tipfecisys, tiphorisys, tipusuisys,
                    tipfecmsys, tiphormsys, tipusumsys
                ) VALUES (
                    :ciacodigo, :tipcodigo, :tipdescri, :tipcobdir, :tipstatus, :tipdefacr,
                    :tipfecisys, :tiphorisys, :tipusuisys,
                    :tipfecmsys, :tiphormsys, :tipusumsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {"data": "Tipos de Cliente importados exitosamente", "inserted": len(to_insert)}
