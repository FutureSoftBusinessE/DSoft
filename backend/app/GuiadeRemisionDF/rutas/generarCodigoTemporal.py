from flask import request
from app.GuiadeRemisionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from error_handling import api_endpoint, ValidationError
from datetime import datetime


@bp.route("/generarCodigoTemporal/<cjacodigo>", methods=["GET"])
@cross_origin()
@jwt_required()
@api_endpoint
def generarCodigoTemporal(cjacodigo):
    """Genera el código NEMOTÉCNICO de la Guía de Remisión según la caja seleccionada"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Buscamos la secuencia para el documento 06 (Guía de Remisión)
        query = text(
            """
            SELECT sriautnumero, sriserie01, sriserie02, srisecini, srisecfin, srisecact
            FROM siactsriseries
            WHERE ciacodigo = :ciacodigo
              AND cjacodigo = :cjacodigo
              AND srisecdoc = '06'
        """
        )
        serie = connection.execute(query, {"ciacodigo": ciacodigo, "cjacodigo": cjacodigo}).mappings().first()

        if not serie:
            raise ValidationError("No existe configuración SRI (06) para la caja seleccionada.")

        srisecact = int(serie["srisecact"] or 0)
        secuencia_actual = srisecact + 1

        year = datetime.now().strftime("%y")
        sriserie01 = str(serie["sriserie01"]).strip() if serie["sriserie01"] else "001"
        sriserie02 = str(serie["sriserie02"]).strip() if serie["sriserie02"] else "001"

        # Formato G + Año + Estab + PtoEmi + Secuencia (Ej: G26001777000000001)
        guinumero = f"G{year}{sriserie01}{sriserie02}{secuencia_actual:09}"

    return {"data": guinumero}
