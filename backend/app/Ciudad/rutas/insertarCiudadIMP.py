from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.Ciudad import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.Ciudad.rutas.validarCiudadIMP import validar_ciudad


@bp.route("/insertarCiudadIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarCiudadIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    now = datetime.now()

    data = request.get_json()

    # Son las columnas de la tabla
    columns = data.get("columns")

    # Son las columnas que no pueden estar vacías (obligatorias)
    required = data.get("required")

    # Son las columnas que forman la clave (para las validaciones)
    key_columns = data.get("key_columns")

    # Son las filas con los datos del csv
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            rows, summary = validar_ciudad(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # insert
            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "ciucodigo": fila.get("ciucodigo"),
                        "ciudescri": fila.get("ciudescri"),
                        "ciustatus": fila.get("ciustatus", "A"),
                        "ciufecsys": now,
                        "ciuhorsys": now.replace(year=1900, month=1, day=1, microsecond=0),
                        "ciuususys": sUsuario,
                        "ciudinardap": fila.get("ciudinardap"),
                    }
                )

            insert_sql = text(
                """
                INSERT INTO hotbciu (
                    ciucodigo, ciudescri, ciustatus,
                    ciufecsys, ciuhorsys, ciuususys, ciudinardap
                ) VALUES (
                    :ciucodigo, :ciudescri, :ciustatus,
                    :ciufecsys, :ciuhorsys, :ciuususys, :ciudinardap
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Ciudades insertadas exitosamente",
        "inserted": len(to_insert),
    }
