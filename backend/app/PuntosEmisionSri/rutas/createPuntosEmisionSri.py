from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.PuntosEmisionSri import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createPuntosEmisionSri", methods=["POST"])
@jwt_required()
@api_endpoint
def createPuntosEmisionSri():
    # 1. Extracción de sesión y auditoría
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = str(claims["seleccion"]["cliciaciacodigo"]).strip()[:2]
    sUsuario = str(claims.get("user", "WEB")).strip()[:10]
    sNomEst = str(request.headers.get("X-Forwarded-For", request.remote_addr) or "WEB").strip()[:30]

    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()

    # 2. Extracción de parámetros enviados por el Frontend
    cjacodigo = str(data.get("cjacodigo", "")).strip().upper()[:3]
    cjadescri = str(data.get("cjadescri", "")).strip().upper()[:40]
    loccodigo = str(data.get("loccodigo", "")).strip().upper()[:2]

    sripreauto = str(data.get("sripreauto", "")).strip().upper()[:1]
    sriautnumero = data.get("sriautnumero")

    # Establecimiento
    sriserie01 = str(data.get("sriserie01", "")).strip().zfill(3)
    # Punto Emisión
    sriserie02 = str(data.get("sriserie02", "")).strip().zfill(3)
    # Las secuencias configuradas en la grilla
    detalles = data.get("detalles", [])

    # 3. Validaciones iniciales
    if not cjacodigo or not cjadescri:
        raise ValidationError("Código y Descripción de la caja son obligatorios.")
    if not loccodigo:
        raise ValidationError("Debe seleccionar una Localidad.")
    if not sripreauto or sriautnumero is None:
        raise ValidationError("Debe seleccionar un Número de Autorización.")
    if len(sriserie01) != 3 or len(sriserie02) != 3:
        raise ValidationError("El Establecimiento y Punto de Emisión deben tener 3 dígitos.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # A. Validar que no exista la caja (fapcaja PK)
            check_caja = connection.execute(text("SELECT cjacodigo FROM fapcaja WHERE ciacodigo = :cia AND cjacodigo = :cja"), {"cia": sCodCia, "cja": cjacodigo}).fetchone()
            if check_caja:
                raise ValidationError(f"La Caja con código '{cjacodigo}' ya existe.")

            # B. Validar que no exista la serie SRI (siaccsriseries PK)
            check_serie = connection.execute(
                text(
                    """SELECT sriautnumero FROM siaccsriseries
                        WHERE ciacodigo = :cia AND sripreauto = :pre AND sriautnumero = :num
                        AND sriserie01 = :s1 AND sriserie02 = :s2"""
                ),
                {"cia": sCodCia, "pre": sripreauto, "num": sriautnumero, "s1": sriserie01, "s2": sriserie02},
            ).fetchone()
            if check_serie:
                raise ValidationError(f"La serie {sriserie01}-{sriserie02} ya está registrada para esta autorización.")

            # C. Obtener metadatos de la autorización seleccionada (siacsrinumero)
            auth_meta = (
                connection.execute(
                    text(
                        """SELECT sritramite, sriautfecemi, sriautfecven, sriautnumeroold
                        FROM siacsrinumero
                        WHERE ciacodigo = :cia AND sripreauto = :pre AND sriautnumero = :num"""
                    ),
                    {"cia": sCodCia, "pre": sripreauto, "num": sriautnumero},
                )
                .mappings()
                .fetchone()
            )

            if not auth_meta:
                raise ValidationError("La Autorización seleccionada no se encuentra en la base de datos.")

            # =========================================================================
            # INSERT 1: fapcaja (Cabecera de Cajas)
            # =========================================================================
            insert_caja = text(
                """
                INSERT INTO fapcaja (
                    ciacodigo, cjacodigo, cjadescri, loccodigo, cjastatus,
                    cjafecisys, cjahorisys, cjausuisys, cjaestisys,
                    cjafecmsys, cjahormsys, cjausumsys, cjaestmsys
                    -- Los demás campos tomarán su valor DEFAULT desde SQL Server
                ) VALUES (
                    :ciacodigo, :cjacodigo, :cjadescri, :loccodigo, 'A',
                    :fecisys, :horisys, :usuisys, :estisys,
                    :fecmsys, :hormsys, :usumsys, :estmsys
                )
            """
            )
            connection.execute(
                insert_caja, {"ciacodigo": sCodCia, "cjacodigo": cjacodigo, "cjadescri": cjadescri, "loccodigo": loccodigo, "fecisys": fecha_pura, "horisys": hora_pura, "usuisys": sUsuario, "estisys": sNomEst, "fecmsys": fecha_pura, "hormsys": hora_pura, "usumsys": sUsuario, "estmsys": sNomEst}
            )

            # =========================================================================
            # INSERT 2: fatcaja (Relación Caja - Autorización)
            # =========================================================================
            insert_fatcaja = text(
                """
                INSERT INTO fatcaja (
                    ciacodigo, cjacodigo, sripreauto, sriautnumero,
                    cjafecisys, cjahorisys, cjausuisys, cjaestisys,
                    cjafecmsys, cjahormsys, cjausumsys, cjaestmsys
                ) VALUES (
                    :ciacodigo, :cjacodigo, :sripreauto, :sriautnumero,
                    :fecisys, :horisys, :usuisys, :estisys,
                    :fecmsys, :hormsys, :usumsys, :estmsys
                )
            """
            )
            connection.execute(
                insert_fatcaja,
                {"ciacodigo": sCodCia, "cjacodigo": cjacodigo, "sripreauto": sripreauto, "sriautnumero": sriautnumero, "fecisys": fecha_pura, "horisys": hora_pura, "usuisys": sUsuario, "estisys": sNomEst, "fecmsys": fecha_pura, "hormsys": hora_pura, "usumsys": sUsuario, "estmsys": sNomEst},
            )

            # =========================================================================
            # INSERT 3: siaccsriseries (Cabecera de Series SRI)
            # =========================================================================
            insert_siacc = text(
                """
                INSERT INTO siaccsriseries (
                    ciacodigo, sripreauto, sriautnumero, sritramite, sriserie01, sriserie02,
                    sriautfecemi, sriautfecven, sriautnumeroold, cjacodigo,
                    srifecisys, srihorisys, sriusuisys, sriestisys, sriverisys,
                    srifecmsys, srihormsys, sriusumsys, sriestmsys, srivermsys
                ) VALUES (
                    :ciacodigo, :sripreauto, :sriautnumero, :sritramite, :sriserie01, :sriserie02,
                    :sriautfecemi, :sriautfecven, :sriautnumeroold, :cjacodigo,
                    :fecisys, :horisys, :usuisys, :estisys, '',
                    :fecmsys, :hormsys, :usumsys, :estmsys, ''
                )
            """
            )
            connection.execute(
                insert_siacc,
                {
                    "ciacodigo": sCodCia,
                    "sripreauto": sripreauto,
                    "sriautnumero": sriautnumero,
                    "sritramite": auth_meta["sritramite"],
                    "sriserie01": sriserie01,
                    "sriserie02": sriserie02,
                    "sriautfecemi": auth_meta["sriautfecemi"],
                    "sriautfecven": auth_meta["sriautfecven"],
                    "sriautnumeroold": auth_meta["sriautnumeroold"],
                    "cjacodigo": cjacodigo,
                    "fecisys": fecha_pura,
                    "horisys": hora_pura,
                    "usuisys": sUsuario,
                    "estisys": sNomEst,
                    "fecmsys": fecha_pura,
                    "hormsys": hora_pura,
                    "usumsys": sUsuario,
                    "estmsys": sNomEst,
                },
            )

            # =========================================================================
            # INSERT 4: siactsriseries (Detalle de Documentos Fijos)
            # =========================================================================
            # Documentos fijos requeridos por el sistema
            docs_fijos = [
                {"sec": "01", "desc": "Factura"},
                {"sec": "03", "desc": "Liquidación de compra de Bienes o Prestación de servicio"},
                {"sec": "04", "desc": "Nota de Crédito"},
                {"sec": "05", "desc": "Nota de Débito"},
                {"sec": "06", "desc": "Guía de Remisión"},
                {"sec": "07", "desc": "Comprobante de Retención"},
            ]

            insert_siact = text(
                """
                INSERT INTO siactsriseries (
                    ciacodigo, sripreauto, sriautnumero, sritramite, sriserie01, sriserie02,
                    srisecdoc, sridestipo, srisecini, srisecfin, srisecact,
                    sriautfecemi, sriautfecven, sriautnumeroold, cjacodigo,
                    srifecisys, srihorisys, sriusuisys, sriestisys, sriverisys,
                    srifecmsys, srihormsys, sriusumsys, sriestmsys, srivermsys
                ) VALUES (
                    :ciacodigo, :sripreauto, :sriautnumero, :sritramite, :sriserie01, :sriserie02,
                    :srisecdoc, :sridestipo, :srisecini, :srisecfin, :srisecact,
                    :sriautfecemi, :sriautfecven, :sriautnumeroold, :cjacodigo,
                    :fecisys, :horisys, :usuisys, :estisys, '',
                    :fecmsys, :hormsys, :usumsys, :estmsys, ''
                )
            """
            )

            for doc in docs_fijos:
                # Regla de Negocio: Si es 'E' (Electrónica) la secuencia final es siempre 999999999
                if sripreauto == "E":
                    sec_fin = 999999999
                else:
                    # Buscamos si el frontend mandó una secuencia final para este tipo de documento
                    match = next((item for item in detalles if str(item.get("srisecdoc")) == doc["sec"]), None)
                    sec_fin = int(match["srisecfin"]) if match and match.get("srisecfin") else 0

                connection.execute(
                    insert_siact,
                    {
                        "ciacodigo": sCodCia,
                        "sripreauto": sripreauto,
                        "sriautnumero": sriautnumero,
                        "sritramite": auth_meta["sritramite"],
                        "sriserie01": sriserie01,
                        "sriserie02": sriserie02,
                        "srisecdoc": doc["sec"],
                        "sridestipo": str(doc["desc"])[:100],
                        "srisecini": 1,
                        "srisecfin": sec_fin,
                        "srisecact": 0,
                        "sriautfecemi": auth_meta["sriautfecemi"],
                        "sriautfecven": auth_meta["sriautfecven"],
                        "sriautnumeroold": auth_meta["sriautnumeroold"],
                        "cjacodigo": cjacodigo,
                        "fecisys": fecha_pura,
                        "horisys": hora_pura,
                        "usuisys": sUsuario,
                        "estisys": sNomEst,
                        "fecmsys": fecha_pura,
                        "hormsys": hora_pura,
                        "usumsys": sUsuario,
                        "estmsys": sNomEst,
                    },
                )

    return {"data": f"Punto de Emisión {sriserie01}-{sriserie02} creado y enlazado a la caja '{cjacodigo}' exitosamente."}
