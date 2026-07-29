from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getListaInventarios", methods=["GET"])
@jwt_required()
def getListaInventarios():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Consulta basada en el recordset adorstInv del VB6
        sql_query = text(
            """
            SELECT invcodigo, invdescri, invstatus
            FROM inbinv WITH (NOLOCK)
            WHERE ciacodigo = :ciacodigo
            ORDER BY invdescri ASC
            """
        )
        result = connection.execute(sql_query, {"ciacodigo": sCodCia}).mappings().fetchall()

        lista_inventarios = []
        for row in result:
            # En VB6 se concatenaba "INACTIVO" si el status era "I".
            # Aquí lo enviamos estructurado para que el frontend decida cómo mostrarlo.
            descri_formateada = str(row["invdescri"]).strip()
            if row["invstatus"] == "I":
                descri_formateada += " (INACTIVO)"

            lista_inventarios.append(
                {
                    "invcodigo": str(row["invcodigo"]).strip(),
                    "invdescri": str(row["invdescri"]).strip(),
                    "invstatus": str(row["invstatus"]).strip(),
                    "label": f"{str(row['invcodigo']).strip()} - {descri_formateada}",
                }
            )

    return jsonify({"data": lista_inventarios}), 200
