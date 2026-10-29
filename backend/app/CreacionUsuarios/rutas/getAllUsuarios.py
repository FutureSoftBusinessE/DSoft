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
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from services.encrip_desencrip import desencriptar
import base64


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
                usrcodper,
                usremail,
                usrflagoficre,
                usrflagperfil,
                usrstatus,
                usrimagen,
                usrdiascaduclave,
                usrcodigoreporta,
                usrfecisys,
                usrhorisys,
                usrfecmsys,
                usrhormsys
            FROM siaccusr
            ORDER BY usrfecmsys DESC, usrhormsys DESC, usrstatus ASC
            """

            result = connection.execute(text(base_query)).mappings().fetchall()

            all_usuarios_result = [
                {
                    **{key: value for key, value in dict(row).items()},
                    "usrcodigo": desencriptar(row["usrcodigo"]) if row.get("usrcodigo") else None,
                    "usrnombre": desencriptar(row["usrnombre"]) if row.get("usrnombre") else None,
                    "usrcodper": desencriptar(row["usrcodper"]) if row.get("usrcodper") else None,
                    "usrimagen": (base64.b64encode(row["usrimagen"]).decode("utf-8") if row.get("usrimagen") else None),
                    "usrstatus": desencriptar(row["usrstatus"]) if row.get("usrstatus") else None,
                }
                for row in result
            ]

    return jsonify({"data": all_usuarios_result}), 200
