# flake8: noqa
from flask import jsonify, request
from app.PaquetesDeProcesosTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdoccpaquetes import gdoccpaquetes
from app.models.gdocbprocesos import gdocbprocesos, gdocbprocesosSchema
from services.encrip_desencrip import encriptar
from sqlalchemy import desc


@bp.route("/getProcesos", methods=["GET"])
@jwt_required()
def getAllGestionAlmacenProcesos():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = encriptar(claims["user"])

    db.session = get_session(clicianonBD)

    # Realiza la consulta
    # subquery = db.session.query(gdoccpaquetes.procesocod).filter(gdoccpaquetes.ciacodigo == ciacodigo).distinct()

    query = db.session.query(gdocbprocesos).filter(gdocbprocesos.ciacodigo == ciacodigo).all()

    schema = gdocbprocesosSchema(many=True)

    result = schema.dump(query)

    return jsonify({"data": result})
