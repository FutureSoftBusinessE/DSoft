from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.TransportistasDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarTransportistasDF", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarTransportistasDF():
    # 1. Extracción de variables de sesión y multitenancy (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    transcodigo = data.get("transcodigo")

    # 3. Validación de campos requeridos para la Clave Primaria
    if not transcodigo:
        raise ValidationError("El código del transportista es requerido para la eliminación")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparar parámetros para el borrado (Cia + Código)
            data_delete = {"ciacodigo": sCodCia, "transcodigo": str(transcodigo).strip().upper()}

            # 5. Sentencia SQL de eliminación con integridad multitenancy sobre inbtranspor
            delete_query = text(
                """
                DELETE FROM inbtranspor
                WHERE ciacodigo = :ciacodigo
                  AND transcodigo = :transcodigo
            """
            )

            try:
                # 6. Ejecución del borrado con captura de errores de integridad referencial
                # Esto ocurre si el transportista ya está vinculado a guías de remisión, órdenes de despacho, etc.
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar el Transportista porque posee registros vinculados (Guías de Remisión o Movimientos) en el sistema.")

    # 7. Respuesta de éxito conforme al estándar del sistema
    return {"data": "Transportista eliminado exitosamente"}
