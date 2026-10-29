from flask import jsonify, request
from app.AccesoACompañiasYModulos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from services.encrip_desencrip import desencriptar


@bp.route("/getAllUsuarios", methods=["POST"])
@jwt_required()
def getAllUsuarios():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            base_query = """
            SELECT
                usrcodigo,
                usrnombre,
                usrfeccad,
                usrstatus,
                usrflagperfil,
                usrfecmsys,
                usrhormsys
            FROM siaccusr
            ORDER BY usrstatus ASC, usrfecmsys DESC, usrhormsys DESC
            """

            result = connection.execute(text(base_query)).mappings().fetchall()

            all_usuarios_result = [
                {
                    **{key: value for key, value in dict(row).items()},
                    "usrcodigo": desencriptar(row["usrcodigo"]) if row.get("usrcodigo") else None,
                    "usrnombre": desencriptar(row["usrnombre"]) if row.get("usrnombre") else None,
                    "usrstatus": desencriptar(row["usrstatus"]) if row.get("usrstatus") else None,
                }
                for row in result
            ]

    return jsonify({"data": all_usuarios_result}), 200
