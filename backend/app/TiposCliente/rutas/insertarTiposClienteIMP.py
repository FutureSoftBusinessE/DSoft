from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.TiposCliente import bp
from app.TiposCliente.rutas.common import ALL_COLUMNS, BIT_FIELDS, prepare_insert_payload, TABLE_NAME
from app.TiposCliente.rutas.validarTiposClienteIMP import validar_tipos_cliente
from app.db import get_session
from app.extensions import db
from error_handling import api_endpoint


def normalize_checkbox_to_db(value):
    if value is None or value == "":
        return 0

    if isinstance(value, bool):
        return -1 if value else 0

    if isinstance(value, (int, float)):
        return 0 if int(value) == 0 else -1

    value_str = str(value).strip().lower()
    if value_str in {"1", "true", "t", "si", "sí", "y", "yes"}:
        return -1
    if value_str in {"0", "false", "f", "no", "n"}:
        return 0

    try:
        return 0 if int(float(value_str)) == 0 else -1
    except (ValueError, TypeError):
        return 0


@bp.route("/insertarTiposClienteIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarTiposClienteIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    data = request.get_json(silent=True) or {}
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            rows, summary = validar_tipos_cliente(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            to_insert = [prepare_insert_payload(row["data"], sUsuario) for row in rows]

            # Force company code for all imported rows
            sCodCia = claims["seleccion"]["cliciaciacodigo"]

            for payload in to_insert:
                payload["ciacodigo"] = sCodCia
                for field_name in BIT_FIELDS:
                    payload[field_name] = normalize_checkbox_to_db(payload.get(field_name))

            columns_sql = ", ".join(ALL_COLUMNS)
            values_sql = ", ".join([f":{column}" for column in ALL_COLUMNS])
            insert_query = text(f"INSERT INTO {TABLE_NAME} ({columns_sql}) VALUES ({values_sql})")
            connection.execute(insert_query, to_insert)

    return {
        "data": "Registros insertados exitosamente",
        "inserted": len(to_insert),
    }
