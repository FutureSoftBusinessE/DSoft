from flask import jsonify, request
from app.Parroquia import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from error_handling import api_endpoint, ValidationError


# Esta api borra una parroquia
@bp.route("/eliminarParroquia", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarParroquia():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    parrocodigo = data.get("parrocodigo")

    if not parrocodigo:
        raise ValidationError("Código de parroquia requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Borro el Registro
            data_cxcbparroquia_delete = {
                "parrocodigo": parrocodigo,
            }

            delete_query = text("DELETE FROM cxcbparroquia WHERE parrocodigo = :parrocodigo")

            try:
                connection.execute(delete_query, data_cxcbparroquia_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar la parroquia porque existen registros relacionados")

    return {"data": "Parroquia eliminada exitosamente"}
