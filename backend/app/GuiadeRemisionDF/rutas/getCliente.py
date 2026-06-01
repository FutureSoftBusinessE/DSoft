from flask import request
from app.GuiadeRemisionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from error_handling import api_endpoint


@bp.route("/getCliente", methods=["GET"])
@cross_origin()
@jwt_required()
@api_endpoint
def getClientes():
    """Obtiene el catálogo de clientes activos para Guías de Remisión manuales"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Traemos solo los datos esenciales para el Autocomplete
        query = text(
            """
            SELECT clicodigo, clinombre, cliruc, clidirec, clitelef1, cliemail
            FROM cxcmcli
            WHERE ciacodigo = :ciacodigo
              AND clistatus = 'A'
            ORDER BY clinombre
        """
        )
        resultados = connection.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchall()

        cliente = [
            {
                "clicodigo": r["clicodigo"].strip(),
                "clinombre": r["clinombre"].strip(),
                "cliruc": r["cliruc"].strip() if r["cliruc"] else "",
                "clidirec": r["clidirec"].strip() if r["clidirec"] else "",
                "clitelef1": r["clitelef1"].strip() if r["clitelef1"] else "",
                "cliemail": r["cliemail"].strip() if "cliemail" in r and r["cliemail"] else "",
            }
            for r in resultados
        ]

    return {"data": cliente}
