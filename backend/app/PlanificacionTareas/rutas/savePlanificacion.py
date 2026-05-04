from flask import Blueprint, jsonify, request
from app.PlanificacionTareas import bp
from flask_jwt_extended import get_jwt, jwt_required
from datetime import datetime, timedelta
from app.extensions import db
from sqlalchemy import text
from app.db import get_session
import calendar
from typing import Dict, List, Tuple, Any
from collections import defaultdict


# ============================================================================
# CONSTANTES DE CONFIGURACIÓN
# ============================================================================

# Estados de eventos que OCUPAN espacio (no pueden overlap, ocupan cupo)
ESTADOS_ACTIVOS = ["PENDIENTE", "EN_PROCESO", "COMPLETADA"]

# Estados de eventos que NO ocupan espacio (pueden overlap, no ocupan cupo)
ESTADOS_INACTIVOS = ["CANCELADA", "REPROGRAMADA"]

# Mapeo de números de día a nombres (1=domingo, 7=sábado)
DIAS_SEMANA = {1: "domingo", 2: "lunes", 3: "martes", 4: "miércoles", 5: "jueves", 6: "viernes", 7: "sábado"}

# ============================================================================
# CLASES DE ERROR PERSONALIZADAS PARA MANEJO ESPECÍFICO
# ============================================================================


class PlanificacionError(Exception):
    """Excepción base para todos los errores de planificación"""

    def __init__(self, tipo_error: str, mensaje: str, detalles: Dict = None):
        self.tipo_error = tipo_error
        self.mensaje = mensaje
        self.detalles = detalles or {}
        super().__init__(self.mensaje)


class OverlapError(PlanificacionError):
    """Error cuando un nuevo evento se superpone con eventos existentes activos"""

    pass


class CupoExcedidoError(PlanificacionError):
    """Error cuando se excede el cupo máximo de un intervalo horario"""

    pass


class HorarioNoExisteError(PlanificacionError):
    """Error cuando el usuario no tiene horario asignado o el evento está fuera de horario"""

    pass


# ============================================================================
# FUNCIONES AUXILIARES - MANIPULACIÓN DE TIEMPOS Y FECHAS
# ============================================================================


def calcular_dia_semana(fecha_str: str) -> int:
    """
    Calcula el día de semana numérico a partir de una fecha en formato YYYY-MM-DD

    Args:
        fecha_str: Fecha en formato string 'YYYY-MM-DD'

    Returns:
        int: Día de semana (1=domingo, 2=lunes, ..., 7=sábado)

    Ejemplo:
        calcular_dia_semana("2025-12-17") → 4 (miércoles)
    """
    # Convertir string a objeto datetime
    fecha = datetime.strptime(fecha_str, "%Y-%m-%d")

    # datetime.weekday() retorna: 0=lunes, 1=martes, ..., 6=domingo
    dia_python = fecha.weekday()

    # Convertir a nuestro formato: 1=domingo, 2=lunes, ..., 7=sábado
    # Mapeo: 0(lunes)→2, 1(martes)→3, ..., 5(sábado)→7, 6(domingo)→1
    return dia_python + 2 if dia_python < 6 else 1


def calcular_hora_fin(hora_inicio: str, duracion_min: int) -> str:
    """
    Calcula la hora de terminación sumando minutos a la hora de inicio

    Args:
        hora_inicio: Hora en formato 'HH:MM'
        duracion_min: Duración en minutos enteros

    Returns:
        str: Hora de fin en formato 'HH:MM'

    Ejemplo:
        calcular_hora_fin("09:00", 30) → "09:30"
    """
    # Convertir hora de inicio a objeto datetime
    hora_dt = datetime.strptime(hora_inicio, "%H:%M")

    # Sumar la duración en minutos
    hora_fin_dt = hora_dt + timedelta(minutes=duracion_min)

    # Devolver en formato string
    return hora_fin_dt.strftime("%H:%M")


