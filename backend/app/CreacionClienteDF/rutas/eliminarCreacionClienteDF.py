from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.CreacionClienteDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarCreacionClienteDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarCreacionClienteDF():
    # 1. Extracción de variables de sesión y multitenancy (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    # Código del Cliente (varchar(6))
    clicodigo = data.get("clicodigo")

    # 3. Validación de campos requeridos para la Clave Primaria
    if not clicodigo:
        raise ValidationError("El código del cliente es requerido para la eliminación")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparar parámetros para el borrado (Cia + Código)
            data_delete = {
                "ciacodigo": sCodCia,
                "clicodigo": str(clicodigo).strip().upper()
            }

            # 5. Sentencia SQL de eliminación con integridad multitenancy
            delete_query = text("""
                DELETE FROM cxcmcli
                WHERE ciacodigo = :ciacodigo
                  AND clicodigo = :clicodigo
            """)

            try:
                # 6. Ejecución del borrado con captura de errores de integridad referencial
                # Esto ocurre si el cliente ya tiene facturas, movimientos contables o pedidos vinculados.
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar el Cliente porque posee movimientos (Facturas, Pagos o Pedidos) relacionados en el sistema.")

    # 7. Respuesta de éxito conforme al estándar del sistema
    return {"data": "Cliente eliminado exitosamente"}
