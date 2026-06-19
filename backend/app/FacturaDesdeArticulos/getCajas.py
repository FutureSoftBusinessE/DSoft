from flask import request
from app.FacturaDesdeArticulos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from error_handling import api_endpoint


@bp.route("/getCajas", methods=["GET"])
@jwt_required()
@api_endpoint
def getCajas():
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
        cajas = [{"value": r["cjacodigo"].strip(), "label": f"[{r['cjacodigo'].strip()}] {r['cjadescri'].strip()}"} for r in resultados]

    return cajas
