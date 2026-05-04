# fmt: off
import base64
from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from app.models.producto import Producto as inmart
from services.encrip_desencrip import encriptar


@bp.route("/getArticuloDescrixArtCodigo/<string:artcodigo>", methods=["GET"])
@cross_origin()
@jwt_required()
def getArticuloDescrixArtCodigo(artcodigo):
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)

    # Realiza la consulta

    try:
        query = (
            db.session.query(inmart.artcodigo, inmart.artdescri)
            .filter(
                inmart.ciacodigo == ciacodigo,
                inmart.artcodigo == artcodigo
            ).first()
        )

        formatedResultFrontend = {
            "artdescri": query[1],
        }

        if len(formatedResultFrontend) > 0:
            return jsonify({"dataResult": formatedResultFrontend, "message": "OK"}), 200
        else:
            return jsonify({"dataResult": [], "message": f"No se encontró registro con código {artcodigo}"}), 200
    except Exception as e:
        return f"Error en la transacción: {e}", 500
