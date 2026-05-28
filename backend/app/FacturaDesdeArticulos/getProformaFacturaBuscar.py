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


@bp.route("/getProformaFacturaBuscar", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def getProformaFacturaBuscar():
    """Obtener datos completos de una proforma o factura para visualizar"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    data = request.get_json()
    pednumped = data.get("pednumped")
    pedstatus = data.get("pedstatus")
    facnumfac = data.get("facnumfac")

    if not pednumped:
        raise ValidationError("Numero de proforma requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        if pedstatus == "P":
            # Leer de facped y fatped
            query_cabecera = """
                SELECT *
                FROM facped
                WHERE ciacodigo = :ciacodigo
                  AND pednumped = :pednumped
                  AND loccodigo = :loccodigo
            """
            cabecera = connection.execute(text(query_cabecera), {"ciacodigo": ciacodigo, "pednumped": pednumped, "loccodigo": loccodigo}).mappings().first()

            if not cabecera:
                raise NotFoundError(f"No se encontro la proforma {pednumped}")

            query_detalles = """
                SELECT *
                FROM fatped
                WHERE ciacodigo = :ciacodigo
                  AND pednumped = :pednumped
                  AND loccodigo = :loccodigo
                ORDER BY pedsecuen
            """
            detalles = connection.execute(text(query_detalles), {"ciacodigo": ciacodigo, "pednumped": pednumped, "loccodigo": loccodigo}).mappings().all()

            tipo = "PROFORMA"

        elif pedstatus == "F" and facnumfac:
            # Leer de facfac y fatfac
            query_cabecera = """
                SELECT *
                FROM facfac
                WHERE ciacodigo = :ciacodigo
                  AND facnumfac = :facnumfac
                  AND loccodigo = :loccodigo
            """
            cabecera = connection.execute(text(query_cabecera), {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo}).mappings().first()

            if not cabecera:
                raise NotFoundError(f"No se encontro la factura {facnumfac}")

            query_detalles = """
                SELECT *
                FROM fatfac
                WHERE ciacodigo = :ciacodigo
                  AND facnumfac = :facnumfac
                  AND loccodigo = :loccodigo
                ORDER BY facsecuen
            """
            detalles = connection.execute(text(query_detalles), {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo}).mappings().all()

            tipo = "FACTURA"
        else:
            raise ValidationError("Estado de proforma no valido para busqueda")

        # Obtener informacion del cliente
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
        cliente_info = connection.execute(text(query_cliente), {"ciacodigo": ciacodigo, "clicodigo": cabecera["clicodigo"]}).mappings().first()

        # Obtener informacion de la forma de pago
        factippag = cabecera.get("factippag", "")
        query_formapago = """
            SELECT c.*
            FROM cxcbformapag c
            WHERE c.ciacodigo = :ciacodigo
              AND c.factippag = :factippag
        """
        formapago_info = connection.execute(text(query_formapago), {"ciacodigo": ciacodigo, "factippag": factippag}).mappings().first()

        # Obtener informacion del vendedor
        vencodigo = cabecera.get("vencodigo", "")
        query_vendedor = """
            SELECT vencodigo, vennombre
            FROM fapvendedor
            WHERE ciacodigo = :ciacodigo AND vencodigo = :vencodigo
        """
        vendedor_info = connection.execute(text(query_vendedor), {"ciacodigo": ciacodigo, "vencodigo": vencodigo}).mappings().first()

        # Formatear respuesta segun el tipo
        if tipo == "PROFORMA":
            cabecera_data = {
                "pednumped": cabecera["pednumped"],
                "pedfecemi": cabecera["pedfecemi"].isoformat() if cabecera.get("pedfecemi") else None,
                "pedfecven": cabecera["pedfecven"].isoformat() if cabecera.get("pedfecven") else None,
                "pedsubtot": float(cabecera.get("pedsubtot", 0)),
                "pediva": float(cabecera.get("pediva", 0)),
                "pedtotal": float(cabecera.get("pedtotal", 0)),
                "pedstatus": cabecera.get("pedstatus", ""),
                "peddetalle": cabecera.get("peddetalle", ""),
                "factippag": cabecera.get("factippag", ""),
                "vencodigo": cabecera.get("vencodigo", ""),
            }
            productos_data = [
                {
                    "secuencia": det.get("pedsecuen", i + 1),
                    "artcodigo": det.get("artcodigo", ""),
                    "artdescri": det.get("artdescri", ""),
                    "cantidad": float(det.get("pedcantidad", 0)),
                    "precioUnitario": float(det.get("pedpreven", 0)),
                    "descuento": float(det.get("pedpordesc", 0)),
                    "iva": float(det.get("pediva", 0)),
                    "total": float(det.get("pedvaltot", 0)),
                }
                for i, det in enumerate(detalles)
            ]
        else:
            cabecera_data = {
                "facnumfac": cabecera["facnumfac"],
                "pednumped": cabecera.get("pednumped", ""),
                "facfecemi": cabecera["facfecemi"].isoformat() if cabecera.get("facfecemi") else None,
                "facfecven": cabecera["facfecven"].isoformat() if cabecera.get("facfecven") else None,
                "facsubtot": float(cabecera.get("facsubtot", 0)),
                "faciva": float(cabecera.get("faciva", 0)),
                "factotal": float(cabecera.get("factotal", 0)),
                "facstatus": cabecera.get("facstatus", ""),
                "facdetalle": cabecera.get("facdetalle", ""),
                "factippag": cabecera.get("factippag", ""),
                "vencodigo": cabecera.get("vencodigo", ""),
                "sriautnumero": cabecera.get("sriautnumero", ""),
                "sriserie01": cabecera.get("sriserie01", ""),
                "sriserie02": cabecera.get("sriserie02", ""),
                "srisecini": cabecera.get("srisecini", ""),
            }
            productos_data = [
                {
                    "secuencia": det.get("facsecuen", i + 1),
                    "artcodigo": det.get("artcodigo", ""),
                    "artdescri": det.get("artdescri", ""),
                    "cantidad": float(det.get("faccantidad", 0)),
                    "precioUnitario": float(det.get("facpreven", 0)),
                    "descuento": float(det.get("facpordesc", 0)),
                    "iva": float(det.get("faciva", 0)),
                    "total": float(det.get("facvaltot", 0)),
                }
                for i, det in enumerate(detalles)
            ]

        return {
            "success": True,
            "data": {
                "tipo": tipo,
                "cabecera": cabecera_data,
                "cliente": dict(cliente_info) if cliente_info else {},
                "formaPago": dict(formapago_info) if formapago_info else {},
                "vendedor": dict(vendedor_info) if vendedor_info else {},
                "productos": productos_data,
            },
        }
