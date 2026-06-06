from flask import jsonify, request
from app.CreacionUsuarios import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime
from services.encrip_desencrip import desencriptar


@bp.route("/getAllUsuariosSinPerfiles", methods=["GET"])
@jwt_required()
def getAllUsuariosSinPerfiles():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Conexión a la base de datos correspondiente
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            all_perfiles_query = """
                SELECT DISTINCT
                    TRIM(usrcodigo) as usrcodper_encrypted,
                    TRIM(usrnombre) as usrnombre_encrypted
                FROM siaccusr
                WHERE usrflagperfil != -1
                ORDER BY usrcodper_encrypted
            """
            all_perfiles_result = connection.execute(text(all_perfiles_query), {"usrcode": encriptar(sUsuario)}).mappings().fetchall()

            # Desencriptar resultados
            all_perfiles_result = [{"value": desencriptar(row.usrcodper_encrypted), "label": desencriptar(row.usrnombre_encrypted)} for row in all_perfiles_result]

    return jsonify({"data": all_perfiles_result})
