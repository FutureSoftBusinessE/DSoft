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


@bp.route("/getProforma/<pednumped>", methods=["GET"])
@cross_origin()
@jwt_required()
@api_endpoint
def getProforma(pednumped):
    """Obtener datos completos de una proforma para editar"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # 1. Obtener cabecera de la proforma
        query_cabecera = """
            SELECT
                pednumped, facnumfac, loccodigo, pedtipo, factippag,
                moncodigo, clicodigo, peddirent, pedcambio, pedfecemi,
                pedfecven, pedtivacer, pedtivapor, pedsubtot, pediva,
                pedtotal, pedstatus, peddetalle, vencodigo, zoncodigo,
                pedpordes, peddesglobal, peddesdirecto, pedrecargo,
                tipcodigo, pedporrec, pedporiva, pedapliiva,
                fordias, fortipo, forcuotas, fordescuento,
                foraprocredito, foraprologistica, foraprocliente,
                forpromocion, foranticipo, foraplianti
            FROM facped
            WHERE ciacodigo = :ciacodigo
            AND loccodigo = :loccodigo
            AND pednumped = :pednumped
        """

        cabecera = connection.execute(text(query_cabecera), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "pednumped": pednumped}).mappings().first()

        if not cabecera:
            raise NotFoundError(f"Proforma {pednumped} no encontrada")

        # 2. Obtener información completa del cliente (usando el mismo query que getInfoCliente)
        query_cliente = """
            SELECT DISTINCT
                cxcmcli.clicodigo,
                cxcmcli.clinombre,
                cxcmcli.clidirec,
                cxcmcli.cliruc,
                cxcmcli.clitelef1,
                cxcmcli.clidiascrs,
                cxcmcli.climontocrs,
                cxcmcli.cliprefac,
                cxcmcli.cliemail,
                cxcbtipcli.tipdescri,
                fapzona.zondescri,
                cxcbreg.regdescri,
                hotbciu.ciudescri,
                rhbprov.prodescri,
                cxcmcli.cliestciv,
                cxcbacteconomicas.actividescri,
                cxcbsectorpublico.sectordescri,
                cxcmcli.clidiapago,
                cxcmcli.clidiasrecibefac1,
                cxcmcli.cliapliiva,
                cxcmcli.clibloqueo
            FROM cxcmcli
            INNER JOIN cxcbtipcli ON cxcmcli.tipcodigo = cxcbtipcli.tipcodigo
            INNER JOIN fapzona ON cxcmcli.zoncodigo = fapzona.zoncodigo
            INNER JOIN cxcbreg ON cxcmcli.regcodigo = cxcbreg.regcodigo
            INNER JOIN hotbciu ON cxcmcli.ciucodigo = hotbciu.ciucodigo
            INNER JOIN rhbprov ON cxcmcli.procodigo = rhbprov.procodigo
            INNER JOIN cxcbacteconomicas ON cxcmcli.activicodigo = cxcbacteconomicas.activicodigo
            INNER JOIN cxcbsectorpublico ON cxcbsectorpublico.sectorcodigo = cxcmcli.sectorcodigo
            WHERE cxcmcli.ciacodigo = :ciacodigo
            AND cxcmcli.clicodigo = :clicodigo
        """

        cliente_result = connection.execute(text(query_cliente), {"ciacodigo": ciacodigo, "clicodigo": cabecera["clicodigo"]}).mappings().first()

        cliente_info = dict(cliente_result) if cliente_result else {}

        # 3. Obtener información de la forma de pago (usando el mismo query que getFormaPago)
        query_formapago = """
            SELECT c.*
            FROM cxcbformapag c
            INNER JOIN fasloc f
                ON c.ciacodigo = f.ciacodigo
                AND c.factippag = f.factippag
            WHERE
                c.ciacodigo = :ciacodigo
                AND f.loccodigo = :loccodigo
                AND c.factippag = :factippag
                AND c.forstatus = 'A'
        """

        formapago_result = connection.execute(text(query_formapago), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "factippag": cabecera["factippag"]}).mappings().first()

        formapago_info = dict(formapago_result) if formapago_result else {}

        # 4. Obtener información del vendedor
        query_vendedor = """
            SELECT vencodigo, vennombre, venstatus
            FROM fapvendedor
            WHERE ciacodigo = :ciacodigo AND vencodigo = :vencodigo
        """

        vendedor_result = connection.execute(text(query_vendedor), {"ciacodigo": ciacodigo, "vencodigo": cabecera["vencodigo"]}).mappings().first()

        vendedor_info = dict(vendedor_result) if vendedor_result else {}

        # 5. Obtener detalles de los productos
        query_detalles = """
            SELECT
                fatped.pedsecuen,
                fatped.artcodigo,
                fatped.artdescri,
                fatped.pedcantidad,
                fatped.pedpreven,
                fatped.pedpordesc,
                fatped.pedvaldesc,
                fatped.pedvaliva,
                fatped.pediva,
                fatped.pedvalor,
                fatped.pedvaltot,
                fatped.pedapliiva,
                fatped.invcodigo,
                fatped.precodigo,
                fatped.lincodigo,
                fatped.medcodigo,
                fatped.marcodigo,
                fatped.artpeso,
                fatped.artserie,
                fatped.artservicio,
                inmart.artcantactual,
                inmart.artdescri as artdescri_completa,
                inmart.precodigo as precodigo_inmart,
                inmart.lincodigo as lincodigo_inmart,
                inmart.medcodigo as medcodigo_inmart,
                inmart.marcodigo as marcodigo_inmart
            FROM fatped
            LEFT JOIN inmart ON fatped.ciacodigo = inmart.ciacodigo
                AND fatped.artcodigo = inmart.artcodigo
            WHERE fatped.ciacodigo = :ciacodigo
            AND fatped.loccodigo = :loccodigo
            AND fatped.pednumped = :pednumped
            ORDER BY fatped.pedsecuen
        """

        detalles = connection.execute(text(query_detalles), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "pednumped": pednumped}).mappings().all()

        # 6. Construir respuesta completa
        proforma_data = {
            "cabecera": {
                "pednumped": cabecera["pednumped"],
                "facnumfac": cabecera["facnumfac"],
                "loccodigo": cabecera["loccodigo"],
                "pedfecemi": cabecera["pedfecemi"].isoformat() if cabecera["pedfecemi"] else None,
                "pedfecven": cabecera["pedfecven"].isoformat() if cabecera["pedfecven"] else None,
                "factippag": cabecera["factippag"],
                "fortipo": cabecera["fortipo"],
                "fordias": cabecera["fordias"],
                "forcuotas": cabecera["forcuotas"],
                "fordescuento": str(cabecera["fordescuento"]),
                "peddetalle": cabecera["peddetalle"],
                "pedstatus": cabecera["pedstatus"],
                "pedsubtot": float(cabecera["pedsubtot"] or 0),
                "pediva": float(cabecera["pediva"] or 0),
                "pedtotal": float(cabecera["pedtotal"] or 0),
                "pedapliiva": cabecera["pedapliiva"],
            },
            "cliente": cliente_info,  # Ahora incluye TODA la información del cliente
            "formaPago": formapago_info,  # Información completa de la forma de pago
            "vendedor": vendedor_info,  # Información del vendedor
            "productos": [
                {
                    "pedsecuen": det["pedsecuen"],
                    "artcodigo": det["artcodigo"],
                    "artdescri": det["artdescri"] or det.get("artdescri_completa", ""),
                    "cantidadPedido": float(det["pedcantidad"] or 0),
                    "precioUnitario": float(det["pedpreven"] or 0),
                    "descuentoPorcentaje": float(det["pedpordesc"] or 0),
                    "ivaPorcentaje": float(det["pediva"] or 0),
                    "artapliiva": det["pedapliiva"],
                    "pedvaldesc": float(det["pedvaldesc"] or 0),
                    "pedvaliva": float(det["pedvaliva"] or 0),
                    "pedvalor": float(det["pedvalor"] or 0),
                    "pedvaltot": float(det["pedvaltot"] or 0),
                    "artcantactual": float(det["artcantactual"] or 0) if det["artcantactual"] else 0,
                    "invcodigo": det["invcodigo"],
                    "precodigo": det["precodigo"] or det.get("precodigo_inmart", ""),
                    "lincodigo": det["lincodigo"] or det.get("lincodigo_inmart", ""),
                    "medcodigo": det["medcodigo"] or det.get("medcodigo_inmart", ""),
                    "marcodigo": det["marcodigo"] or det.get("marcodigo_inmart", ""),
                    "lindescri": det.get("lindescri", ""),
                    "meddescri": det.get("meddescri", ""),
                    "predescri": det.get("predescri", ""),
                    "mardescri": det.get("mardescri", ""),
                    "imagen": det.get("imagen", ""),
                    "artpeso": float(det["artpeso"] or 0) if det.get("artpeso") else 0,
                    "artserie": det.get("artserie", ""),
                    "artservicio": det.get("artservicio", ""),
                }
                for det in detalles
            ],
        }

        return proforma_data
