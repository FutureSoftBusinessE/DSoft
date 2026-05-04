from flask import jsonify, request
from app.Provincia import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api actualiza una provincia
@bp.route("/editarProvincia", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def editarProvincia():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    procodigo_old = data.get("procodigoOld")
    procodigo_new = data.get("procodigoNew")
    prodescri = data.get("prodescri")
    prostatus = data.get("prostatus")

    if not procodigo_new:
        raise ValidationError("Código de provincia requerido")

    if not prodescri:
        raise ValidationError("Descripción de provincia requerida")

    # El código no puede ser modificado
    if str(procodigo_new).strip() != str(procodigo_old).strip():
        raise ValidationError("El código de provincia no puede ser modificado")

    procodigo_new = str(procodigo_new).strip()
    prodescri = str(prodescri).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "procodigo": 3,
        "prodescri": 20,
        "prostatus": 1,
        "proususys": 10,
    }

    if procodigo_new and len(str(procodigo_new)) > max_lengths["procodigo"]:
        raise ValidationError(f"procodigo excede {max_lengths['procodigo']} caracteres")
    if prodescri and len(str(prodescri)) > max_lengths["prodescri"]:
        raise ValidationError(f"prodescri excede {max_lengths['prodescri']} caracteres")
    if prostatus and len(str(prostatus)) > max_lengths["prostatus"]:
        raise ValidationError(f"prostatus excede {max_lengths['prostatus']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Actualizo el Registro
            data_rhbprov_update = {
                "procodigoOld": procodigo_old,
                "procodigoNew": procodigo_new,
                "prodescri": prodescri,
                "prostatus": prostatus,
            }

            update_query = text(
                """
                UPDATE rhbprov
                SET procodigo = :procodigoNew,
                    prodescri = :prodescri,
                    prostatus = :prostatus
                WHERE procodigo = :procodigoOld
            """
            )

            try:
                connection.execute(update_query, data_rhbprov_update)
            except IntegrityError:
                raise ValidationError("No se puede editar la provincia porque existen registros relacionados")

    return {"data": "Provincia actualizada exitosamente"}
