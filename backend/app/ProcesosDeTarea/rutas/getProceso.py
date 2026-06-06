# flake8: noqa
from flask import jsonify, request, make_response
from app.ProcesosDeTarea import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdocbprocesos import gdocbprocesos
from services.encrip_desencrip import encriptar


@bp.route("/getProceso", methods=["POST"])
@jwt_required()
def getProceso():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json()
    procesocod = data.get("procesocod", "")

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = encriptar(claims["user"])

    db.session = get_session(clicianonBD)

    if not procesocod:
        return jsonify({"error": "Desde la web no se envio ningun procesocod"}), 500

    # Realiza la consulta para obtner el proceso
    query = db.session.query(gdocbprocesos).filter(gdocbprocesos.ciacodigo == ciacodigo, gdocbprocesos.procesocod == procesocod).first()

    # Construir la estructura deseada
    schema = {"proceso": query.procesocod, "estado": query.procesosta}

    return jsonify({"data": schema}), 200
