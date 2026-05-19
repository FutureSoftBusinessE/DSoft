from flask import jsonify, request
from app.FacturaDesdeArticulos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError, APIError, NotFoundError
from datetime import datetime
import time
from app.FacturaDesdeArticulos.utils.construir_payload_sri import construir_payload_sri


@bp.route("/recuperarPayloadFactura", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def recuperarPayloadFactura():
    """
    Endpoint que recupera el payload SRI desde las tablas facfac/fatfac
    para poder reenviar a autorización cuando falló el primer intento.

    Recibe: facnumfac, loccodigo, ciacodigo
    Retorna: Payload completo para enviar a emisionFactura
    """

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    # usrcodigo = claims["user"]

    data = request.get_json()
    facnumfac = data.get("facnumfac")
    loccodigo = data.get("loccodigo")

    if not facnumfac or not loccodigo:
        raise ValidationError("Número de factura y localidad requeridos")

    # Obtener sesión
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:

        # PASO 1: Leer cabecera de la factura
        query_factura = """
            SELECT *
            FROM facfac
            WHERE ciacodigo = :ciacodigo
              AND facnumfac = :facnumfac
              AND loccodigo = :loccodigo
        """
        factura_raw = connection.execute(text(query_factura), {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo}).mappings().first()

        if not factura_raw:
            raise NotFoundError(f"No se encontró la factura {facnumfac}")

        # Verificar que no esté ya autorizada
        # if factura_raw.get("facstatus") == 'A':
        #     raise ValidationError(f"La factura {facnumfac} ya está autorizada con número: {factura_raw['sriautnumero']}")

        # ========== TRANSFORMAR facfac → formato facped ==========
        factura = {
            "pednumped": factura_raw["pednumped"],
            "pedfecemi": factura_raw["facfecemi"],
            "pedfecven": factura_raw["facfecven"],
            "pedsubtot": factura_raw["facsubtot"],
            "pediva": factura_raw["faciva"],
            "pedtotal": factura_raw["factotal"],
            "peddetalle": factura_raw["facdetalle"],
            "pedtivacer": factura_raw["factivacer"],
            "pedtivapor": factura_raw["factivapor"],
            "pedpordes": factura_raw["facpordes"],
            "peddesglobal": factura_raw["facdesglobal"],
            "peddesdirecto": factura_raw["facdesdirecto"],
            "pedrecargo": factura_raw["facrecargo"],
            "pedporrec": factura_raw["facporrec"],
            "pedporiva": factura_raw["facporiva"],
            "moncodigo": factura_raw["moncodigo"],
            "clicodigo": factura_raw["clicodigo"],
            "factippag": factura_raw["factippag"],
            "vencodigo": factura_raw["vencodigo"],
        }
        # PASO 2: Leer detalles de la factura
        query_detalles = """
            SELECT *
            FROM fatfac
            WHERE ciacodigo = :ciacodigo
              AND facnumfac = :facnumfac
              AND loccodigo = :loccodigo
            ORDER BY facsecuen
        """
        detalles_factura_raw = connection.execute(text(query_detalles), {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo}).mappings().all()

        if not detalles_factura_raw:
            raise ValidationError("La factura no tiene detalles")

        # Transformar nombres de columnas de fatfac a fatped
        detalles_factura = []
        for detalle in detalles_factura_raw:
            detalle_transformado = {
                "pedsecuen": detalle["facsecuen"],
                "pedcantidad": detalle["faccantidad"],
                "pedcosto": detalle["faccosto"],
                "pedcostodol": detalle["faccostodol"],
                "pedpreven": detalle["facpreven"],
                "pedvaldesglo": detalle["facvaldesglo"],
                "pedvaldesc": detalle["facvaldesc"],
                "pedvalrec": detalle["facvalrec"],
                "pediva": detalle["faciva"],
                "pedvaliva": detalle["facvaliva"],
                "pedvalor": detalle["facvalor"],
                "pedvaltot": detalle["facvaltot"],
                "pedpordesc": detalle["facpordesc"],
                "pedusudesc": detalle["facusudesc"],
                "pedvalinter": detalle["facvalinter"],
                "pedsolsinstock": detalle["facsolsinstock"],
                # Columnas que mantienen el mismo nombre
                "artcodigo": detalle["artcodigo"],
                "artdescri": detalle["artdescri"],
                "invcodigo": detalle["invcodigo"],
                "precodigo": detalle["precodigo"],
                "lincodigo": detalle["lincodigo"],
                "medcodigo": detalle["medcodigo"],
                "marcodigo": detalle["marcodigo"],
                "artpeso": detalle["artpeso"],
                "artserie": detalle["artserie"],
                "artservicio": detalle["artservicio"],
                "artexpins": detalle["artexpins"],
                "artfaccero": detalle["artfaccero"],
                "artaplipro": detalle["artaplipro"],
                "cliprecio": detalle["cliprecio"],
                "bodcodigo": detalle["bodcodigo"],
            }
            detalles_factura.append(detalle_transformado)

        # PASO 3: Obtener datos de la empresa
        query_empresa = """
            SELECT *
            FROM siaccia
            WHERE ciacodigo = :ciacodigo
        """
        datos_empresa = connection.execute(text(query_empresa), {"ciacodigo": ciacodigo}).mappings().first()

        if not datos_empresa:
            raise APIError(f"No se encontraron datos de la empresa {ciacodigo}")

        # PASO 4: Obtener datos del cliente
        query_cliente = """
            SELECT clicodigo, clinombre, cliruc, clidirec, clitelef1, zoncodigo,
                   tipcodigo, regcodigo, ciucodigo, procodigo
            FROM cxcmcli
            WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
        """
        datos_cliente = connection.execute(text(query_cliente), {"ciacodigo": ciacodigo, "clicodigo": factura["clicodigo"]}).mappings().first()

        if not datos_cliente:
            raise APIError(f"No se encontró el cliente {factura['clicodigo']}")

        # PASO 5: Obtener datos de forma de pago
        query_forma_pago = """
            SELECT *
            FROM cxcbformapag
            WHERE ciacodigo = :ciacodigo AND factippag = :factippag
        """
        forma_pago = connection.execute(text(query_forma_pago), {"ciacodigo": ciacodigo, "factippag": factura["factippag"]}).mappings().first()

        if not forma_pago:
            raise APIError(f"No se encontró la forma de pago {factura['factippag']}")

        # PASO 6: Obtener secuencia SRI actual (lo tomo en el facfac campo facnumero porque esa factura ya se guarda y debo usar la misma secuencia)
        query_secuencia = """
            SELECT sriautnumero, sriserie01, sriserie02, srisecini, srisecfin
            FROM siactsriseries
            WHERE ciacodigo = :ciacodigo
            AND sripreauto = 'E'
            AND cjacodigo = '103'
            AND srisecdoc = '01'
        """

        secuencia_sri = connection.execute(text(query_secuencia), {"ciacodigo": ciacodigo}).mappings().first()

        if not secuencia_sri:
            raise APIError("No se encontró la secuencia SRI configurada")

        # convertir a dict mutable
        secuencia_sri = dict(secuencia_sri)

        # Reemplazar por la misma secuencia con la que se guardo la factura
        secuencia_sri["srisecini"] = factura_raw["facnumero"]

    # PASO 7: Construir payload (misma función que usa facturarProforma)
    payload_sri = construir_payload_sri(
        proforma=factura, detalles=detalles_factura, secuencia_sri=secuencia_sri, datos_empresa=datos_empresa, datos_cliente=datos_cliente, forma_pago=forma_pago, ciacodigo=ciacodigo, loccodigo=loccodigo, facnumfac=facnumfac  # AHORA sí tiene formato facped  # AHORA sí tiene formato fatped
    )

    # Agregar datos adicionales que necesita emisionFactura
    payload_sri["ciacodigo"] = ciacodigo
    payload_sri["facnumfac"] = facnumfac
    payload_sri["loccodigo"] = loccodigo
    payload_sri["datos_cliente"] = {
        "email": datos_cliente.get("email", ""),
        "clinombre": datos_cliente.get("clinombre", ""),
        "cliruc": datos_cliente.get("cliruc", ""),
    }

    return {"success": True, "message": "Payload recuperado exitosamente", "facnumfac": facnumfac, "payload_sri": payload_sri}
