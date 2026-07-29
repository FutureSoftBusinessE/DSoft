from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getListaPresentaciones", methods=["GET"])
@jwt_required()
def getListaPresentaciones():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Consulta de presentaciones basada en la lógica de VB6
        sql_query = text(
            """
            SELECT precodigo, predescri, prestatus
            FROM inbpre WITH (NOLOCK)
            WHERE ciacodigo = :ciacodigo
            ORDER BY predescri ASC
            """
        )
        result = connection.execute(sql_query, {"ciacodigo": sCodCia}).mappings().fetchall()

        lista_presentaciones = []
        for row in result:
            descri_formateada = str(row["predescri"]).strip()
            if row["prestatus"] == "I":
                descri_formateada += " (INACTIVO)"

            lista_presentaciones.append(
                {
                    "precodigo": str(row["precodigo"]).strip(),
                    "predescri": str(row["predescri"]).strip(),
                    "prestatus": str(row["prestatus"]).strip(),
                    "label": f"{str(row['precodigo']).strip()} - {descri_formateada}",
                }
            )

    return jsonify({"data": lista_presentaciones}), 200
