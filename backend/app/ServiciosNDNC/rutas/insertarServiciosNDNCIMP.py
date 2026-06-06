from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.ServiciosNDNC import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

# Importamos la función helper de validación estricta
from app.ServiciosNDNC.rutas.validarServiciosNDNCIMP import validar_servicios_ndnc


@bp.route("/insertarServiciosNDNCIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarServiciosNDNCIMP():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        sCodCia = seleccion["cliciaciacodigo"]
    except KeyError:
        raise ValidationError("Error Crítico: Sesión incompleta. No se pudo verificar la compañía.")

    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar al usuario en la sesión actual.")

    # Truncamos el usuario a 10 caracteres por límite de la tabla
    sUsuario = str(sUsuario)[:10]

    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    # 2. OBTENER PARÁMETROS DEL MODAL
    data = request.get_json()
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Inyectar la compañía para la validación
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            # 3. DOBLE VALIDACIÓN (Evita inyecciones si se salta el frontend)
            rows, summary = validar_servicios_ndnc(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. MAPEO PARA INSERCIÓN
            to_insert = []
            for fila in rows:
                # Lógica para convertir valores del CSV (texto/booleanos) a números para BD
                val_iva = str(fila.get("seriva", "0")).strip().upper()
                seriva = 1.0 if val_iva in ["1", "SI", "S", "TRUE", "V"] else 0.0

                val_autor = str(fila.get("serautor", "0")).strip().upper()
                serautor = 1 if val_autor in ["1", "SI", "S", "TRUE", "V"] else 0

                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "sercodigo": str(fila.get("sercodigo", ""))[:3].upper(),
                        "pctacodigo": "0",  # Valor por defecto forzado
                        "serdescri": str(fila.get("serdescri", ""))[:40].upper(),
                        "seriva": seriva,
                        "serstatus": str(fila.get("serstatus", "A")).strip().upper()[:1],
                        "serfecisys": fecha_pura,
                        "serhorisys": hora_pura,
                        "serusuisys": sUsuario,
                        "serfecmsys": fecha_pura,
                        "serhormsys": hora_pura,
                        "serusumsys": sUsuario,
                        "ttrcodigo": None,  # Valor por defecto forzado
                        "serncnd": str(fila.get("serncnd", ""))[:1].upper(),
                        "serautor": serautor,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO cxcbser (
                    ciacodigo, sercodigo, pctacodigo, serdescri,
                    serfecisys, serfecmsys, serhorisys, serhormsys,
                    seriva, serstatus, serusuisys, serusumsys,
                    ttrcodigo, serncnd, serautor
                ) VALUES (
                    :ciacodigo, :sercodigo, :pctacodigo, :serdescri,
                    :serfecisys, :serfecmsys, :serhorisys, :serhormsys,
                    :seriva, :serstatus, :serusuisys, :serusumsys,
                    :ttrcodigo, :serncnd, :serautor
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Servicios ND/NC insertados exitosamente",
        "inserted": len(to_insert),
    }