def generar_fechas_recurrencia(fecha_base: str, recurrencia: str, repeticiones: int) -> List[str]:
    """
    Genera la lista completa de fechas para un evento recurrente

    Args:
        fecha_base: Fecha inicial en formato 'YYYY-MM-DD'
        recurrencia: Tipo de recurrencia: 'diaria', 'semanal', 'mensual', 'anual', o vacío
        repeticiones: Número total de repeticiones (incluyendo la fecha base)

    Returns:
        List[str]: Lista de fechas en formato 'YYYY-MM-DD'

    Ejemplo:
        generar_fechas_recurrencia("2025-12-17", "diaria", 3)
        → ["2025-12-17", "2025-12-18", "2025-12-19"]
    """
    # Si no hay recurrencia o solo 1 repetición, retornar solo la fecha base
    if not recurrencia or repeticiones <= 1:
        return [fecha_base]

    # Convertir fecha base a datetime para cálculos
    fecha_dt = datetime.strptime(fecha_base, "%Y-%m-%d")
    fechas = [fecha_base]  # Incluir la fecha base
    dia_original = fecha_dt.day

    # Generar cada fecha de repetición según el tipo
    for i in range(1, repeticiones):
        if recurrencia.lower() == "diaria":
            nueva_fecha = fecha_dt + timedelta(days=i)

        elif recurrencia.lower() == "semanal":
            nueva_fecha = fecha_dt + timedelta(weeks=i)

        elif recurrencia.lower() == "quincenal":
            nueva_fecha = fecha_dt + timedelta(days=i * 15)

        elif recurrencia.lower() == "mensual":
            meses_a_sumar = i
            year = fecha_dt.year + (fecha_dt.month + meses_a_sumar - 1) // 12
            month = (fecha_dt.month + meses_a_sumar - 1) % 12 + 1

            # Obtener último día del mes destino
            ultimo_dia = calendar.monthrange(year, month)[1]

            # Usar el día original o el último día si no existe
            day = min(dia_original, ultimo_dia)

            nueva_fecha = datetime(year, month, day)

        elif recurrencia.lower() == "bimestral":
            meses_a_sumar = i * 2
            year = fecha_dt.year + (fecha_dt.month + meses_a_sumar - 1) // 12
            month = (fecha_dt.month + meses_a_sumar - 1) % 12 + 1
            ultimo_dia = calendar.monthrange(year, month)[1]
            day = min(dia_original, ultimo_dia)
            nueva_fecha = datetime(year, month, day)

        elif recurrencia.lower() == "trimestral":
            meses_a_sumar = i * 3
            year = fecha_dt.year + (fecha_dt.month + meses_a_sumar - 1) // 12
            month = (fecha_dt.month + meses_a_sumar - 1) % 12 + 1
            ultimo_dia = calendar.monthrange(year, month)[1]
            day = min(dia_original, ultimo_dia)
            nueva_fecha = datetime(year, month, day)

        elif recurrencia.lower() == "semestral":
            meses_a_sumar = i * 6
            year = fecha_dt.year + (fecha_dt.month + meses_a_sumar - 1) // 12
            month = (fecha_dt.month + meses_a_sumar - 1) % 12 + 1
            ultimo_dia = calendar.monthrange(year, month)[1]
            day = min(dia_original, ultimo_dia)
            nueva_fecha = datetime(year, month, day)

        elif recurrencia.lower() == "anual":
            # Para anual, mantener el mismo día, ajustando si es 29 de febrero
            year = fecha_dt.year + i
            month = fecha_dt.month
            # Verificar si el día existe (manejar 29 de febrero)
            ultimo_dia = calendar.monthrange(year, month)[1]
            day = min(dia_original, ultimo_dia)
            nueva_fecha = datetime(year, month, day)
        else:
            continue

        fechas.append(nueva_fecha.strftime("%Y-%m-%d"))

    return fechas


# ============================================================================
# FUNCIONES AUXILIARES - VALIDACIONES PRINCIPALES
# ============================================================================


