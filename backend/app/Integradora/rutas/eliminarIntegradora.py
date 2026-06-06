from flask import jsonify, request
from app.Integradora import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from error_handling import api_endpoint, ValidationError


# Esta api borra una integradora
@bp.route("/eliminarIntegradora", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarIntegradora():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    integracodigo = data.get("integracodigo")

    if not integracodigo:
        raise ValidationError("Código de integradora requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Borro el Registro
            data_fabintegra_delete = {
                "integracodigo": integracodigo,
            }

            delete_query = text("DELETE FROM fabintegra WHERE integracodigo = :integracodigo")

            try:
                connection.execute(delete_query, data_fabintegra_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar la integradora porque existen registros relacionados")

    return {"data": "Integradora eliminada exitosamente"}
