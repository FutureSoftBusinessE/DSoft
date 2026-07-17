from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.ExcepcionesdeIVA import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarExcepcionesdeIVA", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarExcepcionesdeIVA():
    # 1. Extracción de variables de sesión[cite: 19]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    # Nota: No extraemos sCodCia porque esta tabla se maneja por ivetipocompania, no por ciacodigo.

    # 2. Obtener los parámetros de la solicitud[cite: 19]
    data = request.get_json()
    ivetipocompania = data.get("ivetipocompania")
    ivefecinicio = data.get("ivefecinicio")

    # 3. Validación de campos requeridos (Llave primaria compuesta)[cite: 19]
    if not ivetipocompania:
        raise ValidationError("El tipo de compañía es requerido para eliminar la excepción de IVA")
    if not ivefecinicio:
        raise ValidationError("La fecha de inicio es requerida para eliminar la excepción de IVA")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparar parámetros para el borrado[cite: 19]
            data_delete = {
                "ivetipocompania": ivetipocompania,
                "ivefecinicio": ivefecinicio,
            }

            # 5. Sentencia SQL de eliminación filtrando por la llave compuesta
            delete_query = text(
                """
                DELETE FROM siacivaexcepcion
                WHERE ivetipocompania = :ivetipocompania
                  AND ivefecinicio = :ivefecinicio
                """
            )

            try:
                # Ejecutamos el delete[cite: 19]
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                # 6. Captura de errores de llave foránea (Integridad Referencial)[cite: 19]
                raise ValidationError("No se puede eliminar la Excepción de IVA porque ya existen registros " "históricos o facturas relacionadas a esta configuración.")

    # 7. Respuesta de éxito[cite: 19]
    return {"data": "Excepción de IVA eliminada exitosamente"}
