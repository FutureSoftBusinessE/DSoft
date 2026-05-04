from app.Localidad import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError


@bp.route("/getSiguienteCodigoLocalidad", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def getSiguienteCodigoLocalidad():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            query = text("SELECT loccodigo FROM cgblocal WHERE ciacodigo = :ciacodigo")
            rows = connection.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchall()

            numeric_codes = [int(str(row.get("loccodigo", "")).strip()) for row in rows if str(row.get("loccodigo", "")).strip().isdigit()]

            next_code = (max(numeric_codes) + 1) if numeric_codes else 1

            if next_code > 99:
                raise ValidationError("No se puede generar más códigos de localidad (máximo 99)")

            # Format as 2-digit string with leading zero
            formatted_code = str(next_code).zfill(2)

    return {"loccodigo": formatted_code, "ciacodigo": ciacodigo}
