from flask import jsonify, request
from app.EjecucionTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from services.encrip_desencrip import encriptar


@bp.route("/saveEjecucionEvento", methods=["POST"])
@jwt_required()
def saveEjecucionEvento():
    """
    Guarda una ejecución de evento en la tabla de transacciones
    y actualiza el evento maestro
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]
        usuario_actual = claims["user"]
        estacion_actual = request.headers.get("X-Forwarded-For", request.remote_addr)

        # Parsear datos JSON del request
        data = request.get_json()
        eventocodigo = data.get("eventocodigo")
        fecha_ejecucion_real = data.get("fechaEjecucionReal")

        # Validar datos requeridos
        if not eventocodigo:
            return jsonify({"error": {"success": False, "message": "eventocodigo es requerido"}}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind
        fecha_actual = datetime.now()

        # Obtener la fecha actual con la hora seteada en 00:00:00
        fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        # Obtener la fecha con formato de 1900-01-01 y la hora actual
        fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

        with engine.connect() as connection:
            with connection.begin():
                # ============================================
                # 0. VERIFICAR SI EL USUARIO ES SUPERVISOR
                # ============================================
                is_supervisor = False

                if usuario_actual:
                    is_supervisor_query = """
                        SELECT
                            usrcodigo, usrflagsup
                        FROM
                            siactloc
                        WHERE
                            usrcodigo = :usrcodigo
                            AND ciacodigo = :ciacodigo
                            AND loccodigo = :loccodigo
                    """
                    is_supervisor_result = connection.execute(text(is_supervisor_query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "usrcodigo": encriptar(usuario_actual)}).mappings().fetchone()

                    if is_supervisor_result:
                        is_supervisor_result = dict(is_supervisor_result)
                        if is_supervisor_result["usrflagsup"] != 0:
                            is_supervisor = True
                # ============================================
                # 1. OBTENER DATOS ACTUALES DEL EVENTO
                # ============================================
                query_evento = text(
                    """
                    SELECT
                        eventostatus as status_actual,
                        porcentajeavance,
                        paquetecodigo,
                        formsecuen,
                        pregcodigo,
                        eventohorainicio,
                        eventohorafin,
                        clicodigo,
                        eventofecha,
                        usrcodigo,
                        eventofecisys,
                        eventohorisys
                    FROM gdocmeventos
                    WHERE ciacodigo = :ciacodigo
                        AND loccodigo = :loccodigo
                        AND eventocodigo = :eventocodigo
                """
                )

                evento_actual = connection.execute(query_evento, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "eventocodigo": eventocodigo}).mappings().first()

                if not evento_actual:
                    return jsonify({"error": {"success": False, "message": "Evento no encontrado"}}), 404

                evento_actual = dict(evento_actual)

                # ============================================
                # 2. OBTENER TIPO DE TAREA PARA VALIDACIONES
                # ============================================
                pregcodigo = evento_actual["pregcodigo"]

                query_tarea = text(
                    """
                    SELECT pregtipo, pregobligatoria
                    FROM gdocctareas
                    WHERE ciacodigo = :ciacodigo
                        AND pregcodigo = :pregcodigo
                """
                )

                tarea = connection.execute(query_tarea, {"ciacodigo": ciacodigo, "pregcodigo": pregcodigo}).mappings().first()

                tarea = dict(tarea) if tarea else {}

                # ============================================
                # 3. VALIDACIONES DE NEGOCIO
                # ============================================
                # Validar transición de estados permitida
                estados_permitidos = {"PENDIENTE": ["EN_PROCESO", "COMPLETADA", "CANCELADA", "REPROGRAMADA"], "EN_PROCESO": ["EN_PROCESO", "COMPLETADA", "CANCELADA", "REPROGRAMADA"], "COMPLETADA": ["EN_PROCESO"], "CANCELADA": [], "REPROGRAMADA": []}

                estado_actual = evento_actual["status_actual"]
                estado_nuevo = data.get("eventostatus")

                if estado_nuevo not in estados_permitidos.get(estado_actual, []):
                    return jsonify({"error": {"success": False, "message": f"No se puede cambiar de {estado_actual} a {estado_nuevo}"}}), 400

                # Validar que COMPLETADA = 100%
                if estado_nuevo == "COMPLETADA" and data.get("porcentajeavance", 0) != 100:
                    return jsonify({"error": {"success": False, "message": "El estado COMPLETADA requiere 100% de avance"}}), 400

                # Validar respuesta obligatoria según tipo de tarea
                pregtipo = tarea.get("pregtipo", "")
                pregobligatoria = data.get("pregobligatoria", False)

                if pregobligatoria and estado_nuevo not in ["CANCELADA", "REPROGRAMADA"]:

                    if pregtipo == "U" and not data.get("respuestaTextoLibre"):
                        return jsonify({"error": {"success": False, "message": "Debe completar el campo de texto libre (tarea obligatoria)"}}), 400

                    elif pregtipo == "L" and not data.get("respuestaListaSecuencia"):
                        return jsonify({"error": {"success": False, "message": "Debe seleccionar una opción (tarea obligatoria)"}}), 400

                    elif pregtipo == "M":
                        resp_multiple = data.get("respuestaMultipleSecuencias", [])
                        if not resp_multiple or len(resp_multiple) == 0:
                            return jsonify({"error": {"success": False, "message": "Debe seleccionar al menos una opción (tarea obligatoria)"}}), 400

                # Verificar permisos para modificar fecha real
                if fecha_ejecucion_real is not None:
                    # Si se está enviando una fecha real (no es None)
                    if not is_supervisor:
                        return jsonify({"error": {"success": False, "message": "Solo los supervisores pueden modificar la fecha real de ejecución"}}), 403

                # Validar que si el estado es COMPLETADA, se proporcione fechaEjecucionReal
                if estado_nuevo == "COMPLETADA":
                    if not fecha_ejecucion_real:
                        # Si es supervisor y no envió fecha, usar fecha actual
                        if is_supervisor:
                            fecha_ejecucion_real = fecha_actual
                        else:
                            # Si no es supervisor, la fecha real se establece automáticamente
                            fecha_ejecucion_real = fecha_actual

                    # Validar formato de fecha (opcional)
                    try:
                        # Si viene como string, convertirlo a datetime
                        if isinstance(fecha_ejecucion_real, str):
                            fecha_ejecucion_real = datetime.strptime(fecha_ejecucion_real, "%Y-%m-%d %H:%M:%S")
                        elif isinstance(fecha_ejecucion_real, datetime):
                            pass  # Ya es datetime
                        else:
                            raise ValueError("Formato de fecha inválido")
                    except Exception as e:
                        return jsonify({"error": {"success": False, "message": f"Formato de fecha inválido: {str(e)}"}}), 400
                else:
                    # Si no es COMPLETADA, se guarda fecha actual
                    fecha_ejecucion_real = fecha_actual
                # ============================================
                # 4. CALCULAR NUEVA SECUENCIA
                # ============================================
                query_max_secuencia = text(
                    """
                    SELECT ISNULL(MAX(eventosecuen), 0) as max_secuencia
                    FROM gdocteventos
                    WHERE ciacodigo = :ciacodigo
                        AND loccodigo = :loccodigo
                        AND eventocodigo = :eventocodigo
                """
                )

                max_secuencia = connection.execute(query_max_secuencia, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "eventocodigo": eventocodigo}).scalar()

                nueva_secuencia = max_secuencia + 1

                # ============================================
                # 5. PREPARAR DATOS PARA INSERTAR
                # ============================================
                # Preparar respuestaMultipleSecuencias como string separado por comas
                respuesta_multiple = data.get("respuestaMultipleSecuencias")
                if respuesta_multiple and isinstance(respuesta_multiple, list):
                    respuesta_multiple_str = ",".join(str(x) for x in respuesta_multiple)
                else:
                    respuesta_multiple_str = None

                ejecucion_fuera_rango = data.get("ejecucionFueraRango", False)
                if ejecucion_fuera_rango:
                    ejecucion_fuera_rango = -1
                else:
                    ejecucion_fuera_rango = 0

                # ============================================
                # 6. INSERTAR EN TABLA DE TRANSACCIONES
                # ============================================
                insert_query = text(
                    """
                    INSERT INTO gdocteventos (
                        ciacodigo, loccodigo, eventocodigo, eventosecuen,
                        comentario, statusAnterior, statusNuevo, porcentajeavance,
                        respuestaTextoLibre, respuestaListaSecuencia, respuestaMultipleSecuencias,
                        ejecucionFueraRango, tipoFueraRango, fechaEjecucionReal,
                        paquetecodigo, formsecuen,
                        eventofecisys, eventohorisys, eventousuisys, eventoestisys,
                        eventofecmsys, eventohormsys, eventousumsys, eventoestmsys
                    ) VALUES (
                        :ciacodigo, :loccodigo, :eventocodigo, :eventosecuen,
                        :comentario, :statusAnterior, :statusNuevo, :porcentajeavance,
                        :respuestaTextoLibre, :respuestaListaSecuencia, :respuestaMultipleSecuencias,
                        :ejecucionFueraRango, :tipoFueraRango, :fechaEjecucionReal,
                        :paquetecodigo, :formsecuen,
                        :eventofecisys, :eventohorisys, :usuario_actual, :estacion_actual,
                        :eventofecmsys, :eventohormsys, :usuario_actual, :estacion_actual
                    )
                """
                )

                connection.execute(
                    insert_query,
                    {
                        "ciacodigo": ciacodigo,
                        "loccodigo": loccodigo,
                        "eventocodigo": eventocodigo,
                        "eventosecuen": nueva_secuencia,
                        "comentario": data.get("comentario", ""),
                        "statusAnterior": estado_actual,
                        "statusNuevo": estado_nuevo,
                        "porcentajeavance": data.get("porcentajeavance", 0),
                        "respuestaTextoLibre": data.get("respuestaTextoLibre"),
                        "respuestaListaSecuencia": data.get("respuestaListaSecuencia"),
                        "respuestaMultipleSecuencias": respuesta_multiple_str,
                        "ejecucionFueraRango": ejecucion_fuera_rango,
                        "tipoFueraRango": data.get("tipoFueraRango"),
                        "fechaEjecucionReal": fecha_ejecucion_real,
                        "paquetecodigo": evento_actual.get("paquetecodigo"),
                        "formsecuen": evento_actual.get("formsecuen"),
                        "fecha_actual": fecha_actual,
                        "eventofecisys": fecha_con_hora_cero,
                        "eventohorisys": fecha_formato_1900,
                        "eventofecmsys": fecha_con_hora_cero,
                        "eventohormsys": fecha_formato_1900,
                        "usuario_actual": usuario_actual,
                        "estacion_actual": estacion_actual,
                    },
                )

                # ============================================
                # 7. ACTUALIZAR EVENTO MAESTRO
                # ============================================
                update_evento_query = text(
                    """
                    UPDATE gdocmeventos
                    SET
                        eventostatus = :eventostatus,
                        porcentajeavance = :porcentajeavance,
                        eventofecmsys = :fecha_actual,
                        eventohormsys = :fecha_actual,
                        eventousumsys = :usuario_actual,
                        eventoestmsys = :estacion_actual
                    WHERE ciacodigo = :ciacodigo
                        AND loccodigo = :loccodigo
                        AND eventocodigo = :eventocodigo
                """
                )

                connection.execute(
                    update_evento_query,
                    {"eventostatus": estado_nuevo, "porcentajeavance": data.get("porcentajeavance", 0), "ciacodigo": ciacodigo, "loccodigo": loccodigo, "eventocodigo": eventocodigo, "fecha_actual": fecha_actual, "usuario_actual": usuario_actual, "estacion_actual": estacion_actual},
                )

                # ============================================
                # 7. ACTUALIZAR TODOS LOS CLIENTES Y PLACAs DEL MISMO PAQUETE (ESTO SOLO APLICA PARA TECNICENTRO)
                # ============================================
                procesocod = data.get("procesocod", "")
                paquetecodigo = evento_actual.get("paquetecodigo", "")
                clicodigo = data.get("clicodigo")
                clinombre = data.get("clinombre")
                placa = data.get("placa")

                usrcodigo_asignado_al_evento = evento_actual.get("usrcodigo", "")
                eventofecha = evento_actual.get("eventofecha", "")
                eventofecisys = evento_actual.get("eventofecisys", "")
                eventohorisys = evento_actual.get("eventohorisys", "")

                update_eventos_query = """
                UPDATE SiacIntegradores.dbo.gdocmeventos
                SET
                    clicodigo = :clicodigo,
                    clinombre = :clinombre,
                    placa = :placa,
                    eventofecmsys = :fecha_actual,
                    eventohormsys = :fecha_actual,
                    eventousumsys = :usuario_actual,
                    eventoestmsys = :estacion_actual
                WHERE ciacodigo = :ciacodigo
                    AND loccodigo = :loccodigo
                    AND paquetecodigo = :paquetecodigo
                    AND usrcodigo = :usrcodigo
                    AND procesocod = :procesocod
                    AND eventofecha = :eventofecha
                    AND eventofecisys = :eventofecisys
                    AND eventohorisys = :eventohorisys;
                """
                connection.execute(
                    text(update_eventos_query),
                    {
                        "ciacodigo": ciacodigo,
                        "loccodigo": loccodigo,
                        "clicodigo": clicodigo,
                        "clinombre": clinombre,
                        "placa": placa,
                        "paquetecodigo": paquetecodigo,
                        "procesocod": procesocod,
                        "usrcodigo": usrcodigo_asignado_al_evento,
                        "eventofecha": eventofecha,
                        "eventofecisys": eventofecisys,
                        "eventohorisys": eventohorisys,
                        "fecha_actual": fecha_actual,
                        "usuario_actual": usuario_actual,
                        "estacion_actual": estacion_actual,
                    },
                )

                return jsonify({"success": True, "message": "Ejecución guardada exitosamente", "data": {"eventocodigo": eventocodigo, "eventosecuen": nueva_secuencia, "nuevo_status": estado_nuevo}}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": {"success": False, "message": f"Error al guardar ejecución: {str(e)}"}}), 500
