from flask import request
from app.GuiadeRemisionDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from error_handling import api_endpoint


@bp.route("/getArticulos", methods=["GET"])
@jwt_required()
@api_endpoint
def getArticulos():
    """Obtiene la lista de artículos activos para agregar a la Guía de Remisión"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        query = text(
            """
            SELECT artcodigo, artdescri
            FROM inmart
            WHERE ciacodigo = :ciacodigo
              AND artstatus = 'A'
            ORDER BY artdescri
        """
        )
        resultados = connection.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchall()

        articulos = [{"artcodigo": r["artcodigo"].strip(), "artdescri": r["artdescri"].strip()} for r in resultados]

    return {"data": articulos}
