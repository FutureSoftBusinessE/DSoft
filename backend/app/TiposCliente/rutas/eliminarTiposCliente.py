from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.TiposCliente import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarTiposCliente", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarTiposCliente():
    # 1. Extracción de variables de sesión y multitenancy (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    # Código del Tipo de Cliente (varchar(3))
    tipcodigo = data.get("tipcodigo")

    # 3. Validación de campos requeridos para la Clave Primaria
    if not tipcodigo:
        raise ValidationError("El código del tipo de cliente es requerido para la eliminación")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparar parámetros para el borrado (Cia + Código)
            data_delete = {"ciacodigo": sCodCia, "tipcodigo": str(tipcodigo).strip().upper()}

            # 5. Sentencia SQL de eliminación con integridad multitenancy
            delete_query = text(
                """
                DELETE FROM cxcbtipcli
                WHERE ciacodigo = :ciacodigo
                  AND tipcodigo = :tipcodigo
            """
            )

            try:
                # 6. Ejecución del borrado con captura de errores de integridad
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                # Esto ocurre si el tipo de cliente ya está vinculado a la tabla de clientes (cxcbmst)
                raise ValidationError("No se puede eliminar el Tipo de Cliente porque existen clientes u otros registros vinculados a él.")

    # 7. Respuesta de éxito conforme al estándar del sistema
    return {"data": "Tipo de Cliente eliminado exitosamente"}
