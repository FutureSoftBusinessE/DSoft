from flask import jsonify, request
from app.Compania import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api borra una compañía
@bp.route("/eliminarCompania", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarCompania():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    ciacodigo = data.get("ciacodigo")

    if not ciacodigo:
        raise ValidationError("Código de compañía requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Borro el Registro
            data_siaccia_delete = {
                "ciacodigo": ciacodigo,
            }

            delete_query = text("DELETE FROM siaccia WHERE ciacodigo = :ciacodigo")

            try:
                connection.execute(delete_query, data_siaccia_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar la compañía porque existen registros relacionados")

    return {"data": "Compañía eliminada exitosamente"}
