# fmt: off
import base64
from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from app.models.intimagen import intimagen, intimagenSchema
from services.encrip_desencrip import encriptar


@bp.route("/getImagesxArtcodigo/<string:artcodigo>", methods=["GET"])
@cross_origin()
@jwt_required()
def getImagesxArtcodigo(artcodigo):
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]

        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        db.session = get_session(clicianonBD)

        # Realiza la consulta

        query = (
            db.session.query(intimagen.artcodigo, intimagen.artimagen)
            .filter(intimagen.ciacodigo == ciacodigo, intimagen.artcodigo == artcodigo)
            .all()
        )

        formatedResultFrontend = [
            {"artcodigo": q[0], "artimagen": base64.b64encode(q[1]).decode("utf-8") if q[1] else None} for q in query
        ]

        return jsonify({"data": formatedResultFrontend})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
