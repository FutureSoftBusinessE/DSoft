from flask import jsonify, request
from app.SectorComercialCliente import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api actualiza un sector comercial cliente
@bp.route("/editarSectorComercialCliente", methods=["POST"])
@jwt_required()
@api_endpoint
def editarSectorComercialCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Obtener el estado del sistema desde headers
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener la fecha y horas para modificación
    fecha_modif = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_modif = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    activicodigo_old = data.get("activicodigoOld")
    activicodigo_new = data.get("activicodigoNew")
    actividescri = data.get("actividescri")
    activistatus = data.get("activistatus")

    if not activicodigo_new:
        raise ValidationError("Código de sector comercial requerido")

    if not actividescri:
        raise ValidationError("Descripción de sector comercial requerida")

    activicodigo_new = str(activicodigo_new).strip()
    actividescri = str(actividescri).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "activicodigo": 3,
        "actividescri": 60,
        "activistatus": 1,
    }

    if activicodigo_new and len(str(activicodigo_new)) > max_lengths["activicodigo"]:
        raise ValidationError(f"activicodigo excede {max_lengths['activicodigo']} caracteres")
    if actividescri and len(str(actividescri)) > max_lengths["actividescri"]:
        raise ValidationError(f"actividescri excede {max_lengths['actividescri']} caracteres")
    if activistatus and len(str(activistatus)) > max_lengths["activistatus"]:
        raise ValidationError(f"activistatus excede {max_lengths['activistatus']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Actualizo el Registro
            data_cxcbacteconomicas_update = {
                "activicodigoOld": activicodigo_old,
                "activicodigoNew": activicodigo_new,
                "actividescri": actividescri,
                "activistatus": activistatus,
                "activifecmsys": fecha_modif,
                "activihormsys": hora_modif,
                "activiusumsys": sUsuario,
                "activiestmsys": sNomEst,
            }

            update_query = text(
                """
                UPDATE cxcbacteconomicas
                SET activicodigo = :activicodigoNew,
                    actividescri = :actividescri,
                    activistatus = :activistatus,
                    activifecmsys = :activifecmsys,
                    activihormsys = :activihormsys,
                    activiusumsys = :activiusumsys,
                    activiestmsys = :activiestmsys
                WHERE activicodigo = :activicodigoOld
            """
            )

            try:
                connection.execute(update_query, data_cxcbacteconomicas_update)
            except IntegrityError:
                raise ValidationError("No se puede editar el sector comercial porque existen registros relacionados")

    return {"data": "Sector comercial cliente actualizado exitosamente"}
