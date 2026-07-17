from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.extensions import db
from app.db import get_session
from app.ExcepcionesdeIVA import bp


@bp.route("/getListaTipoCompania", methods=["GET"])
@jwt_required()
def getListaTipoCompania():
    claims = get_jwt()
    db.session = get_session(claims["seleccion"]["clicianonBD"])

    with db.session.bind.connect() as connection:
        # Buscamos los tipos de compañía que estén Activos (A)[cite: 18]
        sql = text(
            """
            SELECT tpcodigo, tpdescripcion
            FROM siactipocompania
            WHERE tpstatus = 'A'
            ORDER BY tpcodigo ASC
            """
        )
        result = connection.execute(sql).mappings().all()

        lista = []
        for r in result:
            lista.append(
                {
                    "tpcodigo": r["tpcodigo"],
                    # Protegemos contra campos nulos[cite: 18]
                    "tpdescripcion": (r["tpdescripcion"] if r["tpdescripcion"] is not None else ""),
                }
            )

    # Devolvemos el diccionario directamente (SIN jsonify)[cite: 18]
    return {"data": lista}, 200
