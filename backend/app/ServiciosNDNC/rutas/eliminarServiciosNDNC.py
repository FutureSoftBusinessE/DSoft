from flask import request
from app.ServiciosNDNC import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarServiciosNDNC", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarServiciosNDNC():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        sCodCia = seleccion["cliciaciacodigo"]
    except KeyError:
        raise ValidationError("Error de Seguridad: Sesión incompleta. Transacción abortada.")

    # 2. VALIDAR PARÁMETROS
    data = request.get_json()
    codigo = data.get("sercodigo")

    if not codigo or str(codigo).strip() == "":
        raise ValidationError("El código del Servicio es obligatorio para proceder con la eliminación.")

    codigo = str(codigo).strip().upper()

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. ELIMINACIÓN DE DATOS (Asegurando la compañía)
            delete_query = text("DELETE FROM cxcbser WHERE ciacodigo = :cia AND sercodigo = :cod")
            result = connection.execute(delete_query, {"cia": sCodCia, "cod": codigo})

            # Si no se afectó ninguna fila, significa que el código no existía o era de otra empresa
            if result.rowcount == 0:
                raise ValidationError("No se pudo eliminar: el registro no existe o ya fue borrado.")

    return {"data": "Servicio de Nota de Débito/Crédito eliminado exitosamente"}
