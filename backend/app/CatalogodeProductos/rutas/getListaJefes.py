from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getListaJefes", methods=["GET"])
@jwt_required()
def getListaJefes():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Consulta de jefes de producto basada en la lógica de VB6
        # Se traen todos (A e I) para no perder el historial en productos antiguos
        sql_query = text(
            """
            SELECT jefecodigo, jefedescri, jefestatus
            FROM intartjefe WITH (NOLOCK)
            WHERE ciacodigo = :ciacodigo
            ORDER BY jefedescri ASC
            """
        )
        result = connection.execute(sql_query, {"ciacodigo": sCodCia}).mappings().fetchall()

        lista_jefes = []
        for row in result:
            descri_formateada = str(row["jefedescri"]).strip()
            if row["jefestatus"] == "I":
                descri_formateada += " (INACTIVO)"

            lista_jefes.append(
                {
                    "jefecodigo": str(row["jefecodigo"]).strip(),
                    "jefedescri": str(row["jefedescri"]).strip(),
                    "jefestatus": str(row["jefestatus"]).strip(),
                    "label": f"{str(row['jefecodigo']).strip()} - {descri_formateada}",
                }
            )

    return jsonify({"data": lista_jefes}), 200
