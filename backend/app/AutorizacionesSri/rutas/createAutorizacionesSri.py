from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.AutorizacionesSri import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createAutorizacionesSri", methods=["POST"])
@jwt_required()
@api_endpoint
def createAutorizacionesSri():
    # 1. Extracción de sesión y contexto de auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = str(claims["seleccion"]["cliciaciacodigo"]).strip()[:2]
    sUsuario = str(claims.get("user", "WEB")).strip()[:10]
    sNomEst = str(request.headers.get("X-Forwarded-For", request.remote_addr) or "WEB").strip()[:50]

    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()

    # 2. Extracción y Normalización de Parámetros del Frontend
    # sripreauto: A = AutoImpresores, P = PreImpresa, E = Electrónica
    sripreauto = str(data.get("sripreauto", "E")).strip().upper()[:1]
    sritramite = int(data.get("sritramite", 6))
    sriautnumeroold = int(data.get("sriautnumeroold", 0))
    sriautfecemi = data.get("sriautfecemi")

    # 3. Lógica Fuerte de VB6: Forzar valores si es Electrónica
    if sripreauto == "E":
        sriautnumero = 9999999999
        sriautfecven = "2100-12-31 00:00:00"
    else:
        sriautnumero = int(data.get("sriautnumero", 0))
        sriautfecven = data.get("sriautfecven")

    # 4. Validaciones Estrictas
    if sripreauto not in ["A", "P", "E"]:
        raise ValidationError("Tipo de autorización inválido. Seleccione AutoImpresores, PreImpresa o Electrónica.")
    if sriautnumero <= 0:
        raise ValidationError("El Número de Autorización es obligatorio y debe ser mayor a cero.")
    if not sriautfecemi or not sriautfecven:
        raise ValidationError("Las fechas 'Válido desde' y 'Caduca en' son obligatorias.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 5. Validar Integridad de Llave Primaria (PK_siacsrinumero)
            sql_check = text(
                """
                SELECT sriautnumero
                FROM siacsrinumero
                WHERE ciacodigo = :cia AND sripreauto = :preauto AND sriautnumero = :autnum
            """
            )
            existe = connection.execute(sql_check, {"cia": sCodCia, "preauto": sripreauto, "autnum": sriautnumero}).fetchone()

            if existe:
                tipo_desc = "Electrónica" if sripreauto == "E" else ("PreImpresa" if sripreauto == "P" else "AutoImpresores")
                raise ValidationError(f"El número de autorización {sriautnumero} ya se encuentra registrado para el tipo {tipo_desc}.")

            # 6. Inserción en Base de Datos (siacsrinumero)
            insert_sql = text(
                """
                INSERT INTO siacsrinumero (
                    ciacodigo, sripreauto, sriautnumero, sritramite, sriautnumeroold,
                    sriautfecemi, sriautfecven, sritramitexml, sriultimotramite,
                    srifecisys, srihorisys, sriusuisys, sriestisys,
                    srifecmsys, srihormsys, sriusumsys, sriestmsys
                ) VALUES (
                    :ciacodigo, :sripreauto, :sriautnumero, :sritramite, :sriautnumeroold,
                    :sriautfecemi, :sriautfecven, 0, 0,
                    :fecisys, :horisys, :usuisys, :estisys,
                    :fecmsys, :hormsys, :usumsys, :estmsys
                )
            """
            )

            connection.execute(
                insert_sql,
                {
                    "ciacodigo": sCodCia,
                    "sripreauto": sripreauto,
                    "sriautnumero": sriautnumero,
                    "sritramite": sritramite,
                    "sriautnumeroold": sriautnumeroold,
                    "sriautfecemi": sriautfecemi,
                    "sriautfecven": sriautfecven,
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
    return {"data": f"Autorización SRI {sriautnumero} registrada exitosamente."}
