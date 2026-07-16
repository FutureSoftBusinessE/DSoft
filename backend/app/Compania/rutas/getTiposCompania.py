from app.Compania import bp
from app.extensions import db
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint


@bp.route("/getTiposCompania", methods=["POST"])
@jwt_required()
@api_endpoint
def getTiposCompania():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        query = text(
            """
            SELECT tpcodigo, tpdescripcion
            FROM siactipocompania
            WHERE tpstatus = 'A'
            ORDER BY tpdescripcion
        """
        )
        result = connection.execute(query).mappings().fetchall()

    return {"data": [dict(row) for row in result]}
