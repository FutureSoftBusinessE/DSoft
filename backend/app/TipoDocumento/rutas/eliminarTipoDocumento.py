from flask import jsonify, request
from app.TipoDocumento import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api borra un tipo de documento
@bp.route("/eliminarTipoDocumento", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarTipoDocumento():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    tipdoccodigo = data.get("tipdoccodigo")

    if not tipdoccodigo:
        raise ValidationError("Código de tipo de documento requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Borro el Registro
            data_delete = {
                "ciacodigo": sCodCia,
                "tipdoccodigo": tipdoccodigo,
            }

            delete_query = text("DELETE FROM gdocbtipodoc WHERE ciacodigo = :ciacodigo AND tipdoccodigo = :tipdoccodigo")

            try:
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar el Tipo de documento porque existen registros relacionados")

    return {"data": "Tipo de documento eliminado exitosamente"}
