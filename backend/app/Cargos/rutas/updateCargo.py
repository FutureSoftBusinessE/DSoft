from flask import request
from app.Cargos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/updateCargo", methods=["POST"])
@jwt_required()
@api_endpoint
def updateCargo():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD
    try:
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    except KeyError:
        raise ValidationError("Error Crítico: No se pudo verificar la compañía o la base de datos para la modificación.")

    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar al usuario que intenta realizar la modificación.")

    # 2. VALIDACIÓN DE PARÁMETROS
    data = request.get_json()
    codigo = data.get("cargocodigo")

    if not codigo:
        raise ValidationError("El código de cargo es requerido para actualizar el registro.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            ahora = datetime.now()
            fecha_pura = ahora.strftime("%Y-%m-%d 00:00:00")
            hora_pura = ahora.strftime("1900-01-01 %H:%M:%S")

            update_query = text(
                """
                UPDATE rhbcargos SET
                    cargodescri = :descri,
                    carsueldo = :sueldo,
                    cargostatus = :status,
                    cargofecmsys = :fecmsys,
                    cargohormsys = :hormsys,
                    cargousumsys = :usumsys
                WHERE ciacodigo = :cia AND cargocodigo = :codigo
            """
            )

            result = connection.execute(update_query, {"cia": ciacodigo, "codigo": codigo, "descri": data.get("cargodescri", "").upper(), "sueldo": data.get("carsueldo", 0), "status": data.get("cargostatus", "A"), "fecmsys": fecha_pura, "hormsys": hora_pura, "usumsys": sUsuario})

            # Validar si realmente se actualizó algo
            if result.rowcount == 0:
                raise ValidationError("No se encontró el cargo especificado o no pertenece a esta compañía.")

    return {"data": "Cargo actualizado con éxito"}
