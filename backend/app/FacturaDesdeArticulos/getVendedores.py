# flake8: noqa
from app.FacturaDesdeArticulos import bp
from app.models.fapvendedor import Fapvendedor, FapvendedorSchema
from app.extensions import db
from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from flask_cors import cross_origin
from app.db import get_session
from sqlalchemy import text


@bp.route("/getVendedores", methods=["GET"])
@cross_origin()
@jwt_required()
def getVendedores():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    # Obtener la sesión y el engine
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Consulta SQL directa
    with engine.connect() as connection:
        with connection.begin():
            query = """
                SELECT vencodigo, vennombre, pedidossiac, pedidosweb
                from fapvendedor
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND venstatus = 'A'
            """
            resultados = (
                connection.execute(
                    text(query),
                    {
                        "ciacodigo": ciacodigo,
                        "loccodigo": loccodigo,
                    },
                )
                .mappings()
                .fetchall()
            )

            # Convertir los resultados a lista de diccionarios
            vendedores = [dict(row) for row in resultados]

    return jsonify(vendedores)
