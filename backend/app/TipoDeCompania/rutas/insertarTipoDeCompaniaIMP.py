from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.TipoDeCompania import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos el helper de validación que creamos en el paso anterior[cite: 19]
from app.TipoDeCompania.rutas.validarTipoDeCompaniaIMP import validar_tipodecompania


@bp.route("/insertarTipoDeCompaniaIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarTipoDeCompaniaIMP():
    # 1. Extracción de sesión[cite: 19]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras[cite: 19]
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

    # Nota: No inyectamos ciacodigo porque la tabla se rige globalmente por tpcodigo.

    with engine.connect() as connection:
        with connection.begin():
            # 3. Validación de seguridad final antes de insertar[cite: 19]
            rows, summary = validar_tipodecompania(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. Preparación de datos limpios para inserción masiva[cite: 19]
            to_insert = []
            for fila in rows:
                tpobservacion = fila.get("tpobservacion")
                tpobservacion_clean = str(tpobservacion).strip().upper()[:255] if tpobservacion else None

                to_insert.append(
                    {
                        "tpcodigo": str(fila.get("tpcodigo", "")).strip().upper()[:3],
                        "tpdescripcion": str(fila.get("tpdescripcion", "")).strip().upper()[:100],
                        "tpobservacion": tpobservacion_clean,
                        "tpstatus": str(fila.get("tpstatus", "A")).strip().upper()[:1],
                        # Auditoría separada en fechas y horas puras[cite: 19]
                        "tpfecisys": fecha_pura,
                        "tphorisys": hora_pura,
                        "tpusuisys": str(sUsuario)[:10],
                        "tpestisys": str(sNomEst)[:50],
                        "tpfecmsys": fecha_pura,
                        "tphormsys": hora_pura,
                        "tpusumsys": str(sUsuario)[:10],
                        "tpestmsys": str(sNomEst)[:50],
                    }
                )

            # 5. Ejecución optimizada de SQL[cite: 19]
            insert_sql = text(
                """
                INSERT INTO siactipocompania (
                    tpcodigo, tpdescripcion, tpobservacion, tpstatus,
                    tpfecisys, tphorisys, tpusuisys, tpestisys,
                    tpfecmsys, tphormsys, tpusumsys, tpestmsys
                ) VALUES (
                    :tpcodigo, :tpdescripcion, :tpobservacion, :tpstatus,
                    :tpfecisys, :tphorisys, :tpusuisys, :tpestisys,
                    :tpfecmsys, :tphormsys, :tpusumsys, :tpestmsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Tipos de Compañía insertados exitosamente",
        "inserted": len(to_insert),
    }
