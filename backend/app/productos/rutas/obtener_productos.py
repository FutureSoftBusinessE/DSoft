# flake8: noqa
import base64
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import and_
from app.models.intimagen import intimagen
from flask import jsonify, request

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


@bp.route("/obtener_productos", methods=["POST"])
@jwt_required()
def obtener_productos():
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
            ViewProducto.artcantactual.label("cantidad"),
        )
        .filter(
            ViewProducto.ciacodigo == cliciaciacodigo
            and ViewProducto.artprodven != 0
            # Producto.artcodigo == '00018'
        )
        .order_by(ViewProducto.artcodigo)
        .distinct()
        .all()
    )

    # data = [row._asdict() for row in query_result]
    data = []
    for row in query_result:
        row_dict = {}
        cabecera = row._asdict()
        row_dict["cabecera"] = cabecera
        row_dict["cabecera"]["precio"] = f'{row_dict["cabecera"]["precio"]:.10f}'
        row_dict["maxTotalStockToBuy"] = cabecera["cantidad"]
        row_dict["totalToBuy"] = 1
        data.append(row_dict)

    return jsonify(data)


@bp.route("/obtener_productos/<codigo_Prod>", methods=["GET"])
@jwt_required()
def obtener_productos_por_codigo(codigo_Prod):

    query_result = (
        db.session.query(
            Producto.artcodigo.label("codigo"),
            Producto.artdescri.label("descripcion"),
            Producto.artprecventa1.label("precio"),
            Medida.meddescri.label("medida"),
            Marca.mardescri.label("marca"),
            Presentacion.predescri.label("presentacion"),
            Linea.lindescri.label("linea"),
            Producto.tmpcantidadimpresion.label("cantidad_etiquetas"),
        )
        .join(Marca, Producto.marcodigo == Marca.marcodigo)
        .join(Medida, Producto.medcodigo == Medida.medcodigo)
        .join(Presentacion, Producto.precodigo == Presentacion.precodigo)
        .join(Linea, Producto.lincodigo == Linea.lincodigo)
        .filter(Producto.artcodigo == str(codigo_Prod))
        .order_by(Producto.artcodigo)
        .all()
    )

    data = [row._asdict() for row in query_result]
    return jsonify(data[0])


@bp.route("/obtener_productos/it/<categoria>/<nivel>", methods=["GET"])
@jwt_required()
def obtener_items_cat_nivel(categoria, nivel):
    query_result = db.session.query(
        Siacopc.modcodigo.label("modcodigo"),
        Siacopc.opccaption.label("opccaption"),
        Siacopc.opcname.label("opcname"),
        Siacopc.opctag.label("opctag"),
        Siacopc.opcmenujquery.label("opcmenuquery"),
        Siacopc.nivel.label("nivel"),
        Siacopc.item_number.label("item_number"),
        Siacopc.padre_id.label("padre_id"),
    ).filter(
        # Siacopc.modcodigo == str(categoria) and
        Siacopc.nivel == int(nivel),
        Siacopc.modcodigo == str(categoria),
    )

    data = [row._asdict() for row in query_result]

    return jsonify(data)
