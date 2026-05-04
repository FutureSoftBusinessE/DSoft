from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxpmprov import cxpmprov
from sqlalchemy import and_, func, or_
from app.models.viewProductos import ViewProducto as view_inmart


@bp.route("/getProductosBusqueda", methods=["POST"])
@cross_origin()
@jwt_required()
def getProductosBusqueda():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        db.session = get_session(clicianonBD)

        query_ayudaProductos = db.session.query(view_inmart.artcodigo, view_inmart.artdescri).filter(view_inmart.ciacodigo == ciacodigo).order_by(view_inmart.artcodigo)
        productos = []
        result_list = query_ayudaProductos.all()

        for result in result_list:
            producto = f"{result.artcodigo}-{result.artdescri}"
            productos.append(producto)

        return jsonify({"productos": productos})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
