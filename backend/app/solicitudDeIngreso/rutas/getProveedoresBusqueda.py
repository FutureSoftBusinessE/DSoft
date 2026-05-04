from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxpmprov import cxpmprov
from sqlalchemy import func, or_


@bp.route("/getProveedoresBusqueda", methods=["POST"])
@cross_origin()
@jwt_required()
def getProveedoresBusqueda():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        db.session = get_session(clicianonBD)

        query_ayudaProveedor = (
            db.session.query(
                cxpmprov.procodigo,
                cxpmprov.pronombre,
            )
            .filter(cxpmprov.ciacodigo == ciacodigo)
            .order_by(cxpmprov.procodigo)
            .distinct()
        )

        proveedores = []
        result_list = query_ayudaProveedor.all()

        for result in result_list:
            proveedor = f"{result.procodigo}-{result.pronombre}"
            proveedores.append(proveedor)

        return jsonify({"proveedores": proveedores})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
