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


# Esta api actualiza un Beneficiario de Gravamen
@bp.route("/editarBeneficiarioGravamen", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def editarBeneficiarioGravamen():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener la fecha y horas
    fecha_actual = datetime.now()

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    beneficiariosgravamen_new = data.get("benegravamenNew")
    beneficiariosgravamen_old = data.get("benegravamenOld")

    if not beneficiariosgravamen_new:
        raise ValidationError("Beneficiario de Gravamen requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Actualizo el Registro
            data_PredbGravBene_update = {
                "ciacodigo": sCodCia,
                "benegravamenNew": beneficiariosgravamen_new,
                "benegravamenOld": beneficiariosgravamen_old,
                "benegrafecmsys": fecha_actual,
                "benegrausumsys": sUsuario,
                "benegraestmsys": sNomEst,
            }

            update_query = text(
                """
                UPDATE PredbGravBene SET
                    benegravamen = :benegravamenNew,
                    benegrafecmsys = :benegrafecmsys,
                    benegrausumsys = :benegrausumsys,
                    benegraestmsys = :benegraestmsys
                WHERE ciacodigo = :ciacodigo AND benegravamen = :benegravamenOld
            """
            )

            try:
                connection.execute(update_query, data_PredbGravBene_update)
            except IntegrityError:
                raise ValidationError("No se puede editar el Beneficiario de gravamen porque existen registros relacionados")

    return {"data": "Beneficiario de Gravamen actualizado exitosamente"}
