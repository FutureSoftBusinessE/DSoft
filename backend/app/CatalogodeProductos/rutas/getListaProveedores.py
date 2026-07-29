from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session


@bp.route("/getListaProveedores", methods=["GET"])
@jwt_required()
def getListaProveedores():
    claims = get_jwt()
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Buscamos los Proveedores que estén Activos (A) en la compañía actual
        sql_query = text(
            """
            SELECT procodigo, pronombre
            FROM cxpmprov WITH (NOLOCK)
            WHERE ciacodigo = :cia AND prostatus = 'A'
            ORDER BY pronombre ASC
            """
        )
        result = connection.execute(sql_query, {"cia": sCodCia}).mappings().all()

        lista_proveedores = []
        for r in result:
            codigo = str(r["procodigo"]).strip()
            # Protegemos contra campos nulos
            nombre = str(r["pronombre"]).strip() if r["pronombre"] is not None else ""

            lista_proveedores.append(
                {
                    "provcodigo": codigo,
                    "provdescri": nombre,
                    "label": f"{codigo} - {nombre}",
                }
            )

    # Devolvemos el diccionario directamente (SIN jsonify)
    return {"data": lista_proveedores}, 200
