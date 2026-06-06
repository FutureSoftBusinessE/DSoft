from flask import jsonify, request
from app.SectorComercialCliente import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api crea un sector comercial cliente
@bp.route("/crearSectorComercialCliente", methods=["POST"])
@jwt_required()
@api_endpoint
def crearSectorComercialCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Obtener el estado del sistema desde headers
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener la fecha y horas
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    activicodigo = data.get("activicodigo")
    actividescri = data.get("actividescri")
    activistatus = data.get("activistatus", "A")

    if activicodigo is None or activicodigo.strip() == "":
        raise ValidationError("Código de sector comercial requerido")

    if actividescri is None or actividescri.strip() == "":
        raise ValidationError("Descripción de sector comercial requerida")

    activicodigo = str(activicodigo).strip()
    actividescri = str(actividescri).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "activicodigo": 3,
        "actividescri": 60,
        "activistatus": 1,
    }

    if len(activicodigo) > max_lengths["activicodigo"]:
        raise ValidationError(f"activicodigo excede {max_lengths['activicodigo']} caracteres")
    if len(actividescri) > max_lengths["actividescri"]:
        raise ValidationError(f"actividescri excede {max_lengths['actividescri']} caracteres")
    if activistatus and len(str(activistatus)) > max_lengths["activistatus"]:
        raise ValidationError(f"activistatus excede {max_lengths['activistatus']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            data_cxcbacteconomicas = {
                "activicodigo": activicodigo,
                "actividescri": actividescri,
                "activistatus": activistatus,
                "activifecisys": fecha_actual,
                "activihorisys": hora_sys,
                "activiusuisys": sUsuario,
                "activiestisys": sNomEst,
                "activifecmsys": fecha_actual,
                "activihormsys": hora_sys,
                "activiusumsys": sUsuario,
                "activiestmsys": sNomEst,
            }

            data_getAll = {
                "activicodigo": activicodigo,
            }
            getAll = text("SELECT activicodigo FROM cxcbacteconomicas WHERE activicodigo = :activicodigo")
            result = connection.execute(getAll, data_getAll).mappings().fetchone()
            if result:
                raise ValidationError("Sector comercial cliente ya existe")

            insert_query = text(
                """
                INSERT INTO cxcbacteconomicas (
                    activicodigo, actividescri, activistatus, activifecisys, activihorisys, activiusuisys, activiestisys, activifecmsys, activihormsys, activiusumsys, activiestmsys
                ) VALUES (
                    :activicodigo, :actividescri, :activistatus, :activifecisys, :activihorisys, :activiusuisys, :activiestisys, :activifecmsys, :activihormsys, :activiusumsys, :activiestmsys
                )
            """
            )

            connection.execute(insert_query, data_cxcbacteconomicas)

    return {"data": "Sector comercial cliente creado exitosamente"}
