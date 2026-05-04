# flake8: noqa
from flask import jsonify, request
from app.PaquetesDeProcesosTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdoccpaquetes import gdoccpaquetes, gdoccpaquetesSchema
from services.encrip_desencrip import encriptar


@bp.route("/getAllPaquetes", methods=["GET"])
@cross_origin()
@jwt_required()
def getAllPaquetes():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = encriptar(claims["user"])

    db.session = get_session(clicianonBD)

    # Realiza la consulta

    query = (
        db.session.query(
            gdoccpaquetes.ciacodigo,
            gdoccpaquetes.formcodigo,
            gdoccpaquetes.procesocod,
            gdoccpaquetes.formdescri,
            gdoccpaquetes.formstatus,
            gdoccpaquetes.formfecisys,
            gdoccpaquetes.formhorisys,
            gdoccpaquetes.formusuisys,
            gdoccpaquetes.formestisys,
            gdoccpaquetes.formfecmsys,
            gdoccpaquetes.formhormsys,
            gdoccpaquetes.formusumsys,
            gdoccpaquetes.formestmsys,
        )
        .filter(
            gdoccpaquetes.ciacodigo == ciacodigo,
        )
        .order_by(gdoccpaquetes.formcodigo.desc())
        .distinct()
        .all()
    )

    schema = gdoccpaquetesSchema(many=True)

    result = schema.dump(query)

    return jsonify({"data": result})
