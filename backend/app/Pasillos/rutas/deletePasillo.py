from flask import jsonify, request, make_response
from app.Pasillos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.inbpasillos import InbPasillo
from services.encrip_desencrip import encriptar

from sqlalchemy.exc import IntegrityError


@bp.route("/deletePasillo/<string:pasillo_codigo>", methods=["DELETE"])
@jwt_required()
def deletePasillo(pasillo_codigo):

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)

    # Realiza la consulta

    try:
        # Inicia la transacciÃ³n
        db.session.begin()
        db.session.query(InbPasillo).filter(InbPasillo.ciacodigo == ciacodigo, InbPasillo.pascodigo == pasillo_codigo).delete()
        # Confirma la transacciÃ³n
        db.session.commit()
        return jsonify({"data": "Eliminado con Ã©xito"}), 200

    except IntegrityError as ex:
        print(ex)
        db.session.rollback()
        return make_response(jsonify({"msg": "No se puede el pasillo por que esta en uso."}), 409)
    except Exception as e:

        # Si hay algÃºn error, realiza un rollback para deshacer los cambios
        db.session.rollback()

        print(e)
        # Maneja el error
        return make_response(jsonify({"msg": "Error al eliminar el pasillo"}), 404)
    finally:
        # Cierra la transacciÃ³n
        db.session.close()
