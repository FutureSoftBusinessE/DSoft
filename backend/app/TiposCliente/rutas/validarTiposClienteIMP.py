from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.TiposCliente import bp
from app.TiposCliente.rutas.common import ALL_COLUMNS, PRIMARY_KEYS, TABLE_NAME
from app.db import get_session
from app.extensions import db
from error_handling import ValidationError, api_endpoint


def _normalize_columns(columns):
    if not columns:
        return ALL_COLUMNS.copy()
    return [str(column).strip() for column in columns if str(column).strip()]


def _normalize_required(required):
    base_required = {"ciacodigo", "clicodigo", "clinombre", "clidirec"}
    required_set = {str(column).strip() for column in (required or []) if str(column).strip()}
    required_set.update(base_required)
    return required_set


def _normalize_keys(key_columns):
    if not key_columns:
        return PRIMARY_KEYS.copy()
    keys = [str(column).strip() for column in key_columns if str(column).strip()]
    return keys or PRIMARY_KEYS.copy()


def _prepare_row(columns, row_data):
    normalized = {}

    for column in ALL_COLUMNS:
        if column in columns:
            normalized[column] = row_data.get(column)
        else:
            normalized[column] = None

    # Minimal VB-like default: if matrix name empty, copy from name
    if (normalized.get("clinommatriz") in (None, "")) and (normalized.get("clinombre") not in (None, "")):
        normalized["clinommatriz"] = normalized.get("clinombre")

    return normalized


def validar_tipos_cliente(connection, columns, required, key_columns, rows_csv):
    if not isinstance(rows_csv, list):
        raise ValidationError("rows debe ser un arreglo")

    normalized_columns = _normalize_columns(columns)
    normalized_required = _normalize_required(required)
    normalized_keys = _normalize_keys(key_columns)

    invalid_columns = [column for column in normalized_columns if column not in ALL_COLUMNS]
    if invalid_columns:
        raise ValidationError(f"Columnas inválidas en importación: {', '.join(invalid_columns)}")

    invalid_required = [column for column in normalized_required if column not in ALL_COLUMNS]
    if invalid_required:
        raise ValidationError(f"Columnas obligatorias inválidas: {', '.join(invalid_required)}")

    invalid_keys = [column for column in normalized_keys if column not in ALL_COLUMNS]
    if invalid_keys:
        raise ValidationError(f"Columnas llave inválidas: {', '.join(invalid_keys)}")

    results = []
    seen_keys = set()

    for index, row_data in enumerate(rows_csv, start=1):
        row_errors = []

        if not isinstance(row_data, dict):
            results.append(
                {
                    "row": index,
                    "is_valid": False,
                    "errors": ["Cada fila debe ser un objeto con columnas"],
                    "data": {},
                }
            )
            continue

        try:
            normalized_row = _prepare_row(normalized_columns, row_data)
        except ValidationError as exc:
            results.append(
                {
                    "row": index,
                    "is_valid": False,
                    "errors": [str(exc)],
                    "data": row_data,
                }
            )
            continue

        for required_field in normalized_required:
            if normalized_row.get(required_field) in (None, ""):
                row_errors.append(f"{required_field} es requerido")

        row_key = tuple(normalized_row.get(column) for column in normalized_keys)
        if any(value in (None, "") for value in row_key):
            row_errors.append(f"Las columnas llave no pueden estar vacías: {', '.join(normalized_keys)}")
        else:
            if row_key in seen_keys:
                row_errors.append("Clave duplicada dentro del archivo")
            seen_keys.add(row_key)

            where_clause = " AND ".join([f"{column} = :{column}" for column in normalized_keys])
            exists_query = text(f"SELECT 1 FROM {TABLE_NAME} WHERE {where_clause}")
            exists = connection.execute(exists_query, {column: normalized_row[column] for column in normalized_keys}).first()
            if exists:
                row_errors.append("El registro ya existe en base de datos")

        results.append(
            {
                "row": index,
                "is_valid": len(row_errors) == 0,
                "errors": row_errors,
                "data": normalized_row,
            }
        )

    summary = {
        "total_rows": len(results),
        "valid_rows": sum(1 for row in results if row["is_valid"]),
        "invalid_rows": sum(1 for row in results if not row["is_valid"]),
    }

    return results, summary


@bp.route("/validarTiposClienteIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def validarTiposClienteIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json(silent=True) or {}
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Force company code on all rows and ensure ciacodigo is included in columns
            claim_cia = sCodCia
            if columns is None:
                columns = []
            if "ciacodigo" not in [str(c).strip() for c in columns]:
                columns = ["ciacodigo"] + columns

            if not isinstance(rows_csv, list):
                raise ValidationError("rows debe ser un arreglo")

            # override/insert ciacodigo in each row to prevent client override
            for row_data in rows_csv:
                if not isinstance(row_data, dict):
                    continue
                row_data["ciacodigo"] = claim_cia

            rows, summary = validar_tipos_cliente(connection, columns, required, key_columns, rows_csv)

    return {
        "data": "Validación completada",
        "rows": rows,
        "summary": summary,
    }
