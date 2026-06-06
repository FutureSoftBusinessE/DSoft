from flask import request
from app.GuiadeRemisionDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from error_handling import api_endpoint


@bp.route("/getTransportistas", methods=["GET"])
@jwt_required()
@api_endpoint
def getTransportistas():
    """Obtiene la lista de transportistas activos de la compañía"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        query = text(
            """
            SELECT transcodigo, transdescri, transplaca , transruc
            FROM inbtranspor
            WHERE ciacodigo = :ciacodigo
              AND transstatus = 'A'
            ORDER BY transdescri
        """
        )
        resultados = connection.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchall()

        transportistas = [{"transcodigo": r["transcodigo"].strip(), "transdescri": r["transdescri"].strip(), "transplaca": r["transplaca"].strip(), "transruc": r["transruc"].strip() if r["transruc"] else ""} for r in resultados]

    return {"data": transportistas}
