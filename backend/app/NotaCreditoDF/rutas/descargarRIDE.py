from flask import request, jsonify
from app.NotaCreditoDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
import base64


@bp.route("/descargarRIDE", methods=["POST"])
@cross_origin()
@jwt_required()
def descargar_ride():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        payload = request.get_json()
        # El frontend envía 'facnumfac' conteniendo el 'nccodigo'
        facnumfac = payload.get("facnumfac")

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as conn:
            res = conn.execute(text("SELECT sripdf, sriclave FROM siacdocelectronicos WHERE ciacodigo=:cia AND facnumfac=:fac AND loccodigo=:loc"), {"cia": ciacodigo, "fac": facnumfac, "loc": loccodigo}).fetchone()

            if not res or not res[0]:
                return jsonify({"success": False, "message": "No se encontró el PDF (RIDE) de esta Nota de Crédito en la base de datos."}), 404

            pdf_b64 = base64.b64encode(res[0]).decode("utf-8")

            return jsonify({"success": True, "ridePDF": pdf_b64, "claveAcceso": res[1]})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error obteniendo RIDE: {str(e)}"}), 500
