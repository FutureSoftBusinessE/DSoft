from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.FormasDeCobro import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarFormasDeCobro", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarFormasDeCobro():
    # 1. Extracción de variables de sesión
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    factippag = data.get("factippag")

    # 3. Validación de campos requeridos (Llave primaria) [cite: 80]
    if not factippag:
        raise ValidationError("El código de la forma de cobro (factippag) es requerido para eliminar el registro")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparar parámetros para el borrado [cite: 80, 81]
            data_delete = {
                "ciacodigo": sCodCia,
                "factippag": factippag,
            }

            # 5. Sentencia SQL de eliminación filtrando por la llave [cite: 81, 82, 83]
            delete_query = text(
                """
                DELETE FROM cxcbformapag
                WHERE ciacodigo = :ciacodigo
                  AND factippag = :factippag
                """
            )

            try:
                # Ejecutamos el delete [cite: 83]
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                # 6. Captura de errores de llave foránea (Integridad Referencial)
                raise ValidationError("No se puede eliminar esta Forma de Cobro porque ya existen facturas u otros documentos relacionados a ella en el sistema.")

    # 7. Respuesta de éxito [cite: 84]
    return {"data": "Forma de Cobro eliminada exitosamente"}
