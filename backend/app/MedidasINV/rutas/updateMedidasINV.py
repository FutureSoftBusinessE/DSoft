from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.MedidasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updateMedidasINV", methods=["POST"])
@jwt_required()
@api_endpoint
def updateMedidasINV():
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
    medcodigo_old = data.get("medcodigoOld", data.get("medcodigo"))
    medcodigo_new = data.get("medcodigoNew", data.get("medcodigo"))
    # Campos a actualizar según estructura varchar(30) y varchar(1)
    meddescri = data.get("meddescri")
    medstatus = data.get("medstatus", "A")

    # 3. Validaciones de integridad
    if not medcodigo_old or not medcodigo_new:
        raise ValidationError("El código de la unidad de medida es requerido")
    if not meddescri:
        raise ValidationError("La descripción de la medida es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparación de parámetros con limpieza y truncado según la tabla inbmed
            # medcodigo: varchar(3), meddescri: varchar(30), medusumsys: varchar(10)
            data_update = {
                "ciacodigo": sCodCia,
                "medcodigoOld": str(medcodigo_old).strip().upper()[:3],
                "medcodigoNew": str(medcodigo_new).strip().upper()[:3],
                "meddescri": str(meddescri).strip().upper()[:30],
                "medstatus": str(medstatus).strip().upper()[:1],
                # Auditoría de Modificación (msys)
                "medfecmsys": fecha_pura,
                "medhormsys": hora_pura,
                "medusumsys": sUsuario[:10],
            }

            # 5. Sentencia SQL de actualización respetando la Clave Primaria Compuesta
            update_query = text(
                """
                UPDATE inbmed SET
                    medcodigo = :medcodigoNew,
                    meddescri = :meddescri,
                    medstatus = :medstatus,
                    medfecmsys = :medfecmsys,
                    medhormsys = :medhormsys,
                    medusumsys = :medusumsys
                WHERE ciacodigo = :ciacodigo
                  AND medcodigo = :medcodigoOld
            """
            )

            try:
                # 6. Ejecución con captura de errores de integridad (Duplicados o FK)
                connection.execute(update_query, data_update)
            except IntegrityError:
                raise ValidationError("No se puede actualizar la Unidad de Medida. Verifique que el nuevo código no exista ya o que no tenga registros vinculados.")

    return {"data": "Unidad de Medida actualizada exitosamente"}
