from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.SectorialesIess import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarSectorialesIess", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarSectorialesIess():
    # 1. Extracción de variables de sesión y multitenancy
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    # Código IESS
    seccodigo = data.get("seccodigo")
    # Año del registro
    secanio = data.get("secanio")

    # 3. Validación de campos requeridos para la Clave Primaria Compuesta
    if not seccodigo:
        raise ValidationError("El código del sectorial es requerido")
    if not secanio:
        raise ValidationError("El año del sectorial es requerido para la eliminación")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparar parámetros para el borrado (Cia + Código + Año)
            data_delete = {"ciacodigo": sCodCia, "seccodigo": seccodigo, "secanio": secanio}

            # 5. Sentencia SQL de eliminación con integridad multitenancy
            delete_query = text(
                """
                DELETE FROM nomsectorialiess
                WHERE ciacodigo = :ciacodigo
                  AND seccodigo = :seccodigo
                  AND secanio = :secanio
            """
            )

            try:
                # Ejecutamos el delete
                connection.execute(delete_query, data_delete)
            except IntegrityError:
                # 6. Captura de errores de llave foránea
                # Esto sucede si el sectorial ya está asignado en contratos o nóminas.
                raise ValidationError("No se puede eliminar el Sectorial porque existen registros relacionados (Nómina o Empleados) vinculados a él.")

    # 7. Respuesta de éxito
    return {"data": "Sectorial eliminado exitosamente"}
