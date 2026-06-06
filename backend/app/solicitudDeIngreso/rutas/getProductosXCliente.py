from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxpmprov import cxpmprov
from sqlalchemy import and_, func, or_
from app.models.inbsgaclibod import inbsgaclibod
from app.models.inmstock import inmstock
from app.models.viewProductos import ViewProducto as view_inmart
from app.models.inbsgaclipro import inbsgaclipro
from app.models.intartcodpro import intartcodpro


@bp.route("/getProductosXCliente", methods=["POST"])
@jwt_required()
def getProductosXCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    data = request.get_json()
    cliente = data.get("cliente")
    db.session = get_session(clicianonBD)

    query_ayudaProductos = (
        db.session.query(
            view_inmart.artcodigo,
            view_inmart.artdescri,
            view_inmart.artservicio,
            view_inmart.artexpins,
            view_inmart.artstatus,
        )
        .join(inmstock, inmstock.artcodigo == view_inmart.artcodigo)
        .join(
            inbsgaclibod,
            (inmstock.invcodigo == inbsgaclibod.invcodigo) & (inmstock.bodcodigo == inbsgaclibod.bodcodigo) & (inmstock.ciacodigo == inbsgaclibod.ciacodigo),
        )
        .filter(
            inbsgaclibod.ciacodigo == ciacodigo,
            inbsgaclibod.clicodigo == cliente,
            view_inmart.artservicio == 0,
            view_inmart.artexpins == 0,
            or_(view_inmart.artstatus == "P", view_inmart.artstatus == "A"),
        )
        .order_by(view_inmart.artdescri)
        .distinct()  # Si es necesario
    )
    productos = []
    result_list = query_ayudaProductos.all()

    for result in result_list:
        producto = f"{result.artcodigo}-{result.artdescri}"
        productos.append(producto)

    return jsonify({"productos": productos})
