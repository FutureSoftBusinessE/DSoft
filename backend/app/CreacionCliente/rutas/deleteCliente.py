from flask import jsonify, request
from app.CreacionCliente import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from services.encrip_desencrip import encriptar
from app import create_app


@bp.route("/deleteCliente", methods=["POST"])
@cross_origin()
@jwt_required()
def deleteCliente():
    """
    Elimina un cliente de la base de datos.
    Requiere: clicodigo en el body de la petición
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json()

    # Validar que se proporcionó el código del cliente
    if not data or "clicodigo" not in data:
        return jsonify({"error": {"msg": "El código del cliente es requerido"}}), 400

    clicodigo = data.get("clicodigo")

    # Validación adicional
    if not clicodigo or not clicodigo.strip():
        return jsonify({"error": {"msg": "El código del cliente no puede estar vacío"}}), 400

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                # 1. Eliminar el cliente
                delete_query = """
                DELETE FROM cxcmcli
                WHERE ciacodigo = :ciacodigo
                AND clicodigo = :clicodigo
                """

                connection.execute(text(delete_query), {"ciacodigo": ciacodigo, "clicodigo": clicodigo})

        return jsonify({"success": True, "message": f"(Código: {clicodigo}) eliminado exitosamente", "data": {"clicodigo": clicodigo}}), 200

    except Exception as e:
        print(f"Error al eliminar cliente: {str(e)}")
        return jsonify({"error": {"msg": f"Error al eliminar cliente: {str(e)}"}}), 400
