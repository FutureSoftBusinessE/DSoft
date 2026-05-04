from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.Provincia import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.Provincia.rutas.validarProvinciaIMP import validar_provincia


@bp.route("/insertarProvinciaIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarProvinciaIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
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
            rows, summary = validar_provincia(connection, columns, required, key_columns, rows_csv)

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
                        "procodigo": fila.get("procodigo"),
                        "prodescri": fila.get("prodescri"),
                        "prostatus": fila.get("prostatus", "A"),
                        "profecsys": now,
                        "prohorsys": now.replace(year=1900, month=1, day=1, microsecond=0),
                        "proususys": sUsuario,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO rhbprov (
                    procodigo, prodescri, prostatus,
                    profecsys, prohorsys, proususys
                ) VALUES (
                    :procodigo, :prodescri, :prostatus,
                    :profecsys, :prohorsys, :proususys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Provincias insertadas exitosamente",
        "inserted": len(to_insert),
    }
