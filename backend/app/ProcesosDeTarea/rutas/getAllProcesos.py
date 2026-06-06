# flake8: noqa
from flask import jsonify, request
from app.ProcesosDeTarea import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdocbprocesos import gdocbprocesos, gdocbprocesosSchema
from services.encrip_desencrip import encriptar
from sqlalchemy import desc


@bp.route("/getAllProcesos", methods=["GET"])
@jwt_required()
def getAllProcesos():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = encriptar(claims["user"])

    db.session = get_session(clicianonBD)

    # Realiza la consulta

    query = (
        db.session.query(
            gdocbprocesos.ciacodigo,
            gdocbprocesos.procesocod,
            gdocbprocesos.espcodigo,
            gdocbprocesos.invcodigo,
            gdocbprocesos.artcodigo,
            gdocbprocesos.procesosta,
            gdocbprocesos.procesofisys,
            gdocbprocesos.procesohisys,
            gdocbprocesos.procesouisys,
            gdocbprocesos.procesoeisys,
            gdocbprocesos.procesofmsys,
            gdocbprocesos.procesohmsys,
            gdocbprocesos.procesoumsys,
            gdocbprocesos.procesoemsys,
        )
        .filter(
            gdocbprocesos.ciacodigo == ciacodigo,
        )
        .order_by(desc(gdocbprocesos.procesofmsys), desc(gdocbprocesos.procesohmsys))
        .distinct()
        .all()
    )

    schema = gdocbprocesosSchema(many=True)

    result = schema.dump(query)

    return jsonify({"data": result})
