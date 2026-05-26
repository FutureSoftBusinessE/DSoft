from flask import request
from app.TipoDeCredenciales import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/updateTipoDeCredenciales", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updateTipoDeCredenciales():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
    except KeyError:
        raise ValidationError("Error de Seguridad: Sesión incompleta.")

    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar el usuario en la sesión actual.")

    # Ajustes de longitud para cumplir con los varchar de la tabla
    sUsuario = str(sUsuario)[:10]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr) or "FSOFTAPP"
    sNomEst = str(sNomEst)[:40]

    # 2. VALIDACIÓN DE PARÁMETROS
    data = request.get_json()
    codigo = data.get("clacodigo")
    descri = data.get("cladescri")
    status = data.get("clastatus", "A")

    if not codigo or str(codigo).strip() == "":
        raise ValidationError("El código es obligatorio para actualizar.")

    if not descri or str(descri).strip() == "":
        raise ValidationError("La descripción es obligatoria.")

    # Tiempos de modificación
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    # 3. CONEXIÓN Y ACTUALIZACIÓN
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            update_query = text(
                """
                UPDATE gdocbTipoClaves SET
                    cladescri = :des,
                    clastatus = :sta,
                    clafecmsys = :fec,
                    clahormsys = :hor,
                    clausumsys = :usu,
                    claestmsys = :est
                WHERE clacodigo = :cod
                """
            )

            result = connection.execute(
                update_query,
                {
                    "cod": str(codigo).strip().upper()[:3],
                    "des": str(descri).strip().upper()[:60],
                    "sta": str(status).strip().upper()[:1],
                    "fec": fecha_pura,
                    "hor": hora_pura,
                    "usu": sUsuario,
                    "est": sNomEst,
                },
            )

            if result.rowcount == 0:
                raise ValidationError("No se encontró el Tipo de Credencial especificado.")

    return {"data": "Tipo de Credencial actualizado exitosamente"}
