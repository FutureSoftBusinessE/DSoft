from app.PlanesServicios import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint


@bp.route("/getTarifasIVA", methods=["GET"])
@jwt_required()
@api_endpoint
def getTarifasIVA():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        query = text(
            """
            SELECT
                codigo,
                descripcion,
                porcentaje
            FROM siacsritarifaiva
            WHERE disponible = 1
            ORDER BY codigo
        """
        )

        result = connection.execute(query).mappings().all()

        tarifas = []
        for row in result:
            tarifas.append({"codigo": row["codigo"], "descripcion": row["descripcion"], "porcentaje": float(row["porcentaje"])})

        return {"data": tarifas}
