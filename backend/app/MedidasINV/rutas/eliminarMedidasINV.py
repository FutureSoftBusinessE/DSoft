from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.MedidasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarMedidasINV", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarMedidasINV():
    # 1. Extracción de variables de sesión y multitenancy (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    # Código de la Unidad de Medida
    medcodigo = data.get("medcodigo")

    # 3. Validación de campos requeridos para la Clave Primaria
    if not medcodigo:
        raise ValidationError("El código de la unidad de medida es requerido para la eliminación")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparar parámetros para el borrado (Cia + Código)
            data_delete = {
                "ciacodigo": sCodCia,
                "medcodigo": str(medcodigo).strip().upper()
            }

            # 5. Sentencia SQL de eliminación con integridad multitenancy
            delete_query = text("""
                DELETE FROM inbmed
                WHERE ciacodigo = :ciacodigo
                  AND medcodigo = :medcodigo
            """)

            try:
                # 6. Ejecución del borrado con captura de errores de integridad
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                # Esto sucede si la medida ya está vinculada a productos (inbmst)
                raise ValidationError("No se puede eliminar la Unidad de Medida porque existen productos u otros registros vinculados a ella.")

    # 7. Respuesta de éxito conforme al estándar del sistema
    return {"data": "Unidad de Medida eliminada exitosamente"}
