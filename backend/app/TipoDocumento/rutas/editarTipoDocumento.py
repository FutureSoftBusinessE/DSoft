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


# Esta api actualiza un tipo de documento
@bp.route("/editarTipoDocumento", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def editarTipoDocumento():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener la fecha y horas
    fecha_actual = datetime.now()

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    tipdoccodigo_new = data.get("tipdoccodigoNew")
    tipdoccodigo_old = data.get("tipdoccodigoOld")
    tipdocdescri_new = data.get("tipdocdescriNew")
    tipdocstatus_new = data.get("tipdocstatusNew")

    if not tipdoccodigo_new:
        raise ValidationError("Código de tipo de documento requerido")
    if not tipdocdescri_new:
        raise ValidationError("Descripción de tipo de documento requerida")
    if not tipdocdescri_new:
        raise ValidationError("Descripción de tipo de documento requerida")

    # El código no puede ser modificado
    if str(tipdoccodigo_new).strip() != str(tipdoccodigo_old).strip():
        raise ValidationError("El código de tipo de documento no puede ser modificado")

    # Validaciones de tamaño según esquema
    max_lengths = {
        "ciacodigo": 2,
        "tipdoccodigo": 3,
        "tipdocdescri": 60,
        "tipdocstatus": 1,
        "tipdocusuisys": 10,
        "tipdocestisys": 40,
        "tipdocusumsys": 10,
        "tipdocestmsys": 40,
    }

    if tipdoccodigo_new and len(str(tipdoccodigo_new)) > max_lengths["tipdoccodigo"]:
        raise ValidationError(f"tipdoccodigoNew excede {max_lengths['tipdoccodigo']} caracteres")
    if tipdocdescri_new and len(str(tipdocdescri_new)) > max_lengths["tipdocdescri"]:
        raise ValidationError(f"tipdocdescriNew excede {max_lengths['tipdocdescri']} caracteres")
    if tipdocstatus_new and len(str(tipdocstatus_new)) > max_lengths["tipdocstatus"]:
        raise ValidationError(f"tipdocstatusNew excede {max_lengths['tipdocstatus']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Actualizo el Registro
            data_update = {
                "ciacodigo": sCodCia,
                "tipdoccodigoNew": tipdoccodigo_new,
                "tipdoccodigoOld": tipdoccodigo_old,
                "tipdocdescriNew": tipdocdescri_new,
                "tipdocstatusNew": tipdocstatus_new,
                "tipdocfechormsys": fecha_actual,
                "tipdocusumsys": sUsuario,
                "tipdocestmsys": sNomEst,
            }

            update_query = text(
                """
                UPDATE gdocbtipodoc SET
                    tipdoccodigo = :tipdoccodigoNew,
                    tipdocdescri = :tipdocdescriNew,
                    tipdocstatus = :tipdocstatusNew,
                    tipdocfechormsys = :tipdocfechormsys,
                    tipdocusumsys = :tipdocusumsys,
                    tipdocestmsys = :tipdocestmsys
                WHERE ciacodigo = :ciacodigo AND tipdoccodigo = :tipdoccodigoOld
            """
            )

            try:
                connection.execute(update_query, data_update)
            except IntegrityError:
                raise ValidationError("No se puede editar el Tipo de documento porque existen registros relacionados")

    return {"data": "Tipo de documento actualizado exitosamente"}