def encontrar_horario_para_fecha(connection, ciacodigo: str, loccodigo: str, usrcodigo: str, fecha: str, hora_inicio: str, hora_fin: str, tarea_info: Dict) -> Dict:
    """
    Encuentra el intervalo horario del usuario que CONTIENE COMPLETAMENTE un evento

    Esta función:
    1. Calcula el día de semana de la fecha
    2. Busca todos los horarios del usuario para ese día
    3. Encuentra el intervalo que contiene completamente el evento
    4. Valida que el evento esté dentro de los límites del intervalo

    Args:
        connection: Conexión a la base de datos
        ciacodigo: Código de compañía
        loccodigo: Código de la localidad
        usrcodigo: Código de usuario
        fecha: Fecha del evento (YYYY-MM-DD)
        hora_inicio: Hora de inicio del evento (HH:MM)
        hora_fin: Hora de fin del evento (HH:MM)
        tarea_info: Información de la tarea para mensajes de error

    Returns:
        Dict: Información del intervalo encontrado con:
            - hrsecuen: Secuencia del intervalo
            - cupo: Cupo máximo del intervalo
            - horaini: Hora de inicio del intervalo
            - horafin: Hora de fin del intervalo
            - dia: Día de semana numérico
            - fecha: Fecha del evento

    Raises:
        HorarioNoExisteError: Si el usuario no tiene horario para ese día
        HorarioNoExisteError: Si el evento no está dentro de ningún intervalo
    """
    # 1. Determinar el día de semana de la fecha
    dia_semana = calcular_dia_semana(fecha)

    # 2. Consultar todos los horarios del usuario para ESE día específico
    query = """
    SELECT hrsecuen, hrcupo,
           CONVERT(VARCHAR(5), hrhorini, 108) as horaini,
           CONVERT(VARCHAR(5), hrhorfin, 108) as horafin
    FROM rhbhorarios
    WHERE ciacodigo = :ciacodigo
      AND usrcodigo = :usrcodigo
      AND loccodigo = :loccodigo
      AND hrdia = :dia
    ORDER BY hrhorini
    """

    horarios = connection.execute(text(query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "usrcodigo": usrcodigo, "dia": dia_semana}).fetchall()

    # 3. Validar que el usuario tenga horarios para ese día
    if not horarios:
        raise HorarioNoExisteError(
            "USUARIO_SIN_HORARIO_DIA",
            f"El usuario {usrcodigo} no tiene horarios asignados para los {DIAS_SEMANA.get(dia_semana)} ({fecha})",
            {"usuario": usrcodigo, "usuario_nombre": tarea_info.get("usuario_nombre", ""), "fecha": fecha, "dia": dia_semana, "dia_nombre": DIAS_SEMANA.get(dia_semana), "hora_evento": f"{hora_inicio}-{hora_fin}", "tarea": tarea_info.get("pregdescri", "")},
        )

    # 4. Buscar el intervalo que CONTENGA COMPLETAMENTE el evento
    intervalo_encontrado = None

    for horario in horarios:
        horaini_bd = horario.horaini
        horafin_bd = horario.horafin

        # Convertir a datetime para comparaciones precisas
        inicio_evento = datetime.strptime(hora_inicio, "%H:%M")
        fin_evento = datetime.strptime(hora_fin, "%H:%M")
        inicio_intervalo = datetime.strptime(horaini_bd, "%H:%M")
        fin_intervalo = datetime.strptime(horafin_bd, "%H:%M")

        # Verificar que el evento esté COMPLETAMENTE dentro del intervalo
        # Condición: inicio_evento ≥ inicio_intervalo Y fin_evento ≤ fin_intervalo
        if inicio_evento >= inicio_intervalo and fin_evento <= fin_intervalo:
            intervalo_encontrado = {"hrsecuen": horario.hrsecuen, "cupo": horario.hrcupo, "horaini": horaini_bd, "horafin": horafin_bd, "dia": dia_semana, "fecha": fecha}
            break  # Encontrado, salir del bucle

    # 5. Si no se encontró intervalo apropiado, lanzar error
    if not intervalo_encontrado:
        # Preparar información de horarios disponibles para el mensaje de error
        horarios_disponibles = [{"hrsecuen": h.hrsecuen, "horario": f"{h.horaini}-{h.horafin}", "cupo": h.hrcupo} for h in horarios]

        raise HorarioNoExisteError(
            "EVENTO_FUERA_HORARIO",
            f"El evento {hora_inicio}-{hora_fin} no está dentro de ningún horario del usuario para el {DIAS_SEMANA.get(dia_semana)} {fecha}",
            {
                "usuario": usrcodigo,
                "usuario_nombre": tarea_info.get("usuario_nombre", ""),
                "fecha": fecha,
                "dia": dia_semana,
                "dia_nombre": DIAS_SEMANA.get(dia_semana),
                "hora_evento": f"{hora_inicio}-{hora_fin}",
                "tarea": tarea_info.get("pregdescri", ""),
                "horarios_disponibles": horarios_disponibles,
                "mensaje_sugerencia": f"El usuario trabaja el {DIAS_SEMANA.get(dia_semana)} en estos horarios: {', '.join([h['horario'] for h in horarios_disponibles])}",
            },
        )

    return intervalo_encontrado


def validar_overlap_eventos_existentes(connection, ciacodigo: str, loccodigo: str, usrcodigo: str, fecha: str, hora_inicio: str, hora_fin: str, tarea_info: Dict) -> None:
    """
    Valida que el nuevo evento NO se superponga con eventos existentes activos

    Verifica contra eventos en estados: PENDIENTE, EN_PROCESO, COMPLETADA
    Back-to-back permitido: eventos pueden terminar/iniciar exactamente a la misma hora

    Args:
        connection: Conexión a la base de datos
        ciacodigo: Código de compañía
        loccodigo: Código de la compañía
        usrcodigo: Código de usuario
        fecha: Fecha del evento (YYYY-MM-DD)
        hora_inicio: Hora de inicio del evento (HH:MM)
        hora_fin: Hora de fin del evento (HH:MM)
        tarea_info: Información de la tarea para mensajes de error

    Raises:
        OverlapError: Si se encuentra superposición con un evento existente activo
    """
    # Consultar eventos existentes que se superpongan
    query = """
    SELECT eventocodigo, pregdescri,
           CONVERT(VARCHAR(5), eventohorainicio, 108) as horainicio,
           CONVERT(VARCHAR(5), eventohorafin, 108) as horafin,
           eventostatus
    FROM gdocmeventos
    WHERE ciacodigo = :ciacodigo
      AND loccodigo = :loccodigo
      AND usrcodigo = :usrcodigo
      AND eventofecha = :fecha
      AND eventostatus IN :estados
      AND eventohorainicio < :hora_fin
      AND eventohorafin > :hora_inicio
    """

    # Convertir lista de estados a tupla para la cláusula IN
    estados_tuple = tuple(ESTADOS_ACTIVOS)

    # Ejecutar consulta
    resultados = connection.execute(text(query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "usrcodigo": usrcodigo, "fecha": fecha, "estados": estados_tuple, "hora_fin": hora_fin, "hora_inicio": hora_inicio}).fetchall()

    # Si hay resultados, hay overlap
    if resultados:
        evento_conflicto = resultados[0]  # Tomar el primer conflicto encontrado
        raise OverlapError(
            "OVERLAP_DETECTADO",
            f"El usuario {usrcodigo} ya tiene un evento programado que se superpone",
            {
                "tarea_codigo": tarea_info.get("pregcodigo"),
                "tarea_descripcion": tarea_info.get("pregdescri"),
                "fecha": fecha,
                "hora_intentada": f"{hora_inicio}-{hora_fin}",
                "evento_existente": {"eventocodigo": evento_conflicto.eventocodigo, "descripcion": evento_conflicto.pregdescri, "horario": f"{evento_conflicto.horainicio}-{evento_conflicto.horafin}", "estado": evento_conflicto.eventostatus},
            },
        )


