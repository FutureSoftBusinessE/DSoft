from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.VendedoresDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarVendedoresDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarVendedoresDF():
    # 1. Extracción de variables de sesión y multitenancy (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    vencodigo = data.get("vencodigo")
    # 3. Validación de campos requeridos para la Clave Primaria
    if not vencodigo:
        raise ValidationError("El código del vendedor es requerido para la eliminación")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparar parámetros para el borrado (Cia + Código)
            data_delete = {"ciacodigo": sCodCia, "vencodigo": str(vencodigo).strip().upper()}

            # 5. Sentencia SQL de eliminación sobre fapvendedor
            delete_query = text(
                """
                DELETE FROM fapvendedor
                WHERE ciacodigo = :ciacodigo
                  AND vencodigo = :vencodigo
            """
            )

            try:
                # 6. Ejecución del borrado con captura de errores de integridad referencial
                # Esto ocurre si el vendedor ya está vinculado a facturas, pedidos o proformas.
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar el Vendedor porque posee registros vinculados (Facturas, Pedidos o Clientes) en el sistema.")

    # 7. Respuesta de éxito conforme al estándar
    return {"data": "Vendedor eliminado exitosamente"}
