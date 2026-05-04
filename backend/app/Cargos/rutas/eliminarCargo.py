from flask import request
from app.Cargos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarCargo", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarCargo():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA
    try:
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    except KeyError:
        raise ValidationError("Error de Seguridad: Sesión incompleta. Transacción abortada.")

    data = request.get_json()
    codigo = data.get("cargocodigo")

    if not codigo:
        raise ValidationError("El código de cargo es obligatorio para proceder con la eliminación.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            delete_query = text("DELETE FROM rhbcargos WHERE ciacodigo = :cia AND cargocodigo = :codigo")
            result = connection.execute(delete_query, {"cia": ciacodigo, "codigo": codigo})

            if result.rowcount == 0:
                raise ValidationError("No se pudo eliminar: el registro no existe o ya fue borrado.")

    return {"data": "Cargo eliminado exitosamente"}
