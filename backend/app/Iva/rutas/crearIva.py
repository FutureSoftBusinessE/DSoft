from flask import jsonify, request
from app.Iva import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from email.utils import parsedate_to_datetime
from error_handling import api_endpoint, ValidationError


# Esta api crea un IVA
@bp.route("/crearIva", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def crearIva():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Obtener la fecha y horas
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    ivafecini = data.get("ivafecini")
    ivavalor = data.get("ivavalor")

    if ivafecini is None:
        raise ValidationError("Fecha de IVA requerida")
    if ivavalor is None:
        raise ValidationError("Valor de IVA requerido")

    # Convertir fecha si es string (formato HTTP/RFC 2822)
    if isinstance(ivafecini, str):
        try:
            ivafecini = parsedate_to_datetime(ivafecini)
        except Exception:
            pass

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            data_siaciva = {
                "ivafecini": ivafecini,
                "ivavalor": ivavalor,
                "ivafecisys": fecha_actual,
                "ivahorisys": hora_sys,
                "ivausuisys": sUsuario,
                "ivafecmsys": fecha_actual,
                "ivahormsys": hora_sys,
                "ivausumsys": sUsuario,
            }

            data_getAll = {
                "ivafecini": ivafecini,
            }
            getAll = text("SELECT ivafecini FROM siaciva WHERE ivafecini = :ivafecini")
            result = connection.execute(getAll, data_getAll).mappings().fetchone()
            if result:
                raise ValidationError("IVA ya existe")

            insert_query = text(
                """
                INSERT INTO siaciva (
                    ivafecini, ivavalor, ivafecisys, ivahorisys, ivausuisys, ivafecmsys, ivahormsys, ivausumsys
                ) VALUES (
                    :ivafecini, :ivavalor, :ivafecisys, :ivahorisys, :ivausuisys, :ivafecmsys, :ivahormsys, :ivausumsys
                )
            """
            )

            connection.execute(insert_query, data_siaciva)

            # Actualizar siacsys con el nuevo IVA
            update_siacsys = text("UPDATE siacsys SET sysiva = :ivavalor")
            connection.execute(update_siacsys, {"ivavalor": ivavalor})

    return {"data": "IVA creado exitosamente"}
