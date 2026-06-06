from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.TiposCliente import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updateTiposCliente", methods=["POST"])
@jwt_required()
@api_endpoint
def updateTiposCliente():
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
    tipcodigo_old = data.get("tipcodigoOld", data.get("tipcodigo"))
    tipcodigo_new = data.get("tipcodigoNew", data.get("tipcodigo"))

    # Campos a actualizar según estructura de la tabla cxcbtipcli
    tipdescri = data.get("tipdescri")
    tipcobdir = data.get("tipcobdir", 0)
    tipstatus = data.get("tipstatus", "A")
    tipdefacr = data.get("tipdefacr", 0)

    # 3. Validaciones de integridad
    if not tipcodigo_old or not tipcodigo_new:
        raise ValidationError("El código del tipo de cliente es requerido")
    if not tipdescri:
        raise ValidationError("La descripción del tipo de cliente es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparación de parámetros con limpieza y truncado técnico
            # tipcodigo: varchar(3), tipdescri: varchar(40), tipusumsys: varchar(10)
            data_update = {
                "ciacodigo": sCodCia,
                "tipcodigoOld": str(tipcodigo_old).strip().upper()[:3],
                "tipcodigoNew": str(tipcodigo_new).strip().upper()[:3],
                "tipdescri": str(tipdescri).strip().upper()[:40],
                "tipcobdir": int(tipcobdir),
                "tipstatus": str(tipstatus).strip().upper()[:1],
                "tipdefacr": float(tipdefacr),
                # Auditoría de Modificación (msys)
                "tipfecmsys": fecha_pura,
                "tiphormsys": hora_pura,
                "tipusumsys": sUsuario[:10],
            }

            # 5. Sentencia SQL de actualización respetando la Clave Primaria Compuesta
            update_query = text(
                """
                UPDATE cxcbtipcli SET
                    tipcodigo = :tipcodigoNew,
                    tipdescri = :tipdescri,
                    tipcobdir = :tipcobdir,
                    tipstatus = :tipstatus,
                    tipdefacr = :tipdefacr,
                    tipfecmsys = :tipfecmsys,
                    tiphormsys = :tiphormsys,
                    tipusumsys = :tipusumsys
                WHERE ciacodigo = :ciacodigo
                  AND tipcodigo = :tipcodigoOld
            """
            )

            try:
                # 6. Ejecución con captura de errores de integridad
                connection.execute(update_query, data_update)
            except IntegrityError:
                raise ValidationError("No se puede actualizar el Tipo de Cliente. Verifique que el nuevo código no exista ya o que no tenga registros vinculados.")

    return {"data": "Tipo de Cliente actualizado exitosamente"}
