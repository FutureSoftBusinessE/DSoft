from flask import request
from app.PerfilUsuarioDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError


@bp.route("/setFirmaActivaDF", methods=["POST", "OPTIONS"], strict_slashes=False)
@jwt_required()
@api_endpoint
def setFirmaActivaDF():
    if request.method == "OPTIONS":
        return {"success": True}, 200

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    data = request.get_json()
    documentouuid = data.get("documentouuid")

    if not documentouuid:
        raise ValidationError("El identificador del certificado (UUID) es requerido.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Actualizamos el campo locpathxml con el UUID del documento P12
            update_sql = text(
                """
                UPDATE cgblocal
                SET locpathxml = :documentouuid
                WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo
            """
            )

            connection.execute(update_sql, {"documentouuid": documentouuid, "ciacodigo": ciacodigo, "loccodigo": loccodigo})

    return {"data": "El certificado se ha configurado como la firma electrónica activa exitosamente."}
