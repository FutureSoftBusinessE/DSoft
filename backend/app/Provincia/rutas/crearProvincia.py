from flask import jsonify, request
from app.Provincia import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api crea una provincia
@bp.route("/crearProvincia", methods=["POST"])
@jwt_required()
@api_endpoint
def crearProvincia():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Obtener la fecha y horas
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    procodigo = data.get("procodigo") or ""
    prodescri = data.get("prodescri")
    prostatus = data.get("prostatus", "A")

    if prodescri is None or prodescri.strip() == "":
        raise ValidationError("Descripción de provincia requerida")

    # Auto-generar código si no se proporciona
    if not procodigo or procodigo.strip() == "":
        db.session = get_session(clicianonBD)
        engine = db.session.bind
        with engine.connect() as connection:
            with connection.begin():
                query = text("SELECT procodigo FROM rhbprov")
                rows = connection.execute(query).mappings().fetchall()
                numeric_codes = [int(str(row.get("procodigo", "")).strip()) for row in rows if str(row.get("procodigo", "")).strip().isdigit()]
                next_code = (max(numeric_codes) + 1) if numeric_codes else 1
                if next_code > 999:
                    raise ValidationError("No se puede generar más códigos de provincia (máximo 999)")
                procodigo = str(next_code).zfill(3)

    procodigo = str(procodigo).strip()
    prodescri = str(prodescri).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "procodigo": 3,
        "prodescri": 20,
        "prostatus": 1,
        "proususys": 10,
    }

    if len(procodigo) > max_lengths["procodigo"]:
        raise ValidationError(f"procodigo excede {max_lengths['procodigo']} caracteres")
    if len(prodescri) > max_lengths["prodescri"]:
        raise ValidationError(f"prodescri excede {max_lengths['prodescri']} caracteres")
    if prostatus and len(str(prostatus)) > max_lengths["prostatus"]:
        raise ValidationError(f"prostatus excede {max_lengths['prostatus']} caracteres")
    if sUsuario and len(str(sUsuario)) > max_lengths["proususys"]:
        raise ValidationError(f"proususys (usuario) excede {max_lengths['proususys']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            data_rhbprov = {
                "procodigo": procodigo,
                "prodescri": prodescri,
                "prostatus": prostatus,
                "profecsys": fecha_actual,
                "prohorsys": hora_sys,
                "proususys": sUsuario,
            }

            data_getAll = {
                "procodigo": procodigo,
            }
            getAll = text("SELECT procodigo FROM rhbprov WHERE procodigo = :procodigo")
            result = connection.execute(getAll, data_getAll).mappings().fetchone()
            if result:
                raise ValidationError("Provincia ya existe")

            insert_query = text(
                """
                INSERT INTO rhbprov (
                    procodigo, prodescri, prostatus, profecsys, prohorsys, proususys
                ) VALUES (
                    :procodigo, :prodescri, :prostatus, :profecsys, :prohorsys, :proususys
                )
            """
            )

            connection.execute(insert_query, data_rhbprov)

    return {"data": "Provincia creada exitosamente"}
