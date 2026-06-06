from flask import jsonify, request
from app.PlanesServicios import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text


@bp.route("/getInventariosSelect", methods=["POST"])
@jwt_required()
def getInventariosSelect():
    """Obtiene la lista de inventarios para usar en selects/dropdowns"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            query = text(
                """
                SELECT invcodigo, invdescri
                FROM inbinv
                WHERE ciacodigo = :cia
                AND invstatus = 'A'
                ORDER BY invcodigo
            """
            )

            rows = connection.execute(query, {"cia": sCodCia}).mappings().fetchall()
            data = [{"value": row["invcodigo"], "label": f"{row['invcodigo']} - {row['invdescri']}"} for row in rows]

    return {
        "data": data,
    }
