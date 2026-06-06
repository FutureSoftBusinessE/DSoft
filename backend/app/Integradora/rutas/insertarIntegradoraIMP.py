from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.Integradora import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.Integradora.rutas.validarIntegradoraIMP import validar_integradora


@bp.route("/insertarIntegradoraIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarIntegradoraIMP():
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
            rows, summary = validar_integradora(connection, columns, required, key_columns, rows_csv)

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
                # Extraer codigo de objetos si vienen como {'codigo': 'X', 'descripcion': 'Y'}
                integraidentifica_val = fila.get("integraidentifica")
                if isinstance(integraidentifica_val, dict):
                    integraidentifica_val = integraidentifica_val.get("codigo")

                sectorcodigo_val = fila.get("sectorcodigo")
                if isinstance(sectorcodigo_val, dict):
                    sectorcodigo_val = sectorcodigo_val.get("codigo")

                to_insert.append(
                    {
                        "integracodigo": fila.get("integracodigo"),
                        "integradescri": fila.get("integradescri"),
                        "integradirecc": fila.get("integradirecc"),
                        "integrafono": fila.get("integrafono"),
                        "integrastatus": fila.get("integrastatus", "A"),
                        "integrafecisys": now,
                        "integrahorisys": now.replace(year=1900, month=1, day=1, microsecond=0),
                        "integrausuisys": sUsuario,
                        "integraestisys": sNomEst,
                        "integrafecmsys": now,
                        "integrahormsys": now.replace(year=1900, month=1, day=1, microsecond=0),
                        "integrausumsys": sUsuario,
                        "integraestmsys": sNomEst,
                        "integraruc": fila.get("integraruc"),
                        "integraidentifica": integraidentifica_val,
                        "integratipo": fila.get("integratipo", "I"),
                        "sectorcodigo": sectorcodigo_val,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO fabintegra (
                    integracodigo, integradescri, integradirecc, integrafono, integrastatus,
                    integrafecisys, integrahorisys, integrausuisys, integraestisys,
                    integrafecmsys, integrahormsys, integrausumsys, integraestmsys,
                    integraruc, integraidentifica, integratipo, sectorcodigo
                ) VALUES (
                    :integracodigo, :integradescri, :integradirecc, :integrafono, :integrastatus,
                    :integrafecisys, :integrahorisys, :integrausuisys, :integraestisys,
                    :integrafecmsys, :integrahormsys, :integrausumsys, :integraestmsys,
                    :integraruc, :integraidentifica, :integratipo, :sectorcodigo
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Integradoras insertadas exitosamente",
        "inserted": len(to_insert),
    }
