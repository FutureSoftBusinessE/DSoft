from app.FacturaDesdeArticulos import bp
from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from flask_cors import cross_origin
from app.extensions import db
from app.db import get_session
from sqlalchemy import text


@bp.route("/getFormaPago", methods=["GET"])
@cross_origin()
@jwt_required()
def get_formas_pago():
    # Obtener los datos del usuario autenticado desde el token JWT
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
                SELECT c.*
                FROM cxcbformapag c
                INNER JOIN fasloc f
                    ON c.ciacodigo = f.ciacodigo
                    AND c.factippag = f.factippag
                WHERE
                    c.ciacodigo = :ciacodigo
                    AND f.loccodigo = :loccodigo
                    AND c.forstatus = 'A'
            """

            resultados = connection.execute(text(query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).mappings().fetchall()

            # Convertir los resultados a lista de diccionarios
            formas_pago_serializadas = [dict(row) for row in resultados]

    return jsonify(formas_pago_serializadas)
