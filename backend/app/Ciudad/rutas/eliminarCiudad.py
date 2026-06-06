from flask import jsonify, request
from app.Ciudad import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from error_handling import api_endpoint, ValidationError


# Esta api borra una ciudad
@bp.route("/eliminarCiudad", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarCiudad():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    ciucodigo = data.get("ciucodigo")

    if not ciucodigo:
        raise ValidationError("Código de ciudad requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Borro el Registro
            data_hotbciu_delete = {
                "ciucodigo": ciucodigo,
            }

            delete_query = text("DELETE FROM hotbciu WHERE ciucodigo = :ciucodigo")

            try:
                connection.execute(delete_query, data_hotbciu_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar la ciudad porque existen registros relacionados")

    return {"data": "Ciudad eliminada exitosamente"}
