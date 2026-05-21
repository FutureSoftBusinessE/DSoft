from flask import request
from app.AutorizacionesSri import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/updateAutorizacionesSri", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updateAutorizacionesSri():
    claims = get_jwt()
    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        sCodCia = str(seleccion["cliciaciacodigo"]).strip()[:2]
    except KeyError:
        raise ValidationError("Error Crítico: No se pudo verificar la compañía para la modificación.")

    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar al usuario que intenta realizar la modificación.")
    # Ajustes de longitud para auditoría
    sUsuario = str(sUsuario)[:10]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr) or "FSOFTAPP"
    sNomEst = str(sNomEst)[:50]

    # 2. VALIDACIÓN DE PARÁMETROS DEL FRONTEND
    data = request.get_json()
    # Llaves primarias (Intocables)
    sripreauto = str(data.get("sripreauto", "")).strip().upper()[:1]
    sriautnumero = data.get("sriautnumero")
    # Campos a modificar
    sriautfecemi = data.get("sriautfecemi")
    sriautfecven = data.get("sriautfecven")
    if not sripreauto or sripreauto not in ["A", "P", "E"]:
        raise ValidationError("El tipo de autorización es inválido o no fue enviado.")
    if sriautnumero is None or float(sriautnumero) <= 0:
        raise ValidationError("El Número de Autorización es obligatorio para actualizar el registro.")
    if not sriautfecven:
        raise ValidationError("La fecha de caducidad ('Caduca en') es obligatoria.")
    # Regla de Negocio: Si no es electrónica, se exige también la fecha de inicio
    if sripreauto != "E" and not sriautfecemi:
        raise ValidationError("La fecha de inicio ('Válido desde') es obligatoria para este tipo de autorización.")
    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Tiempos de Auditoría
            now = datetime.now()
            fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
            hora_pura = now.strftime("1900-01-01 %H:%M:%S")

            # 3. ACTUALIZAR TABLA CON LÓGICA CONDICIONAL DE NEGOCIO
            if sripreauto == "E":
                # Electrónica: SOLO se actualiza la fecha de caducidad
                update_query = text(
                    """
                    UPDATE siacsrinumero SET
                        sriautfecven = :ven,
                        srifecmsys = :fec,
                        srihormsys = :hor,
                        sriusumsys = :usu,
                        sriestmsys = :est
                    WHERE ciacodigo = :cia AND sripreauto = :preauto AND sriautnumero = :autnum
                """
                )
                params = {"cia": sCodCia, "preauto": sripreauto, "autnum": float(sriautnumero), "ven": sriautfecven, "fec": fecha_pura, "hor": hora_pura, "usu": sUsuario, "est": sNomEst}
            else:
                # PreImpresa o AutoImpresores: Se actualizan AMBAS fechas
                update_query = text(
                    """
                    UPDATE siacsrinumero SET
                        sriautfecemi = :emi,
                        sriautfecven = :ven,
                        srifecmsys = :fec,
                        srihormsys = :hor,
                        sriusumsys = :usu,
                        sriestmsys = :est
                    WHERE ciacodigo = :cia AND sripreauto = :preauto AND sriautnumero = :autnum
                """
                )
                params = {"cia": sCodCia, "preauto": sripreauto, "autnum": float(sriautnumero), "emi": sriautfecemi, "ven": sriautfecven, "fec": fecha_pura, "hor": hora_pura, "usu": sUsuario, "est": sNomEst}
            result = connection.execute(update_query, params)

            # 4. Validar si realmente se actualizó algo
            if result.rowcount == 0:
                raise ValidationError("No se encontró la Autorización SRI especificada o no pertenece a su compañía.")

    return {"data": "Autorización SRI actualizada con éxito."}
