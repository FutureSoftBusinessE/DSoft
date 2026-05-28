from flask import jsonify, request
from app.FacturaDesdeArticulos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from app.utils.calcular_metricas_productos import calcular_metricas_productos
from datetime import datetime
from error_handling import api_endpoint, ValidationError, validate_required, NotFoundError, APIError


@bp.route("/getFacturaParaClonar", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def getFacturaParaClonar():
    """Obtener datos de una factura para clonar como proforma"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    data = request.get_json()
    facnumfac = data.get("facnumfac")
    loccodigo_param = data.get("loccodigo", loccodigo)
    ciacodigo_param = data.get("ciacodigo", ciacodigo)

    if not facnumfac:
        raise ValidationError("Numero de factura requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # 1. Leer cabecera de la factura
        query_factura = """
            SELECT *
            FROM facfac
            WHERE ciacodigo = :ciacodigo
              AND facnumfac = :facnumfac
              AND loccodigo = :loccodigo
        """
        factura = connection.execute(text(query_factura), {"ciacodigo": ciacodigo_param, "facnumfac": facnumfac, "loccodigo": loccodigo_param}).mappings().first()

        if not factura:
            raise NotFoundError(f"No se encontro la factura {facnumfac}")

        # 2. Leer detalles de la factura
        query_detalles = """
            SELECT *
            FROM fatfac
            WHERE ciacodigo = :ciacodigo
              AND facnumfac = :facnumfac
              AND loccodigo = :loccodigo
            ORDER BY facsecuen
        """
        detalles_factura = connection.execute(text(query_detalles), {"ciacodigo": ciacodigo_param, "facnumfac": facnumfac, "loccodigo": loccodigo_param}).mappings().all()

        if not detalles_factura:
            raise ValidationError("La factura no tiene detalles")

        # 3. Obtener informacion del cliente
        query_cliente = """
            SELECT DISTINCT
                cxcmcli.clicodigo,
                cxcmcli.clinombre,
                cxcmcli.clidirec,
                cxcmcli.cliruc,
                cxcmcli.clitelef1,
                cxcmcli.clireferencia1,
                cxcmcli.zoncodigo,
                cxcmcli.clistatus,
                cxcmcli.ciacodigo
            FROM cxcmcli
            WHERE cxcmcli.ciacodigo = :ciacodigo
            AND cxcmcli.clicodigo = :clicodigo
        """
        cliente_info = connection.execute(text(query_cliente), {"ciacodigo": ciacodigo_param, "clicodigo": factura["clicodigo"]}).mappings().first()

        cliente_data = dict(cliente_info) if cliente_info else {}

        # 4. Obtener informacion de la forma de pago
        query_formapago = """
            SELECT c.*
            FROM cxcbformapag c
            INNER JOIN fasloc f
                ON c.ciacodigo = f.ciacodigo
                AND c.factippag = f.factippag
            WHERE c.ciacodigo = :ciacodigo
              AND f.loccodigo = :loccodigo
              AND c.factippag = :factippag
              AND c.forstatus = 'A'
        """
        formapago_info = connection.execute(text(query_formapago), {"ciacodigo": ciacodigo_param, "loccodigo": loccodigo_param, "factippag": factura["factippag"]}).mappings().first()

        formapago_data = dict(formapago_info) if formapago_info else {}

        # 5. Obtener informacion del vendedor
        query_vendedor = """
            SELECT vencodigo, vennombre, venstatus
            FROM fapvendedor
            WHERE ciacodigo = :ciacodigo AND vencodigo = :vencodigo
        """
        vendedor_info = connection.execute(text(query_vendedor), {"ciacodigo": ciacodigo_param, "vencodigo": factura.get("vencodigo", "")}).mappings().first()

        vendedor_data = dict(vendedor_info) if vendedor_info else {}

        # 6. Construir observacion
        observacion = f"Clonada de factura {facnumfac}"

        # 7. Formatear productos
        productos_data = []
        for detalle in detalles_factura:
            # Obtener info adicional del producto desde inmart
            query_producto = """
                SELECT artcantactual
                FROM inmart
                WHERE ciacodigo = :ciacodigo AND artcodigo = :artcodigo
            """
            producto_info = connection.execute(text(query_producto), {"ciacodigo": ciacodigo_param, "artcodigo": detalle["artcodigo"]}).mappings().first()

            productos_data.append(
                {
                    "artcodigo": detalle["artcodigo"],
                    "artdescri": detalle.get("artdescri", ""),
                    "meddescri": "",
                    "predescri": "",
                    "lindescri": "",
                    "artcantactual": float(producto_info["artcantactual"] or 0) if producto_info else 0,
                    "mardescri": "",
                    "precioUnitario": float(detalle.get("facpreven", 0)),
                    "ivaPorcentaje": float(detalle.get("faciva", 0)),
                    "artapliiva": detalle.get("artaplipro", -1),
                    "descuentoPorcentaje": float(detalle.get("facpordesc", 0)),
                    # "imagen": producto_info["imagen"] if producto_info else "",
                    "cantidadPedido": float(detalle.get("faccantidad", 0)),
                    "pedvaldesc": float(detalle.get("facvaldesc", 0)),
                    "pedvaliva": float(detalle.get("facvaliva", 0)),
                    "pedvalor": float(detalle.get("facvalor", 0)),
                    "pedvaltot": float(detalle.get("facvaltot", 0)),
                }
            )

        return {
            "success": True,
            "data": {
                "cliente": cliente_data,
                "formaPago": formapago_data,
                "vendedor": vendedor_data,
                "productos": productos_data,
                "observacion": observacion,
            },
        }
