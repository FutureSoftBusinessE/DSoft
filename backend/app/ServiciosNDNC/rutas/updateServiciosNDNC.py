from flask import request
from app.ServiciosNDNC import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/updateServiciosNDNC", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updateServiciosNDNC():
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

    sUsuario = str(sUsuario)[:10]

    # 2. VALIDACIÓN DE PARÁMETROS Y REGLAS DE NEGOCIO
    data = request.get_json()

    codigo = data.get("sercodigo")
    serncnd = data.get("serncnd")
    descri = data.get("serdescri")
    status = data.get("serstatus", "A")
    aplica_iva = data.get("aplica_iva", False)
    formulario_autorizado = data.get("formulario_autorizado", False)

    if not codigo or str(codigo).strip() == "":
        raise ValidationError("El código de servicio es requerido para actualizar el registro.")

    if not serncnd or str(serncnd).strip() not in ["D", "C"]:
        raise ValidationError("Debe especificar un Tipo de Servicio válido (Débito o Crédito).")

    if not descri or str(descri).strip() == "":
        raise ValidationError("La descripción del servicio es requerida.")

    # Normalización de datos y límites
    codigo = str(codigo).strip().upper()[:3]
    serncnd = str(serncnd).strip().upper()[:1]
    descri = str(descri).strip().upper()[:40]
    status = str(status).strip().upper()[:1]

    # Conversión de Checkboxes (Booleanos a Numéricos)
    seriva = 1.0 if aplica_iva else 0.0
    serautor = 1 if formulario_autorizado else 0

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Tiempos de Auditoría (Estilo SIAC)
            now = datetime.now()
            fecha_cero = now.replace(hour=0, minute=0, second=0, microsecond=0)
            fecha_1900 = datetime(1900, 1, 1, now.hour, now.minute, now.second)

            # 3. ACTUALIZAR TABLA (Omitiendo pctacodigo y ttrcodigo para que conserven su valor original)
            update_query = text(
                """
                UPDATE cxcbser SET
                    serncnd = :ncnd,
                    serdescri = :des,
                    seriva = :iva,
                    serautor = :autor,
                    serstatus = :sta,
                    serfecmsys = :fec_msys,
                    serhormsys = :hor_msys,
                    serusumsys = :usu_msys
                WHERE ciacodigo = :cia AND sercodigo = :cod
                """
            )

            result = connection.execute(
                update_query,
                {
                    "cia": sCodCia,
                    "cod": codigo,
                    "ncnd": serncnd,
                    "des": descri,
                    "iva": seriva,
                    "autor": serautor,
                    "sta": status,
                    "fec_msys": fecha_cero,
                    "hor_msys": fecha_1900,
                    "usu_msys": sUsuario,
                },
            )

            # Validar si realmente se actualizó algo (Seguridad de capa de datos)
            if result.rowcount == 0:
                raise ValidationError("No se encontró el Servicio especificado o no pertenece a su compañía.")

    return {"data": "Servicio de Nota de Débito/Crédito actualizado con éxito"}
