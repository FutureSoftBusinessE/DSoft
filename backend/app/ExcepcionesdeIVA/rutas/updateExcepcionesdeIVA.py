from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import email.utils

from app.ExcepcionesdeIVA import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updateExcepcionesdeIVA", methods=["POST"])
@jwt_required()
@api_endpoint
def updateExcepcionesdeIVA():
    # 1. Extracción de variables de sesión y auditoría[cite: 20]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras para la modificación[cite: 20]
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    # 3. Obtener los parámetros de la solicitud[cite: 20]
    data = request.get_json()

    # Manejamos el cambio de llave (Old -> New) para Tipo y Fecha de Inicio[cite: 20]
    ivetipocompania_old = data.get("ivetipocompaniaOld", data.get("ivetipocompania"))
    ivetipocompania_new = data.get("ivetipocompaniaNew", data.get("ivetipocompania"))
    ivefecinicio_old = data.get("ivefecinicioOld", data.get("ivefecinicio"))
    ivefecinicio_new = data.get("ivefecinicioNew", data.get("ivefecinicio"))

    ivefectermino = data.get("ivefectermino")
    iveporcentajeactual = data.get("iveporcentajeactual", 0)
    iveporcentajeresolucion = data.get("iveporcentajeresolucion", 0)
    ivenumresolucion = data.get("ivenumresolucion")
    ivemotivo = data.get("ivemotivo")
    ivestatus = data.get("ivestatus", "A")

    # Variables de UI para el Control de Concurrencia Optimista (Regla 4 SIAC)
    ivefecmsys_ui = data.get("ivefecmsys")
    ivehormsys_ui = data.get("ivehormsys")

    # 4. Validaciones requeridas[cite: 20]
    if not ivetipocompania_old or not ivetipocompania_new:
        raise ValidationError("El tipo de compañía es requerido")
    if not ivefecinicio_old or not ivefecinicio_new:
        raise ValidationError("La fecha de inicio es requerida")
    if not ivefectermino:
        raise ValidationError("La fecha de término es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # --- CONTROL DE CONCURRENCIA (Regla Global SIAC 4) ---
            if ivefecmsys_ui and ivehormsys_ui:
                check_query = text(
                    """
                    SELECT ivefecmsys, ivehormsys
                    FROM siacivaexcepcion
                    WHERE ivetipocompania = :tipoOld
                      AND ivefecinicio = :fecOld
                    """
                )
                current_db = (
                    connection.execute(
                        check_query,
                        {"tipoOld": ivetipocompania_old, "fecOld": ivefecinicio_old},
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

                    ui_fecha = limpiar_fecha_web(ivefecmsys_ui, "fecha")
                    ui_hora = limpiar_fecha_web(ivehormsys_ui, "hora")

                    db_fecha = current_db["ivefecmsys"].strftime("%Y-%m-%d") if current_db["ivefecmsys"] else ""
                    db_hora = current_db["ivehormsys"].strftime("%H:%M:%S") if current_db["ivehormsys"] else ""

                    if ui_fecha != db_fecha or (db_hora != "" and ui_hora != db_hora):
                        raise ValidationError("No se puede guardar: Otro usuario modificó este registro " "mientras lo editabas. Recarga la tabla e intenta de nuevo.")
            # --------------------------------------------------------

            # Casteos numéricos y de texto según esquema
            try:
                iveporcentajeactual = float(iveporcentajeactual)
                iveporcentajeresolucion = float(iveporcentajeresolucion)
            except ValueError:
                raise ValidationError("Los porcentajes deben ser numéricos")

            ivenumresolucion = str(ivenumresolucion).strip().upper()[:30] if ivenumresolucion else None
            ivemotivo = str(ivemotivo).strip().upper()[:255] if ivemotivo else None

            # 5. Preparar diccionario de actualización con limpieza y límites[cite: 20]
            data_update = {
                "ivetipocompaniaOld": str(ivetipocompania_old).strip().upper()[:3],
                "ivetipocompaniaNew": str(ivetipocompania_new).strip().upper()[:3],
                "ivefecinicioOld": ivefecinicio_old,
                "ivefecinicioNew": ivefecinicio_new,
                "ivefectermino": ivefectermino,
                "iveporcentajeactual": iveporcentajeactual,
                "iveporcentajeresolucion": iveporcentajeresolucion,
                "ivenumresolucion": ivenumresolucion,
                "ivemotivo": ivemotivo,
                "ivestatus": str(ivestatus).strip().upper()[:1],
                # Campos de auditoría (SOLO MODIFICACIÓN)[cite: 20]
                "ivefecmsys": fecha_pura,
                "ivehormsys": hora_pura,
                "iveusumsys": str(sUsuario)[:10],
                "iveestmsys": str(sNomEst)[:50],
            }

            # 6. Query de actualización usando la llave primaria compuesta[cite: 20]
            update_query = text(
                """
                UPDATE siacivaexcepcion SET
                    ivetipocompania = :ivetipocompaniaNew,
                    ivefecinicio = :ivefecinicioNew,
                    ivefectermino = :ivefectermino,
                    iveporcentajeactual = :iveporcentajeactual,
                    iveporcentajeresolucion = :iveporcentajeresolucion,
                    ivenumresolucion = :ivenumresolucion,
                    ivemotivo = :ivemotivo,
                    ivestatus = :ivestatus,
                    ivefecmsys = :ivefecmsys,
                    ivehormsys = :ivehormsys,
                    iveusumsys = :iveusumsys,
                    iveestmsys = :iveestmsys
                WHERE ivetipocompania = :ivetipocompaniaOld
                  AND ivefecinicio = :ivefecinicioOld
                """
            )

            try:
                # 7. Ejecutar y proteger contra errores de Integridad Referencial[cite: 20]
                connection.execute(update_query, data_update)
            except IntegrityError:
                raise ValidationError("No se puede editar esta Excepción de IVA porque la nueva fecha o " "tipo de compañía choca con otra configuración existente.")

    return {"data": "Excepción de IVA actualizada exitosamente"}
