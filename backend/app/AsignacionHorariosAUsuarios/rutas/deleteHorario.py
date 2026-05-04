from flask import jsonify, request
from app.AsignacionHorariosAUsuarios import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from services.encrip_desencrip import encriptar
from app import create_app


@bp.route("/deleteHorario", methods=["POST"])
@cross_origin()
@jwt_required()
def deleteHorario():
    """
    Elimina todos los horarios de un usuario.
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json()

    # Validar datos requeridos
    if not data or "usrcodigo" not in data:
        return jsonify({"error": {"msg": "El código de usuario es requerido"}}), 400

    usrcodigo = data.get("usrcodigo")
    loccodigo = data.get("loccodigo")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                # Eliminar todos los horarios del usuario
                delete_query = """
                DELETE FROM rhbhorarios
                WHERE ciacodigo = :ciacodigo
                AND usrcodigo = :usrcodigo
                AND loccodigo = :loccodigo
                """

                result = connection.execute(text(delete_query), {"ciacodigo": ciacodigo, "usrcodigo": usrcodigo, "loccodigo": loccodigo})

                return jsonify({"success": True, "message": f"Se eliminaron {result.rowcount} horarios del usuario {usrcodigo} de la localidad {loccodigo}", "data": {"usrcodigo": usrcodigo, "loccodigo": loccodigo, "total_eliminados": result.rowcount}}), 200

    except Exception as e:
        print(f"Error al eliminar horarios: {str(e)}")
        return jsonify({"error": {"msg": f"Error al eliminar horarios: {str(e)}"}}), 400
