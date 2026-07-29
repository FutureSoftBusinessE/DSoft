from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getListaPrincipiosActivos", methods=["GET"])
@jwt_required()
def getListaPrincipiosActivos():
    claims = get_jwt()
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtenemos la conexión a la base de datos correspondiente de la sesión[cite: 9]
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Buscamos los Principios Activos que estén Activos (A) en la compañía actual[cite: 9]
        sql_query = text(
            """
            SELECT priactcodigo, priactdescri
            FROM inbpriactivo WITH (NOLOCK)
            WHERE ciacodigo = :cia AND priactstatus = 'A'
            ORDER BY priactdescri ASC
            """
        )
        result = connection.execute(sql_query, {"cia": sCodCia}).mappings().all()

        lista_principios = []
        for r in result:
            codigo = str(r["priactcodigo"]).strip()
            # Protegemos contra campos nulos[cite: 9]
            descripcion = str(r["priactdescri"]).strip() if r["priactdescri"] is not None else ""

            lista_principios.append(
                {
                    "pricodigo": codigo,
                    "pridescri": descripcion,
                    "label": f"{codigo} - {descripcion}",
                }
            )

    # Devolvemos el diccionario directamente (SIN jsonify)[cite: 9]
    return {"data": lista_principios}, 200
