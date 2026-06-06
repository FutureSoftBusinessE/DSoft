from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxcmcli import Cxcmcli
from sqlalchemy import func, or_
from app.models.inbsgaclibod import inbsgaclibod


@bp.route("/getAllClientes", methods=["GET"])
@jwt_required()
def getAllClientes():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)

    query_ayudaCliente = (
        db.session.query(
            Cxcmcli.clicodigo,
            Cxcmcli.clinombre,
        )
        .join(inbsgaclibod, Cxcmcli.clicodigo == inbsgaclibod.clicodigo)
        .filter(Cxcmcli.ciacodigo == ciacodigo)
        .order_by(Cxcmcli.clicodigo)
        .distinct()
    )

    clientes = []
    result_list = query_ayudaCliente.all()

    for result in result_list:
        cliente = f"{result.clicodigo}-{result.clinombre}"
        clientes.append(cliente)

    return jsonify({"clientes": clientes})
