from flask import jsonify, request
from app.SectorComercialCliente import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from error_handling import api_endpoint, ValidationError


# Esta api borra un sector comercial cliente
@bp.route("/eliminarSectorComercialCliente", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarSectorComercialCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    activicodigo = data.get("activicodigo")

    if not activicodigo:
        raise ValidationError("Código de sector comercial requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Borro el Registro
            data_cxcbacteconomicas_delete = {
                "activicodigo": activicodigo,
            }

            delete_query = text("DELETE FROM cxcbacteconomicas WHERE activicodigo = :activicodigo")

            try:
                connection.execute(delete_query, data_cxcbacteconomicas_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar el sector comercial porque existen registros relacionados")

    return {"data": "Sector comercial cliente eliminado exitosamente"}
