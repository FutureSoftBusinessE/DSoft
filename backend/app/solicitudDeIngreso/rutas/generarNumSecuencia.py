from flask import jsonify, request, make_response
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from datetime import datetime
from app.models.Siacser import Siacser
from app.models.Cgpdpto import Cgpdpto


@bp.route("/generarNumSecuencia", methods=["POST"])
@cross_origin()
@jwt_required()
def generarNumSecuencia():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    data = request.get_json()
    db.session = get_session(clicianonBD)

    _doccodigo = data.get("codDocumento")

    # Obtener el servidor actual
    locservidor = db.session.query(Siacser.locservidor).filter(Siacser.serstatus == "A").first()[0]

    year = datetime.now().strftime("%y")
    _dptoanio = datetime.now().strftime("%Y")
    # registro actual cgpdpto filtrado por parametros(Solo devuelve un registro)
    cgpdpto = (
        db.session.query(Cgpdpto)
        .filter(
            Cgpdpto.ciacodigo == ciacodigo,
            Cgpdpto.loccodigo == loccodigo,
            Cgpdpto.dptoanio == _dptoanio,
            Cgpdpto.doccodigo == _doccodigo,
        )
        .first()
    )

    secuenciaActual = cgpdpto.dptonumsec
    nuevaSecuenciaActual = secuenciaActual + 1

    codigoGenerado = f"{_doccodigo}{locservidor}{year}{nuevaSecuenciaActual:06}01"

    print(codigoGenerado)
    return {"data": codigoGenerado}, 200
