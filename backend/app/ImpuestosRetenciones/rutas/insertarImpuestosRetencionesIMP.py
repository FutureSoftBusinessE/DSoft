from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.ImpuestosRetenciones import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.ImpuestosRetenciones.rutas.validarImpuestosRetencionesIMP import validar_impuestos_retenciones


@bp.route("/insertarImpuestosRetencionesIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarImpuestosRetencionesIMP():
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
            rows, summary = validar_impuestos_retenciones(connection, columns, required, key_columns, rows_csv)

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
                        "impid": fila.get("impid"),
                        "impdescri": fila.get("impdescri"),
                        "impctadol": fila.get("impctanor", ""),
                        "impctanor": fila.get("impctanor", ""),
                        "impporcent": fila.get("impporcent", 0),
                        "impesiva": fila.get("impesiva"),
                        "impaplica": fila.get("impaplica"),
                        "impstatus": fila.get("impstatus", "A"),
                        "impretimp": fila.get("impretimp"),
                        "codSRI": fila.get("codSRI", ""),
                        "desSRI": fila.get("desSRI", ""),
                        "impbienser": fila.get("impbienser"),
                        "impfecisys": fecha_actual,
                        "imphorisys": hora_sys,
                        "impusuisys": sUsuario,
                        "impfecmsys": fecha_actual,
                        "imphormsys": hora_sys,
                        "impusumsys": sUsuario,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO cxpbimp (
                    ciacodigo, impid, impdescri, impctadol, impctanor, impporcent, impesiva,
                    impaplica, impstatus, impretimp, codSRI, desSRI, impbienser,
                    impfecisys, imphorisys, impusuisys,
                    impfecmsys, imphormsys, impusumsys
                ) VALUES (
                    :ciacodigo, :impid, :impdescri, :impctadol, :impctanor, :impporcent, :impesiva,
                    :impaplica, :impstatus, :impretimp, :codSRI, :desSRI, :impbienser,
                    :impfecisys, :imphorisys, :impusuisys,
                    :impfecmsys, :imphormsys, :impusumsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Impuestos/Retenciones insertados exitosamente",
        "inserted": len(to_insert),
    }
