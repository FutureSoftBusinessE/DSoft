from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.VendedoresDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos la función de validación del módulo Vendedores
from app.VendedoresDF.rutas.validarVendedoresDFIMP import validar_vendedoresdf


@bp.route("/insertarVendedoresDFIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarVendedoresDFIMP():
    # 1. Extracción de contexto y auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora pura para SQL Server
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

    # Inyectamos la compañía antes de validar para el cumplimiento Multitenancy
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            # 3. Validación previa a la inserción
            rows, summary = validar_vendedoresdf(connection, columns, required, key_columns, rows_csv)

            # Si existen registros inválidos, frenamos el proceso y devolvemos el feedback
            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se realizó la importación: existen errores de validación",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. Preparación del lote para inserción masiva en la tabla fapvendedor
            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "vencodigo": str(fila.get("vencodigo", "")).strip().upper()[:3],
                        "vennombre": str(fila.get("vennombre", "")).strip().upper()[:30],
                        "vendireccion": str(fila.get("vendireccion", "")).strip().upper()[:40],
                        "ventelefono": str(fila.get("ventelefono", "")).strip()[:15],
                        "venstatus": str(fila.get("venstatus", "A")).strip().upper()[:1],

                        # Valores por defecto para campos técnicos
                        "vencomision": 0.0,
                        "ventipcom": "P",
                        "venaplica": "S",
                        "vencontacto": 0.0,
                        "usrcodigo": None,
                        "vencomisiona": 0,
                        "emcodemp": None,
                        "loccodigo": "01",
                        "pedidossiac": 0,
                        "pedidosweb": 0,
                        "pedidoswebart": 0,

                        # Auditoría de Inserción
                        "venfecisys": fecha_pura,
                        "venhorisys": hora_pura,
                        "venusuisys": sUsuario[:10],
                        "venestisys": sNomEst[:30] if sNomEst else "WEB",

                        # Auditoría de Modificación
                        "venfecmsys": fecha_pura,
                        "venhormsys": hora_pura,
                        "venusumsys": sUsuario[:10],
                        "venestmsys": sNomEst[:30] if sNomEst else "WEB",
                    }
                )

            # 5. Ejecución del INSERT masivo en SQL Server
            insert_sql = text(
                """
                INSERT INTO fapvendedor (
                    ciacodigo, vencodigo, vennombre, vendireccion, ventelefono,
                    vencomision, ventipcom, venaplica, vencontacto, venstatus,
                    venfecisys, venhorisys, venusuisys, venestisys,
                    venfecmsys, venhormsys, venusumsys, venestmsys,
                    usrcodigo, vencomisiona, emcodemp, loccodigo,
                    pedidossiac, pedidosweb, pedidoswebart
                ) VALUES (
                    :ciacodigo, :vencodigo, :vennombre, :vendireccion, :ventelefono,
                    :vencomision, :ventipcom, :venaplica, :vencontacto, :venstatus,
                    :venfecisys, :venhorisys, :venusuisys, :venestisys,
                    :venfecmsys, :venhormsys, :venusumsys, :venestmsys,
                    :usrcodigo, :vencomisiona, :emcodemp, :loccodigo,
                    :pedidossiac, :pedidosweb, :pedidoswebart
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {"data": "Vendedores importados exitosamente", "inserted": len(to_insert)}