def validar_cupo_intervalo(connection, ciacodigo: str, loccodigo: str, usrcodigo: str, fecha: str, intervalo_info: Dict, eventos_nuevos_por_intervalo: Dict, tarea_info: Dict) -> None:
    """
    Valida que no se exceda el cupo máximo del intervalo horario

    Considera:
    - Eventos YA EXISTENTES en estados activos dentro del mismo intervalo
    - Eventos NUEVOS de este request que caen en el mismo intervalo

    Args:
        connection: Conexión a la base de datos
        ciacodigo: Código de compañía
        loccodigo: Código de la compañía
        usrcodigo: Código de usuario
        fecha: Fecha del evento (YYYY-MM-DD)
        intervalo_info: Diccionario con información del intervalo encontrado
        eventos_nuevos_por_intervalo: Contador de eventos nuevos por intervalo
        tarea_info: Información de la tarea para mensajes de error

    Raises:
        CupoExcedidoError: Si el total de eventos excede el cupo máximo
    """
    # Extraer información del intervalo
    hrsecuen = intervalo_info["hrsecuen"]
    cupo_maximo = intervalo_info["cupo"]

    # Si cupo es 0, significa ilimitado - no validar
    if cupo_maximo == 0:
        return

    # Contar eventos EXISTENTES en estados activos dentro del MISMO intervalo
    query = """
    SELECT COUNT(*) as count
    FROM gdocmeventos e
    WHERE e.ciacodigo = :ciacodigo
      AND loccodigo = :loccodigo
      AND e.usrcodigo = :usrcodigo
      AND e.eventofecha = :fecha
      AND e.eventostatus IN :estados
      AND e.eventohorainicio >= :horaini
      AND e.eventohorafin <= :horafin
    """

    # Convertir lista de estados a tupla
    estados_tuple = tuple(ESTADOS_ACTIVOS)

    # Ejecutar consulta de conteo
    resultado = connection.execute(text(query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "usrcodigo": usrcodigo, "fecha": fecha, "estados": estados_tuple, "horaini": intervalo_info["horaini"], "horafin": intervalo_info["horafin"]}).fetchone()

    # Obtener cantidad de eventos existentes
    eventos_existentes = resultado.count if resultado else 0

    # Obtener cantidad de eventos NUEVOS para este intervalo (de este request)
    key = (usrcodigo, fecha, hrsecuen)
    eventos_nuevos = eventos_nuevos_por_intervalo.get(key, 0)

    # Calcular total
    total = eventos_existentes + eventos_nuevos

    # Validar que no exceda el cupo máximo
    if total > cupo_maximo:
        raise CupoExcedidoError(
            "CUPO_EXCEDIDO",
            f"Intervalo {intervalo_info['horaini']}-{intervalo_info['horafin']} excede cupo máximo",
            {
                "tarea_codigo": tarea_info.get("pregcodigo"),
                "tarea_descripcion": tarea_info.get("pregdescri"),
                "fecha": fecha,
                "intervalo": {"hrsecuen": hrsecuen, "horaini": intervalo_info["horaini"], "horafin": intervalo_info["horafin"], "cupo_maximo": cupo_maximo, "dia": intervalo_info.get("dia"), "dia_nombre": DIAS_SEMANA.get(intervalo_info.get("dia"))},
                "ocupacion": {"eventos_existentes": eventos_existentes, "eventos_nuevos": eventos_nuevos, "total": total},
            },
        )


