from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getListaBodegas", methods=["POST"])
@jwt_required()
def getListaBodegas():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # Se requiere el código de inventario ya que las bodegas dependen de este
    data = request.get_json() or {}
    invcodigo = data.get("invcodigo")

    if not invcodigo:
        return jsonify({"message": "El código del inventario (invcodigo) es requerido."}), 400

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Consulta de bodegas basada en la lógica de VB6 (Solo bodegas activas para el inventario)
        sql_query = text(
            """
            SELECT bodcodigo, boddescri, bodstatus
            FROM inbbod WITH (NOLOCK)
            WHERE ciacodigo = :ciacodigo
              AND invcodigo = :invcodigo
              AND bodstatus = 'A'
            ORDER BY boddescri ASC
            """
        )
        result = (
            connection.execute(
                sql_query,
                {
                    "ciacodigo": sCodCia,
                    "invcodigo": str(invcodigo).strip().upper()[:2],
                },
            )
            .mappings()
            .fetchall()
        )

        lista_bodegas = []
        for row in result:
            lista_bodegas.append(
                {
                    "bodcodigo": str(row["bodcodigo"]).strip(),
                    "boddescri": str(row["boddescri"]).strip(),
                    "bodstatus": str(row["bodstatus"]).strip(),
                    "label": f"{str(row['bodcodigo']).strip()} - {str(row['boddescri']).strip()}",
                }
            )

    return jsonify({"data": lista_bodegas}), 200
