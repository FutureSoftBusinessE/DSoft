from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.ProveedoresDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

@bp.route("/eliminarProveedoresDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarProveedoresDF():
    # 1. Extracción de variables de sesión y multitenancy (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    procodigo = data.get("procodigo") # Código del Proveedor (varchar(6))

    # 3. Validación de campos requeridos para la Clave Primaria
    if not procodigo:
        raise ValidationError("El código del proveedor es requerido para la eliminación")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    
    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparar parámetros para el borrado (Cia + Código)
            data_delete = {
                "ciacodigo": sCodCia,
                "procodigo": str(procodigo).strip().upper()
            }

            # 5. Sentencia SQL de eliminación sobre cxpmprov
            delete_query = text("""
                DELETE FROM cxpmprov 
                WHERE ciacodigo = :ciacodigo 
                  AND procodigo = :procodigo
            """)

            try:
                # 6. Ejecución del borrado con captura de errores de integridad referencial
                # Esto ocurre si el proveedor ya está vinculado a facturas, órdenes de compra o pagos.
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                raise ValidationError("No se puede eliminar el Proveedor porque posee registros vinculados (Facturas, Pagos o Movimientos de Inventario) en el sistema.")

    # 7. Respuesta de éxito conforme al estándar
    return {"data": "Proveedor eliminado exitosamente"}