from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import email.utils  # <-- NATIVA DE PYTHON: Para interpretar las fechas GMT de Flask

from app.FormasDeCobro import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updateFormasDeCobro", methods=["POST"])
@jwt_required()
@api_endpoint
def updateFormasDeCobro():
    # 1. Extracción de variables de sesión
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # 2. Lógica de separación de Fecha y Hora puras para la modificación
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    # 3. Obtener los parámetros de la solicitud
    data = request.get_json()

    # Manejamos el cambio de código (Old -> New) para la Forma de Cobro
    factippag_old = data.get("factippagOld", data.get("factippag"))
    factippag_new = data.get("factippagNew", data.get("factippag"))

    fordescri = data.get("fordescri")
    fordias = data.get("fordias", 0)
    fortipo = data.get("fortipo")
    forcuotas = data.get("forcuotas", 0)
    forstatus = data.get("forstatus", "A")

    # Variables de UI para el Control de Concurrencia Optimista
    forfecmsys_ui = data.get("forfecmsys")
    forhormsys_ui = data.get("forhormsys")

    # 4. Validaciones requeridas
    if not factippag_old or not factippag_new:
        raise ValidationError("El código de la Forma de Cobro es requerido")
    if not fordescri:
        raise ValidationError("La descripción de la Forma de Cobro es requerida")
    if not fortipo:
        raise ValidationError("El tipo de Forma de Cobro es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # --- CONTROL DE CONCURRENCIA (Regla Global SIAC 4) ---
            if forfecmsys_ui and forhormsys_ui:
                check_query = text("SELECT forfecmsys, forhormsys FROM cxcbformapag WHERE ciacodigo = :cia AND factippag = :id")
                current_db = connection.execute(check_query, {"cia": sCodCia, "id": factippag_old}).mappings().fetchone()

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
                        # Fallback a la regla maestra SIAC por si envían "YYYY-MM-DD"
                        return s.split(" ")[0] if tipo == "fecha" else (s.split(" ")[1] if " " in s else s)

                    ui_fecha = limpiar_fecha_web(forfecmsys_ui, "fecha")
                    ui_hora = limpiar_fecha_web(forhormsys_ui, "hora")

                    db_fecha = current_db["forfecmsys"].strftime("%Y-%m-%d") if current_db["forfecmsys"] else ""
                    db_hora = current_db["forhormsys"].strftime("%H:%M:%S") if current_db["forhormsys"] else ""

                    if ui_fecha != db_fecha or (db_hora != "" and ui_hora != db_hora):
                        raise ValidationError("No se puede guardar: Otro usuario modificó este registro mientras lo editabas. Recarga la tabla e intenta de nuevo.")
            # --------------------------------------------------------

            # Limpiamos y preparamos variables numéricas
            try:
                fordias = float(fordias)
                forcuotas = int(forcuotas)
            except ValueError:
                raise ValidationError("Los campos de días y cuotas deben ser numéricos")

            # 5. Preparar diccionario de actualización con limpieza y límites
            data_update = {
                "ciacodigo": sCodCia,
                "factippagNew": str(factippag_new).strip().upper()[:3],
                "factippagOld": str(factippag_old).strip().upper()[:3],
                "fordescri": str(fordescri).strip().upper()[:40],
                "fordias": fordias,
                "fortipo": str(fortipo).strip().upper()[:2],
                "forcuotas": forcuotas,
                "forstatus": str(forstatus).strip().upper()[:1],
                # Campos de auditoría (SOLO MODIFICACIÓN)
                "forfecmsys": fecha_pura,
                "forhormsys": hora_pura,
                "forusumsys": str(sUsuario)[:10],
            }

            # 6. Query de actualización usando la llave primaria
            update_query = text(
                """
                UPDATE cxcbformapag SET
                    factippag = :factippagNew,
                    fordescri = :fordescri,
                    fordias = :fordias,
                    fortipo = :fortipo,
                    forcuotas = :forcuotas,
                    forstatus = :forstatus,
                    forfecmsys = :forfecmsys,
                    forhormsys = :forhormsys,
                    forusumsys = :forusumsys
                WHERE ciacodigo = :ciacodigo
                  AND factippag = :factippagOld
            """
            )

            try:
                # 7. Ejecutar y proteger contra errores de Integridad Referencial
                connection.execute(update_query, data_update)
            except IntegrityError:
                raise ValidationError("No se puede editar el código de esta Forma de Cobro porque ya está siendo usado en facturas u otros documentos relacionados.")

    return {"data": "Forma de Cobro actualizada exitosamente"}
