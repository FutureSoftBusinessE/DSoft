from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.Localidad import bp
from app.db import get_session
from app.extensions import db
from error_handling import ValidationError, api_endpoint


@bp.route("/eliminarLocalidad", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarLocalidad():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json(silent=True) or {}
    ciacodigo = (data.get("ciacodigo") or "").strip()
    loccodigo = (data.get("loccodigo") or "").strip()

    if not ciacodigo:
        raise ValidationError("ciacodigo es requerido")
    if not loccodigo:
        raise ValidationError("loccodigo es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            try:
                result = connection.execute(
                    text(
                        """
                        DELETE FROM cgblocal
                        WHERE ciacodigo = :ciacodigo
                          AND loccodigo = :loccodigo
                        """
                    ),
                    {"ciacodigo": ciacodigo, "loccodigo": loccodigo},
                )
            except IntegrityError:
                raise ValidationError("No se puede eliminar la localidad porque existen registros relacionados")

            if result.rowcount == 0:
                raise ValidationError(f"No existe ninguna localidad con clave ({ciacodigo}, {loccodigo})")

    return {"data": "Localidad eliminada exitosamente"}
