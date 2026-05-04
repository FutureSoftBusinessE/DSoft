from flask import jsonify, request, make_response
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.intSgaSolIng import intSgaSolIng
from services.encrip_desencrip import encriptar


@bp.route("/deleteProductosSolIng", methods=["DELETE"])
@cross_origin()
@jwt_required()
def deleteProductosSolIng():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    db.session = get_session(clicianonBD)
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    data = request.get_json()
    dataCodigoSolicitud = data["codigoSolicitud"]
    artcodigo = data.get("artcodigo")
    sgasecuen = data.get("sgasecuen")

    # Realiza la consulta
    try:
        # Inicia la transacción
        db.session.begin()

        # Realiza la consulta para eliminar la cabecera y el detalle de los formularios
        db.session.query(intSgaSolIng).filter(
            intSgaSolIng.ciacodigo == ciacodigo,
            intSgaSolIng.loccodigo == loccodigo,
            intSgaSolIng.sgasoling == dataCodigoSolicitud,
            intSgaSolIng.artcodigo == artcodigo,
            intSgaSolIng.sgasecuen == sgasecuen,
        ).delete()

        # Confirma la transacción
        db.session.commit()
        return jsonify({"data": "Eliminado con éxito"}), 200

    except Exception as e:
        # Si hay algún error, realiza un rollback para deshacer los cambios
        db.session.rollback()

        print(e)
        # Maneja el error
        return make_response(jsonify({"msg": "Error al eliminar el solicitud la solicitud"}), 404)
    finally:
        # Cierra la transacción
        db.session.close()
