# flake8: noqa
from flask_jwt_extended import get_jwt, jwt_required
from app.models.intart import Intart
from app.models.viewProductos import ViewProducto
from flask import jsonify, request
from sqlalchemy import and_, or_
from app.filter import bp
from app.extensions import db


from app.utils import paginate
from app.db import get_session
from app.utils.get_info_product import get_info_product


# {
#      "codigo":{
#           "codigo_descripcion":["08"],
#           "presentacion":["01","02","03"],
#           "marca":["01","02","03"],
#           "medida":["01","02","03"],
#           "linea":["01","02","03"],
#           "p_ingreso_egreso ": "23424"
#      },
#      "limit": 100,
#      "page": 1
# }


@bp.route("/make_filter", methods=["POST"])
@jwt_required()
def make_filter():
    data = request.get_json() if request.is_json else None
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    loccodigo = claims["localidad"]["loccodigo"]

    try:
        cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    except KeyError:
        error_response = {"error": 'No se encontró la clave "cliciaciacodigo" en el payload del JWT'}
        return jsonify(error_response), 400

    try:

        limit = int(data.get("limit", 10))  # default limit to 10 if not provided
        page = int(data.get("page", 1))  # default page to 1 if not provided

        codigo_descripcion = data["codigo"].get("codigoDescripcion")
        presentacion = data["codigo"].get("presentacion")
        marca = data["codigo"].get("marca")
        medida = data["codigo"].get("medida")
        linea = data["codigo"].get("linea")
        p_ingreso_egreso = data["codigo"].get("p_ingreso_egreso")
        p_show = data["codigo"].get("p_show")
    except KeyError:
        error_response = {"error": "algun error en el json no permite hacer el filtrado"}
        return jsonify(error_response), 400

    db.session = get_session(clicianonBD)

    if not codigo_descripcion and not presentacion and not marca and not medida and not linea and not p_ingreso_egreso:
        return jsonify({"message": "No hay datos para filtrar"})

    filtro = []
    if cliciaciacodigo:
        filtro.append(ViewProducto.ciacodigo == cliciaciacodigo)

    if codigo_descripcion:
        filtro.append(ViewProducto.artcodigo.in_(codigo_descripcion))

    if presentacion:
        filtro.append(ViewProducto.precodigo.in_(presentacion))

    if marca:
        filtro.append(ViewProducto.marcodigo.in_(marca))

    if medida:
        filtro.append(ViewProducto.medcodigo.in_(medida))

    if linea:
        filtro.append(or_(*[ViewProducto.lincodigo.startswith(str(c).rstrip("0")) for c in linea]))
    if p_show:
        filtro.append(ViewProducto.artcantactual >= 1)

    if p_ingreso_egreso:

        query_result, count_query = paginate(
            page,
            limit,
            db.session.query(
                # ViewProducto.artprevendol1.label('artprevendol1'),
                ViewProducto.artcodigo.label("codigo"),
                ViewProducto.artdescri.label("descripcion"),
                ViewProducto.artprecventa1.label("precio"),
                ViewProducto.meddescri.label("medida"),
                ViewProducto.mardescri.label("marca"),
                ViewProducto.predescri.label("presentacion"),
                ViewProducto.lindescri.label("linea"),
                # ViewProducto.artcantactual.label('artcantactual'),
                Intart.tracantidad.label("artcantactual"),
                # Intart.tranumero.label('tranumero'),
            )
            .join(
                Intart,
                and_(
                    ViewProducto.ciacodigo == Intart.ciacodigo,
                    ViewProducto.invcodigo == Intart.invcodigo,
                    ViewProducto.artcodigo == Intart.artcodigo,
                ),
            )
            .filter(Intart.tranumero == p_ingreso_egreso, and_(*filtro))
            .order_by(ViewProducto.artcodigo),
        )

    else:
        query_result, count_query = paginate(
            page,
            limit,
            db.session.query(
                ViewProducto.artcodigo.label("codigo"),
                ViewProducto.artdescri.label("descripcion"),
                ViewProducto.artprecventa1.label("precio"),
                # ViewProducto.artprevendol1.label('precio'), #este esta como vacio
                ViewProducto.meddescri.label("medida"),
                ViewProducto.mardescri.label("marca"),
                ViewProducto.predescri.label("presentacion"),
                ViewProducto.lindescri.label("linea"),
                ViewProducto.artcantactual.label("artcantactual"),
            )
            .filter(and_(*filtro))
            .order_by(ViewProducto.artcodigo),
        )

    # Convertir los objetos Row en diccionarios
    data = [row._asdict() for row in query_result]

    # Adjuntar data adicional a cada producto, por ejemplo el iva

    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            for product in data:
                infoProduct = get_info_product(connection, ciacodigo=cliciaciacodigo, loccodigo=loccodigo, artcodigo=product["codigo"], factippag="EFE")  # CLIENTE FINAL POR DEFECTO

                # Convertir precioUnitario y ivaProductoPorcentaje a float
                precioUnitario = float(infoProduct["precioUnitario"])  # Convertir a float
                ivaPorcentaje = float(infoProduct["ivaProductoPorcentaje"])  # Convertir a float

                # Calcular el IVA: (precioUnitario * ivaPorcentaje / 100)
                ivaCalculado = precioUnitario * ivaPorcentaje / 100

                # Calcular el precio unitario más IVA
                product["precioUnitarioMasIva"] = "{:.2f}".format(precioUnitario + ivaCalculado)

                # Asignar el porcentaje de IVA al producto
                product["ivaPorcentaje"] = "{:.2f}".format(ivaPorcentaje)

    return jsonify({"data": data, "total_count": count_query})
