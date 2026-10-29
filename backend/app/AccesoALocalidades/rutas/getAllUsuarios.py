from flask import jsonify, request
from app.AccesoALocalidades import bp
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
            SELECT DISTINCT
                sct.ciacodigo,
                sca.ciadescri,
                scu.usrcodigo,
                scu.usrnombre,
                scu.usrfeccad,
                scu.usrstatus,
                scu.usrflagperfil,
                scu.usrfecmsys,
                scu.usrhormsys
            FROM siaccusr scu
            INNER JOIN siactusr sct
                ON sct.usrcodigo = scu.usrcodigo
            INNER JOIN siaccia sca
                ON sca.ciacodigo = sct.ciacodigo
            WHERE scu.usrflagperfil = 0
            ORDER BY scu.usrstatus ASC, scu.usrfecmsys DESC, scu.usrhormsys DESC
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
