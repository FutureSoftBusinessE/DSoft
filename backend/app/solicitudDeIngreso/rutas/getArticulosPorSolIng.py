from flask import jsonify, request, make_response
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.intSgaSolIng import intSgaSolIng
from app.models.inbsgamotivos import inbsgamotivos
from app.models.viewProductos import ViewProducto as view_inmart
from app.models.cxcmcli import Cxcmcli as cxcmcli
from app.models.view_cxcmcli import View_cxcmcli as view_cxcmcli
from app.models.cxpmprov import cxpmprov


@bp.route("/getArticulosPorSolIng/<string:sgasoling>", methods=["GET"])
@cross_origin()
@jwt_required()
def getArticulosPorSolIng(sgasoling):
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    db.session = get_session(clicianonBD)

    # Realiza la consulta

    try:
        query = (
            db.session.query(
                intSgaSolIng.artcodigo,
                intSgaSolIng.ciacodigo,
                intSgaSolIng.loccodigo,
                intSgaSolIng.artcodigo,
                intSgaSolIng.sgacansol,
                view_inmart.artdescri,
                intSgaSolIng.sgastatus,
                intSgaSolIng.sgasecuen,
            )
            .join(view_inmart, view_inmart.artcodigo == intSgaSolIng.artcodigo)
            .filter(
                intSgaSolIng.ciacodigo == ciacodigo,
                intSgaSolIng.loccodigo == loccodigo,
                intSgaSolIng.sgasoling == sgasoling,
            )
            .distinct()
            .order_by(intSgaSolIng.sgasecuen)
            .all()
        )

        solicitudes = []
        for result in query:
            solicitud = {
                "numSecuencia": result[7],
                "artcodigo": result[0],
                "artdescri": result[5],
                "cantSolicitada": result[4],
                "estado": result[6],
            }

            if solicitud not in solicitudes:
                solicitudes.append(solicitud)

        return jsonify({"productos": solicitudes}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
