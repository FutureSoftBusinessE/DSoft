# flake8: noqa
import base64
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import and_
from app.models.intimagen import intimagen
from flask import jsonify, request
from flask_cors import cross_origin
from app.productos import bp
from app.extensions import db
from app.models.producto import Producto
from app.models.medida import Medida
from app.models.marca import Marca
from app.models.presentacion import Presentacion
from app.models.linea import Linea
from app.models.siacopc import Siacopc
from decimal import Decimal
from app.models.viewProductos import ViewProducto
from app.models.inbbod import inbbod
from app.models.view_inmstock import view_inmstock
from app.models.intimagen import intimagenSchema
from app.models.viewProductos import ViewProductoSchema
from app.models.view_inmstock import view_inmstockSchema


@bp.route("/obtener_viewProductos", methods=["POST"])
@cross_origin()
@jwt_required()
def obtener_viewProductos():

    data = request.get_json()
    claims = get_jwt()
    cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    query_result = (
        db.session.query(
            ViewProducto.artcodigo.label("codigo"),
            ViewProducto.artdescri.label("descripcion"),
            ViewProducto.artprecventa1.label("precio"),
            ViewProducto.meddescri.label("medida"),
            ViewProducto.mardescri.label("marca"),
            ViewProducto.predescri.label("presentacion"),
            ViewProducto.lindescri.label("linea"),
            # ViewProducto.tmpcantidadimpresion.label('cantidad_etiquetas'),
        )
        .filter(ViewProducto.ciacodigo == cliciaciacodigo)
        .order_by(ViewProducto.artcodigo)
        .all()
    )

    # El resultado de la consulta es un objeto Row, que no puede ser serializado en JSON directamente.
    # Para convertir los objetos Row en diccionarios se utiliza el mÃ©todo as_dict() que se puede agregar en el modelo de SQLAlchemy.
    # Luego, se puede construir una lista de diccionarios y devolverla como una respuesta JSON
    data = [row._asdict() for row in query_result]

    return jsonify(data)
