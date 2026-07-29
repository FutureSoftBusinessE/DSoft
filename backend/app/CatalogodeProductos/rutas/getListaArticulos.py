from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getListaArticulos", methods=["GET"])
@jwt_required()
def getListaArticulos():
    claims = get_jwt()
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtenemos la conexión a la base de datos correspondiente[cite: 9]
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Buscamos los Artículos que cumplan con la condición artexpins = 0 en la CIA actual[cite: 9]
        sql_query = text(
            """
            SELECT artcodigo, artdescri
            FROM inmart WITH (NOLOCK)
            WHERE ciacodigo = :cia AND artexpins = 0
            ORDER BY artdescri ASC
            """
        )
        result = connection.execute(sql_query, {"cia": sCodCia}).mappings().all()

        lista_articulos = []
        for r in result:
            codigo = str(r["artcodigo"]).strip()
            # Protegemos contra campos nulos[cite: 9]
            descripcion = str(r["artdescri"]).strip() if r["artdescri"] is not None else ""

            lista_articulos.append(
                {
                    "artcodigo": codigo,
                    "artdescri": descripcion,
                    "label": f"{codigo} - {descripcion}",
                }
            )

    # Devolvemos el diccionario directamente (SIN jsonify)[cite: 9]
    return {"data": lista_articulos}, 200
