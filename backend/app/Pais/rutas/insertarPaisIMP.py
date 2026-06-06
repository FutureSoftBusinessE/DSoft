from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.Pais import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.Pais.rutas.validarPaisIMP import validar_pais


@bp.route("/insertarPaisIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarPaisIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

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
            rows, summary = validar_pais(connection, columns, required, key_columns, rows_csv)

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
                        "paiscodigo": fila.get("paiscodigo"),
                        "paisdescri": fila.get("paisdescri"),
                        "paisstatus": fila.get("paisstatus", "A"),
                        "paisfecsys": datetime.now().replace(hour=0, minute=0, second=0, microsecond=0),
                        "paishorsys": datetime.now().replace(year=1900, month=1, day=1, microsecond=0),
                        "paisususys": sUsuario,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO hotbpais (
                    paiscodigo, paisdescri, paisstatus,
                    paisfecsys, paishorsys, paisususys
                ) VALUES (
                    :paiscodigo, :paisdescri, :paisstatus,
                    :paisfecsys, :paishorsys, :paisususys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Países insertados exitosamente",
        "inserted": len(to_insert),
    }
