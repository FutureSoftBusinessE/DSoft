from app.Compania import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError


@bp.route("/getSiguienteCodigoCompania", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def getSiguienteCodigoCompania():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            query = text("SELECT ciacodigo FROM siaccia")
            rows = connection.execute(query).mappings().fetchall()

            numeric_codes = [int(str(row.get("ciacodigo", "")).strip()) for row in rows if str(row.get("ciacodigo", "")).strip().isdigit()]

            next_code = (max(numeric_codes) + 1) if numeric_codes else 1

            if next_code > 99:
                raise ValidationError("No se puede generar más códigos de compañía (máximo 99)")

            # Format as 2-digit string with leading zero
            formatted_code = str(next_code).zfill(2)

    return {"ciacodigo": formatted_code}