def generar_eventocodigo(connection, ciacodigo: str, loccodigo: str) -> str:
    """
    Genera un código único para un nuevo evento

    Args:
        connection: Conexión a la base de datos
        ciacodigo: Código de compañía
        loccodigo: Código de localidad

    Returns:
        str: Código único para el nuevo evento
    """
    # ----- --------ALGORITMO PARA GENERAR SECUENCIA ------------
    # Obtener el servidor actual
    locservidor_query = """
    SELECT locservidor
    FROM siacser
    WHERE serstatus = 'A'
    """
    locservidor_result = connection.execute(text(locservidor_query)).mappings().fetchone()
    locservidor = locservidor_result["locservidor"]

    year = datetime.now().strftime("%y")
    _dptoanio = datetime.now().strftime("%Y")
    _doccodigo = "EVE"
    _inicial_codigo_generated = "EV"

    # Obtener el registro actual en cgpdpto filtrado por los parámetros
    cgpdpto_query = """
    SELECT dptonumsec
    FROM cgpdpto
    WHERE ciacodigo = :ciacodigo
    AND loccodigo = :loccodigo
    AND dptoanio = :dptoanio
    AND doccodigo = :doccodigo
    """
    cgpdpto_result = (
        connection.execute(
            text(cgpdpto_query),
            {
                "ciacodigo": ciacodigo,
                "loccodigo": loccodigo,
                "dptoanio": _dptoanio,
                "doccodigo": _doccodigo,
            },
        )
        .mappings()
        .fetchone()
    )

    if not cgpdpto_result:
        raise PlanificacionError("ERROR_GENERAR_CODIGO", "No se encontró secuencia para generar código de evento", {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "dptoanio": _dptoanio, "doccodigo": _doccodigo})
    # Obtener y actualizar la secuencia actual
    secuenciaActual = cgpdpto_result["dptonumsec"]
    nuevaSecuenciaActual = secuenciaActual + 1

    # Generar el código concatenando los valores
    codigoGenerated = f"{_inicial_codigo_generated}{locservidor}{year}{nuevaSecuenciaActual:06}{loccodigo}"

    # Auditar la nueva secuencia actualizando el valor en la base de datos
    update_cgpdpto_query = """
    UPDATE cgpdpto
    SET dptonumsec = :nuevaSecuencia
    WHERE ciacodigo = :ciacodigo
    AND loccodigo = :loccodigo
    AND dptoanio = :dptoanio
    AND doccodigo = :doccodigo
    """
    connection.execute(
        text(update_cgpdpto_query),
        {
            "nuevaSecuencia": nuevaSecuenciaActual,
            "ciacodigo": ciacodigo,
            "loccodigo": loccodigo,
            "dptoanio": _dptoanio,
            "doccodigo": _doccodigo,
        },
    )

    return codigoGenerated


# ============================================================================
# ENDPOINT PRINCIPAL - FLUJO COMPLETO DE GUARDADO
# ============================================================================


