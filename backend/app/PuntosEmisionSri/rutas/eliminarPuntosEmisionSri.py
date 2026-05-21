from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.PuntosEmisionSri import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarPuntosEmisionSri", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarPuntosEmisionSri():
    # 1. Extracción de variables de sesión
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = str(claims["seleccion"]["cliciaciacodigo"]).strip()[:2]

    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    cjacodigo = data.get("cjacodigo")

    # 3. Validación de campos requeridos
    if not cjacodigo or str(cjacodigo).strip() == "":
        raise ValidationError("El código de la caja (Punto de Emisión) es requerido para la eliminación.")

    cjacodigo = str(cjacodigo).strip().upper()[:3]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            params = {
                "cia": sCodCia,
                "cja": cjacodigo,
            }

            try:
                # 4. ELIMINACIÓN EN CASCADA MANUAL (Para no violar Foreign Keys)

                # A. Eliminar detalle de documentos fijos (siactsriseries)
                connection.execute(text("DELETE FROM siactsriseries WHERE ciacodigo = :cia AND cjacodigo = :cja"), params)

                # B. Eliminar cabecera de series SRI (siaccsriseries)
                connection.execute(text("DELETE FROM siaccsriseries WHERE ciacodigo = :cia AND cjacodigo = :cja"), params)

                # C. Eliminar relación Caja - Autorización (fatcaja)
                connection.execute(text("DELETE FROM fatcaja WHERE ciacodigo = :cia AND cjacodigo = :cja"), params)

                # D. Eliminar la Caja maestra (fapcaja)
                result = connection.execute(text("DELETE FROM fapcaja WHERE ciacodigo = :cia AND cjacodigo = :cja"), params)

                # 5. Validación de existencia
                if result.rowcount == 0:
                    raise ValidationError("No se pudo eliminar: El Punto de Emisión no existe o ya fue borrado.")

            except IntegrityError:
                # 6. Captura de errores de llave foránea (Si la caja ya facturó)
                raise ValidationError("No se puede eliminar el Punto de Emisión porque ya tiene comprobantes electrónicos o movimientos comerciales asociados.")

    # 7. Respuesta de éxito
    return {"data": f"Punto de Emisión '{cjacodigo}' eliminado exitosamente."}
