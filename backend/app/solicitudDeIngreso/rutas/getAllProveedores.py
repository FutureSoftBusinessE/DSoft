from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxpmprov import cxpmprov
from sqlalchemy import func, or_
from app.models.inbsgaclipro import inbsgaclipro


@bp.route("/getAllProveedores", methods=["POST"])
@jwt_required()
def getAllProveedores():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    data = request.get_json()
    cliente = data.get("cliente")
    db.session = get_session(clicianonBD)

    query_ayudaProveedor = (
        db.session.query(
            cxpmprov.procodigo,
            cxpmprov.pronombre,
        )
        .join(inbsgaclipro, cxpmprov.procodigo == inbsgaclipro.procodigo)
        .filter(cxpmprov.ciacodigo == ciacodigo, inbsgaclipro.clicodigo == cliente)
        .order_by(cxpmprov.procodigo)
        .distinct()
    )

    proveedores = []
    result_list = query_ayudaProveedor.all()

    for result in result_list:
        proveedor = f"{result.procodigo}-{result.pronombre}"
        proveedores.append(proveedor)

    return jsonify({"proveedores": proveedores})
