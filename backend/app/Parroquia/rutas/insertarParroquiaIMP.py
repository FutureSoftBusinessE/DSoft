from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.Parroquia import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.Parroquia.rutas.validarParroquiaIMP import validar_parroquia


@bp.route("/insertarParroquiaIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarParroquiaIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)
    now = datetime.now()

    data = request.get_json()

    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            rows, summary = validar_parroquia(connection, columns, required, key_columns, rows_csv)

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
                        "parrocodigo": fila.get("parrocodigo"),
                        "parrodescri": fila.get("parrodescri"),
                        "parrostatus": fila.get("parrostatus", "A"),
                        "parrofecsys": now,
                        "parrohorsys": now.replace(year=1900, month=1, day=1, microsecond=0),
                        "parroususys": sUsuario,
                        "parroestsys": sNomEst,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO cxcbparroquia (
                    parrocodigo, parrodescri, parrostatus,
                    parrofecsys, parrohorsys, parroususys, parroestsys
                ) VALUES (
                    :parrocodigo, :parrodescri, :parrostatus,
                    :parrofecsys, :parrohorsys, :parroususys, :parroestsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Parroquias insertadas exitosamente",
        "inserted": len(to_insert),
    }
