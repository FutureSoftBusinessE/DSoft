from flask import jsonify, request
from app.PlanificacionTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime


@bp.route("/getAllClientes", methods=["GET"])
@jwt_required()
def getAllClientes():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            all_clientes_query = """
                SELECT DISTINCT
                    cxcmcli.clicodigo,
                    cxcmcli.clinombre,
                    cxcmcli.clitelef1
                FROM
                    cxcmcli
                WHERE
                    cxcmcli.ciacodigo = :ciacodigo
                ORDER BY
                    cxcmcli.clicodigo
            """
            all_clientes_result = connection.execute(text(all_clientes_query), {"ciacodigo": ciacodigo}).mappings().fetchall()
            all_clientes_result = [{"value": row.clicodigo, "label": f"{row.clinombre} ({row.clicodigo})", "clicodigo": row.clicodigo, "clinombre": row.clinombre, "clitelef1": row.clitelef1} for row in all_clientes_result]

    return jsonify({"data": all_clientes_result})
