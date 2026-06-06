from flask import jsonify, request
from app.PlanesServicios import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from error_handling import api_endpoint, ValidationError


# Esta api elimina un plan de servicios
@bp.route("/eliminarPlanesServicios", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarPlanesServicios():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    invcodigo = data.get("invcodigo")
    artcodigo = data.get("artcodigo")

    if not invcodigo or not artcodigo:
        raise ValidationError("Claves primarias requeridas")

    artcodigo = str(artcodigo).strip()
    invcodigo = str(invcodigo).strip()

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            delete_query = text(
                """
                DELETE FROM inmart
                WHERE ciacodigo = :cia AND invcodigo = :inv AND artcodigo = :art
            """
            )

            try:
                result = connection.execute(delete_query, {"cia": sCodCia, "inv": invcodigo, "art": artcodigo})

                if result.rowcount == 0:
                    raise ValidationError("El plan de servicios no existe")

            except IntegrityError:
                raise ValidationError("No se puede eliminar porque existen registros relacionados")

    return {"data": "Plan de servicios eliminado exitosamente"}
