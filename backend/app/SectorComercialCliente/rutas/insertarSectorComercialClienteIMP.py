from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.SectorComercialCliente import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.SectorComercialCliente.rutas.validarSectorComercialClienteIMP import validar_sector_comercial_cliente


@bp.route("/insertarSectorComercialClienteIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarSectorComercialClienteIMP():
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
            rows, summary = validar_sector_comercial_cliente(connection, columns, required, key_columns, rows_csv)

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
                        "activicodigo": fila.get("activicodigo"),
                        "actividescri": fila.get("actividescri"),
                        "activistatus": fila.get("activistatus", "A"),
                        "activifecisys": now,
                        "activihorisys": now.replace(year=1900, month=1, day=1, microsecond=0),
                        "activiusuisys": sUsuario,
                        "activiestisys": sNomEst,
                        "activifecmsys": now,
                        "activihormsys": now.replace(year=1900, month=1, day=1, microsecond=0),
                        "activiusumsys": sUsuario,
                        "activiestmsys": sNomEst,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO cxcbacteconomicas (
                    activicodigo, actividescri, activistatus,
                    activifecisys, activihorisys, activiusuisys, activiestisys,
                    activifecmsys, activihormsys, activiusumsys, activiestmsys
                ) VALUES (
                    :activicodigo, :actividescri, :activistatus,
                    :activifecisys, :activihorisys, :activiusuisys, :activiestisys,
                    :activifecmsys, :activihormsys, :activiusumsys, :activiestmsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Sectores comerciales cliente insertados exitosamente",
        "inserted": len(to_insert),
    }
