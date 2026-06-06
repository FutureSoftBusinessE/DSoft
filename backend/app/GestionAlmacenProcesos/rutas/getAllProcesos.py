# flake8: noqa
from flask import jsonify, request
from app.GestionAlmacenProcesos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.siacprocesos import siacprocesos, siacprocesosSchema
from services.encrip_desencrip import encriptar
from sqlalchemy import desc


@bp.route("/getAllProcesos", methods=["GET"])
@jwt_required()
def getAllGestionAlmacenProcesos():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = encriptar(claims["user"])

    db.session = get_session(clicianonBD)

    # Realiza la consulta

    query = (
        db.session.query(
            siacprocesos.ciacodigo,
            siacprocesos.procesocod,
            siacprocesos.espcodigo,
            siacprocesos.invcodigo,
            siacprocesos.artcodigo,
            siacprocesos.procesosta,
            siacprocesos.procesofisys,
            siacprocesos.procesohisys,
            siacprocesos.procesouisys,
            siacprocesos.procesoeisys,
            siacprocesos.procesofmsys,
            siacprocesos.procesohmsys,
            siacprocesos.procesoumsys,
            siacprocesos.procesoemsys,
        )
        .filter(
            siacprocesos.ciacodigo == ciacodigo,
        )
        .order_by(desc(siacprocesos.procesofmsys), desc(siacprocesos.procesohmsys))
        .distinct()
        .all()
    )

    schema = siacprocesosSchema(many=True)

    result = schema.dump(query)

    return jsonify({"data": result})
