from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getSecuenciaArticulo", methods=["POST"])
@jwt_required()
def getSecuenciaArticulo():
    claims = get_jwt()
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    data = request.get_json() or {}
    artprodven = data.get("artprodven", True)

    # Lógica de VB6: ART para venta, ACI para consumo interno
    seccodigo = "ART" if artprodven else "ACI"

    with engine.connect() as connection:
        sql_query = text(
            """
            SELECT secnumero
            FROM siacsec WITH (NOLOCK)
            WHERE ciacodigo = :cia AND locservidor = 'A' AND seccodigo = :seccodigo
            """
        )
        result = connection.execute(sql_query, {"cia": sCodCia, "seccodigo": seccodigo}).mappings().fetchone()

        secnumero = ""
        if result and result["secnumero"] is not None:
            # Sumamos 1 a la secuencia actual para mostrar la que será asignada
            sec_actual = int(result["secnumero"])
            secnumero = str(sec_actual + 1)

    return {"data": secnumero}, 200
