from flask import jsonify, request
from app.ImpuestosRetenciones import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from error_handling import api_endpoint, ValidationError


# Esta api borra un impuesto/retención
@bp.route("/eliminarImpuestosRetenciones", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarImpuestosRetenciones():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    impid = data.get("impid")

    if not impid:
        raise ValidationError("Código del impuesto/retención requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                # Verificar que existe
                check_query = text("SELECT impid FROM cxpbimp WHERE ciacodigo = :ciacodigo AND impid = :impid")
                result = connection.execute(check_query, {"ciacodigo": sCodCia, "impid": impid}).mappings().fetchone()

                if not result:
                    raise ValidationError("Impuesto/Retención no encontrado")

                # Eliminar
                delete_query = text("DELETE FROM cxpbimp WHERE ciacodigo = :ciacodigo AND impid = :impid")
                connection.execute(delete_query, {"ciacodigo": sCodCia, "impid": impid})

        return {"data": "Impuesto/Retención eliminado exitosamente"}

    except IntegrityError:
        raise ValidationError("No se puede eliminar: el registro está en uso")
