# flake8: noqa
import base64
from flask_jwt_extended import get_jwt, jwt_required
from app.models.intart import Intart
from app.models.viewProductos import ViewProducto
from flask import jsonify, request
from sqlalchemy import and_, func, or_
from app.FacturaDesdeArticulosDF import bp
from app.extensions import db
from flask_cors import cross_origin

from app.models.intimagen import intimagen
from app.utils import paginate
from app.db import get_session
from app.models.SiacSys import SiacSys, SiacSysSchema


# {
#      "codigo":{
#           "codigo_descripcion":["08"],
#           "presentacion":["01","02","03"],
#           "marca":["01","02","03"],
#           "medida":["01","02","03"],
#           "linea":["01","02","03"],
#      },
#      "limit": 100,
#      "page": 1
# }


@bp.route("/getArticulosConImagen", methods=["GET"])
@cross_origin()
@jwt_required()
def getArticulosConImagen():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    try:
        cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    except KeyError:
        error_response = {"error": 'No se encontró la clave "cliciaciacodigo" en el payload del JWT'}
        return jsonify(error_response), 400

    db.session = get_session(clicianonBD)

    query_columns = [
        ViewProducto.artcodigo.label("codigo"),
        ViewProducto.artdescri.label("descripcion"),
        ViewProducto.artprecventa1.label("precio"),
        ViewProducto.meddescri.label("medida"),
        ViewProducto.mardescri.label("marca"),
        ViewProducto.predescri.label("presentacion"),
        ViewProducto.lindescri.label("linea"),
        ViewProducto.artcantactual.label("cantidad"),
        ViewProducto.artapliiva.label("artapliiva"),
    ]

    query_result = db.session.query(*query_columns).order_by(ViewProducto.artcodigo).limit(30).all()

    sysivaquery = db.session.query(SiacSys.sysiva).first()
    sysiva = SiacSysSchema().dump(sysivaquery)

    data = []
    for row in query_result:
        item = row._asdict()
        imagen = db.session.query(intimagen.artimagen).filter(and_(intimagen.artcodigo == item["codigo"], intimagen.ciacodigo == cliciaciacodigo)).first()

        item["imagen"] = base64.b64encode(imagen[0]).decode("utf-8").replace("\n", "") if imagen else None
        item["sysiva"] = float(sysiva["sysiva"])
        data.append(item)

    response_data = {"data": data, "total_count": len(data)}

    return jsonify(response_data)
