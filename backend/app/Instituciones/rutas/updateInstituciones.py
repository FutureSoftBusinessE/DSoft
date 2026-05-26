from flask import request
from app.Instituciones import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/updateInstituciones", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updateInstituciones():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        # No se extrae 'cliciaciacodigo' por ser un catálogo global
    except KeyError:
        raise ValidationError("Error Crítico: No se pudo verificar la base de datos para la modificación.")

    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar al usuario que intenta realizar la modificación.")

    # Ajustamos longitudes para cumplir con los varchar de la tabla gdocbinstituciones
    sUsuario = str(sUsuario)[:10]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr) or "FSOFTAPP"
    sNomEst = str(sNomEst)[:40]

    # 2. VALIDACIÓN DE PARÁMETROS
    data = request.get_json()
    codigo = data.get("insticodigo")
    descri = data.get("instidescri")
    status = data.get("instistatus", "A")

    if not codigo or str(codigo).strip() == "":
        raise ValidationError("El código de la Institución es requerido para actualizar el registro.")

    if not descri or str(descri).strip() == "":
        raise ValidationError("La descripción de la Institución es requerida.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Tiempos de Auditoría
            now = datetime.now()
            fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
            hora_pura = now.strftime("1900-01-01 %H:%M:%S")

            # 3. ACTUALIZAR TABLA (Respetando los isys y actualizando solo los msys)
            update_query = text(
                """
                UPDATE gdocbinstituciones SET
                    instidescri = :des,
                    instistatus = :sta,
                    instifecmsys = :fec,
                    instihormsys = :hor,
                    instiusumsys = :usu,
                    instiestmsys = :est
                WHERE insticodigo = :cod
                """
            )

            result = connection.execute(
                update_query,
                {
                    "cod": str(codigo).strip().upper()[:3],
                    "des": str(descri).strip().upper()[:60],
                    "sta": str(status).strip().upper()[:1],
                    # Solo se actualizan los campos de modificación
                    "fec": fecha_pura,
                    "hor": hora_pura,
                    "usu": sUsuario,
                    "est": sNomEst,
                },
            )

            # Validar si realmente se actualizó algo
            if result.rowcount == 0:
                raise ValidationError("No se encontró la Institución especificada.")

    return {"data": "Institución actualizada con éxito"}
