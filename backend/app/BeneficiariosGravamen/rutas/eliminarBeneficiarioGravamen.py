from flask import jsonify, request
from app.BeneficiariosGravamen import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api borra un Beneficiario de Gravamen
@bp.route("/eliminarBeneficiarioGravamen", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarBeneficiarioGravamen():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    beneficiarioGravamen = data.get("benegravamen")

    if not beneficiarioGravamen:
        raise ValidationError("Beneficiario de Gravamen requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Borro el Registro
            data_PredbGravBene_delete = {
                "ciacodigo": sCodCia,
                "benegravamen": beneficiarioGravamen,
            }

            delete_query = text("DELETE FROM PredbGravBene WHERE ciacodigo = :ciacodigo AND benegravamen = :benegravamen")

            try:
                connection.execute(delete_query, data_PredbGravBene_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar el Beneficiario de gravamen porque existen registros relacionados")

    return {"data": "Beneficiario de Gravamen eliminado exitosamente"}
