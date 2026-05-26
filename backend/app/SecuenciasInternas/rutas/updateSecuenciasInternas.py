from flask import request
from app.SecuenciasInternas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/updateSecuenciasInternas", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updateSecuenciasInternas():
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

    # Ajustamos longitudes para cumplir con los varchar de la tabla
    sUsuario = str(sUsuario)[:10]

    # 2. VALIDACIÓN DE PARÁMETROS (Llave compuesta + datos a modificar)
    data = request.get_json()
    locservidor = data.get("locservidor")
    seccodigo = data.get("seccodigo")
    secnumero = data.get("secnumero")
    secdescri = data.get("secdescri")

    if not locservidor or str(locservidor).strip() == "":
        raise ValidationError("El Local/Servidor es requerido para ubicar la secuencia a actualizar.")

    if not seccodigo or str(seccodigo).strip() == "":
        raise ValidationError("El código de secuencia es requerido para actualizar el registro.")

    if secnumero is None or str(secnumero).strip() == "":
        raise ValidationError("El número de secuencia es requerido.")

    try:
        secnumero = int(secnumero)
    except ValueError:
        raise ValidationError("El número de secuencia debe ser un valor numérico entero.")

    if not secdescri or str(secdescri).strip() == "":
        raise ValidationError("La descripción de la secuencia es requerida.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Tiempos de Auditoría
            now = datetime.now()
            fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
            hora_pura = now.strftime("1900-01-01 %H:%M:%S")

            # 3. ACTUALIZAR TABLA (Asegurando coincidencia exacta de llave primaria)
            update_query = text(
                """
                UPDATE siacsec SET
                    secnumero = :num,
                    secdescri = :des,
                    secfecmsys = :fec,
                    sechormsys = :hor,
                    secusumsys = :usu
                WHERE ciacodigo = :cia
                  AND locservidor = :loc
                  AND seccodigo = :cod
                """
            )

            result = connection.execute(
                update_query,
                {
                    "cia": sCodCia,
                    "loc": str(locservidor).strip().upper()[:1],
                    "cod": str(seccodigo).strip().upper()[:3],
                    "num": secnumero,
                    "des": str(secdescri).strip().upper()[:200],
                    "fec": fecha_pura,
                    "hor": hora_pura,
                    "usu": sUsuario,
                },
            )

            # Validar si realmente se actualizó algo
            if result.rowcount == 0:
                raise ValidationError("No se encontró la Secuencia Interna especificada o no pertenece a su compañía.")

    return {"data": "Secuencia Interna actualizada con éxito"}
