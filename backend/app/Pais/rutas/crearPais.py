from flask import jsonify, request
from app.Pais import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api crea un país
@bp.route("/crearPais", methods=["POST"])
@jwt_required()
@api_endpoint
def crearPais():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Obtener la fecha y horas
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    paiscodigo = data.get("paiscodigo")
    paisdescri = data.get("paisdescri")
    paisstatus = data.get("paisstatus", "A")  # Por defecto activo

    if paiscodigo is None or paiscodigo.strip() == "":
        raise ValidationError("Código de país requerido")

    if paisdescri is None or paisdescri.strip() == "":
        raise ValidationError("Descripción de país requerida")

    paiscodigo = str(paiscodigo).strip()
    paisdescri = str(paisdescri).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "paiscodigo": 3,
        "paisdescri": 20,
        "paisstatus": 1,
        "paisususys": 10,
    }

    if len(paiscodigo) > max_lengths["paiscodigo"]:
        raise ValidationError(f"paiscodigo excede {max_lengths['paiscodigo']} caracteres")
    if len(paisdescri) > max_lengths["paisdescri"]:
        raise ValidationError(f"paisdescri excede {max_lengths['paisdescri']} caracteres")
    if paisstatus and len(str(paisstatus)) > max_lengths["paisstatus"]:
        raise ValidationError(f"paisstatus excede {max_lengths['paisstatus']} caracteres")
    if sUsuario and len(str(sUsuario)) > max_lengths["paisususys"]:
        raise ValidationError(f"paisususys (usuario) excede {max_lengths['paisususys']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            data_hotbpais = {
                "paiscodigo": paiscodigo,
                "paisdescri": paisdescri,
                "paisstatus": paisstatus,
                "paisfecsys": fecha_actual,
                "paishorsys": hora_sys,
                "paisususys": sUsuario,
            }

            data_getAll = {
                "paiscodigo": paiscodigo,
            }
            getAll = text("SELECT paiscodigo FROM hotbpais WHERE paiscodigo = :paiscodigo")
            result = connection.execute(getAll, data_getAll).mappings().fetchone()
            if result:
                raise ValidationError("País ya existe")

            insert_query = text(
                """
                INSERT INTO hotbpais (
                    paiscodigo, paisdescri, paisstatus, paisfecsys, paishorsys, paisususys
                ) VALUES (
                    :paiscodigo, :paisdescri, :paisstatus, :paisfecsys, :paishorsys, :paisususys
                )
            """
            )

            connection.execute(insert_query, data_hotbpais)

    return {"data": "País creado exitosamente"}
