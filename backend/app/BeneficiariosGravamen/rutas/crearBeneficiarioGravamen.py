from flask import jsonify, request
from app.BeneficiariosGravamen import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api crea un Beneficiario de Gravamen
@bp.route("/crearBeneficiarioGravamen", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def crearBeneficiarioGravamen():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener la fecha y horas
    fecha_actual = datetime.now()

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    beneficiarioGravamen = data.get("benegravamen")

    if beneficiarioGravamen is None or beneficiarioGravamen.strip() == "":
        raise ValidationError("Beneficiario de Gravamen requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            data_PredbGravBene = {
                "ciacodigo": sCodCia,
                "benegravamen": beneficiarioGravamen,
                "benegrafecisys": fecha_actual,
                "benegrausuisys": sUsuario,
                "benegraestisys": sNomEst,
                "benegrafecmsys": fecha_actual,
                "benegrausumsys": sUsuario,
                "benegraestmsys": sNomEst,
            }

            data_getAll = {
                "benegravamen": beneficiarioGravamen,
            }
            getAll = text("SELECT benegravamen FROM PredbGravBene WHERE benegravamen = :benegravamen")
            result = connection.execute(getAll, data_getAll).mappings().fetchone()
            if result:
                raise ValidationError("Beneficiario de Gravamen ya existe")

            insert_query = text(
                """
                INSERT INTO PredbGravBene (
                    ciacodigo, benegravamen, benegrafecisys, benegrausuisys, benegraestisys, benegrafecmsys, benegrausumsys, benegraestmsys
                ) VALUES (
                    :ciacodigo, :benegravamen, :benegrafecisys, :benegrausuisys, :benegraestisys, :benegrafecmsys, :benegrausumsys, :benegraestmsys
                )
            """
            )

            connection.execute(insert_query, data_PredbGravBene)

    return {"data": "Beneficiario de Gravamen creado exitosamente"}
