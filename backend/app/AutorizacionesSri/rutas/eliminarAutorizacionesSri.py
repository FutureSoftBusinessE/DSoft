from flask import request
from app.AutorizacionesSri import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarAutorizacionesSri", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarAutorizacionesSri():
    claims = get_jwt()
    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        sCodCia = str(seleccion["cliciaciacodigo"]).strip()[:2]
    except KeyError:
        raise ValidationError("Error de Seguridad: Sesión incompleta. Transacción abortada.")

    # 2. VALIDAR PARÁMETROS DEL FRONTEND
    data = request.get_json()
    sripreauto = data.get("sripreauto")
    sriautnumero = data.get("sriautnumero")
    if not sripreauto or str(sripreauto).strip() == "":
        raise ValidationError("El tipo de autorización es obligatorio para proceder con la eliminación.")
    if sriautnumero is None or float(sriautnumero) <= 0:
        raise ValidationError("El Número de Autorización es obligatorio para la eliminación.")
    # Normalizamos los campos de la llave primaria compuesta
    sripreauto = str(sripreauto).strip().upper()[:1]
    sriautnumero = float(sriautnumero)
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. ELIMINACIÓN DE DATOS (Asegurando la compañía y las llaves primarias)
            delete_query = text(
                """
                DELETE FROM siacsrinumero
                WHERE ciacodigo = :cia
                  AND sripreauto = :preauto
                  AND sriautnumero = :autnum
            """
            )
            result = connection.execute(delete_query, {"cia": sCodCia, "preauto": sripreauto, "autnum": sriautnumero})
            # Si no se afectó ninguna fila, significa que el código no existía o era de otra empresa
            if result.rowcount == 0:
                raise ValidationError("No se pudo eliminar: la autorización no existe o ya fue borrada.")
    # Retornamos el número formateado como entero para que el mensaje sea más limpio
    return {"data": f"Autorización SRI {int(sriautnumero)} eliminada exitosamente."}
