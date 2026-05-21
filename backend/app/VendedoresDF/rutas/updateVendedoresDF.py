from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.VendedoresDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updateVendedoresDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updateVendedoresDF():
    # 1. Extracción de sesión y contexto de auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora para auditoría en SQL Server
    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')

    data = request.get_json()

    # Identificadores de la Clave Primaria (Old para localizar, New por si se edita el código)
    vencodigo_old = data.get("vencodigoOld", data.get("vencodigo"))
    vencodigo_new = data.get("vencodigoNew", data.get("vencodigo"))

    # Campos a actualizar según estructura de la tabla fapvendedor
    vennombre = data.get("vennombre")
    vendireccion = data.get("vendireccion", "")
    ventelefono = data.get("ventelefono", "")
    vencomision = data.get("vencomision", 0)
    ventipcom = data.get("ventipcom", "P")
    venaplica = data.get("venaplica", "S")
    venstatus = data.get("venstatus", "A")
    usrcodigo = data.get("usrcodigo")
    vencomisiona = data.get("vencomisiona", 0)
    emcodemp = data.get("emcodemp")
    loccodigo = data.get("loccodigo", "01")

    # 3. Validaciones de integridad
    if not vencodigo_old or not vencodigo_new:
        raise ValidationError("El código del vendedor es requerido")
    if not vennombre:
        raise ValidationError("El nombre del vendedor es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparación de parámetros con limpieza y truncado técnico según fapvendedor
            data_update = {
                "ciacodigo": sCodCia,
                "vencodigoOld": str(vencodigo_old).strip().upper()[:3],
                "vencodigoNew": str(vencodigo_new).strip().upper()[:3],

                "vennombre": str(vennombre).strip().upper()[:30],
                "vendireccion": str(vendireccion).strip().upper()[:40],
                "ventelefono": str(ventelefono).strip()[:15],
                "vencomision": float(vencomision),
                "ventipcom": str(ventipcom).strip().upper()[:1],
                "venaplica": str(venaplica).strip().upper()[:1],
                "venstatus": str(venstatus).strip().upper()[:1],

                "usrcodigo": str(usrcodigo).strip()[:10] if usrcodigo else None,
                "vencomisiona": int(vencomisiona),
                "emcodemp": str(emcodemp).strip()[:10] if emcodemp else None,
                "loccodigo": str(loccodigo).strip()[:2],

                # Auditoría de Modificación (msys)
                "venfecmsys": fecha_pura,
                "venhormsys": hora_pura,
                "venusumsys": sUsuario[:10],
                "venestmsys": sNomEst[:30] if sNomEst else "WEB",
            }

            # 5. Sentencia SQL de actualización respetando la Clave Primaria Compuesta
            update_query = text(
                """
                UPDATE fapvendedor SET
                    vencodigo = :vencodigoNew,
                    vennombre = :vennombre,
                    vendireccion = :vendireccion,
                    ventelefono = :ventelefono,
                    vencomision = :vencomision,
                    ventipcom = :ventipcom,
                    venaplica = :venaplica,
                    venstatus = :venstatus,
                    usrcodigo = :usrcodigo,
                    vencomisiona = :vencomisiona,
                    emcodemp = :emcodemp,
                    loccodigo = :loccodigo,
                    venfecmsys = :venfecmsys,
                    venhormsys = :venhormsys,
                    venusumsys = :venusumsys,
                    venestmsys = :venestmsys
                WHERE ciacodigo = :ciacodigo
                  AND vencodigo = :vencodigoOld
            """
            )

            try:
                # 6. Ejecución con captura de errores de integridad
                connection.execute(update_query, data_update)
            except IntegrityError:
                raise ValidationError("No se puede actualizar el Vendedor. Verifique que el nuevo código no exista ya o que no tenga registros vinculados (Facturas o Pedidos) en el sistema.")

    return {"data": "Vendedor actualizado exitosamente"}
