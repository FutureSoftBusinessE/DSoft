from flask import request, jsonify

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.LineasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint


@bp.route("/getConfigLineas", methods=["GET"])
@jwt_required()
@api_endpoint
def getConfigLineas():
    # Extrae la configuración dinámica de la empresa
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        query = text("SELECT ciaforlin, cianiveleslin FROM siaccia WHERE ciacodigo = :ciacodigo")
        res = connection.execute(query, {"ciacodigo": sCodCia}).mappings().fetchone()

        if res:
            return {"ciaforlin": res["ciaforlin"] or "##-##-##", "cianiveleslin": int(res["cianiveleslin"] or 3)}
        return {"ciaforlin": "##-##-##", "cianiveleslin": 3}


# Cambiado a POST para mayor estabilidad
@bp.route("/getLineaByCodigo", methods=["POST"])
@jwt_required()
@api_endpoint
def getLineaByCodigo():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json()
    # Recibimos el código crudo (ej: 020700)
    codigo = data.get("codigo")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Usamos TRIM para evitar fallos si el campo en SQL es CHAR de longitud fija
        query = text(
            """
            SELECT RTRIM(lincodigo) as lincodigo, RTRIM(lindescri) as lindescri
            FROM inblin
            WHERE ciacodigo = :ciacodigo
              AND RTRIM(lincodigo) = :codigo
        """
        )
        res = connection.execute(query, {"ciacodigo": sCodCia, "codigo": str(codigo).strip().upper()}).mappings().fetchone()

        if res:
            return {"encontrado": True, "lincodigo": res["lincodigo"], "lindescri": res["lindescri"]}
        return {"encontrado": False}
