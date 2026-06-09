from flask import request, jsonify
from app.RetencionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
import base64


@bp.route("/descargarRIDE", methods=["POST"])
@cross_origin()
@jwt_required()
def descargar_ride_retencion():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        payload = request.get_json()
        retid = payload.get("retid")

        if not retid:
            return jsonify({"success": False, "message": "ID de Retención requerido."}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as conn:
            # Buscamos en la tabla de documentos electrónicos (facnumfac guarda el ID del documento, en este caso el retid)
            res = conn.execute(text("SELECT sripdf, sriclave FROM siacdocelectronicos WHERE ciacodigo=:cia AND facnumfac=:retid AND loccodigo=:loc"), {"cia": ciacodigo, "retid": retid, "loc": loccodigo}).fetchone()

            if not res or not res[0]:
                return jsonify({"success": False, "message": "No se encontró el PDF (RIDE) de esta Retención en la base de datos."}), 404

            pdf_base64 = base64.b64encode(res[0]).decode("utf-8")
            clave_acceso = res[1].strip() if res[1] else retid

            return jsonify({"success": True, "ridePDF": pdf_base64, "claveAcceso": clave_acceso})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error al descargar RIDE: {str(e)}"}), 500
