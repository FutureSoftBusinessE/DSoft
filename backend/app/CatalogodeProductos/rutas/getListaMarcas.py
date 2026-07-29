from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getListaMarcas", methods=["GET"])
@jwt_required()
def getListaMarcas():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Consulta de marcas basada en la lógica de VB6
        sql_query = text(
            """
            SELECT marcodigo, mardescri, marstatus
            FROM inbmar WITH (NOLOCK)
            WHERE ciacodigo = :ciacodigo
            ORDER BY mardescri ASC
            """
        )
        result = connection.execute(sql_query, {"ciacodigo": sCodCia}).mappings().fetchall()

        lista_marcas = []
        for row in result:
            descri_formateada = str(row["mardescri"]).strip()
            if row["marstatus"] == "I":
                descri_formateada += " (INACTIVO)"

            lista_marcas.append(
                {
                    "marcodigo": str(row["marcodigo"]).strip(),
                    "mardescri": str(row["mardescri"]).strip(),
                    "marstatus": str(row["marstatus"]).strip(),
                    "label": f"{str(row['marcodigo']).strip()} - {descri_formateada}",
                }
            )

    return jsonify({"data": lista_marcas}), 200
