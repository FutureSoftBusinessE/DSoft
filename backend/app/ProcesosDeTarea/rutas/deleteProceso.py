# flake8: noqa
from flask import jsonify, request, make_response
from app.ProcesosDeTarea import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdocbprocesos import gdocbprocesos
from services.encrip_desencrip import encriptar


@bp.route("/deleteProceso/<string:procesocod>", methods=["DELETE"])
@cross_origin()
@jwt_required()
def deleteProceso(procesocod):

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

        # Realiza la consulta para eliminar el proceso
        db.session.query(gdocbprocesos).filter(gdocbprocesos.ciacodigo == ciacodigo, gdocbprocesos.procesocod == procesocod).delete()

        # Confirma la transacción
        db.session.commit()
        return jsonify({"data": "Eliminado con Ã©xito"}), 200

    except Exception as e:
        # Si hay algÃºn error, realiza un rollback para deshacer los cambios
        db.session.rollback()

        print(e)
        # Maneja el error
        return make_response(jsonify({"msg": "Error al eliminar el proceso"}), 404)
    finally:
        # Cierra la transacción
        db.session.close()
