from flask import jsonify, request
from app.FacturaDesdeArticulos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError, APIError, NotFoundError
from datetime import datetime
import time
from app.FacturaDesdeArticulos.utils.construir_payload_sri import construir_payload_sri


@bp.route("/facturarProforma", methods=["POST"])
@jwt_required()
@api_endpoint
def facturarProforma():
    """
    Endpoint para facturar una proforma existente.
    Flujo:
    1. Validar proforma
    2. Crear factura en facfac/fatfac
    3. Actualizar secuencia SRI (+1)
    4. Actualizar proforma P→F
    5. Construir payload para SRI
    6. Devolver payload (el resto lo hace otro servicio)
    """

    # ========== PASO 0: OBTENER DATOS JWT Y REQUEST ==========
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = claims["user"]

    data = request.get_json()
    pednumped = data.get("pednumped")

    if not pednumped:
        raise ValidationError("Número de proforma requerido")

    # Fechas del sistema
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener sesión
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():

            # ========== PASO 1: LEER Y VALIDAR PROFROMA ==========
            query_proforma = """
                SELECT *
                FROM facped
                WHERE ciacodigo = :ciacodigo
                  AND pednumped = :pednumped
                  AND loccodigo = :loccodigo
            """
            proforma = connection.execute(text(query_proforma), {"ciacodigo": ciacodigo, "pednumped": pednumped, "loccodigo": loccodigo}).mappings().first()

            if not proforma:
                raise NotFoundError(f"No se encontró la proforma {pednumped}")

            if proforma["pedstatus"] != "P":
                raise ValidationError(f"La proforma {pednumped} no está pendiente. Estado actual: {proforma['pedstatus']}")

            # Verificar que no exista ya una factura para esta proforma
            query_factura_existente = """
                SELECT COUNT(*) as cantidad
                FROM facfac
                WHERE ciacodigo = :ciacodigo
                  AND pednumped = :pednumped
                  AND loccodigo = :loccodigo
            """
            factura_existente = connection.execute(text(query_factura_existente), {"ciacodigo": ciacodigo, "pednumped": pednumped, "loccodigo": loccodigo}).mappings().first()

            if factura_existente["cantidad"] > 0:
                raise ValidationError(f"La proforma {pednumped} ya tiene una factura asociada")

            # Leer detalles de la proforma
            query_detalles = """
                SELECT *
                FROM fatped
                WHERE ciacodigo = :ciacodigo
                  AND pednumped = :pednumped
                  AND loccodigo = :loccodigo
                ORDER BY pedsecuen
            """
            detalles_proforma = connection.execute(text(query_detalles), {"ciacodigo": ciacodigo, "pednumped": pednumped, "loccodigo": loccodigo}).mappings().all()

            if not detalles_proforma:
                raise ValidationError("La proforma no tiene detalles")

            # ========== PASO 2: OBTENER DATOS DE LA EMPRESA ==========
            query_empresa = """
                SELECT *
                FROM siaccia
                WHERE ciacodigo = :ciacodigo
            """
            datos_empresa = connection.execute(text(query_empresa), {"ciacodigo": ciacodigo}).mappings().first()

            if not datos_empresa:
                raise APIError(f"No se encontraron datos de la empresa {ciacodigo}")

            # ========== PASO 3: OBTENER DATOS DEL CLIENTE ==========
            query_cliente = """
                SELECT clicodigo, clinombre, cliruc, clidirec, clitelef1, zoncodigo,
                       tipcodigo, regcodigo, ciucodigo, procodigo
                FROM cxcmcli
                WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
            """
            datos_cliente = connection.execute(text(query_cliente), {"ciacodigo": ciacodigo, "clicodigo": proforma["clicodigo"]}).mappings().first()

            if not datos_cliente:
                raise APIError(f"No se encontró el cliente {proforma['clicodigo']}")

            # ========== PASO 4: OBTENER DATOS DE FORMA DE PAGO ==========
            query_forma_pago = """
                SELECT factippag, fordescri, fordias, fortipo, forcuotas,
                       foranticipo, forintmen, forpromocion, fordescuento,
                       foraprocredito, foraprologistica, foraprocliente, foraplianti
                FROM cxcbformapag
                WHERE ciacodigo = :ciacodigo AND factippag = :factippag
            """
            forma_pago = connection.execute(text(query_forma_pago), {"ciacodigo": ciacodigo, "factippag": proforma["factippag"]}).mappings().first()

            if not forma_pago:
                raise APIError(f"No se encontró la forma de pago {proforma['factippag']}")

            # ========== PASO 5: OBTENER SECUENCIA SRI (SIN ACTUALIZAR AÚN) ==========
            query_secuencia = """
                SELECT sriautnumero, sriserie01, sriserie02, srisecini, srisecfin, srisecact
                FROM siactsriseries
                WHERE ciacodigo = :ciacodigo
                  AND sripreauto = 'E'
                  AND cjacodigo = '103'
                  AND srisecdoc = '01'
            """
            secuencia_sri = connection.execute(text(query_secuencia), {"ciacodigo": ciacodigo}).mappings().first()

            if not secuencia_sri:
                raise APIError("No se encontró la secuencia SRI configurada")

            secuencia_actual = secuencia_sri["srisecact"]
            nueva_secuencia = secuencia_actual + 1

            # Generar número de factura
            year = datetime.now().strftime("%y")
            sriserie01 = secuencia_sri["sriserie01"]
            sriserie02 = secuencia_sri["sriserie02"]
            facnumfac = f"F{year}{sriserie01}{sriserie02}{secuencia_actual:09}"

            # ========== PASO 6: INSERTAR CABECERA EN facfac ==========
            sql_insert_cabecera = """
                INSERT INTO facfac (
                    ciacodigo, facnumfac, factipo, factippag, moncodigo, clicodigo, loccodigo,
                    garcodigo, facdirent, faccambio, facfecemi, facfecven, factivacer, factivapor,
                    facsubtot, faciva, factotal, facabono, facsaldo, facvalnc, facstatus, facdetalle,
                    facfecisys, fachorisys, facusuisys, facestisys, facfecmsys, fachormsys,
                    facusumsys, facestmsys, facusudes, vencodigo, zoncodigo, cjacodigo,
                    ncompcodigo, facaplicomi, cxcpagpor, facpordes, facdesglobal, facdesdirecto,
                    facrecargo, seqcodigo, tipcodigo, pednumped, facnumero, facporrec, facporiva,
                    facvuelto, facvoucher, facrecap, facvalantici, forintmen, facrecnc, facvalinter,
                    tarjcodigo, fordias, forcuotas, foraplianti, foranticipo, foraplirango,
                    formondesde, formonhasta, forapligrac, fordiasgrac, forcuoinigr, facusuanti,
                    facfanv, codcodigo, adinumero, facnumadi, facvaladi, reccodigo, facorigen,
                    facrotdif, faccuotasdif, facgraciadif, tarciacod, tarloccod, tarclicod,
                    precodigo, facvehi, reccodlegal, facnumref, tarnumero, factitpro, fectitpro,
                    hortitpro, usutitpro, esttitpro, facflaglegal, sriserie01, sriserie02,
                    srisecini, srisecfin, sriautfecemi, sriautfecven, sriautnumero, audnumxml,
                    leccodigo, integracodigo, proyectocodigo, facproyecto, facsolsinstock,
                    facfecposent, fachorposent, forpromocion, fordescuento, facretiracliente,
                    regcodigo, ciucodigo, procodigo, fasrioritipo, fasrioriserie01, fasrioriserie02,
                    fasriorinumero, facelectronica, clinombre, cliruc, clidirec, cliemail,
                    ciaciaruc, ciaciadescri, ciaciadirec, ciaciatelefono1, ciaciaciudad,
                    ciaciapais, locdescri, locciadirec, locciatelefono1, locciaciudad, locciapais,
                    cianumresolucion, ciaobligadocon, numsolanusri, codctblesri
                ) VALUES (
                    :ciacodigo, :facnumfac, :factipo, :factippag, :moncodigo, :clicodigo, :loccodigo,
                    :garcodigo, :facdirent, :faccambio, :facfecemi, :facfecven, :factivacer, :factivapor,
                    :facsubtot, :faciva, :factotal, :facabono, :facsaldo, :facvalnc, :facstatus, :facdetalle,
                    :facfecisys, :fachorisys, :facusuisys, :facestisys, :facfecmsys, :fachormsys,
                    :facusumsys, :facestmsys, :facusudes, :vencodigo, :zoncodigo, :cjacodigo,
                    :ncompcodigo, :facaplicomi, :cxcpagpor, :facpordes, :facdesglobal, :facdesdirecto,
                    :facrecargo, :seqcodigo, :tipcodigo, :pednumped, :facnumero, :facporrec, :facporiva,
                    :facvuelto, :facvoucher, :facrecap, :facvalantici, :forintmen, :facrecnc, :facvalinter,
                    :tarjcodigo, :fordias, :forcuotas, :foraplianti, :foranticipo, :foraplirango,
                    :formondesde, :formonhasta, :forapligrac, :fordiasgrac, :forcuoinigr, :facusuanti,
                    :facfanv, :codcodigo, :adinumero, :facnumadi, :facvaladi, :reccodigo, :facorigen,
                    :facrotdif, :faccuotasdif, :facgraciadif, :tarciacod, :tarloccod, :tarclicod,
                    :precodigo, :facvehi, :reccodlegal, :facnumref, :tarnumero, :factitpro, :fectitpro,
                    :hortitpro, :usutitpro, :esttitpro, :facflaglegal, :sriserie01, :sriserie02,
                    :srisecini, :srisecfin, :sriautfecemi, :sriautfecven, :sriautnumero, :audnumxml,
                    :leccodigo, :integracodigo, :proyectocodigo, :facproyecto, :facsolsinstock,
                    :facfecposent, :fachorposent, :forpromocion, :fordescuento, :facretiracliente,
                    :regcodigo, :ciucodigo, :procodigo, :fasrioritipo, :fasrioriserie01, :fasrioriserie02,
                    :fasriorinumero, :facelectronica, :clinombre, :cliruc, :clidirec, :cliemail,
                    :ciaciaruc, :ciaciadescri, :ciaciadirec, :ciaciatelefono1, :ciaciaciudad,
                    :ciaciapais, :locdescri, :locciadirec, :locciatelefono1, :locciaciudad, :locciapais,
                    :cianumresolucion, :ciaobligadocon, :numsolanusri, :codctblesri
                )
            """

            params_cabecera = {
                "ciacodigo": ciacodigo,
                "facnumfac": facnumfac,
                "factipo": "FE",
                "factippag": proforma["factippag"],
                "moncodigo": proforma["moncodigo"],
                "clicodigo": proforma["clicodigo"],
                "loccodigo": loccodigo,
                "garcodigo": proforma["clicodigo"],
                "facdirent": datos_cliente["clidirec"],
                "faccambio": 0,
                "facfecemi": proforma["pedfecemi"],
                "facfecven": proforma["pedfecven"],
                "factivacer": proforma["pedtivacer"],
                "factivapor": proforma["pedtivapor"],
                "facsubtot": proforma["pedsubtot"],
                "faciva": proforma["pediva"],
                "factotal": proforma["pedtotal"],
                "facabono": 0,
                "facsaldo": proforma["pedtotal"],
                "facvalnc": 0,
                "facstatus": "A",
                "facdetalle": proforma.get("peddetalle", ""),
                "facfecisys": fecha_con_hora_cero,
                "fachorisys": fecha_formato_1900,
                "facusuisys": usrcodigo,
                "facestisys": ipUser,
                "facfecmsys": fecha_con_hora_cero,
                "fachormsys": fecha_formato_1900,
                "facusumsys": usrcodigo,
                "facestmsys": ipUser,
                "facusudes": usrcodigo,
                "vencodigo": proforma["vencodigo"],
                "zoncodigo": datos_cliente["zoncodigo"],
                "cjacodigo": "103",
                "ncompcodigo": None,
                "facaplicomi": -1,
                "cxcpagpor": None,
                "facpordes": proforma.get("pedpordes", 0),
                "facdesglobal": proforma.get("peddesglobal", 0),
                "facdesdirecto": proforma.get("peddesdirecto", 0),
                "facrecargo": proforma.get("pedrecargo", 0),
                "seqcodigo": "000",
                "tipcodigo": datos_cliente["tipcodigo"],
                "pednumped": pednumped,
                "facnumero": secuencia_actual,
                "facporrec": proforma.get("pedporrec", 0),
                "facporiva": proforma.get("pedporiva", 0),
                "facvuelto": 0,
                "facvoucher": None,
                "facrecap": None,
                "facvalantici": 0,
                "forintmen": forma_pago["forintmen"],
                "facrecnc": 0,
                "facvalinter": 0,
                "tarjcodigo": None,
                "fordias": forma_pago["fordias"],
                "forcuotas": forma_pago["forcuotas"],
                "foraplianti": forma_pago["foraplianti"],
                "foranticipo": forma_pago["foranticipo"],
                "foraplirango": 0,
                "formondesde": 0,
                "formonhasta": 0,
                "forapligrac": 0,
                "fordiasgrac": 0,
                "forcuoinigr": 0,
                "facusuanti": None,
                "facfanv": None,
                "codcodigo": None,
                "adinumero": None,
                "facnumadi": 0,
                "facvaladi": 0,
                "reccodigo": None,
                "facorigen": None,
                "facrotdif": 0,
                "faccuotasdif": 0,
                "facgraciadif": 0,
                "tarciacod": None,
                "tarloccod": None,
                "tarclicod": None,
                "precodigo": None,
                "facvehi": 0,
                "reccodlegal": None,
                "facnumref": None,
                "tarnumero": None,
                "factitpro": 0,
                "fectitpro": None,
                "hortitpro": None,
                "usutitpro": None,
                "esttitpro": None,
                "facflaglegal": 0,
                "sriserie01": sriserie01,
                "sriserie02": sriserie02,
                "srisecini": secuencia_sri["srisecini"],
                "srisecfin": secuencia_sri["srisecfin"],
                "sriautfecemi": fecha_con_hora_cero,
                "sriautfecven": fecha_con_hora_cero,
                "sriautnumero": secuencia_sri["sriautnumero"],
                "audnumxml": None,
                "leccodigo": None,
                "integracodigo": "000",
                "proyectocodigo": "000",
                "facproyecto": 0,
                "facsolsinstock": 0,
                "facfecposent": None,
                "fachorposent": None,
                "forpromocion": forma_pago["forpromocion"],
                "fordescuento": forma_pago["fordescuento"],
                "facretiracliente": 0,
                "regcodigo": datos_cliente["regcodigo"],
                "ciucodigo": datos_cliente["ciucodigo"],
                "procodigo": datos_cliente["procodigo"],
                "fasrioritipo": None,
                "fasrioriserie01": None,
                "fasrioriserie02": None,
                "fasriorinumero": 0,
                "facelectronica": 1,
                "clinombre": datos_cliente["clinombre"],
                "cliruc": datos_cliente["cliruc"],
                "clidirec": datos_cliente["clidirec"],
                "cliemail": None,
                "ciaciaruc": datos_empresa["ciaruc"],
                "ciaciadescri": datos_empresa["ciasrirazon"],
                "ciaciadirec": datos_empresa["ciasridirmatriz"],
                "ciaciatelefono1": datos_empresa.get("ciatelefono1", ""),
                "ciaciaciudad": datos_empresa.get("ciaciudad", ""),
                "ciaciapais": datos_empresa.get("ciapais", ""),
                "locdescri": None,
                "locciadirec": datos_empresa.get("ciasridirmatriz", ""),
                "locciatelefono1": datos_empresa.get("ciatelefono1", ""),
                "locciaciudad": datos_empresa.get("ciaciudad", ""),
                "locciapais": datos_empresa.get("ciapais", ""),
                "cianumresolucion": datos_empresa.get("cianumresolucion", ""),
                "ciaobligadocon": 0,
                "numsolanusri": datos_empresa.get("numsolanusri", ""),
                "codctblesri": None,
            }

            connection.execute(text(sql_insert_cabecera), params_cabecera)

            # ========== PASO 7: INSERTAR DETALLES EN fatfac ==========
            sql_insert_detalle = """
                INSERT INTO fatfac (
                    ciacodigo, facnumfac, facsecuen, factipo, factippag, moncodigo,
                    faccambio, facfecemi, clicodigo, loccodigo, cliprecio, facstatus,
                    bodcodigo, invcodigo, artcodigo, precodigo, coscodigo, lincodigo,
                    vencodigo, zoncodigo, sercodigo, faccantidad, faccosto, faccostodol,
                    facpreven, facvalnc, faccantnc, facvaldesglo, facvaldesc, facvalrec,
                    faciva, facvaliva, facvalor, facvaltot, facfecisys, fachorisys,
                    facusuisys, facestisys, facfecmsys, fachormsys, facusumsys, facestmsys,
                    tipcodigo, facpordesc, facusudesc, pednumped, facnumero, tranumbco,
                    artaplipro, facvalinter, medcodigo, marcodigo, artpeso, artserie,
                    artservicio, artexpins, reccodigo, tarnumero, audnumxml, artfaccero,
                    integracodigo, proyectocodigo, faccantentregados, faccantporentregar,
                    facproyecto, facsolsinstock, facfecposent, facsecuenpedido,
                    porcumpcuotav, porcumpcuotaj, porcumplineav, porcomirentv, porcomirentj,
                    feccalcomiv, horcalcomiv, usucalcomiv, estcalcomiv, feccalcomij,
                    horcalcomij, usucalcomij, estcalcomij, stacalcomiv, stacalcomij,
                    jefecodigo, porlispre, porpreven, artdescri, faccostolcdcfac, faccostolcdcing
                ) VALUES (
                    :ciacodigo, :facnumfac, :facsecuen, :factipo, :factippag, :moncodigo,
                    :faccambio, :facfecemi, :clicodigo, :loccodigo, :cliprecio, :facstatus,
                    :bodcodigo, :invcodigo, :artcodigo, :precodigo, :coscodigo, :lincodigo,
                    :vencodigo, :zoncodigo, :sercodigo, :faccantidad, :faccosto, :faccostodol,
                    :facpreven, :facvalnc, :faccantnc, :facvaldesglo, :facvaldesc, :facvalrec,
                    :faciva, :facvaliva, :facvalor, :facvaltot, :facfecisys, :fachorisys,
                    :facusuisys, :facestisys, :facfecmsys, :fachormsys, :facusumsys, :facestmsys,
                    :tipcodigo, :facpordesc, :facusudesc, :pednumped, :facnumero, :tranumbco,
                    :artaplipro, :facvalinter, :medcodigo, :marcodigo, :artpeso, :artserie,
                    :artservicio, :artexpins, :reccodigo, :tarnumero, :audnumxml, :artfaccero,
                    :integracodigo, :proyectocodigo, :faccantentregados, :faccantporentregar,
                    :facproyecto, :facsolsinstock, :facfecposent, :facsecuenpedido,
                    :porcumpcuotav, :porcumpcuotaj, :porcumplineav, :porcomirentv, :porcomirentj,
                    :feccalcomiv, :horcalcomiv, :usucalcomiv, :estcalcomiv, :feccalcomij,
                    :horcalcomij, :usucalcomij, :estcalcomij, :stacalcomiv, :stacalcomij,
                    :jefecodigo, :porlispre, :porpreven, :artdescri, :faccostolcdcfac, :faccostolcdcing
                )
            """

            for i, detalle in enumerate(detalles_proforma):
                params_detalle = {
                    "ciacodigo": ciacodigo,
                    "facnumfac": facnumfac,
                    "facsecuen": i + 1,
                    "factipo": "FE",
                    "factippag": proforma["factippag"],
                    "moncodigo": proforma["moncodigo"],
                    "faccambio": 0,
                    "facfecemi": proforma["pedfecemi"],
                    "clicodigo": proforma["clicodigo"],
                    "loccodigo": loccodigo,
                    "cliprecio": detalle.get("cliprecio", 1),
                    "facstatus": "A",
                    "bodcodigo": detalle.get("bodcodigo", ""),
                    "invcodigo": detalle.get("invcodigo", ""),
                    "artcodigo": detalle["artcodigo"],
                    "precodigo": detalle.get("precodigo", ""),
                    "coscodigo": None,
                    "lincodigo": detalle["lincodigo"],
                    "vencodigo": proforma["vencodigo"],
                    "zoncodigo": datos_cliente["zoncodigo"],
                    "sercodigo": None,
                    "faccantidad": detalle["pedcantidad"],
                    "faccosto": detalle.get("pedcosto", 0),
                    "faccostodol": detalle.get("pedcostodol", 0),
                    "facpreven": detalle["pedpreven"],
                    "facvalnc": 0,
                    "faccantnc": 0,
                    "facvaldesglo": detalle.get("pedvaldesglo", 0),
                    "facvaldesc": detalle.get("pedvaldesc", 0),
                    "facvalrec": detalle.get("pedvalrec", 0),
                    "faciva": detalle["pediva"],
                    "facvaliva": detalle.get("pedvaliva", 0),
                    "facvalor": detalle.get("pedvalor", 0),
                    "facvaltot": detalle["pedvaltot"],
                    "facfecisys": fecha_con_hora_cero,
                    "fachorisys": fecha_formato_1900,
                    "facusuisys": usrcodigo,
                    "facestisys": ipUser,
                    "facfecmsys": fecha_con_hora_cero,
                    "fachormsys": fecha_formato_1900,
                    "facusumsys": usrcodigo,
                    "facestmsys": ipUser,
                    "tipcodigo": datos_cliente["tipcodigo"],
                    "facpordesc": detalle.get("pedpordesc", 0),
                    "facusudesc": usrcodigo if detalle.get("pedpordesc", 0) > 0 else "",
                    "pednumped": pednumped,
                    "facnumero": secuencia_actual,
                    "tranumbco": None,
                    "artaplipro": detalle.get("artaplipro", 0),
                    "facvalinter": detalle.get("pedvalinter", 0),
                    "medcodigo": detalle.get("medcodigo", ""),
                    "marcodigo": detalle.get("marcodigo", ""),
                    "artpeso": detalle.get("artpeso", 0),
                    "artserie": detalle.get("artserie", 0),
                    "artservicio": detalle.get("artservicio", 0),
                    "artexpins": detalle.get("artexpins", 0),
                    "reccodigo": None,
                    "tarnumero": None,
                    "audnumxml": None,
                    "artfaccero": detalle.get("artfaccero", 0),
                    "integracodigo": "000",
                    "proyectocodigo": "000",
                    "faccantentregados": 0,
                    "faccantporentregar": 0,
                    "facproyecto": 0,
                    "facsolsinstock": detalle.get("pedsolsinstock", 0),
                    "facfecposent": None,
                    "facsecuenpedido": detalle["pedsecuen"],
                    "porcumpcuotav": 0,
                    "porcumpcuotaj": 0,
                    "porcumplineav": 0,
                    "porcomirentv": 0,
                    "porcomirentj": 0,
                    "feccalcomiv": None,
                    "horcalcomiv": None,
                    "usucalcomiv": None,
                    "estcalcomiv": None,
                    "feccalcomij": None,
                    "horcalcomij": None,
                    "usucalcomij": None,
                    "estcalcomij": None,
                    "stacalcomiv": 0,
                    "stacalcomij": 0,
                    "jefecodigo": None,
                    "porlispre": 0,
                    "porpreven": 0,
                    "artdescri": detalle.get("artdescri", ""),
                    "faccostolcdcfac": 0,
                    "faccostolcdcing": 0,
                }

                connection.execute(text(sql_insert_detalle), params_detalle)

            # ========== PASO 8: ACTUALIZAR SECUENCIA SRI (+1) ==========
            update_secuencia = """
                UPDATE siactsriseries
                SET srisecact = :nueva_secuencia,
                    srifecmsys = :fecha,
                    sriusumsys = :usuario
                WHERE ciacodigo = :ciacodigo
                  AND sripreauto = 'E'
                  AND cjacodigo = '103'
                  AND srisecdoc = '01'
            """
            connection.execute(text(update_secuencia), {"nueva_secuencia": nueva_secuencia, "fecha": fecha_con_hora_cero, "usuario": usrcodigo, "ciacodigo": ciacodigo})

            # ========== PASO 9: ACTUALIZAR ESTADO PROFROMA P→F ==========
            update_proforma = """
                UPDATE facped
                SET pedstatus = 'F',
                    pedfecmsys = :fecha,
                    pedusumsys = :usuario
                WHERE ciacodigo = :ciacodigo
                  AND pednumped = :pednumped
                  AND loccodigo = :loccodigo
            """
            connection.execute(text(update_proforma), {"fecha": fecha_con_hora_cero, "usuario": usrcodigo, "ciacodigo": ciacodigo, "pednumped": pednumped, "loccodigo": loccodigo})

    # ========== PASO 10: CONSTRUIR PAYLOAD Y DEVOLVER ==========
    # Usar la secuencia actualizada
    secuencia_sri_actualizada = dict(secuencia_sri)
    secuencia_sri_actualizada["srisecact"] = secuencia_actual

    payload_sri = construir_payload_sri(proforma=proforma, detalles=detalles_proforma, secuencia_sri=secuencia_sri_actualizada, datos_empresa=datos_empresa, datos_cliente=datos_cliente, forma_pago=forma_pago, ciacodigo=ciacodigo, loccodigo=loccodigo, facnumfac=facnumfac)

    return {"success": True, "message": "Factura creada exitosamente. Payload listo para enviar al SRI.", "facnumfac": facnumfac, "pednumped": pednumped, "payload_sri": payload_sri}  # Este es el payload que mandarás a emisionFactura
