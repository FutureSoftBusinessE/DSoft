from flask import request
from app.GuiadeRemisionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from error_handling import api_endpoint


@bp.route("/getCiudades", methods=["GET"])
@cross_origin()
@jwt_required()
@api_endpoint
def getCiudades():
    """Obtiene la lista de ciudades activas para las Guías de Remisión"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        query = text(
            """
            SELECT ciucodigo, ciudescri
            FROM hotbciu
            WHERE ciustatus = 'A'
            ORDER BY ciudescri
        """
        )
        resultados = connection.execute(query).mappings().fetchall()

        ciudades = [{"ciucodigo": r["ciucodigo"].strip(), "ciudescri": r["ciudescri"].strip()} for r in resultados]

    return {"data": ciudades}
