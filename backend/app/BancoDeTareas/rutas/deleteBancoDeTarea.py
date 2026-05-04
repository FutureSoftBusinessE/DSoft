# flake8: noqa
from flask import jsonify, request, make_response
from app.BancoDeTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdocctareas import gdocctareas
from app.models.gdocttareas import gdocttareas
from services.encrip_desencrip import encriptar


@bp.route("/deleteBancoDeTarea/<string:pregcodigo>", methods=["DELETE"])
@cross_origin()
@jwt_required()
def deleteBancoDeTarea(pregcodigo):

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = encriptar(claims["user"])

    db.session = get_session(clicianonBD)

    # Realiza la consulta

    try:
        # Inicia la transacción
        db.session.begin()

        # Realiza la consulta para eliminar la cabecera y el detalle del banco de preguntas
        db.session.query(gdocttareas).filter(gdocttareas.ciacodigo == ciacodigo, gdocttareas.pregcodigo == pregcodigo).delete()

        db.session.query(gdocctareas).filter(gdocctareas.ciacodigo == ciacodigo, gdocctareas.pregcodigo == pregcodigo).delete()

        # Confirma la transacción
        db.session.commit()
        return jsonify({"data": "Eliminado con Ã©xito"}), 200

    except Exception as e:
        # Si hay algÃºn error, realiza un rollback para deshacer los cambios
        db.session.rollback()

        print(e)
        # Maneja el error
        return make_response(jsonify({"msg": "Error al eliminar el banco de preguntas"}), 404)
    finally:
        # Cierra la transacción
        db.session.close()
