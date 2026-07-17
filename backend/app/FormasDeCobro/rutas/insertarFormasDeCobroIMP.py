from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.FormasDeCobro import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos el helper de validación con el nombre corregido en el paso anterior [cite: 67]
from app.FormasDeCobro.rutas.validarFormasDeCobroIMP import validar_formas_cobro


@bp.route("/insertarFormasDeCobroIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarFormasDeCobroIMP():
    # 1. Extracción de sesión [cite: 67]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # 2. Lógica de separación de Fecha y Hora puras según estándar SIAC [cite: 67, 68]
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

    # 3. Inyectar ciacodigo desde JWT a todas las filas [cite: 68]
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            # 4. Validación de seguridad final antes de insertar [cite: 69]
            rows, summary = validar_formas_cobro(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 5. Preparación de datos limpios para inserción masiva [cite: 71, 72]
            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "factippag": str(fila.get("factippag", "")).strip().upper()[:3],
                        "fordescri": str(fila.get("fordescri", "")).strip().upper()[:40],
                        "fordias": float(fila.get("fordias", 0)),
                        "fortipo": str(fila.get("fortipo", "")).strip().upper()[:2],
                        "forcuotas": int(fila.get("forcuotas", 0)),
                        "forstatus": str(fila.get("forstatus", "A")).strip().upper()[:1],
                        # Auditoría separada en fechas y horas puras [cite: 73, 74, 75]
                        # (Nota: La tabla cxcbformapag no usa estisys/estmsys, por lo que se omiten)
                        "forfecisys": fecha_pura,
                        "forhorisys": hora_pura,
                        "forusuisys": str(sUsuario)[:10],
                        "forfecmsys": fecha_pura,
                        "forhormsys": hora_pura,
                        "forusumsys": str(sUsuario)[:10],
                    }
                )

            # 6. Ejecución optimizada de SQL [cite: 75, 76]
            insert_sql = text(
                """
                INSERT INTO cxcbformapag (
                    ciacodigo, factippag, fordescri, fordias, fortipo, forcuotas, forstatus,
                    forfecisys, forhorisys, forusuisys,
                    forfecmsys, forhormsys, forusumsys
                ) VALUES (
                    :ciacodigo, :factippag, :fordescri, :fordias, :fortipo, :forcuotas, :forstatus,
                    :forfecisys, :forhorisys, :forusuisys,
                    :forfecmsys, :forhormsys, :forusumsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {"data": "Formas de Cobro insertadas exitosamente", "inserted": len(to_insert)}
