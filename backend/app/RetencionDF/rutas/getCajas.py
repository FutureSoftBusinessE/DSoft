from flask import request
from app.RetencionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from error_handling import api_endpoint


@bp.route("/getCajas", methods=["GET"])
@cross_origin()
@jwt_required()
@api_endpoint
def getCajas():
    """Obtiene las cajas activas para el combo"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        query = text(
            """
            SELECT cjacodigo, cjadescri
            FROM fapcaja
            WHERE ciacodigo = :ciacodigo
              AND loccodigo = :loccodigo
              AND cjastatus = 'A'
        """
        )
        resultados = connection.execute(query, {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).mappings().fetchall()
        cajas = [{"cjacodigo": r["cjacodigo"].strip(), "cjadescri": r["cjadescri"].strip()} for r in resultados]

    return {"data": cajas}
