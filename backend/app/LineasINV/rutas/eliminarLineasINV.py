from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.LineasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

@bp.route("/eliminarLineasINV", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarLineasINV():
    # 1. Extracción de variables de sesión y multitenancy (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    lincodigo = data.get("lincodigo")

    # 3. Validación de campos requeridos
    if not lincodigo or str(lincodigo).strip() == "":
        raise ValidationError("El código de la Línea/Grupo es requerido para la eliminación.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    
    with engine.connect() as connection:
        with connection.begin():
            lincodigo = str(lincodigo).strip().upper()

            # ================================================================
            # VALIDACIÓN JERÁRQUICA: Evitar borrar un padre si tiene hijos
            # ================================================================
            # Buscamos si existe algún registro donde 'linlindes' (Padre) sea igual al código que queremos borrar
            check_hijos_query = text("""
                SELECT TOP 1 lincodigo 
                FROM inblin 
                WHERE ciacodigo = :ciacodigo 
                  AND linlindes = :lincodigo
            """)
            tiene_hijos = connection.execute(check_hijos_query, {"ciacodigo": sCodCia, "lincodigo": lincodigo}).fetchone()

            if tiene_hijos:
                raise ValidationError(f"No se puede eliminar el Grupo '{lincodigo}' porque tiene sub-niveles (hijos) asociados. Elimine primero los niveles inferiores.")

            # 4. Preparar parámetros para el borrado
            data_delete = {
                "ciacodigo": sCodCia,
                "lincodigo": lincodigo
            }

            # 5. Sentencia SQL de eliminación segura
            delete_query = text("""
                DELETE FROM inblin 
                WHERE ciacodigo = :ciacodigo 
                  AND lincodigo = :lincodigo
            """)

            try:
                # Ejecutamos el delete
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                # 6. Captura de errores de llave foránea (Integridad Referencial en Base de Datos)
                # Esto saltará automáticamente si la línea ya fue asignada a un producto en la tabla de inventario (inbitem).
                raise ValidationError("No se puede eliminar este Grupo/Línea porque ya existen productos, planes o transacciones vinculadas a este registro.")

    # 7. Respuesta de éxito al frontend
    return {"data": "Grupo/Línea de inventario eliminado exitosamente."}