from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.extensions import db
from app.db import get_session
from app.SecuenciasDoc import bp


@bp.route("/getListaLocalidades", methods=["GET"])
@jwt_required()
def getListaLocalidades():
    claims = get_jwt()
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    db.session = get_session(claims["seleccion"]["clicianonBD"])

    with db.session.bind.connect() as connection:
        # Filtramos por compañía y solo localidades Activas (A)
        sql = text(
            """
            SELECT loccodigo, locdescri
            FROM cgblocal
            WHERE ciacodigo = :cia AND locstatus = 'A'
            ORDER BY loccodigo ASC
        """
        )
        result = connection.execute(sql, {"cia": sCodCia}).mappings().all()

        lista = []
        for r in result:
            lista.append(
                {
                    "loccodigo": r["loccodigo"],
                    # Protegemos contra campos nulos
                    "locdescri": r["locdescri"] if r["locdescri"] is not None else "",
                }
            )

    return {"data": lista}, 200
