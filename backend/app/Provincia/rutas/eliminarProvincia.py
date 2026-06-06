from flask import jsonify, request
from app.Provincia import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from error_handling import api_endpoint, ValidationError


# Esta api borra una provincia
@bp.route("/eliminarProvincia", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarProvincia():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    procodigo = data.get("procodigo")

    if not procodigo:
        raise ValidationError("Código de provincia requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Borro el Registro
            data_rhbprov_delete = {
                "procodigo": procodigo,
            }

            delete_query = text("DELETE FROM rhbprov WHERE procodigo = :procodigo")

            try:
                connection.execute(delete_query, data_rhbprov_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar la provincia porque existen registros relacionados")

    return {"data": "Provincia eliminada exitosamente"}
