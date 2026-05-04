from flask import jsonify, request
from app.Iva import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from email.utils import parsedate_to_datetime
from error_handling import api_endpoint, ValidationError


# Esta api actualiza un IVA
@bp.route("/editarIva", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def editarIva():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Obtener la fecha y horas
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    ivafecini_old = data.get("ivafeciniOld")
    ivavalor_new = data.get("ivavalor")

    if not ivafecini_old:
        raise ValidationError("Fecha de IVA requerida")
    if ivavalor_new is None:
        raise ValidationError("Valor de IVA requerido")

    # Convertir fecha si es string (formato HTTP/RFC 2822)
    if isinstance(ivafecini_old, str):
        try:
            ivafecini_old = parsedate_to_datetime(ivafecini_old)
        except Exception:
            pass

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Actualizo solo el valor
            data_siaciva_update = {
                "ivavalor": ivavalor_new,
                "ivafecini_old": ivafecini_old,
                "ivafecmsys": fecha_actual,
                "ivahormsys": hora_sys,
                "ivausumsys": sUsuario,
            }

            update_query = text(
                """
                UPDATE siaciva SET
                    ivavalor = :ivavalor,
                    ivafecmsys = :ivafecmsys,
                    ivahormsys = :ivahormsys,
                    ivausumsys = :ivausumsys
                WHERE ivafecini = :ivafecini_old
            """
            )

            try:
                connection.execute(update_query, data_siaciva_update)
            except IntegrityError:
                raise ValidationError("No se puede editar el IVA porque existen registros relacionados")

            # Actualizar siacsys con el nuevo IVA
            update_siacsys = text("UPDATE siacsys SET sysiva = :ivavalor")
            connection.execute(update_siacsys, {"ivavalor": ivavalor_new})

    return {"data": "IVA actualizado exitosamente"}
