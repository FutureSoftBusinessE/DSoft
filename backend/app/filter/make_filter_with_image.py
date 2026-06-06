# flake8: noqa
import base64
from flask_jwt_extended import get_jwt, jwt_required
from app.models.intart import Intart
from app.models.viewProductos import ViewProducto
from flask import jsonify, request
from sqlalchemy import and_, func, or_, text
from app.filter import bp
from app.extensions import db


from app.models.intimagen import intimagen
from app.utils import paginate
from app.db import get_session
from app.models.SiacSys import SiacSys, SiacSysSchema
import math
from app.utils.get_info_product import get_info_product
from app.models.intartbarras import intartbarras


@bp.route("/make_filter_with_image", methods=["POST"])
@jwt_required()
def make_filter_with_image():
    data = request.get_json() if request.is_json else None
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    try:
        cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    except KeyError:
        error_response = {"error": 'No se encontró la clave "cliciaciacodigo" en el payload del JWT'}
        return jsonify(error_response), 400

    db.session = get_session(clicianonBD)

    engine = db.session.bind
    ciasrinotcreventas = 0
    with engine.connect() as connection:
        query_siaccia = """
                select ciasrinotcreventas from siaccia WHERE ciacodigo = :ciacodigo
        """
        result_siaccia = connection.execute(text(query_siaccia), {"ciacodigo": ciacodigo}).mappings().first()
        ciasrinotcreventas = result_siaccia["ciasrinotcreventas"]

    try:
        limit = int(data.get("limit", 10))
        page = int(data.get("page", 1))

        codigo_descripcion = data["codigo"].get("codigoDescripcion")
        presentacion = data["codigo"].get("presentacion")
        marca = data["codigo"].get("marca")
        medida = data["codigo"].get("medida")
        linea = data["codigo"].get("linea")
        show = data["codigo"].get("pShow")
    except KeyError:
        error_response = {"error": "algun error en el json no permite hacer el filtrado"}
        return jsonify(error_response), 400

    if not codigo_descripcion and not presentacion and not marca and not medida and not linea:
        return jsonify({"message": "No hay datos para filtrar"})

    filtro = []
    if cliciaciacodigo:
        filtro.append(ViewProducto.ciacodigo == cliciaciacodigo)

    if codigo_descripcion:
        # Para búsqueda por código o descripción
        codigo_desc_conditions = []

        for term in codigo_descripcion:
            # Búsqueda normal
            codigo_desc_conditions.append(ViewProducto.artcodigo.like(term))
            codigo_desc_conditions.append(ViewProducto.artdescri.like(term))

            # Si es búsqueda exacta (sin %), buscar en intartbarras
            if "%" not in term and term.strip():
                # Subconsulta para obtener artcodigos que tienen ese código de barras
                artcodigos_con_barras = db.session.query(intartbarras.artcodigo).filter(and_(intartbarras.ciacodigo == cliciaciacodigo, intartbarras.artcodbarra == term.strip())).subquery()

                # Agregar condición de que el artcodigo esté en esos resultados
                codigo_desc_conditions.append(ViewProducto.artcodigo.in_(artcodigos_con_barras))

        filtro.append(or_(*codigo_desc_conditions))

    if presentacion:
        pres_conditions = []
        for term in presentacion:
            pres_conditions.append(ViewProducto.precodigo.like(term))
            pres_conditions.append(ViewProducto.predescri.like(term))
        filtro.append(or_(*pres_conditions))

    if marca:
        marca_conditions = []
        for term in marca:
            marca_conditions.append(ViewProducto.marcodigo.like(term))
            marca_conditions.append(ViewProducto.mardescri.like(term))
        filtro.append(or_(*marca_conditions))

    if medida:
        medida_conditions = []
        for term in medida:
            medida_conditions.append(ViewProducto.medcodigo.like(term))
            medida_conditions.append(ViewProducto.meddescri.like(term))
        filtro.append(or_(*medida_conditions))

    if linea:
        filtro.append(or_(*[ViewProducto.lincodigo.startswith(str(c).rstrip("0")) for c in linea]))

    if show:
        filtro.append(ViewProducto.artcantactual >= 1)

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
        ViewProducto.artprodven.label("artprodven"),
        ViewProducto.artservicio.label("artservicio"),
        ViewProducto.artexpins.label("artexpins"),
    ]

    query_result, count_query = paginate(page, limit, db.session.query(*query_columns).filter(and_(*filtro)).order_by(ViewProducto.artcodigo))

    sysivaquery = db.session.query(SiacSys.sysiva).first()
    sysiva = SiacSysSchema().dump(sysivaquery)

    data = []
    for row in query_result:
        item = row._asdict()
        with engine.connect() as connection:
            infoProduct = get_info_product(conn=connection, ciacodigo=ciacodigo, loccodigo=loccodigo, artcodigo=item["codigo"], factippag="EFE")

        imagen = db.session.query(intimagen.artimagen).filter(and_(intimagen.artcodigo == item["codigo"], intimagen.ciacodigo == cliciaciacodigo)).first()

        item["imagen"] = base64.b64encode(imagen[0]).decode("utf-8") if imagen else None
        item["sysiva"] = infoProduct["ivaProductoPorcentaje"]
        item["isService"] = item["artprodven"] != 0 and (item["artservicio"] != 0 or item["artexpins"] != 0)

        if ciasrinotcreventas != 0:
            precio_base = float(item["precio"])
            sysiva = float(item["sysiva"])
            precio_sin_truncar = precio_base + (precio_base * sysiva / 100)
            item["precio"] = math.floor(precio_sin_truncar * 100) / 100

        data.append(item)

    response_data = {"data": data, "total_count": count_query}

    return jsonify(response_data)
