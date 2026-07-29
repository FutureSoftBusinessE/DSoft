from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getLineasModalFull", methods=["GET"])
@jwt_required()
def getLineasModalFull():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Consulta de líneas de productos basada en el sistema VB6
        sql_query = text(
            """
            SELECT lintipo, linnivel, lincodigo,lincodigo1,linlindes, lindescri,linstatus
            FROM inblin WITH (NOLOCK)
            WHERE ciacodigo = :ciacodigo and linstatus = 'A'
            ORDER BY lincodigo ASC
            """
        )
        result = connection.execute(sql_query, {"ciacodigo": sCodCia}).mappings().fetchall()

        lista_lineas = []
        for row in result:
            descri_formateada = str(row["lindescri"]).strip()
            if row["linstatus"] == "I":
                descri_formateada += " (INACTIVO)"

            lista_lineas.append(
                {
                    "lintipo": str(row["lintipo"]).strip() if row["lintipo"] else "",
                    "linnivel": int(row["linnivel"]) if row["linnivel"] is not None else 0,
                    "lincodigo": str(row["lincodigo"]).strip(),
                    "lincodigo1": str(row["lincodigo1"]).strip(),
                    "linlindes": str(row["linlindes"]).strip(),
                    "lindescri": str(row["lindescri"]).strip(),
                    "linstatus": str(row["linstatus"]).strip(),
                    "label": f"{str(row['lincodigo']).strip()} - {descri_formateada}",
                }
            )

    return jsonify({"data": lista_lineas}), 200
