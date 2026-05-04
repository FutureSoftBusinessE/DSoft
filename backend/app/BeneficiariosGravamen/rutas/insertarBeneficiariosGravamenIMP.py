from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.BeneficiariosGravamen import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.BeneficiariosGravamen.rutas.validarBeneficiariosGravamenIMP import validar_beneficiariogravamen


@bp.route("/insertarBeneficiariosGravamenIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarBeneficiariosGravamenIMP():
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
            rows, summary = validar_beneficiariogravamen(connection, columns, required, key_columns, rows_csv)

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
                        "benegravamen": fila.get("benegravamen"),
                        "benegrafecisys": now,
                        "benegrausuisys": sUsuario,
                        "benegraestisys": sNomEst,
                        "benegrafecmsys": now,
                        "benegrausumsys": sUsuario,
                        "benegraestmsys": sNomEst,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO PredbGravBene (
                    ciacodigo, benegravamen,
                    benegrafecisys, benegrausuisys, benegraestisys,
                    benegrafecmsys, benegrausumsys, benegraestmsys
                ) VALUES (
                    :ciacodigo, :benegravamen,
                    :benegrafecisys, :benegrausuisys, :benegraestisys,
                    :benegrafecmsys, :benegrausumsys, :benegraestmsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {"data": "Beneficiarios de Gravamen insertados exitosamente", "inserted": len(to_insert)}
