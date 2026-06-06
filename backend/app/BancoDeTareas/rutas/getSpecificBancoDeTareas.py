# flake8: noqa
from flask import jsonify, request, make_response
from app.BancoDeTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdocctareas import gdocctareas
from app.models.gdocttareas import gdocttareas
from services.encrip_desencrip import encriptar
from sqlalchemy import asc


@bp.route("/getSpecificBancoDeTareas/<string:pregcodigo>", methods=["GET"])
@jwt_required()
def getSpecificBancoDeTareas(pregcodigo):

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = encriptar(claims["user"])

    db.session = get_session(clicianonBD)

    # Realiza la consulta para obtner la cabecera y el detalle del banco de preguntas
    queryDetalle = db.session.query(gdocttareas).filter(gdocttareas.ciacodigo == ciacodigo, gdocttareas.pregcodigo == pregcodigo).order_by(asc(gdocttareas.pregsecuen)).all()

    queryCabecera = db.session.query(gdocctareas).filter(gdocctareas.ciacodigo == ciacodigo, gdocctareas.pregcodigo == pregcodigo).first()

    # Construir la estructura deseada
    schema = {
        "cabecera": {
            "codigo": queryCabecera.pregcodigo,
            "descripcion": queryCabecera.pregdescri,
            "estado": queryCabecera.pregstatus,
            "tipoPregunta": queryCabecera.pregtipo,
            "preguntaObligatoria": queryCabecera.pregobligatoria,
            "pregdurmin": queryCabecera.pregdurmin,
            "pregrecuren": queryCabecera.pregrecuren,
            "insticodigo": queryCabecera.insticodigo,
            "pregespresencial": queryCabecera.pregespresencial,
        },
        "detalle": [],
    }

    for detalle in queryDetalle:
        detalle_dict = {
            "index": detalle.pregsecuen,
            "respuesta": detalle.pregdescri,
            "estado": detalle.pregstatus,
            "esRespuestaPredeterminada": detalle.pregRespuesta,
        }
        schema["detalle"].append(detalle_dict)

    return jsonify({"data": schema}), 200
