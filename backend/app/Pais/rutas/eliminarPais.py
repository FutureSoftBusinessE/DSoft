from flask import jsonify, request
from app.Pais import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from error_handling import api_endpoint, ValidationError


# Esta api borra un país
@bp.route("/eliminarPais", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarPais():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    paiscodigo = data.get("paiscodigo")

    if not paiscodigo:
        raise ValidationError("Código de país requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Borro el Registro
            data_hotbpais_delete = {
                "paiscodigo": paiscodigo,
            }

            delete_query = text("DELETE FROM hotbpais WHERE paiscodigo = :paiscodigo")

            try:
                connection.execute(delete_query, data_hotbpais_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar el país porque existen registros relacionados")

    return {"data": "País eliminado exitosamente"}
