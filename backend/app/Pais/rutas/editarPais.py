from flask import jsonify, request
from app.Pais import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api actualiza un país
@bp.route("/editarPais", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def editarPais():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    paiscodigo_old = data.get("paiscodigoOld")
    paiscodigo_new = data.get("paiscodigoNew")
    paisdescri = data.get("paisdescri")
    paisstatus = data.get("paisstatus")

    if not paiscodigo_new:
        raise ValidationError("Código de país requerido")

    if not paisdescri:
        raise ValidationError("Descripción de país requerida")

    paiscodigo_new = str(paiscodigo_new).strip()
    paisdescri = str(paisdescri).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "paiscodigo": 3,
        "paisdescri": 20,
        "paisstatus": 1,
        "paisususys": 10,
    }

    if paiscodigo_new and len(str(paiscodigo_new)) > max_lengths["paiscodigo"]:
        raise ValidationError(f"paiscodigo excede {max_lengths['paiscodigo']} caracteres")
    if paisdescri and len(str(paisdescri)) > max_lengths["paisdescri"]:
        raise ValidationError(f"paisdescri excede {max_lengths['paisdescri']} caracteres")
    if paisstatus and len(str(paisstatus)) > max_lengths["paisstatus"]:
        raise ValidationError(f"paisstatus excede {max_lengths['paisstatus']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Actualizo el Registro
            data_hotbpais_update = {
                "paiscodigoOld": paiscodigo_old,
                "paiscodigoNew": paiscodigo_new,
                "paisdescri": paisdescri,
                "paisstatus": paisstatus,
            }

            update_query = text(
                """
                UPDATE hotbpais
                SET paiscodigo = :paiscodigoNew,
                    paisdescri = :paisdescri,
                    paisstatus = :paisstatus
                WHERE paiscodigo = :paiscodigoOld
            """
            )

            try:
                connection.execute(update_query, data_hotbpais_update)
            except IntegrityError:
                raise ValidationError("No se puede editar el país porque existen registros relacionados")

    return {"data": "País actualizado exitosamente"}