@bp.route("/savePlanificacion", methods=["POST"])
@jwt_required()
def savePlanificacion():
    """
    ===========================================================================
    ENDPOINT PRINCIPAL: /planificacion/guardarPlanificacion
    ===========================================================================

    FLUJO VISUAL DEL PROCESO:

    1. 📥 RECEPCIÓN DE DATOS
       ↓
    2. 🔐 OBTENER CONTEXTO (JWT, conexión BD)
       ↓
    3. 🔄 PARA CADA TAREA:
       │   3.1 📋 Validar datos básicos
       │   3.2 🔢 Generar todas las fechas de recurrencia
       │   ↓
       │   3.3 📅 PARA CADA FECHA:
       │   │   3.3.1 🕐 Calcular hora de fin
       │   │   3.3.2 🔍 ENCONTRAR intervalo horario que contenga el evento
       │   │   3.3.3 ❌ Validar NO OVERLAP con eventos existentes activos
       │   │   3.3.4 📊 Contar eventos nuevos por intervalo (para validación de cupo)
       │   │   3.3.5 💾 Preparar datos para inserción
       │   ↓
       │   3.4 ⚠️ Manejar errores por repetición (continuar con siguiente)
       ↓
    4. 📊 VALIDAR CUPO POR INTERVALO (segunda pasada)
       │   Considera: eventos existentes + eventos nuevos del request
       ↓
    5. ✅ SI TODAS LAS VALIDACIONES PASAN:
       │   5.1 🆔 Generar códigos únicos para eventos
       │   5.2 💽 INSERTAR todos los eventos en transacción
       │   5.3 🎉 Retornar éxito con datos de eventos creados
       ↓
    6. ❌ SI HAY ERRORES:
       │   6.1 📋 Retornar lista detallada de errores
       │   6.2 🔙 NO insertar nada (transacción rollback)

    VALIDACIONES REALIZADAS:
    1. ✅ Evento está COMPLETAMENTE dentro de un intervalo horario del usuario
    2. ✅ NO hay overlap con eventos existentes en estados activos
    3. ✅ NO se excede el cupo máximo del intervalo

    ESTADOS CONSIDERADOS:
    - OCUPAN espacio: PENDIENTE, EN_PROCESO, COMPLETADA
    - NO ocupan espacio: CANCELADA, REPROGRAMADA

    BACK-TO-BACK PERMITIDO: eventos pueden terminar/iniciar exactamente a la misma hora
    ===========================================================================
    """

    # ========================================================================
    # 1. 📥 RECEPCIÓN DE DATOS Y CONTEXTO
    # ========================================================================

    # Obtener información del JWT (autenticación y contexto)
    claims = get_jwt()
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]  # Código de compañía
    loccodigo = claims["seleccion"].get("loccodigo", "01")  # Código de localidad
    usrcodigo_planificador = claims["user"]  # Usuario que realiza la planificación
    ip_user = request.headers.get("X-Forwarded-For", request.remote_addr)  # IP del cliente

    # Parsear datos JSON del request
    data = request.get_json()
    cliente_codigo = data.get("cliente")  # Código del cliente
    cliente_nombre = data.get("clienteNombre")  # Nombre del cliente
    tareas = data.get("tareas", [])  # Lista de tareas a planificar

    # Validación básica: cliente y tareas son requeridos
    if not cliente_codigo or not tareas:
        return jsonify({"error": {"success": False, "errorType": "DATOS_INCOMPLETOS", "message": "Cliente y tareas son requeridos"}}), 400

    # Configurar conexión a base de datos según la compañía
    clicianonBD = claims["seleccion"]["clicianonBD"]
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Preparar fechas para auditoría (campos de sistema)
    fecha_actual = datetime.now()
    fecha_con_hora_cero = fecha_actual.replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, fecha_actual.hour, fecha_actual.minute, fecha_actual.second)

    try:
        with engine.connect() as connection:
            # Iniciar transacción: TODO O NADA
            with connection.begin():

                # ============================================================
                # 2. 📋 PREPARACIÓN DE ESTRUCTURAS DE DATOS
                # ============================================================

                eventos_a_insertar = []  # Lista de eventos validados para insertar
                eventos_nuevos_por_intervalo = defaultdict(int)  # Contador de eventos por intervalo
                errores_validacion = []  # Lista de errores encontrados

                # ============================================================
                # 3. 🔄 PRIMERA PASADA: VALIDACIÓN POR TAREA Y REPETICIÓN
                # ============================================================

                for idx_tarea, tarea in enumerate(tareas):
                    try:
                        # Extraer datos básicos de la tarea
                        pregcodigo = tarea.get("pregcodigo")  # Código de tarea
                        pregdescri = tarea.get("pregdescri")  # Descripción de tarea
                        usuario = tarea.get("usuario")  # Usuario asignado
                        usuario_nombre = tarea.get("usuarioNombre")  # Nombre del usuario
                        fecha_base = tarea.get("fechaBase")  # Fecha base para recurrencia
                        hora_inicio = tarea.get("horaInicio")  # Hora de inicio
                        duracion = tarea.get("duracion")  # Duración en minutos
                        recurrencia = tarea.get("recurrencia", "")  # Tipo de recurrencia
                        repeticiones = tarea.get("repeticiones", 1)  # Número de repeticiones
                        referenciaeventocodigoreprogramado = tarea.get("referenciaeventocodigoreprogramado", None)

                        # Validar datos obligatorios
                        if not all([pregcodigo, usuario, fecha_base, hora_inicio, duracion]):
                            raise PlanificacionError("DATOS_INCOMPLETOS_TAREA", f"Tarea {idx_tarea + 1} tiene datos incompletos", {"tarea_index": idx_tarea, "pregcodigo": pregcodigo})

                        # Calcular hora de fin del evento
                        hora_fin = calcular_hora_fin(hora_inicio, duracion)

                        # Generar todas las fechas de recurrencia
                        fechas = generar_fechas_recurrencia(fecha_base, recurrencia, repeticiones)

                        # Procesar cada fecha (repetición) individualmente
                        for idx_rep, fecha in enumerate(fechas):
                            try:
                                # ====================================================
                                # 3.3.1 🔍 ENCONTRAR INTERVALO HORARIO PARA ESTA FECHA
                                # ====================================================

                                intervalo_info = encontrar_horario_para_fecha(connection, ciacodigo, loccodigo, usuario, fecha, hora_inicio, hora_fin, {"pregcodigo": pregcodigo, "pregdescri": pregdescri, "usuario_nombre": usuario_nombre, "tarea_index": idx_tarea, "repeticion_index": idx_rep})

                                # ====================================================
                                # 3.3.2 ❌ VALIDAR NO OVERLAP CON EVENTOS EXISTENTES
                                # ====================================================

                                validar_overlap_eventos_existentes(connection, ciacodigo, loccodigo, usuario, fecha, hora_inicio, hora_fin, {"pregcodigo": pregcodigo, "pregdescri": pregdescri, "tarea_index": idx_tarea, "repeticion_index": idx_rep})

                                # ====================================================
                                # 3.3.3 📊 CONTAR EVENTOS NUEVOS POR INTERVALO
                                # ====================================================

                                # Usar tupla (usuario, fecha, hrsecuen) como clave única
                                key = (usuario, fecha, intervalo_info["hrsecuen"])
                                eventos_nuevos_por_intervalo[key] += 1

                                # ====================================================
                                # 3.3.4 💾 PREPARAR DATOS PARA INSERCIÓN
                                # ====================================================

                                evento_info = {
                                    "ciacodigo": ciacodigo,
                                    "loccodigo": loccodigo,
                                    "usuario": usuario,
                                    "fecha": fecha,
                                    "hora_inicio": hora_inicio,
                                    "hora_fin": hora_fin,
                                    "duracion": duracion,
                                    "pregcodigo": pregcodigo,
                                    "pregdescri": pregdescri,
                                    "usuario_nombre": usuario_nombre,
                                    "cliente_codigo": cliente_codigo,
                                    "cliente_nombre": cliente_nombre,
                                    "recurrencia": recurrencia,
                                    "repeticiones": repeticiones,
                                    "repeticion_actual": idx_rep + 1,  # 1-based index
                                    "fecha_base": fecha_base,
                                    "paquete_codigo": tarea.get("paqueteCodigo"),
                                    "formsecuen": tarea.get("formsecuen"),
                                    "intervalo_encontrado": intervalo_info,  # Horario encontrado
                                    "tarea_data": tarea,  # Datos originales para referencia
                                }

                                eventos_a_insertar.append(evento_info)

                            except PlanificacionError as e:
                                # Error en esta repetición específica
                                errores_validacion.append({"tarea_index": idx_tarea, "pregcodigo": pregcodigo, "pregdescri": pregdescri, "repeticion_index": idx_rep if "fechas" in locals() else 0, "error_type": e.tipo_error, "message": e.mensaje, "details": e.detalles})
                                # Continuar con siguiente repetición (no fallar toda la tarea)
                                continue

                    except PlanificacionError as e:
                        # Error general de la tarea
                        errores_validacion.append({"tarea_index": idx_tarea, "pregcodigo": tarea.get("pregcodigo"), "pregdescri": tarea.get("pregdescri"), "error_type": e.tipo_error, "message": e.mensaje, "details": e.detalles})
                        # Continuar con siguiente tarea
                        continue

                # ============================================================
                # 4. 📊 VALIDACIÓN DE CUPO (SEGUNDA PASADA)
                # ============================================================

                # Si hay errores en la primera pasada, retornar inmediatamente
                if errores_validacion:
                    return jsonify({"error": {"success": False, "errorType": "VALIDACION_FALLIDA", "message": f"Se encontraron {len(errores_validacion)} error(es) de validación", "validationErrors": errores_validacion}}), 400

                # Validar cupo para cada evento (necesita conteo completo de eventos nuevos)
                for evento in eventos_a_insertar:
                    try:
                        validar_cupo_intervalo(connection, ciacodigo, loccodigo, evento["usuario"], evento["fecha"], evento["intervalo_encontrado"], eventos_nuevos_por_intervalo, {"pregcodigo": evento["pregcodigo"], "pregdescri": evento["pregdescri"]})

                    except PlanificacionError as e:
                        errores_validacion.append({"pregcodigo": evento["pregcodigo"], "pregdescri": evento["pregdescri"], "fecha": evento["fecha"], "error_type": e.tipo_error, "message": e.mensaje, "details": e.detalles})

                # Si hay errores de cupo, retornar
                if errores_validacion:
                    return jsonify({"error": {"success": False, "errorType": "CUPO_EXCEDIDO", "message": f"Se encontraron {len(errores_validacion)} error(es) de cupo", "validationErrors": errores_validacion}}), 400

                # ============================================================
                # 5. ✅ INSERCIÓN DE EVENTOS (TODAS LAS VALIDACIONES PASARON)
                # ============================================================

                eventos_creados = []

                for evento in eventos_a_insertar:
                    # Generar código único para el evento

                    eventocodigo = generar_eventocodigo(connection, ciacodigo, loccodigo)

                    # tarea_data es la informacion original sin alterar de la tarea que envia el cliente
                    tarea_data = evento.get("tarea_data") or {}

                    pertenece_a_proceso_tecnicentro = tarea_data.get("procesocod") == "TECNICENTRO"

                    columnas_extra = ""
                    valores_extra = ""

                    if pertenece_a_proceso_tecnicentro:
                        columnas_extra = ", procesocod, placa"
                        valores_extra = ", :procesocod, :placa"

                    # Preparar query de inserción con todos los campos requeridos
                    insert_query = f"""
                    INSERT INTO gdocmeventos (
                        ciacodigo, loccodigo, eventocodigo,
                        pregcodigo, pregdescri,
                        paquetecodigo, formsecuen,
                        usrcodigo, usrnombre,
                        eventofecha, eventohorainicio, eventohorafin, eventoduracion,
                        clicodigo, clinombre,
                        eventorecuren, eventorecurensecuen, eventorecurennum, eventofechabase,
                        eventostatus,
                        eventofecisys, eventohorisys, eventousuisys, eventoestisys,
                        eventofecmsys, eventohormsys, eventousumsys, eventoestmsys, referenciaeventocodigoreprogramado
                        {columnas_extra}
                    ) VALUES (
                        :ciacodigo, :loccodigo, :eventocodigo,
                        :pregcodigo, :pregdescri,
                        :paquetecodigo, :formsecuen,
                        :usrcodigo, :usrnombre,
                        :eventofecha, :eventohorainicio, :eventohorafin, :eventoduracion,
                        :clicodigo, :clinombre,
                        :eventorecuren, :eventorecurensecuen, :eventorecurennum, :eventofechabase,
                        'PENDIENTE',
                        :fecisys, :horisys, :usuisys, :estisys,
                        :fecmsys, :hormsys, :usumsys, :estmsys, :referenciaeventocodigoreprogramado
                        {valores_extra}
                    )
                    """

                    # Determinar campos de recurrencia según el tipo de evento
                    if evento["recurrencia"] and evento["repeticiones"] > 1:
                        eventorecuren = evento["recurrencia"]
                        eventorecurensecuen = evento["repeticion_actual"]
                        eventorecurennum = evento["repeticiones"]
                    else:
                        eventorecuren = None
                        eventorecurensecuen = None
                        eventorecurennum = 0

                    # Convertir horas de string a datetime
                    hora_inicio_dt = datetime.strptime(evento["hora_inicio"], "%H:%M")
                    hora_fin_dt = datetime.strptime(evento["hora_fin"], "%H:%M")

                    # Combinar fecha con hora para campos datetime
                    eventofecha_dt = datetime.strptime(evento["fecha"], "%Y-%m-%d")
                    eventohorainicio_dt = datetime.combine(datetime(1900, 1, 1).date(), hora_inicio_dt.time())
                    eventohorafin_dt = datetime.combine(datetime(1900, 1, 1).date(), hora_fin_dt.time())

                    # Ejecutar inserción
                    params = {
                        "ciacodigo": ciacodigo,
                        "loccodigo": loccodigo,
                        "eventocodigo": eventocodigo,
                        "pregcodigo": evento["pregcodigo"],
                        "pregdescri": evento["pregdescri"],
                        "paquetecodigo": evento.get("paquete_codigo"),
                        "formsecuen": evento.get("formsecuen"),
                        "usrcodigo": evento["usuario"],
                        "usrnombre": evento["usuario_nombre"],
                        "eventofecha": eventofecha_dt,
                        "eventohorainicio": eventohorainicio_dt,
                        "eventohorafin": eventohorafin_dt,
                        "eventoduracion": evento["duracion"],
                        "clicodigo": evento["cliente_codigo"],
                        "clinombre": evento["cliente_nombre"],
                        "eventorecuren": eventorecuren,
                        "eventorecurensecuen": eventorecurensecuen,
                        "eventorecurennum": eventorecurennum,
                        "eventofechabase": datetime.strptime(evento["fecha_base"], "%Y-%m-%d"),
                        "fecisys": fecha_con_hora_cero,
                        "horisys": fecha_formato_1900,
                        "usuisys": usrcodigo_planificador,
                        "estisys": ip_user,
                        "fecmsys": fecha_con_hora_cero,
                        "hormsys": fecha_formato_1900,
                        "usumsys": usrcodigo_planificador,
                        "estmsys": ip_user,
                        "referenciaeventocodigoreprogramado": None,
                    }

                    if pertenece_a_proceso_tecnicentro:
                        params["procesocod"] = tarea_data.get("procesocod")
                        params["placa"] = tarea_data.get("placa")

                    connection.execute(text(insert_query), params)

                    # Si este nuevo evento a crear proviene de una reprogramacion,
                    # entonces actualizar referenciaeventocodigoreprogramado del evento origen
                    # con el valor que la secuencia de este evento nuevo

                    if referenciaeventocodigoreprogramado:
                        update_query = """
                            UPDATE gdocmeventos
                            SET referenciaeventocodigoreprogramado = :nextcodigoevento
                            WHERE ciacodigo = :ciacodigo
                            AND loccodigo = :loccodigo
                            AND eventocodigo = :eventocodigo
                            AND eventostatus = 'REPROGRAMADA'
                        """
                        connection.execute(text(update_query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "eventocodigo": referenciaeventocodigoreprogramado, "nextcodigoevento": eventocodigo})

                    # Guardar información del evento creado para la respuesta
                    eventos_creados.append(
                        {
                            "eventocodigo": eventocodigo,
                            "pregcodigo": evento["pregcodigo"],
                            "pregdescri": evento["pregdescri"],
                            "usuario": evento["usuario"],
                            "fecha": evento["fecha"],
                            "hora_inicio": evento["hora_inicio"],
                            "hora_fin": evento["hora_fin"],
                            "duracion": evento["duracion"],
                            "recurrencia": evento["recurrencia"],
                            "repeticion_actual": evento["repeticion_actual"],
                            "repeticiones_totales": evento["repeticiones"],
                            "intervalo": evento["intervalo_encontrado"],
                        }
                    )

                # ============================================================
                # 6. 🎉 RESPUESTA DE ÉXITO
                # ============================================================

                return jsonify({"success": True, "message": f"Planificación guardada exitosamente. {len(eventos_creados)} evento(s) creado(s)", "data": {"cliente": cliente_codigo, "clienteNombre": cliente_nombre, "totalEventos": len(eventos_creados), "eventos": eventos_creados}}), 200

    except Exception as e:
        # ============================================================
        # 7. ❌ MANEJO DE ERRORES NO CONTROLADOS
        # ============================================================

        # Log del error (en producción usar logging adecuado)
        print(f"Error general en guardarPlanificacion: {str(e)}")

        return jsonify({"error": {"success": False, "errorType": "ERROR_INTERNO", "message": f"Error interno del servidor: {str(e)}"}}), 500
