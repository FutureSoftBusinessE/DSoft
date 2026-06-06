from flask import jsonify, request
from app.Parroquia import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api crea una parroquia
@bp.route("/crearParroquia", methods=["POST"])
@jwt_required()
@api_endpoint
def crearParroquia():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Obtener la fecha y horas
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener el estado del sistema desde headers
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    parrocodigo = data.get("parrocodigo")
    parrodescri = data.get("parrodescri")
    parrostatus = data.get("parrostatus", "A")

    if parrocodigo is None or parrocodigo.strip() == "":
        raise ValidationError("Código de parroquia requerido")

    if parrodescri is None or parrodescri.strip() == "":
        raise ValidationError("Descripción de parroquia requerida")

    parrocodigo = str(parrocodigo).strip()
    parrodescri = str(parrodescri).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "parrocodigo": 6,
        "parrodescri": 120,
        "parrostatus": 1,
        "parroususys": 10,
        "parroestsys": 50,
    }

    if len(parrocodigo) > max_lengths["parrocodigo"]:
        raise ValidationError(f"parrocodigo excede {max_lengths['parrocodigo']} caracteres")
    if len(parrodescri) > max_lengths["parrodescri"]:
        raise ValidationError(f"parrodescri excede {max_lengths['parrodescri']} caracteres")
    if parrostatus and len(str(parrostatus)) > max_lengths["parrostatus"]:
        raise ValidationError(f"parrostatus excede {max_lengths['parrostatus']} caracteres")
    if sUsuario and len(str(sUsuario)) > max_lengths["parroususys"]:
        raise ValidationError(f"parroususys (usuario) excede {max_lengths['parroususys']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            data_cxcbparroquia = {
                "parrocodigo": parrocodigo,
                "parrodescri": parrodescri,
                "parrostatus": parrostatus,
                "parrofecsys": fecha_actual,
                "parrohorsys": hora_sys,
                "parroususys": sUsuario,
                "parroestsys": sNomEst,
            }

            data_getAll = {
                "parrocodigo": parrocodigo,
            }
            getAll = text("SELECT parrocodigo FROM cxcbparroquia WHERE parrocodigo = :parrocodigo")
            result = connection.execute(getAll, data_getAll).mappings().fetchone()
            if result:
                raise ValidationError("Parroquia ya existe")

            insert_query = text(
                """
                INSERT INTO cxcbparroquia (
                    parrocodigo, parrodescri, parrostatus, parrofecsys, parrohorsys, parroususys, parroestsys
                ) VALUES (
                    :parrocodigo, :parrodescri, :parrostatus, :parrofecsys, :parrohorsys, :parroususys, :parroestsys
                )
            """
            )

            connection.execute(insert_query, data_cxcbparroquia)

    return {"data": "Parroquia creada exitosamente"}
