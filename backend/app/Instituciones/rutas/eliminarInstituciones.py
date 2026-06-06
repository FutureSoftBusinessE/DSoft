from flask import request
from app.Instituciones import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarInstituciones", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarInstituciones():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        # No extraemos 'cliciaciacodigo' porque la tabla gdocbinstituciones es global
    except KeyError:
        raise ValidationError("Error de Seguridad: Sesión incompleta. Transacción abortada.")

    # 2. VALIDAR PARÁMETROS
    data = request.get_json()
    codigo = data.get("insticodigo")

    if not codigo or str(codigo).strip() == "":
        raise ValidationError("El código de la Institución es obligatorio para proceder con la eliminación.")

    codigo = str(codigo).strip().upper()

    # 3. CONEXIÓN A LA BASE DE DATOS
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. ELIMINACIÓN DE DATOS (Catálogo Global)
            delete_query = text("DELETE FROM gdocbinstituciones WHERE insticodigo = :cod")
            result = connection.execute(delete_query, {"cod": codigo})

            # Si no se afectó ninguna fila, el código no existía o ya fue borrado
            if result.rowcount == 0:
                raise ValidationError("No se pudo eliminar: el registro no existe o ya fue borrado.")

    return {"data": "Institución eliminada exitosamente"}
