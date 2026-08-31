from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.TransEvenAsesor import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

# Importación de utilidades de encriptación
from services.encrip_desencrip import encriptar, desencriptar


@bp.route("/transferirEventos", methods=["POST"])
@jwt_required()
@api_endpoint
def transferirEventos():
    # 1. Extracción de sesión y variables globales
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuarioAdmin = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    # 3. Recepción de datos del Frontend
    data = request.get_json()
    usrcodigo_origen = data.get("usrcodigo_origen")
    usrcodigo_destino = data.get("usrcodigo_destino")
    eventos_seleccionados = data.get("eventos_seleccionados", [])

    # 4. Validaciones de negocio
    if not usrcodigo_origen or str(usrcodigo_origen).strip() == "":
        raise ValidationError("Debe seleccionar un Asesor de Origen.")
    if not usrcodigo_destino or str(usrcodigo_destino).strip() == "":
        raise ValidationError("Debe seleccionar un Asesor de Destino.")
    if str(usrcodigo_origen).strip() == str(usrcodigo_destino).strip():
        raise ValidationError("El Asesor de origen y destino no pueden ser el mismo.")
    if not eventos_seleccionados or not isinstance(eventos_seleccionados, list) or len(eventos_seleccionados) == 0:
        raise ValidationError("Debe especificar al menos un evento para transferir.")

    usrcodigo_origen_plano = str(usrcodigo_origen).strip()
    usrcodigo_destino_plano = str(usrcodigo_destino).strip()

    # 5. Preparación dinámica de la cláusula IN para los eventos seleccionados
    placeholders_eventos = []
    params = {
        "cia": sCodCia,
        "usr_origen": usrcodigo_origen_plano,
        "fecha": fecha_pura,
        "hora": hora_pura,
        "admin_usr": str(sUsuarioAdmin)[:10],
        "estacion": str(sNomEst)[:50],
    }

    for idx, evento in enumerate(eventos_seleccionados):
        key = f"evt_{idx}"
        placeholders_eventos.append(f":{key}")
        params[key] = str(evento)

    in_clause_eventos = ", ".join(placeholders_eventos)

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # --- A. OBTENER NOMBRE DEL ASESOR DESTINO ---
            usr_destino_enc = encriptar(usrcodigo_destino_plano)
            sql_usr = text(
                """
                SELECT usrnombre
                FROM siaccusr
                WHERE usrcodigo = :usrcodigo
                """
            )
            res_usr = connection.execute(sql_usr, {"usrcodigo": usr_destino_enc}).mappings().fetchone()

            if not res_usr:
                raise ValidationError("El Asesor de Destino no existe en el sistema.")

            usrnombre_destino_plano = desencriptar(res_usr["usrnombre"]) if res_usr["usrnombre"] else ""
            params["usr_destino"] = usrcodigo_destino_plano
            params["nom_destino"] = str(usrnombre_destino_plano)[:100]

            # --- B. INSERCIÓN DEL HISTORIAL (gdocteventos) ---
            comentario_historial = f"Reasignación administrativa masiva selectiva: Transferido desde el asesor {usrcodigo_origen_plano} hacia {usrcodigo_destino_plano}"
            params["comentario"] = comentario_historial

            sql_insert_historial = text(
                f"""
                INSERT INTO gdocteventos (
                    ciacodigo, loccodigo, eventocodigo, eventosecuen,
                    comentario, statusAnterior, statusNuevo, porcentajeavance,
                    respuestaTextoLibre, ejecucionFueraRango, tipoFueraRango, fechaEjecucionReal,
                    paquetecodigo, formsecuen,
                    eventofecisys, eventohorisys, eventousuisys, eventoestisys,
                    eventofecmsys, eventohormsys, eventousumsys, eventoestmsys
                )
                SELECT
                    ciacodigo, loccodigo, eventocodigo,
                    COALESCE((
                        SELECT MAX(eventosecuen)
                        FROM gdocteventos sub
                        WHERE sub.ciacodigo = gdocmeventos.ciacodigo
                          AND sub.loccodigo = gdocmeventos.loccodigo
                          AND sub.eventocodigo = gdocmeventos.eventocodigo
                    ), 0) + 1,
                    :comentario, eventostatus, eventostatus, 0,
                    '', 0, NULL, :fecha,
                    paquetecodigo, formsecuen,
                    :fecha, :hora, :admin_usr, :estacion,
                    :fecha, :hora, :admin_usr, :estacion
                FROM gdocmeventos
                WHERE ciacodigo = :cia
                  AND usrcodigo = :usr_origen
                  AND eventocodigo IN ({in_clause_eventos})
                  AND eventostatus IN ('PENDIENTE', 'EN_PROCESO')
                """
            )

            res_historial = connection.execute(sql_insert_historial, params)
            eventos_transferidos = res_historial.rowcount

            if eventos_transferidos == 0:
                return {"data": "Los eventos seleccionados no se encontraron activos en el origen."}

            # --- C. ACTUALIZACIÓN MASIVA DE LOS EVENTOS SELECCIONADOS (gdocmeventos) ---
            sql_update_eventos = text(
                f"""
                UPDATE gdocmeventos
                SET usrcodigo = :usr_destino,
                    usrnombre = :nom_destino,
                    eventofecmsys = :fecha,
                    eventohormsys = :hora,
                    eventousumsys = :admin_usr,
                    eventoestmsys = :estacion
                WHERE ciacodigo = :cia
                  AND usrcodigo = :usr_origen
                  AND eventocodigo IN ({in_clause_eventos})
                  AND eventostatus IN ('PENDIENTE', 'EN_PROCESO')
                """
            )

            connection.execute(sql_update_eventos, params)

    return {"data": f"Transferencia exitosa. Se reasignaron {eventos_transferidos} eventos activos al asesor {usrcodigo_destino_plano}."}
