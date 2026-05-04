from flask import jsonify, request
from app.Ciudad import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api crea una ciudad
@bp.route("/crearCiudad", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def crearCiudad():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Obtener la fecha y horas
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    ciucodigo = data.get("ciucodigo") or ""
    ciudescri = data.get("ciudescri")
    ciustatus = data.get("ciustatus", "A")  # Por defecto activo
    ciudinardap = data.get("ciudinardap")

    if ciudescri is None or ciudescri.strip() == "":
        raise ValidationError("Descripción de ciudad requerida")

    # Auto-generar código si no se proporciona
    if not ciucodigo or ciucodigo.strip() == "":
        db.session = get_session(clicianonBD)
        engine = db.session.bind
        with engine.connect() as connection:
            with connection.begin():
                query = text("SELECT ciucodigo FROM hotbciu")
                rows = connection.execute(query).mappings().fetchall()
                numeric_codes = [int(str(row.get("ciucodigo", "")).strip()) for row in rows if str(row.get("ciucodigo", "")).strip().isdigit()]
                next_code = (max(numeric_codes) + 1) if numeric_codes else 1
                if next_code > 999:
                    raise ValidationError("No se puede generar más códigos de ciudad (máximo 999)")
                ciucodigo = str(next_code).zfill(3)

    ciucodigo = str(ciucodigo).strip()
    ciudescri = str(ciudescri).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "ciucodigo": 3,
        "ciudescri": 50,
        "ciustatus": 1,
        "ciuususys": 10,
        "ciudinardap": 2,
    }

    if len(ciucodigo) > max_lengths["ciucodigo"]:
        raise ValidationError(f"ciucodigo excede {max_lengths['ciucodigo']} caracteres")
    if len(ciudescri) > max_lengths["ciudescri"]:
        raise ValidationError(f"ciudescri excede {max_lengths['ciudescri']} caracteres")
    if ciustatus and len(str(ciustatus)) > max_lengths["ciustatus"]:
        raise ValidationError(f"ciustatus excede {max_lengths['ciustatus']} caracteres")
    if sUsuario and len(str(sUsuario)) > max_lengths["ciuususys"]:
        raise ValidationError(f"ciuususys (usuario) excede {max_lengths['ciuususys']} caracteres")
    if ciudinardap and len(str(ciudinardap)) > max_lengths["ciudinardap"]:
        raise ValidationError(f"ciudinardap excede {max_lengths['ciudinardap']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            data_hotbciu = {
                "ciucodigo": ciucodigo,
                "ciudescri": ciudescri,
                "ciustatus": ciustatus,
                "ciufecsys": fecha_actual,
                "ciuhorsys": hora_sys,
                "ciuususys": sUsuario,
                "ciudinardap": ciudinardap,
            }

            data_getAll = {
                "ciucodigo": ciucodigo,
            }
            getAll = text("SELECT ciucodigo FROM hotbciu WHERE ciucodigo = :ciucodigo")
            result = connection.execute(getAll, data_getAll).mappings().fetchone()
            if result:
                raise ValidationError("Ciudad ya existe")

            insert_query = text(
                """
                INSERT INTO hotbciu (
                    ciucodigo, ciudescri, ciustatus, ciufecsys, ciuhorsys, ciuususys, ciudinardap
                ) VALUES (
                    :ciucodigo, :ciudescri, :ciustatus, :ciufecsys, :ciuhorsys, :ciuususys, :ciudinardap
                )
            """
            )

            connection.execute(insert_query, data_hotbciu)

    return {"data": "Ciudad creada exitosamente"}
