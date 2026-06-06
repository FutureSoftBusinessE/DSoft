from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.TipoDocumento import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.TipoDocumento.rutas.validarTipoDocumentoIMP import validar_tipodoc


@bp.route("/insertarTipoDocumentoIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarTipoDocumentoIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)
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

    # Inyectar ciacodigo desde JWT si la tabla lo usa como clave
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            rows, summary = validar_tipodoc(connection, columns, required, key_columns, rows_csv)

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
                        "ciacodigo": sCodCia,
                        "tipdoccodigo": fila.get("tipdoccodigo"),
                        "tipdocdescri": fila.get("tipdocdescri"),
                        "tipdocstatus": fila.get("tipdocstatus", "A"),
                        "tipdocfechorisys": now,
                        "tipdocusuisys": sUsuario,
                        "tipdocestisys": sNomEst,
                        "tipdocfechormsys": now,
                        "tipdocusumsys": sUsuario,
                        "tipdocestmsys": sNomEst,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO gdocbtipodoc (
                    ciacodigo, tipdoccodigo, tipdocdescri, tipdocstatus,
                    tipdocfechorisys, tipdocusuisys, tipdocestisys,
                    tipdocfechormsys, tipdocusumsys, tipdocestmsys
                ) VALUES (
                    :ciacodigo, :tipdoccodigo, :tipdocdescri, :tipdocstatus,
                    :tipdocfechorisys, :tipdocusuisys, :tipdocestisys,
                    :tipdocfechormsys, :tipdocusumsys, :tipdocestmsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Tipos de documento insertados exitosamente",
        "inserted": len(to_insert),
    }
