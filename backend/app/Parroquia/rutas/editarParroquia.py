from flask import jsonify, request
from app.Parroquia import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api actualiza una parroquia
@bp.route("/editarParroquia", methods=["POST"])
@jwt_required()
@api_endpoint
def editarParroquia():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    parrocodigo_old = data.get("parrocodigoOld")
    parrocodigo_new = data.get("parrocodigoNew")
    parrodescri = data.get("parrodescri")
    parrostatus = data.get("parrostatus")

    if not parrocodigo_new:
        raise ValidationError("Código de parroquia requerido")

    if not parrodescri:
        raise ValidationError("Descripción de parroquia requerida")

    parrocodigo_new = str(parrocodigo_new).strip()
    parrodescri = str(parrodescri).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "parrocodigo": 6,
        "parrodescri": 120,
        "parrostatus": 1,
        "parroususys": 10,
        "parroestsys": 50,
    }

    if parrocodigo_new and len(str(parrocodigo_new)) > max_lengths["parrocodigo"]:
        raise ValidationError(f"parrocodigo excede {max_lengths['parrocodigo']} caracteres")
    if parrodescri and len(str(parrodescri)) > max_lengths["parrodescri"]:
        raise ValidationError(f"parrodescri excede {max_lengths['parrodescri']} caracteres")
    if parrostatus and len(str(parrostatus)) > max_lengths["parrostatus"]:
        raise ValidationError(f"parrostatus excede {max_lengths['parrostatus']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Actualizo el Registro
            data_cxcbparroquia_update = {
                "parrocodigoOld": parrocodigo_old,
                "parrocodigoNew": parrocodigo_new,
                "parrodescri": parrodescri,
                "parrostatus": parrostatus,
            }

            update_query = text(
                """
                UPDATE cxcbparroquia
                SET parrocodigo = :parrocodigoNew,
                    parrodescri = :parrodescri,
                    parrostatus = :parrostatus
                WHERE parrocodigo = :parrocodigoOld
            """
            )

            try:
                connection.execute(update_query, data_cxcbparroquia_update)
            except IntegrityError:
                raise ValidationError("No se puede editar la parroquia porque existen registros relacionados")

    return {"data": "Parroquia actualizada exitosamente"}
