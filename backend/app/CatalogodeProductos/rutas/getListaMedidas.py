from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getListaMedidas", methods=["GET"])
@jwt_required()
def getListaMedidas():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Consulta de medidas basada en la lógica de VB6[cite: 3]
        sql_query = text(
            """
            SELECT medcodigo, meddescri, medstatus
            FROM inbmed WITH (NOLOCK)
            WHERE ciacodigo = :ciacodigo
            ORDER BY meddescri ASC
            """
        )
        result = connection.execute(sql_query, {"ciacodigo": sCodCia}).mappings().fetchall()

        lista_medidas = []
        for row in result:
            descri_formateada = str(row["meddescri"]).strip()
            if row["medstatus"] == "I":
                descri_formateada += " (INACTIVO)"

            lista_medidas.append(
                {
                    "medcodigo": str(row["medcodigo"]).strip(),
                    "meddescri": str(row["meddescri"]).strip(),
                    "medstatus": str(row["medstatus"]).strip(),
                    "label": f"{str(row['medcodigo']).strip()} - {descri_formateada}",
                }
            )

    return jsonify({"data": lista_medidas}), 200
