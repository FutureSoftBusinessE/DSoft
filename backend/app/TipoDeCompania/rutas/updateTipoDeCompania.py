from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import email.utils

from app.TipoDeCompania import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updateTipoDeCompania", methods=["POST"])
@jwt_required()
@api_endpoint
def updateTipoDeCompania():
    # 1. Extracción de variables de sesión y auditoría[cite: 19]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras para la modificación[cite: 19]
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    # 3. Obtener los parámetros de la solicitud[cite: 19]
    data = request.get_json()

    # Manejamos el cambio de código (Old -> New) para la llave primaria[cite: 19]
    tpcodigo_old = data.get("tpcodigoOld", data.get("tpcodigo"))
    tpcodigo_new = data.get("tpcodigoNew", data.get("tpcodigo"))

    tpdescripcion = data.get("tpdescripcion")
    tpobservacion = data.get("tpobservacion")
    tpstatus = data.get("tpstatus", "A")

    # Variables de UI para el Control de Concurrencia Optimista (Regla 4 SIAC)
    tpfecmsys_ui = data.get("tpfecmsys")
    tphormsys_ui = data.get("tphormsys")

    # 4. Validaciones requeridas[cite: 19]
    if not tpcodigo_old or not tpcodigo_new:
        raise ValidationError("El código del tipo de compañía es requerido")
    if not tpdescripcion:
        raise ValidationError("La descripción del tipo de compañía es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # --- CONTROL DE CONCURRENCIA OPTIMISTA (Regla Global SIAC 4) ---
            if tpfecmsys_ui and tphormsys_ui:
                check_query = text(
                    """
                    SELECT tpfecmsys, tphormsys
                    FROM siactipocompania
                    WHERE tpcodigo = :tpcodigoOld
                    """
                )
                current_db = (
                    connection.execute(
                        check_query,
                        {"tpcodigoOld": tpcodigo_old},
                    )
                    .mappings()
                    .fetchone()
                )

                if current_db:
                    # Helper para limpiar fechas web (GMT) o normales
                    def limpiar_fecha_web(fecha_str, tipo="fecha"):
                        s = str(fecha_str)
                        if "GMT" in s:
                            try:
                                dt = email.utils.parsedate_to_datetime(s)
                                return dt.strftime("%Y-%m-%d") if tipo == "fecha" else dt.strftime("%H:%M:%S")
                            except Exception:
                                pass
                        return s.split(" ")[0] if tipo == "fecha" else (s.split(" ")[1] if " " in s else s)

                    ui_fecha = limpiar_fecha_web(tpfecmsys_ui, "fecha")
                    ui_hora = limpiar_fecha_web(tphormsys_ui, "hora")

                    db_fecha = current_db["tpfecmsys"].strftime("%Y-%m-%d") if current_db["tpfecmsys"] else ""
                    db_hora = current_db["tphormsys"].strftime("%H:%M:%S") if current_db["tphormsys"] else ""

                    if ui_fecha != db_fecha or (db_hora != "" and ui_hora != db_hora):
                        raise ValidationError("No se puede guardar: Otro usuario modificó este registro " "mientras lo editabas. Recarga la tabla e intenta de nuevo.")
            # --------------------------------------------------------

            # Limpieza y topes de texto para campos opcionales
            tpobservacion = str(tpobservacion).strip().upper()[:255] if tpobservacion else None

            # 5. Preparar diccionario de actualización con limpieza y límites[cite: 19]
            data_update = {
                "tpcodigoOld": str(tpcodigo_old).strip().upper()[:3],
                "tpcodigoNew": str(tpcodigo_new).strip().upper()[:3],
                "tpdescripcion": str(tpdescripcion).strip().upper()[:100],
                "tpobservacion": tpobservacion,
                "tpstatus": str(tpstatus).strip().upper()[:1],
                # Campos de auditoría (SOLO MODIFICACIÓN)[cite: 19]
                "tpfecmsys": fecha_pura,
                "tphormsys": hora_pura,
                "tpusumsys": str(sUsuario)[:10],
                "tpestmsys": str(sNomEst)[:50],
            }

            # 6. Query de actualización usando la llave primaria[cite: 19]
            update_query = text(
                """
                UPDATE siactipocompania SET
                    tpcodigo = :tpcodigoNew,
                    tpdescripcion = :tpdescripcion,
                    tpobservacion = :tpobservacion,
                    tpstatus = :tpstatus,
                    tpfecmsys = :tpfecmsys,
                    tphormsys = :tphormsys,
                    tpusumsys = :tpusumsys,
                    tpestmsys = :tpestmsys
                WHERE tpcodigo = :tpcodigoOld
                """
            )

            try:
                # 7. Ejecutar y proteger contra errores de Integridad Referencial[cite: 19]
                connection.execute(update_query, data_update)
            except IntegrityError:
                raise ValidationError("No se puede cambiar el código de este Tipo de Compañía porque ya está " "siendo utilizado en Excepciones de IVA u otros registros vinculados.")

    return {"data": "Tipo de Compañía actualizado exitosamente"}
