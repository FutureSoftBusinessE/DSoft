from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getListaPaises", methods=["GET"])
@jwt_required()
def getListaPaises():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Nota: Según la lógica de VB6, la tabla hotbpais es global
    # y no se filtra por ciacodigo.

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Consulta de países basada en la lógica de VB6
        sql_query = text(
            """
            SELECT paiscodigo, paisdescri, paisstatus
            FROM hotbpais WITH (NOLOCK)
            ORDER BY paisdescri ASC
            """
        )
        result = connection.execute(sql_query).mappings().fetchall()

        lista_paises = []
        for row in result:
            descri_formateada = str(row["paisdescri"]).strip()
            if row["paisstatus"] == "I":
                descri_formateada += " (INACTIVO)"

            lista_paises.append(
                {
                    "paiscodigo": str(row["paiscodigo"]).strip(),
                    "paisdescri": str(row["paisdescri"]).strip(),
                    "paisstatus": str(row["paisstatus"]).strip(),
                    "label": f"{str(row['paiscodigo']).strip()} - {descri_formateada}",
                }
            )

    return jsonify({"data": lista_paises}), 200
