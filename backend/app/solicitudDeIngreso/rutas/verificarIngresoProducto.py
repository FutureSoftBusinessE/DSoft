from flask import jsonify, request, make_response
from app.solicitudDeIngreso import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.incSgaSolIng import incSgaSolIng
from app.models.intSgaSolIng import intSgaSolIng
from app.models.Cgpdpto import Cgpdpto
from datetime import datetime
from app.models.inbsgamotivos import inbsgamotivos
from app.models.viewProductos import ViewProducto as view_inmart
from app.models.cxcmcli import Cxcmcli as cxcmcli
from app.models.view_cxcmcli import View_cxcmcli as view_cxcmcli
from app.models.cxpmprov import cxpmprov
from app.models.intart import Intart as intart


@bp.route("/verificarIngresoProducto", methods=["POST"])
@jwt_required()
def verificarIngresoProducto():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    data = request.get_json()
    dataCodigoSolicitud = data.get("codSolicitud")
    dataCodigoProducto = data.get("codProducto")
    dataNumSecuenciaProducto = data.get("numSecuencia")
    db.session = get_session(clicianonBD)

    try:
        # Verificar si el producto está asociado a un ordNumero
        query_SolicitudIngresoBusqueda = (
            db.session.query(
                intSgaSolIng.sgasoling,
                intSgaSolIng.sgasecuen,
                intart.ordnumero,
                intart.facsecuen,
            )
            .join(
                intart,
                ((intart.artcodigo == intSgaSolIng.artcodigo) & (intart.ciacodigo == intSgaSolIng.ciacodigo) & (intart.ordnumero == intSgaSolIng.sgasoling) & (intart.facsecuen == intSgaSolIng.sgasecuen)),
            )
            .filter((intSgaSolIng.ciacodigo == ciacodigo) & (intSgaSolIng.loccodigo == loccodigo) & (intSgaSolIng.sgasoling == dataCodigoSolicitud) & (intSgaSolIng.artcodigo == dataCodigoProducto) & (intSgaSolIng.sgasecuen == dataNumSecuenciaProducto))
        )

        result = query_SolicitudIngresoBusqueda.distinct().first()
        if result:
            return jsonify({"message": -1}), 200  # true
        else:
            return jsonify({"message": 0}), 200

    except Exception as e:
        return jsonify({"message": "Error al verificar ingreso de producto", "error": str(e)})
