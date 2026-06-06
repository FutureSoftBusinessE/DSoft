from flask import request
from app.SecuenciasDoc import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/updateSecuenciasDoc", methods=["POST"])
@jwt_required()
@api_endpoint
def updateSecuenciasDoc():
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

    # Ajustamos longitudes para cumplir con los varchar de auditoría
    sUsuario = str(sUsuario)[:10]

    # 2. VALIDACIÓN DE PARÁMETROS Y LLAVES
    data = request.get_json()

    # Llaves primarias necesarias para el WHERE
    anio = data.get("dptoanio")
    loccodigo = data.get("loccodigo")
    modcodigo = data.get("modcodigo")  # Corresponde a dptocodigo
    doccodigo = data.get("doccodigo")
    locservidor = data.get("locservidor", "A")

    # Único campo modificable
    numsec = data.get("dptonumsec")

    # Validaciones de presencia
    if not anio:
        raise ValidationError("El año es obligatorio para actualizar el registro.")
    if not loccodigo or str(loccodigo).strip() == "":
        raise ValidationError("La localidad es obligatoria para actualizar el registro.")
    if not modcodigo or str(modcodigo).strip() == "":
        raise ValidationError("El módulo es obligatorio para actualizar el registro.")
    if not doccodigo or str(doccodigo).strip() == "":
        raise ValidationError("El código de documento es obligatorio para actualizar el registro.")
    if numsec is None or str(numsec).strip() == "":
        raise ValidationError("El nuevo número de secuencia es obligatorio.")

    # Normalización y casteo
    try:
        anio = int(anio)
    except ValueError:
        raise ValidationError("El año debe ser un valor numérico.")

    try:
        numsec = float(numsec)
    except ValueError:
        raise ValidationError("El número de secuencia debe ser un valor numérico.")

    loccodigo = str(loccodigo).strip().upper()[:2]
    dptocodigo = str(modcodigo).strip().upper()[:3]
    doccodigo = str(doccodigo).strip().upper()[:3]
    locservidor = str(locservidor).strip().upper()[:1]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Tiempos de Auditoría
            now = datetime.now()
            fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
            hora_pura = now.strftime("1900-01-01 %H:%M:%S")

            # 3. ACTUALIZAR TABLA (Solo secuencia y logs de modificación)
            update_query = text(
                """
                UPDATE cgpdpto SET
                    dptonumsec = :sec,
                    dptofecmsys = :fec,
                    dptohormsys = :hor,
                    dptousumsys = :usu
                WHERE ciacodigo = :cia
                  AND dptoanio = :anio
                  AND dptocodigo = :dpto
                  AND loccodigo = :loc
                  AND doccodigo = :doc
                  AND locservidor = :serv
                """
            )

            result = connection.execute(
                update_query,
                {
                    "cia": sCodCia,
                    "anio": anio,
                    "dpto": dptocodigo,
                    "loc": loccodigo,
                    "doc": doccodigo,
                    "serv": locservidor,
                    "sec": numsec,
                    "fec": fecha_pura,
                    "hor": hora_pura,
                    "usu": sUsuario,
                },
            )

            # Validar si realmente se actualizó algo (evita "falsos positivos" si la llave no existe)
            if result.rowcount == 0:
                raise ValidationError("No se encontró la secuencia especificada o no pertenece a su compañía.")

    return {"data": "Secuencia de documento actualizada con éxito"}
