from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.PresentacionesINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updatePresentacionesINV", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updatePresentacionesINV():
    # 1. Extracción de sesión y contexto de auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # 2. Lógica de separación de Fecha y Hora para auditoría en SQL Server
    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')

    data = request.get_json()

    # Identificadores de la Clave Primaria (Old para localizar el registro, New por si se edita el código)
    precodigo_old = data.get("precodigoOld", data.get("precodigo"))
    precodigo_new = data.get("precodigoNew", data.get("precodigo"))

    # Campos a actualizar según estructura de la tabla inbpre
    predescri = data.get("predescri")
    prestatus = data.get("prestatus", "A")

    # 3. Validaciones de integridad
    if not precodigo_old or not precodigo_new:
        raise ValidationError("El código de la presentación es requerido")
    if not predescri:
        raise ValidationError("La descripción de la presentación es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparación de parámetros con limpieza y truncado técnico
            # precodigo: varchar(2), predescri: varchar(30), preusumsys: varchar(10)
            data_update = {
                "ciacodigo": sCodCia,
                "precodigoOld": str(precodigo_old).strip().upper()[:2],
                "precodigoNew": str(precodigo_new).strip().upper()[:2],

                "predescri": str(predescri).strip().upper()[:30],
                "prestatus": str(prestatus).strip().upper()[:1],

                # Auditoría de Modificación (msys)
                "prefecmsys": fecha_pura,
                "prehormsys": hora_pura,
                "preusumsys": sUsuario[:10],
            }

            # 5. Sentencia SQL de actualización respetando la Clave Primaria Compuesta
            update_query = text(
                """
                UPDATE inbpre SET
                    precodigo = :precodigoNew,
                    predescri = :predescri,
                    prestatus = :prestatus,
                    prefecmsys = :prefecmsys,
                    prehormsys = :prehormsys,
                    preusumsys = :preusumsys
                WHERE ciacodigo = :ciacodigo
                  AND precodigo = :precodigoOld
            """
            )

            try:
                # 6. Ejecución con captura de errores de integridad
                connection.execute(update_query, data_update)
            except IntegrityError:
                raise ValidationError("No se puede actualizar la Presentación. Verifique que el nuevo código no exista ya o que no tenga registros vinculados.")

    return {"data": "Presentación de inventario actualizada exitosamente"}
