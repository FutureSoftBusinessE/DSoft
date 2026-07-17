from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.ExcepcionesdeIVA import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos el helper de validación que creamos en el paso anterior[cite: 23]
from app.ExcepcionesdeIVA.rutas.validarExcepcionesdeIVAIMP import (
    validar_excepciones_iva,
)


@bp.route("/insertarExcepcionesdeIVAIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarExcepcionesdeIVAIMP():
    # 1. Extracción de sesión[cite: 23]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras[cite: 23]
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

    # Nota: No inyectamos ciacodigo porque la tabla se rige por ivetipocompania.

    with engine.connect() as connection:
        with connection.begin():
            # 3. Validación de seguridad final antes de insertar[cite: 23]
            rows, summary = validar_excepciones_iva(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. Preparación de datos limpios para inserción masiva[cite: 23]
            to_insert = []
            for fila in rows:
                # Casteos seguros para evitar caída por formato CSV
                try:
                    pct_actual = float(fila.get("iveporcentajeactual", 0))
                except (ValueError, TypeError):
                    pct_actual = 0.0

                try:
                    pct_resolucion = float(fila.get("iveporcentajeresolucion", 0))
                except (ValueError, TypeError):
                    pct_resolucion = 0.0

                # Limpieza de nulos y fechas
                ivenumresolucion = str(fila.get("ivenumresolucion", "")).strip().upper()[:30] if fila.get("ivenumresolucion") else None
                ivemotivo = str(fila.get("ivemotivo", "")).strip().upper()[:255] if fila.get("ivemotivo") else None
                ivefecinicio = str(fila.get("ivefecinicio", "")).split(" ")[0].strip()
                ivefectermino = str(fila.get("ivefectermino", "")).split(" ")[0].strip()

                to_insert.append(
                    {
                        "ivetipocompania": str(fila.get("ivetipocompania", "")).strip().upper()[:3],
                        "ivefecinicio": ivefecinicio,
                        "ivefectermino": ivefectermino,
                        "iveporcentajeactual": pct_actual,
                        "iveporcentajeresolucion": pct_resolucion,
                        "ivenumresolucion": ivenumresolucion,
                        "ivemotivo": ivemotivo,
                        "ivestatus": str(fila.get("ivestatus", "A")).strip().upper()[:1],
                        # Auditoría separada en fechas y horas puras[cite: 23]
                        "ivefecisys": fecha_pura,
                        "ivehorisys": hora_pura,
                        "iveusuisys": str(sUsuario)[:10],
                        "iveestisys": str(sNomEst)[:50],
                        "ivefecmsys": fecha_pura,
                        "ivehormsys": hora_pura,
                        "iveusumsys": str(sUsuario)[:10],
                        "iveestmsys": str(sNomEst)[:50],
                    }
                )

            # 5. Ejecución optimizada de SQL[cite: 23]
            insert_sql = text(
                """
                INSERT INTO siacivaexcepcion (
                    ivetipocompania, ivefecinicio, ivefectermino,
                    iveporcentajeactual, iveporcentajeresolucion, ivenumresolucion,
                    ivemotivo, ivestatus,
                    ivefecisys, ivehorisys, iveusuisys, iveestisys,
                    ivefecmsys, ivehormsys, iveusumsys, iveestmsys
                ) VALUES (
                    :ivetipocompania, :ivefecinicio, :ivefectermino,
                    :iveporcentajeactual, :iveporcentajeresolucion, :ivenumresolucion,
                    :ivemotivo, :ivestatus,
                    :ivefecisys, :ivehorisys, :iveusuisys, :iveestisys,
                    :ivefecmsys, :ivehormsys, :iveusumsys, :iveestmsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Excepciones de IVA insertadas exitosamente",
        "inserted": len(to_insert),
    }
