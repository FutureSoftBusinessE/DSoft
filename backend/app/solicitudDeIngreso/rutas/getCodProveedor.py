from flask import jsonify, request, make_response
from app.solicitudDeIngreso import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.viewProductos import ViewProducto as view_inmart
from app.models.cxcmcli import Cxcmcli as cxcmcli
from app.models.view_cxcmcli import View_cxcmcli as view_cxcmcli
from app.models.cxpmprov import cxpmprov


@bp.route("/getCodProveedor", methods=["POST"])
@jwt_required()
def getCodProveedor():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    data = request.get_json()
    pronombre = data["pronombre"]

    db.session = get_session(clicianonBD)

    # Realiza la consulta

    try:
        query = (
            db.session.query(
                cxpmprov.pronombre,
                cxpmprov.ciacodigo,
                cxpmprov.procodigo,
            )
            .filter(cxpmprov.pronombre == pronombre, cxpmprov.ciacodigo == ciacodigo)
            .first()
        )

        return jsonify({"codigo": query[2]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
