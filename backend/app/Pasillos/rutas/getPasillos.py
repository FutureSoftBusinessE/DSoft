from flask import jsonify, request
from app.Pasillos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from services.encrip_desencrip import encriptar
from app.models.inbpasillos import InbPasillo, InbPasilloSchema


@bp.route("/getPasillos", methods=["GET"])
@cross_origin()
@jwt_required()
def getPasillos():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    usrcodigo = claims["user"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    db.session = get_session(clicianonBD)
    query = (
        db.session.query(
            InbPasillo.ciacodigo,
            InbPasillo.pascodigo,
            InbPasillo.pasdescripcion,
            InbPasillo.passtatus,
            InbPasillo.pasfecisys,
            InbPasillo.pashorisys,
            InbPasillo.pasusuisys,
            InbPasillo.pasestisys,
            InbPasillo.pasfecmsys,
            InbPasillo.pashormsys,
            InbPasillo.pasusumsys,
            InbPasillo.pasestmsys,
        )
        .filter(
            InbPasillo.ciacodigo == ciacodigo,
        )
        .distinct()
        .all()
    )
    schema = InbPasilloSchema(many=True)

    result = schema.dump(query)

    return jsonify({"data": result, "usuario": usrcodigo})
