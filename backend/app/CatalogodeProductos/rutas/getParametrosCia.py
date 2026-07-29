from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getParametrosCia", methods=["GET"])
@jwt_required()
def getParametrosCia():
    claims = get_jwt()
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        sql_query = text(
            """
            SELECT ciacostfor, cianiveleslin, ciaforlin, codartsec
            FROM siaccia WITH (NOLOCK)
            WHERE ciacodigo = :cia
            """
        )
        result = connection.execute(sql_query, {"cia": sCodCia}).mappings().all()

        lista_parametros = []
        for r in result:
            costfor = str(r["ciacostfor"]).strip() if r["ciacostfor"] is not None else "#,##0.00"
            niveleslin = int(r["cianiveleslin"]) if r["cianiveleslin"] is not None else 0
            forlin = str(r["ciaforlin"]).strip() if r["ciaforlin"] is not None else ""
            codartsec = int(r["codartsec"]) if r["codartsec"] is not None else 0

            lista_parametros.append(
                {
                    "ciacostfor": costfor,
                    "cianiveleslin": niveleslin,
                    "ciaforlin": forlin,
                    "codartsec": codartsec,
                }
            )

    return {"data": lista_parametros}, 200
