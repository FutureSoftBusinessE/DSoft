# flake8: noqa
import base64

from flask_jwt_extended import get_jwt, jwt_required
from app.models.intimagen import intimagen, intimagenSchema
from flask import jsonify, request

from app.productos import bp
from app.extensions import db
from app.models.viewProductos import ViewProducto
from app.models.producto import Producto
from app.models.siaccia import siaccia
from app.models.cxcmcli import Cxcmcli, CxcmcliSchema
from app.models.siacsritarifaiva import siacsritarifaiva
from app.models.view_inmstock import view_inmstock
import json
from app.db import get_session
from app.models.SiacSys import SiacSys, SiacSysSchema
from app.models.fatartpromocion import fatartpromocion
from app.models.fatartpromocionfp import fatartpromocionfp
from sqlalchemy import and_, func
from datetime import datetime


# ...
# producto_codigo : "000901"
# ...


def truncateNumber(num, size=2):
    factor = 10**size
    return int(num * factor) / factor  # Trunca el número a la cantidad de decimales indicada


def obtenerIvaArticulo(ciaivaporproducto, sysiva, codigosTarifasIva, artapliiva, excepcionIVA=None):
    # En el sistema para saber que iva aplica un articulo determinado, existen 2 tipos de iva
    # el que es global(que se aplica a todos los productos de una empresa)
    # y el que es personalizado(en donde cada producto tiene una tarifa especifica de iva que se puede encontrar en siacsritarifaiva)

    # Primero se tiene que determinar que iva se aplica el global o personalizado
    # Si ciaivaporproducto en siaccia es diferente de 0 entonces se va aplicar el iva personalizado
    # ese dato se encuentra en inmart en artapliiva, eso te da el codigo de tarifa que se va
    # a aplicar a ese determinado producto, y cada codigo de tarifa su respectivo porcentaje
    # se encuentra en siacsritarifaiva
    # Y si no(o sea si ciaivaporproducto es igual 0) todos los productos que tengan artapliiva !=0 van a tener el mismo
    # porcentaje de iva del campo sysiva en SiacSys, y sino (osea que artapliiva == 0) entonces su iva es 0

    # Si hay una excepcion de IVA activa por tipo de compania, tiene prioridad absoluta. La variable excepcionIVA es todo el registro encontrado de la tabla siacivaexcepcion
    if excepcionIVA is not None:
        return excepcionIVA["iveporcentajeresolucion"]

    iva = 0
    if ciaivaporproducto != 0:
        tarifaFound = next((tarifa for tarifa in codigosTarifasIva if tarifa["codigo"] == artapliiva), 0)
        iva = tarifaFound["porcentaje"]
    else:
        if artapliiva != "0":
            iva = sysiva
        else:
            iva = 0

    return iva


