from flask import request
from app.NotaDebitoDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from error_handling import api_endpoint


@bp.route("/getServicios", methods=["GET"])
@jwt_required()
@api_endpoint
def getServicios():
    """Obtiene la lista de servicios activos para Notas de Débito"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        query = text(
            """
            SELECT
                sercodigo, serdescri, seriva,
                servals1 as precio1, servals2 as precio2
            FROM cxcbser
            WHERE ciacodigo = :ciacodigo
              AND serncnd = 'D'
              AND serautor = 1
              AND serstatus = 'A'
        """
        )
        resultados = connection.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchall()

        servicios = []
        for row in resultados:
            servicios.append({"sercodigo": row["sercodigo"].strip() if row["sercodigo"] else "", "serdescri": row["serdescri"].strip() if row["serdescri"] else "", "seriva": float(row["seriva"] or 0), "precio1": float(row["precio1"] or 0), "precio2": float(row["precio2"] or 0)})

    return {"data": servicios}
