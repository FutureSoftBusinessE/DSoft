from app.Ciudad import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError


@bp.route("/getSiguienteCodigoCiudad", methods=["POST"])
@jwt_required()
@api_endpoint
def getSiguienteCodigoCiudad():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            query = text("SELECT ciucodigo FROM hotbciu")
            rows = connection.execute(query).mappings().fetchall()

            numeric_codes = [int(str(row.get("ciucodigo", "")).strip()) for row in rows if str(row.get("ciucodigo", "")).strip().isdigit()]

            next_code = (max(numeric_codes) + 1) if numeric_codes else 1

            if next_code > 999:
                raise ValidationError("No se puede generar más códigos de ciudad (máximo 999)")

            # Format as 3-digit string with leading zeros
            formatted_code = str(next_code).zfill(3)

    return {"ciucodigo": formatted_code}
