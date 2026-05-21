from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.MarcasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updateMarcasINV", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updateMarcasINV():
    # 1. Extracción de sesión y contexto de auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # 2. Lógica de separación de Fecha y Hora para auditoría en SQL Server
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()
    # Identificadores de la Clave Primaria (Old para localizar el registro, New por si se edita el código)
    marcodigo_old = data.get("marcodigoOld", data.get("marcodigo"))
    marcodigo_new = data.get("marcodigoNew", data.get("marcodigo"))
    # Campos a actualizar según la estructura varchar(30) y varchar(1)
    mardescri = data.get("mardescri")
    marstatus = data.get("marstatus", "A")

    # 3. Validaciones de integridad
    if not marcodigo_old or not marcodigo_new:
        raise ValidationError("El código de la marca es requerido")
    if not mardescri:
        raise ValidationError("La descripción de la marca es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparación de parámetros con limpieza y truncado según la tabla inbmar
            # marcodigo: varchar(5), mardescri: varchar(30), marusumsys: varchar(10)
            data_update = {
                "ciacodigo": sCodCia,
                "marcodigoOld": str(marcodigo_old).strip().upper()[:5],
                "marcodigoNew": str(marcodigo_new).strip().upper()[:5],
                "mardescri": str(mardescri).strip().upper()[:30],
                "marstatus": str(marstatus).strip().upper()[:1],
                # Auditoría de Modificación (msys)
                "marfecmsys": fecha_pura,
                "marhormsys": hora_pura,
                "marusumsys": sUsuario[:10],
            }

            # 5. Sentencia SQL de actualización respetando la Clave Primaria Compuesta
            update_query = text(
                """
                UPDATE inbmar SET
                    marcodigo = :marcodigoNew,
                    mardescri = :mardescri,
                    marstatus = :marstatus,
                    marfecmsys = :marfecmsys,
                    marhormsys = :marhormsys,
                    marusumsys = :marusumsys
                WHERE ciacodigo = :ciacodigo
                  AND marcodigo = :marcodigoOld
            """
            )

            try:
                # 6. Ejecución con captura de errores de integridad (Duplicados o FK)
                connection.execute(update_query, data_update)
            except IntegrityError:
                raise ValidationError("No se puede actualizar la Marca. Verifique que el nuevo código no exista ya o que no tenga registros vinculados.")

    return {"data": "Marca de inventario actualizada exitosamente"}