@bp.route("/get_producto_por_codigo", methods=["POST"])
@jwt_required()
def get_producto_por_codigo():
    data = request.get_json() if request.is_json else None
    claims = get_jwt()
    cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    hasFranquicias = claims["hasFranquicias"]
    franquicias = claims["franquicias"]
    producto_codigo = data["producto_codigo"]
    # FIXME: Para obtner el precio de los articulos se necesita saber que num de lista de precio tiene asignado ese cliente
    cli_codigo = data.get("cli_codigo", "000001")

    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)

    # sysivaquery = db.session.query(
    #     SiacSys.sysiva
    # ).first()
    # sysiva = SiacSysSchema().dump(sysivaquery)

    images = (
        db.session.query(
            intimagen.artimagen.label("artimagen"),
        )
        .filter(
            intimagen.artcodigo == str(producto_codigo),
            intimagen.ciacodigo == cliciaciacodigo,
        )
        .order_by(intimagen.artcodigo)
        .all()
    )

    # images = [row._asdict() for row in images]

    allImages = []

    # Codificar la imagen en base64
    for img in images:
        encoded_image = base64.b64encode(img.artimagen).decode("utf-8")

        # Crear el diccionario con la imagen codificada en base64
        allImages.append(encoded_image)

    # head = db.session.query(
    #     ViewProducto.artcodigo.label('codigo'),
    #     # ViewProducto.artdescri.label('descripcion'),
    #     # ViewProducto.artprecventa1.label('precio'),
    #     # ViewProducto.meddescri.label('medida'),
    #     # ViewProducto.mardescri.label('marca'),
    #     # ViewProducto.predescri.label('presentacion'),
    #     # ViewProducto.lindescri.label('linea'),
    #     # ViewProducto.artcantactual.label('cantidad'),
    #     # ViewProducto.artapliiva.label("artapliiva"),
    #     # db.literal(float(sysiva['sysiva'])).label("sysiva")
    # ).filter(
    #     ViewProducto.artcodigo == str(producto_codigo),
    #     ViewProducto.ciacodigo == cliciaciacodigo,
    # ).order_by(ViewProducto.artcodigo).all()

    # -------- OBTENER EL IVA------------

    numIvaDescuento = 1  # Correcion 23/09/2024

    try:
        #
        # saca que tipo de iva es
        queryIva = db.session.query(siaccia.ciaivaporproducto, siaccia.cialistprecdefweb, siaccia.ciatipocompania).filter(siaccia.ciacodigo == cliciaciacodigo).first()
        tipoIVA = queryIva[0]
        numIvaDescuento = queryIva[1]  # Obtener la lista
        tipoCompania = queryIva[2]  # Obtener el tipo de compania

        # saca el iva configurado en la tabla siacsys (GLOBAL)
        sys = db.session.query(SiacSys.sysiva).first()
        sys_result = SiacSysSchema().dump(sys)
        globalIVA = int(sys_result.get("sysiva"))

        # saca las tarifas de ivas configurado en la tabla  siacsritarifaiva (PERSONALIZADO)
        tarifasIVA = db.session.query(siacsritarifaiva).all()
        tarifasIVA = [
            {
                "codigo": tarifa.codigo,
                "descripcion": tarifa.descripcion,
                "porcentaje": tarifa.porcentaje,
                "disponible": tarifa.disponible,
            }
            for tarifa in tarifasIVA
        ]

        # NUEVO: Obtener excepcion de IVA por tipo de compania
        excepcionIVA = None
        try:
            if tipoCompania:
                query_excepcion = """
                    SELECT iveporcentajeresolucion
                    FROM siacivaexcepcion
                    WHERE ivetipocompania = :tipoCompania
                    AND ivestatus = 'A'
                    AND GETDATE() BETWEEN ivefecinicio AND ivefectermino
                """
                excepcionIVA = db.session.execute(db.text(query_excepcion), {"tipoCompania": tipoCompania}).mappings().first()
                excepcionIVA = dict(excepcionIVA) if excepcionIVA else None
        except Exception:
            excepcionIVA = None

    except Exception as e:
        raise ValueError(f"Error retrieving IVA:{e} ")

    # ------------Obtner el IVA------------
    query_product = (
        db.session.query(
            ViewProducto.artcodigo.label("codigo"),
            ViewProducto.artdescri.label("descripcion"),
            # ViewProducto.artprecventa1.label('precio'),
            ViewProducto.meddescri.label("medida"),
            ViewProducto.mardescri.label("marca"),
            ViewProducto.predescri.label("presentacion"),
            ViewProducto.lindescri.label("linea"),
            ViewProducto.artcantactual.label("cantidad"),
            ViewProducto.artapliiva.label("artapliiva"),
            # db.literal(float(sysiva['sysiva'])).label("sysiva"),
            ViewProducto.invcodigo,
            ViewProducto.artprecventa1,
            ViewProducto.artprecventa2,
            ViewProducto.artprecventa3,
            ViewProducto.artprecventa4,
            ViewProducto.artprecventa5,
            ViewProducto.artprecventa6,
            ViewProducto.artprodven.label("artprodven"),
            ViewProducto.artservicio.label("artservicio"),
            ViewProducto.artexpins.label("artexpins"),
        )
        .filter(ViewProducto.ciacodigo == cliciaciacodigo, ViewProducto.artcodigo == str(producto_codigo))
        .first()
    )

    query_product = {
        "codigo": query_product.codigo,
        "descripcion": query_product.descripcion,
        "medida": query_product.medida,
        "marca": query_product.marca,
        "presentacion": query_product.presentacion,
        "linea": query_product.linea,
        "cantidad": query_product.cantidad,
        "artapliiva": query_product.artapliiva,
        "invcodigo": query_product.invcodigo,
        "artprecventa1": query_product.artprecventa1,
        "artprecventa2": query_product.artprecventa2,
        "artprecventa3": query_product.artprecventa3,
        "artprecventa4": query_product.artprecventa4,
        "artprecventa5": query_product.artprecventa5,
        "artprecventa6": query_product.artprecventa6,
        "isService": query_product.artprodven != 0 and (query_product.artservicio != 0 or query_product.artexpins != 0),
    }

    listaDePrecios = [
        query_product["artprecventa1"],
        query_product["artprecventa2"],
        query_product["artprecventa3"],
        query_product["artprecventa4"],
        query_product["artprecventa5"],
        query_product["artprecventa6"],
    ]

    precioUnitario = listaDePrecios[numIvaDescuento - 1]
    iva = obtenerIvaArticulo(tipoIVA, globalIVA, tarifasIVA, str(query_product["artapliiva"]), excepcionIVA)

    hasDescuento = False
    descuentoValor = 0
    now = func.now()
    # now = datetime(2023, 11, 15, 14, 30, 0)  # Test

    artpordes_campo = f"artpordes{numIvaDescuento}"
    query_promocionXArticulo = (
        db.session.query(
            fatartpromocion.artflagpromocion,
            fatartpromocion.ciacodigo,
            fatartpromocion.invcodigo,
            fatartpromocion.loccodigo,
            fatartpromocion.artcodigo,
            fatartpromocion.artfecinipro,
            fatartpromocion.arthorinipro,
            fatartpromocion.artfecfinpro,
            fatartpromocion.arthorfinpro,
            getattr(fatartpromocion, artpordes_campo),
        )
        .filter(
            fatartpromocion.ciacodigo == cliciaciacodigo,
            fatartpromocion.invcodigo == query_product["invcodigo"],
            fatartpromocion.loccodigo == loccodigo,
            fatartpromocion.artcodigo == query_product["codigo"],
            now.between(fatartpromocion.artfecinipro, fatartpromocion.artfecfinpro),
            # fatartpromocion.artfecinipro <= now,  # Test
            # fatartpromocion.artfecfinpro >= now  # Test
        )
        .first()
    )

    if query_promocionXArticulo:

        forpordes_campo = f"forpordes{numIvaDescuento}"

        if query_promocionXArticulo.artflagpromocion != 0:
            # Se aplica el descuento por forma de pago
            query_promocionXFormaPago = (
                db.session.query(
                    fatartpromocionfp.ciacodigo,
                    fatartpromocionfp.invcodigo,
                    fatartpromocionfp.loccodigo,
                    fatartpromocionfp.artcodigo,
                    fatartpromocionfp.factippag,
                    fatartpromocionfp.forfecinipro,
                    fatartpromocionfp.forhorinipro,
                    fatartpromocionfp.forfecfinpro,
                    fatartpromocionfp.forhorfinpro,
                    getattr(fatartpromocionfp, forpordes_campo),
                )
                .filter(
                    fatartpromocionfp.ciacodigo == cliciaciacodigo,
                    fatartpromocionfp.invcodigo == query_product["invcodigo"],
                    fatartpromocionfp.loccodigo == loccodigo,
                    fatartpromocionfp.artcodigo == query_product["codigo"],
                    now.between(fatartpromocionfp.forfecinipro, fatartpromocionfp.forfecfinpro),
                    # fatartpromocionfp.forfecinipro <= now,  # Test
                    # fatartpromocionfp.forfecfinpro >= now  # Test
                )
                .order_by(fatartpromocionfp.factippag)
                .first()
            )

            if query_promocionXFormaPago:
                hasDescuento = True
                descuentoValor = query_promocionXFormaPago[-1]

        else:
            # Se aplica el descuento por localidad que es la consulta que ya se hizo al principio
            hasDescuento = True
            descuentoValor = query_promocionXArticulo[-1]

    precioUnitario = float(precioUnitario)
    iva = float(iva)
    query_product["precio"] = truncateNumber(precioUnitario)
    query_product["sysiva"] = truncateNumber(iva)
    query_product["precioWithIVA"] = truncateNumber(precioUnitario + (precioUnitario * (iva / 100)))

    cabecera = query_product

    porcentajeDescuento = float(descuentoValor)
    cabecera["hasDescuento"] = hasDescuento
    cabecera["porcentajeDescuento"] = porcentajeDescuento if hasDescuento else None
    cabecera["productoIvaDescUnitario"] = query_product["precioWithIVA"] - (query_product["precioWithIVA"] * (porcentajeDescuento / 100))

    # Esta valor me dice que si esta compania es capaz
    # de tomar stock de otras localidades
    query_ciafacDeVariosLoc = db.session.query(siaccia.ciafacDeVariosLoc).filter(siaccia.ciacodigo == cliciaciacodigo).first()
    ciafacDeVariosLoc = query_ciafacDeVariosLoc[0]

    body = []

    # 11/6/2024 Correccion al momento de obtener todas las bodegas
    # if ciafacDeVariosLoc != 0:
    #     body = (
    #         db.session.query(
    #             view_inmstock.bodcodigo.label("bodcodigo"),
    #             view_inmstock.boddescri.label("bodega"),
    #             view_inmstock.locdescri.label("localidad"),
    #             view_inmstock.stokactual.label("cantidad_bodega"),
    #         )
    #         .filter(
    #             view_inmstock.artcodigo == str(producto_codigo),
    #             view_inmstock.ciacodigo == cliciaciacodigo,
    #             # view_inmstock.loccodigo == loccodigo,
    #             view_inmstock.stokactual > 0,
    #         )
    #         .order_by(view_inmstock.locdescri, view_inmstock.boddescri)
    #         .all()
    #     )
    # else:
    #     body = (
    #         db.session.query(
    #             view_inmstock.bodcodigo.label("bodcodigo"),
    #             view_inmstock.boddescri.label("bodega"),
    #             view_inmstock.locdescri.label("localidad"),
    #             view_inmstock.stokactual.label("cantidad_bodega"),
    #         )
    #         .filter(
    #             view_inmstock.artcodigo == str(producto_codigo),
    #             view_inmstock.ciacodigo == cliciaciacodigo,
    #             view_inmstock.loccodigo == loccodigo,
    #             view_inmstock.stokactual > 0,
    #         )
    #         .order_by(view_inmstock.locdescri, view_inmstock.boddescri)
    #         .all()
    #     )

    # Obtenga todas las bodegas
    cliciaciacodigos = {cliciaciacodigo}

    if hasFranquicias:
        for fr in franquicias:
            cliciaciacodigos.add(fr["CiaFranqui"])

    body = (
        db.session.query(
            view_inmstock.ciacodigo.label("ciacodigo"),
            view_inmstock.loccodigo.label("loccodigo"),
            view_inmstock.locdescri.label("localidad"),
            view_inmstock.bodcodigo.label("bodcodigo"),
            view_inmstock.boddescri.label("bodega"),
            view_inmstock.stokactual.label("cantidad_bodega"),
        )
        .filter(
            view_inmstock.ciacodigo == cliciaciacodigo,
            view_inmstock.artcodigo == str(producto_codigo),
        )
        .order_by(view_inmstock.locdescri, view_inmstock.boddescri)
        .all()
    )

    cuerpo = [row._asdict() for row in body]

    result = {"cabecera": cabecera, "imagen": allImages, "cuerpo": cuerpo}
    return jsonify(result)
