# flake8: noqa
from flask import jsonify, request
from app.BancoDeTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdocctareas import gdocctareas, gdocctareasSchema
from services.encrip_desencrip import encriptar


@bp.route("/getAllBancoDeTareas", methods=["GET"])
@cross_origin()
@jwt_required()
def getAllBancoDeTareas():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = encriptar(claims["user"])

    db.session = get_session(clicianonBD)

    # Realiza la consulta

    query = (
        db.session.query(
            gdocctareas.ciacodigo,
            gdocctareas.pregcodigo,
            gdocctareas.pregdescri,
            gdocctareas.pregtipo,
            gdocctareas.pregobligatoria,
            gdocctareas.pregdurmin,
            gdocctareas.pregrecuren,
            gdocctareas.pregstatus,
            gdocctareas.pregfecisys,
            gdocctareas.pregorisys,
            gdocctareas.pregusuisys,
            gdocctareas.pregestisys,
            gdocctareas.pregfecmsys,
            gdocctareas.preghormsys,
            gdocctareas.pregusumsys,
            gdocctareas.pregestmsys,
            gdocctareas.insticodigo,
            gdocctareas.pregespresencial,
        )
        .filter(
            gdocctareas.ciacodigo == ciacodigo,
        )
        .order_by(gdocctareas.pregcodigo.desc())
        .distinct()
        .all()
    )

    schema = gdocctareasSchema(many=True)

    result = schema.dump(query)

    return jsonify({"data": result})
