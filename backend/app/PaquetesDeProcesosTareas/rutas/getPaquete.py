# flake8: noqa
from flask import jsonify, request
from app.PaquetesDeProcesosTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdoccpaquetes import gdoccpaquetes, gdoccpaquetesSchema
from app.models.gdoctpaquetes import gdoctpaquetes
from app.models.gdocctareas import gdocctareas, gdocctareasSchema
from services.encrip_desencrip import encriptar
from sqlalchemy import asc


@bp.route("/getPaquete/<string:formcodigo>", methods=["GET"])
@cross_origin()
@jwt_required()
def getFormulario(formcodigo):

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = encriptar(claims["user"])

    db.session = get_session(clicianonBD)

    # Realiza la consulta para obtener cabecera

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
        .filter(gdoccpaquetes.ciacodigo == ciacodigo, gdoccpaquetes.formcodigo == formcodigo)
        .first()
    )

    schema = gdoccpaquetesSchema()

    cabecera = schema.dump(query)

    # Realiza la consulta para obtener el detalle

    # Las preguntas que no estan en el formulario
    subquery = db.session.query(gdoctpaquetes.pregcodigo).filter(gdoctpaquetes.formcodigo == formcodigo, gdoctpaquetes.ciacodigo == ciacodigo).order_by(asc(gdoctpaquetes.formsecuen)).distinct()

    query = db.session.query(gdocctareas).filter(~gdocctareas.pregcodigo.in_(subquery), gdocctareas.ciacodigo == ciacodigo).order_by(gdocctareas.pregcodigo.desc()).all()

    schema = gdocctareasSchema(many=True)

    data1 = schema.dump(query)

    # Las preguntas que ya estan en el formulario
    query = (
        db.session.query(gdocctareas)
        .filter(gdocctareas.pregcodigo.in_(subquery), gdocctareas.ciacodigo == ciacodigo)
        .join(gdoctpaquetes, gdocctareas.pregcodigo == gdoctpaquetes.pregcodigo)
        .filter(gdoctpaquetes.formcodigo == formcodigo, gdoctpaquetes.ciacodigo == ciacodigo)
        .order_by(gdoctpaquetes.formsecuen)
        .all()
    )

    schema = gdocctareasSchema(many=True)

    dat2 = schema.dump(query)

    return jsonify({"cabecera": cabecera, "detalle": {"data1": data1, "data2": dat2}})
