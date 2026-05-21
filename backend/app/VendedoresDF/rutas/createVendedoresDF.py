from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.VendedoresDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createVendedoresDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createVendedoresDF():
    # 1. Extracción de contexto y auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora pura para SQL Server
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()

    # 3. Extracción de campos según estructura de tabla fapvendedor
    vencodigo = data.get("vencodigo")
    vennombre = data.get("vennombre")
    vendireccion = data.get("vendireccion", "")
    ventelefono = data.get("ventelefono", "")
    vencomision = data.get("vencomision", 0)
    ventipcom = data.get("ventipcom", "P")
    venaplica = data.get("venaplica", "S")
    venstatus = data.get("venstatus", "A")

    # Campos adicionales con valores por defecto de la tabla
    usrcodigo = data.get("usrcodigo")
    emcodemp = data.get("emcodemp")
    loccodigo = data.get("loccodigo", "01")
    vencomisiona = data.get("vencomisiona", 0)

    # 4. Validaciones de campos obligatorios para la Clave Primaria
    if not vencodigo or str(vencodigo).strip() == "":
        raise ValidationError("El Código del Vendedor es requerido")
    if not vennombre or str(vennombre).strip() == "":
        raise ValidationError("El Nombre del Vendedor es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Formateo y truncado según estructura de tabla (PK: varchar(3))
            vencodigo = str(vencodigo).strip().upper()[:3]
            vennombre = str(vennombre).strip().upper()[:30]
            vendireccion = str(vendireccion).strip().upper()[:40]

            # 5. Verificación de Duplicados (PK: ciacodigo + vencodigo)
            check_data = {"ciacodigo": sCodCia, "vencodigo": vencodigo}
            check_query = text(
                """
                SELECT vencodigo
                FROM fapvendedor
                WHERE ciacodigo = :ciacodigo
                  AND vencodigo = :vencodigo
            """
            )
            result = connection.execute(check_query, check_data).mappings().fetchone()

            if result:
                raise ValidationError(f"Ya existe un Vendedor registrado con el código '{vencodigo}'")

            # 6. Preparación del Insert con Auditoría Completa
            data_insert = {
                "ciacodigo": sCodCia,
                "vencodigo": vencodigo,
                "vennombre": vennombre,
                "vendireccion": vendireccion,
                "ventelefono": str(ventelefono).strip()[:15],
                "vencomision": float(vencomision),
                "ventipcom": str(ventipcom).strip().upper()[:1],
                "venaplica": str(venaplica).strip().upper()[:1],
                "venstatus": str(venstatus).strip().upper()[:1],
                "vencontacto": 0,
                # Auditoría de Inserción
                "venfecisys": fecha_pura,
                "venhorisys": hora_pura,
                "venusuisys": sUsuario[:10],
                "venestisys": sNomEst[:30] if sNomEst else "WEB",
                # Auditoría de Modificación
                "venfecmsys": fecha_pura,
                "venhormsys": hora_pura,
                "venusumsys": sUsuario[:10],
                "venestmsys": sNomEst[:30] if sNomEst else "WEB",
                # Otros campos
                "usrcodigo": str(usrcodigo).strip()[:10] if usrcodigo else None,
                "vencomisiona": int(vencomisiona),
                "emcodemp": str(emcodemp).strip()[:10] if emcodemp else None,
                "loccodigo": str(loccodigo).strip()[:2],
                "pedidossiac": 0,
                "pedidosweb": 0,
                "pedidoswebart": 0,
            }

            insert_query = text(
                """
                INSERT INTO fapvendedor (
                    ciacodigo, vencodigo, vennombre, vendireccion, ventelefono,
                    vencomision, ventipcom, venaplica, vencontacto, venstatus,
                    venfecisys, venhorisys, venusuisys, venestisys,
                    venfecmsys, venhormsys, venusumsys, venestmsys,
                    usrcodigo, vencomisiona, emcodemp, loccodigo,
                    pedidossiac, pedidosweb, pedidoswebart
                ) VALUES (
                    :ciacodigo, :vencodigo, :vennombre, :vendireccion, :ventelefono,
                    :vencomision, :ventipcom, :venaplica, :vencontacto, :venstatus,
                    :venfecisys, :venhorisys, :venusuisys, :venestisys,
                    :venfecmsys, :venhormsys, :venusumsys, :venestmsys,
                    :usrcodigo, :vencomisiona, :emcodemp, :loccodigo,
                    :pedidossiac, :pedidosweb, :pedidoswebart
                )
                """
            )

            connection.execute(insert_query, data_insert)

    return {"data": "Vendedor creado exitosamente"}
