from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.MarcasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarMarcasINV", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarMarcasINV():
    # 1. Extracción de variables de sesión y multitenancy (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    # Código de la Marca a eliminar
    marcodigo = data.get("marcodigo")

    # 3. Validación de campos requeridos para la Clave Primaria
    if not marcodigo:
        raise ValidationError("El código de la marca es requerido para la eliminación")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparar parámetros para el borrado (Cia + Código)
            data_delete = {"ciacodigo": sCodCia, "marcodigo": str(marcodigo).strip().upper()}

            # 5. Sentencia SQL de eliminación con integridad multitenancy
            delete_query = text(
                """
                DELETE FROM inbmar
                WHERE ciacodigo = :ciacodigo
                  AND marcodigo = :marcodigo
            """
            )

            try:
                # 6. Ejecución del borrado con captura de errores de integridad
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                # Captura si la marca está vinculada a productos (inbmst) u otras tablas
                raise ValidationError("No se puede eliminar la Marca porque ya existen productos u otros registros relacionados vinculados a ella.")

    # 7. Respuesta de éxito conforme al estándar del sistema
    return {"data": "Marca eliminada exitosamente"}
