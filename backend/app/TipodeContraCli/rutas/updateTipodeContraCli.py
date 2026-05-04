from flask import request
from app.TipodeContraCli import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/updateTipodeContraCli", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updateTipodeContraCli():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        sCodCia = seleccion["cliciaciacodigo"]
    except KeyError:
        raise ValidationError("Error Crítico: No se pudo verificar la compañía para la modificación.")

    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar al usuario que intenta realizar la modificación.")

    # Ajustamos longitudes para cumplir con los varchar de tu tabla
    sUsuario = str(sUsuario)[:10]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr) or "FSOFTAPP"
    sNomEst = str(sNomEst)[:50]

    # 2. VALIDACIÓN DE PARÁMETROS Y REGLAS DE NEGOCIO
    data = request.get_json()
    codigo = data.get("concodigo")
    descri = data.get("condescri")
    frecuencia = data.get("confrecuencia")
    status = data.get("constatus", "A")

    if not codigo:
        raise ValidationError("El código de contrato es requerido para actualizar el registro.")

    if not descri or str(descri).strip() == "":
        raise ValidationError("La descripción del contrato es requerida.")

    # Regla de Negocio: Validar Frecuencias exactas
    frecuencias_validas = ["MENSUAL", "BIMESTRAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]
    frecuencia = str(frecuencia).strip().upper()

    if frecuencia not in frecuencias_validas:
        raise ValidationError(f"Frecuencia inválida. Debe ser una de las siguientes: {', '.join(frecuencias_validas)}")

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
                UPDATE cxcbtipcon SET
                    condescri = :des,
                    confrecuencia = :fre,
                    constatus = :sta,
                    confecmsys = :fec,
                    conhormsys = :hor,
                    conusumsys = :usu,
                    conestmsys = :est
                WHERE ciacodigo = :cia AND concodigo = :cod
            """
            )

            result = connection.execute(
                update_query,
                {
                    "cia": sCodCia,
                    "cod": str(codigo).strip().upper()[:3],
                    "des": str(descri).strip().upper()[:60],
                    "fre": frecuencia,
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
                raise ValidationError("No se encontró el Tipo de Contrato especificado o no pertenece a su compañía.")

    return {"data": "Tipo de Contrato actualizado con éxito"}
