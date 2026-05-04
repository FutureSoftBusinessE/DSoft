from flask import jsonify, request, make_response
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxcmcli import Cxcmcli as cxcmcli


@bp.route("/getCodCliente", methods=["POST"])
@cross_origin()
@jwt_required()
def getCodCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    data = request.get_json()
    clinombre = data["clinombre"]

    db.session = get_session(clicianonBD)

    # Realiza la consulta

    try:
        query = (
            db.session.query(
                cxcmcli.clinombre,
                cxcmcli.ciacodigo,
                cxcmcli.clicodigo,
            )
            .filter(cxcmcli.clinombre == clinombre, cxcmcli.ciacodigo == ciacodigo)
            .first()
        )

        return jsonify({"codigo": query[2]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
