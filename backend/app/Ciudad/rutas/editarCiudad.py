from flask import jsonify, request
from app.Ciudad import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api actualiza una ciudad
@bp.route("/editarCiudad", methods=["POST"])
@jwt_required()
@api_endpoint
def editarCiudad():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    ciucodigo_old = data.get("ciucodigoOld")
    ciucodigo_new = data.get("ciucodigoNew")
    ciudescri = data.get("ciudescri")
    ciustatus = data.get("ciustatus")
    ciudinardap = data.get("ciudinardap")

    if not ciucodigo_new:
        raise ValidationError("Código de ciudad requerido")

    if not ciudescri:
        raise ValidationError("Descripción de ciudad requerida")

    # El código no puede ser modificado
    if str(ciucodigo_new).strip() != str(ciucodigo_old).strip():
        raise ValidationError("El código de ciudad no puede ser modificado")

    ciucodigo_new = str(ciucodigo_new).strip()
    ciudescri = str(ciudescri).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "ciucodigo": 3,
        "ciudescri": 50,
        "ciustatus": 1,
        "ciuususys": 10,
        "ciudinardap": 2,
    }

    if ciucodigo_new and len(str(ciucodigo_new)) > max_lengths["ciucodigo"]:
        raise ValidationError(f"ciucodigo excede {max_lengths['ciucodigo']} caracteres")
    if ciudescri and len(str(ciudescri)) > max_lengths["ciudescri"]:
        raise ValidationError(f"ciudescri excede {max_lengths['ciudescri']} caracteres")
    if ciustatus and len(str(ciustatus)) > max_lengths["ciustatus"]:
        raise ValidationError(f"ciustatus excede {max_lengths['ciustatus']} caracteres")
    if ciudinardap and len(str(ciudinardap)) > max_lengths["ciudinardap"]:
        raise ValidationError(f"ciudinardap excede {max_lengths['ciudinardap']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Actualizo el Registro
            data_hotbciu_update = {
                "ciucodigoOld": ciucodigo_old,
                "ciucodigoNew": ciucodigo_new,
                "ciudescri": ciudescri,
                "ciustatus": ciustatus,
                "ciudinardap": ciudinardap,
            }

            update_query = text(
                """
                UPDATE hotbciu
                SET ciucodigo = :ciucodigoNew,
                    ciudescri = :ciudescri,
                    ciustatus = :ciustatus,
                    ciudinardap = :ciudinardap
                WHERE ciucodigo = :ciucodigoOld
            """
            )

            try:
                connection.execute(update_query, data_hotbciu_update)
            except IntegrityError:
                raise ValidationError("No se puede editar la ciudad porque existen registros relacionados")

    return {"data": "Ciudad actualizada exitosamente"}
