from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime
from email.utils import parsedate_to_datetime

from app.Iva import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.Iva.rutas.validarIvaIMP import validar_iva


@bp.route("/insertarIvaIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarIvaIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

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
            rows, summary = validar_iva(connection, columns, required, key_columns, rows_csv)

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
                ivafecini_val = fila.get("ivafecini")

                # Convertir fecha si es string (formato HTTP/RFC 2822)
                if isinstance(ivafecini_val, str):
                    try:
                        ivafecini_val = parsedate_to_datetime(ivafecini_val)
                    except Exception:
                        pass

                to_insert.append(
                    {
                        "ivafecini": ivafecini_val,
                        "ivavalor": fila.get("ivavalor"),
                        "ivafecisys": fecha_actual,
                        "ivahorisys": hora_sys,
                        "ivausuisys": sUsuario,
                        "ivafecmsys": fecha_actual,
                        "ivahormsys": hora_sys,
                        "ivausumsys": sUsuario,
                        "ciacodigo": sCodCia,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO siaciva (
                    ivafecini, ivavalor,
                    ivafecisys, ivahorisys, ivausuisys,
                    ivafecmsys, ivahormsys, ivausumsys
                ) VALUES (
                    :ivafecini, :ivavalor,
                    :ivafecisys, :ivahorisys, :ivausuisys,
                    :ivafecmsys, :ivahormsys, :ivausumsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "IVA insertados exitosamente",
        "inserted": len(to_insert),
    }
