from flask import request
from app.FacturaDesdeArticulosDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from error_handling import api_endpoint, ValidationError, NotFoundError


@bp.route("/getProformaFacturaBuscar", methods=["POST"])
@jwt_required()
@api_endpoint
def getProformaFacturaBuscar():
    """Busca y devuelve la información consolidada de una Proforma o una Factura"""
    claims = get_jwt()

    try:
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]
    except KeyError:
        raise ValidationError("Sesión inválida o incompleta. Faltan datos de compañía o localidad.")

    data = request.get_json()
    pednumped = data.get("pednumped")
    facnumfac = data.get("facnumfac")

    if not pednumped and not facnumfac:
        raise ValidationError("Debe proporcionar un número de proforma o de factura para la búsqueda.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # ==========================================
        # 1. DETERMINAR TIPO Y OBTENER CABECERA
        # ==========================================
        if facnumfac and str(facnumfac).strip() != "":
            tipo = "FACTURA"
            # Asumimos que las facturas definitivas están en facfac
            query_cabecera = text(
                """
                SELECT
                    facnumfac, pednumped, facfecemi, facfecven, factippag,
                    clicodigo, vencodigo, facstatus, facdetalle, sriautnumero,
                    facsubtot, faciva, factotal
                FROM facfac
                WHERE ciacodigo = :ciacodigo
                  AND loccodigo = :loccodigo
                  AND facnumfac = :facnumfac
            """
            )
            cabecera = connection.execute(query_cabecera, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "facnumfac": facnumfac}).mappings().first()

            if not cabecera:
                raise NotFoundError(f"La Factura {facnumfac} no fue encontrada.")
        else:
            tipo = "PROFORMA"
            # Las proformas están en facped
            query_cabecera = text(
                """
                SELECT
                    pednumped, facnumfac, pedfecemi, pedfecven, factippag,
                    clicodigo, vencodigo, pedstatus, peddetalle,
                    pedsubtot, pediva, pedtotal, '' as sriautnumero
                FROM facped
                WHERE ciacodigo = :ciacodigo
                  AND loccodigo = :loccodigo
                  AND pednumped = :pednumped
            """
            )
            cabecera = connection.execute(query_cabecera, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "pednumped": pednumped}).mappings().first()

            if not cabecera:
                raise NotFoundError(f"La Proforma {pednumped} no fue encontrada.")

        # ==========================================
        # 2. OBTENER METADATOS (Cliente, Pago, Vendedor)
        # ==========================================
        query_cliente = text(
            """
            SELECT clicodigo, clinombre, cliruc, clitelef1, clidirec
            FROM cxcmcli
            WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
        """
        )
        cliente = connection.execute(query_cliente, {"ciacodigo": ciacodigo, "clicodigo": cabecera["clicodigo"]}).mappings().first()

        query_formapago = text(
            """
            SELECT fordescri
            FROM cxcbformapag
            WHERE ciacodigo = :ciacodigo AND factippag = :factippag
        """
        )
        formaPago = connection.execute(query_formapago, {"ciacodigo": ciacodigo, "factippag": cabecera["factippag"]}).mappings().first()

        query_vendedor = text(
            """
            SELECT vennombre
            FROM fapvendedor
            WHERE ciacodigo = :ciacodigo AND vencodigo = :vencodigo
        """
        )
        vendedor = connection.execute(query_vendedor, {"ciacodigo": ciacodigo, "vencodigo": cabecera["vencodigo"]}).mappings().first()

        # ==========================================
        # 3. OBTENER PRODUCTOS / DETALLE
        # ==========================================
        if tipo == "FACTURA":
            query_detalles = text(
                """
                SELECT
                    facsecuen as secuencia, artcodigo, artdescri, faccantidad as cantidad,
                    facpreven as precioUnitario, facpordesc as descuento, faciva as iva, facvaltot as total
                FROM fatfac
                WHERE ciacodigo = :ciacodigo
                  AND loccodigo = :loccodigo
                  AND facnumfac = :facnumfac
                ORDER BY facsecuen
            """
            )
            productos = connection.execute(query_detalles, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "facnumfac": facnumfac}).mappings().all()
        else:
            query_detalles = text(
                """
                SELECT
                    pedsecuen as secuencia, artcodigo, artdescri, pedcantidad as cantidad,
                    pedpreven as precioUnitario, pedpordesc as descuento, pediva as iva, pedvaltot as total
                FROM fatped
                WHERE ciacodigo = :ciacodigo
                  AND loccodigo = :loccodigo
                  AND pednumped = :pednumped
                ORDER BY pedsecuen
            """
            )
            productos = connection.execute(query_detalles, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "pednumped": pednumped}).mappings().all()

    # ==========================================
    # 4. FORMATEAR RESPUESTA FINAL
    # ==========================================
    # Convertimos las fechas y valores decimales a formatos compatibles con JSON y el Frontend
    cabecera_dict = dict(cabecera)

    if tipo == "FACTURA":
        cabecera_dict["facfecemi"] = cabecera["facfecemi"].isoformat() if cabecera["facfecemi"] else None
        cabecera_dict["facfecven"] = cabecera["facfecven"].isoformat() if cabecera["facfecven"] else None
        cabecera_dict["facsubtot"] = float(cabecera["facsubtot"] or 0)
        cabecera_dict["faciva"] = float(cabecera["faciva"] or 0)
        cabecera_dict["factotal"] = float(cabecera["factotal"] or 0)
    else:
        cabecera_dict["pedfecemi"] = cabecera["pedfecemi"].isoformat() if cabecera["pedfecemi"] else None
        cabecera_dict["pedfecven"] = cabecera["pedfecven"].isoformat() if cabecera["pedfecven"] else None
        cabecera_dict["pedsubtot"] = float(cabecera["pedsubtot"] or 0)
        cabecera_dict["pediva"] = float(cabecera["pediva"] or 0)
        cabecera_dict["pedtotal"] = float(cabecera["pedtotal"] or 0)

    productos_list = []
    for p in productos:
        prod_dict = dict(p)
        prod_dict["cantidad"] = float(p["cantidad"] or 0)
        prod_dict["precioUnitario"] = float(p["precioUnitario"] or 0)
        prod_dict["descuento"] = float(p["descuento"] or 0)
        prod_dict["iva"] = float(p["iva"] or 0)
        prod_dict["total"] = float(p["total"] or 0)
        productos_list.append(prod_dict)

    return {"data": {"tipo": tipo, "cabecera": cabecera_dict, "cliente": dict(cliente) if cliente else {}, "formaPago": dict(formaPago) if formaPago else {}, "vendedor": dict(vendedor) if vendedor else {}, "productos": productos_list}}
