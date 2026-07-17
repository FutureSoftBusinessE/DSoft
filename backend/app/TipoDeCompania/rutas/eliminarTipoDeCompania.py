from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.TipoDeCompania import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarTipoDeCompania", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarTipoDeCompania():
    # 1. Extracción de variables de sesión[cite: 19]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    # Nota: No extraemos sCodCia porque esta tabla es global por tpcodigo.

    # 2. Obtener los parámetros de la solicitud[cite: 19]
    data = request.get_json()
    tpcodigo = data.get("tpcodigo")

    # 3. Validación de campos requeridos (Llave primaria)[cite: 19]
    if not tpcodigo:
        raise ValidationError("El código del tipo de compañía es requerido para eliminar el registro")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparar parámetros para el borrado[cite: 19]
            data_delete = {
                "tpcodigo": tpcodigo,
            }

            # 5. Sentencia SQL de eliminación filtrando por la llave primaria[cite: 19]
            delete_query = text(
                """
                DELETE FROM siactipocompania
                WHERE tpcodigo = :tpcodigo
                """
            )

            try:
                # Ejecutamos el delete[cite: 19]
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                # 6. Captura de errores de llave foránea (Integridad Referencial)[cite: 19]
                raise ValidationError("No se puede eliminar este Tipo de Compañía porque ya está siendo " "utilizado en Excepciones de IVA u otros registros vinculados.")

    # 7. Respuesta de éxito[cite: 19]
    return {"data": "Tipo de Compañía eliminado exitosamente"}
