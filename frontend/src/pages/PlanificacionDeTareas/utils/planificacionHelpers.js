import dayjs from "./dayjsConfig"

/**
 * UTILIDADES PARA PROCESAMIENTO DE DATOS DE PLANIFICACIÓN
 * Convierte la estructura de datos del backend en formatos usables por los componentes
 */

/**
 * Procesa datos crudos del backend para crear opciones del combobox agrupadas
 */
// export const procesarParaCombobox = (data) => {
//   const { tareas = [], paquetes = [] } = data

//   // Grupo 1: Paquetes completos
//   const grupoPaquetes = paquetes.map((paquete) => ({
//     value: `PAQUETE_${paquete.formcodigo}`,
//     label: `${paquete.formdescri} (${paquete.tareasRelacionadas?.length || 0} tareas)`,
//     tipo: "paquete",
//     datos: {
//       formcodigo: paquete.formcodigo,
//       formdescri: paquete.formdescri,
//       tareasRelacionadas: paquete.tareasRelacionadas || [],
//     },
//   }))

//   // Grupo 2: Tareas individuales (TODAS las tareas disponibles)
//   const grupoTareas = tareas.map((tarea) => ({
//     value: `TAREA_${tarea.pregcodigo}`,
//     label: `${tarea.pregdescri} (${tarea.pregdurmin} min)`,
//     tipo: "tarea",
//     datos: {
//       pregcodigo: tarea.pregcodigo,
//       pregdescri: tarea.pregdescri,
//       pregdurmin: tarea.pregdurmin,
//       pregrecuren: tarea.pregrecuren || "",
//       pregrecurennum: tarea.pregrecurennum || 0,
//     },
//   }))

//   return [
//     { grupo: "📦 Paquetes", opciones: grupoPaquetes },
//     { grupo: "✅ Tareas Individuales", opciones: grupoTareas },
//   ]
// }

/**
 * Obtiene las tareas completas de un paquete específico
 */
export const obtenerTareasDePaquete = (data, formcodigo) => {
  const { tareas = [], paquetes = [] } = data
  const paquete = paquetes.find((p) => p.formcodigo === formcodigo)

  if (!paquete || !paquete.tareasRelacionadas) return []

  return paquete.tareasRelacionadas
    .map((relacion) => {
      const tareaCompleta = tareas.find((t) => t.pregcodigo === relacion.pregcodigo)
      if (!tareaCompleta) return null

      return {
        ...tareaCompleta,
        formsecuen: relacion.formsecuen,
        procesocod: paquete.procesocod,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.formsecuen - b.formsecuen)
}

/**
 * Encuentra una tarea por su código
 */
export const obtenerTareaPorCodigo = (data, pregcodigo) => {
  const { tareas = [] } = data
  return tareas.find((t) => t.pregcodigo === pregcodigo) || null
}

/**
 * Crea una tarea inicial para el panel derecho
 */
export const crearTareaParaPanel = (tareaDatos, origen, paqueteCodigo = null, formsecuen = null) => {
  const esEliminable = origen === "manual"

  return {
    id: `${origen}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    pregcodigo: tareaDatos.pregcodigo,
    pregdescri: tareaDatos.pregdescri,
    pregdurmin: tareaDatos.pregdurmin,
    pregrecuren: tareaDatos.pregrecuren || "",
    pregrecurennum: tareaDatos.pregrecurennum || 0,

    horaInicio: "08:00",
    horaFin: "08:00",
    duracionActual: tareaDatos.pregdurmin,
    recurrenciaActual: tareaDatos.pregrecuren || "",
    repeticionesActual: tareaDatos.pregrecurennum || 0,

    origen,
    esEliminable,
    paqueteCodigo,
    formsecuen,
    procesocod: tareaDatos?.procesocod || null,
  }
}

/**
 * Calcula horarios automáticos para tareas
 */
export const calcularHorariosParaTareas = (tareasEnPanel, horaInicioBase = "08:00") => {
  if (!tareasEnPanel.length) return tareasEnPanel

  const tareasOrdenadas = [...tareasEnPanel].sort((a, b) => {
    if (a.origen !== b.origen) return a.origen === "automatico" ? -1 : 1
    if (a.formsecuen !== null && b.formsecuen !== null) return a.formsecuen - b.formsecuen
    return 0
  })

  let horaActual = horaInicioBase

  return tareasOrdenadas.map((tarea) => {
    const [horas, minutos] = horaActual.split(":").map(Number)
    const horaInicio = `${horas.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}`

    const minutosTotales = horas * 60 + minutos + tarea.duracionActual
    const horasFin = Math.floor(minutosTotales / 60)
    const minutosFin = minutosTotales % 60
    const horaFin = `${horasFin.toString().padStart(2, "0")}:${minutosFin.toString().padStart(2, "0")}`

    horaActual = horaFin

    return {
      ...tarea,
      horaInicio,
      horaFin,
    }
  })
}

/**
 * Calcula el incremento CORRECTO según tipo de recurrencia usando Day.js
 */
export const calcularIncrementoRecurrencia = (tipoRecurrencia, numeroRepeticion) => {
  if (!tipoRecurrencia || tipoRecurrencia === "") return 0

  switch (tipoRecurrencia.toLowerCase()) {
    case "diaria":
      return { valor: numeroRepeticion, unidad: "day" }
    case "semanal":
      return { valor: numeroRepeticion, unidad: "week" }
    case "mensual":
      return { valor: numeroRepeticion, unidad: "month" }
    case "anual":
      return { valor: numeroRepeticion, unidad: "year" }
    case "quincenal":
      return { valor: numeroRepeticion * 15, unidad: "day" }
    case "bimestral":
      return { valor: numeroRepeticion * 2, unidad: "month" }
    case "trimestral":
      return { valor: numeroRepeticion * 3, unidad: "month" }
    case "semestral":
      return { valor: numeroRepeticion * 6, unidad: "month" }
    default:
      return { valor: 0, unidad: "day" }
  }
}

/**
 * Genera todas las fechas para eventos recurrentes CORRECTAMENTE usando Day.js
 */
export const generarFechasRecurrentes = (fechaBase, tipoRecurrencia, numeroRepeticiones) => {
  const fechas = [dayjs(fechaBase)]

  if (!tipoRecurrencia || tipoRecurrencia === "" || numeroRepeticiones <= 1) {
    return fechas
  }

  for (let i = 1; i < numeroRepeticiones; i++) {
    let fechaRecurrente

    switch (tipoRecurrencia.toLowerCase()) {
      case "diaria":
        fechaRecurrente = dayjs(fechaBase).add(i, "day")
        break
      case "semanal":
        fechaRecurrente = dayjs(fechaBase).add(i, "week")
        break
      case "mensual":
        fechaRecurrente = dayjs(fechaBase).add(i, "month")
        break
      case "anual":
        fechaRecurrente = dayjs(fechaBase).add(i, "year")
        break
      case "quincenal":
        fechaRecurrente = dayjs(fechaBase).add(i * 15, "day")
        break
      case "bimestral":
        fechaRecurrente = dayjs(fechaBase).add(i * 2, "month")
        break
      case "trimestral":
        fechaRecurrente = dayjs(fechaBase).add(i * 3, "month")
        break
      case "semestral":
        fechaRecurrente = dayjs(fechaBase).add(i * 6, "month")
        break
      default:
        fechaRecurrente = dayjs(fechaBase)
    }

    fechas.push(fechaRecurrente)
  }

  return fechas
}

/**
 * Valida si dos rangos de fecha/hora se superponen
 */
export const haySuperposicion = (inicio1, fin1, inicio2, fin2) => {
  const inicioA = dayjs(inicio1)
  const finA = dayjs(fin1)
  const inicioB = dayjs(inicio2)
  const finB = dayjs(fin2)

  // Superposición ocurre si:
  // 1. A comienza antes que B termine Y A termina después que B comience
  return inicioA.isBefore(finB) && finA.isAfter(inicioB)
}
// ⭐ HELPER NUEVO: Contar tareas en un horario específico
export const contarTareasEnHorario = (usuarioId, fecha, horarioEspecifico, tareasEnPanel) => {
  let count = 0

  tareasEnPanel.forEach((tarea) => {
    if (tarea.usuarioAsignado?.usrcodigo === usuarioId && tarea.fechaInicio === fecha) {
      // Contar repeticiones si hay recurrencia
      const repeticiones = Math.max(1, tarea.repeticionesActual)

      for (let i = 0; i < repeticiones; i++) {
        let fechaRepeticion
        if (tarea.recurrenciaActual && tarea.recurrenciaActual !== "") {
          switch (tarea.recurrenciaActual.toLowerCase()) {
            case "diaria":
              fechaRepeticion = dayjs(fecha).add(i, "day")
              break
            case "semanal":
              fechaRepeticion = dayjs(fecha).add(i, "week")
              break
            case "mensual":
              fechaRepeticion = dayjs(fecha).add(i, "month")
              break
            case "anual":
              fechaRepeticion = dayjs(fecha).add(i, "year")
              break
            default:
              fechaRepeticion = dayjs(fecha)
          }
        } else {
          fechaRepeticion = dayjs(fecha)
        }

        if (fechaRepeticion.format("YYYY-MM-DD") === fecha) {
          // Verificar si cae dentro del mismo horario
          const tareaInicio = dayjs(`2000-01-01T${tarea.horaInicio}`)
          const tareaFin = dayjs(`2000-01-01T${tarea.horaFin}`)
          const horarioInicio = dayjs(`2000-01-01T${horarioEspecifico.inicio}`)
          const horarioFin = dayjs(`2000-01-01T${horarioEspecifico.fin}`)

          if (tareaInicio.isSameOrAfter(horarioInicio) && tareaFin.isSameOrBefore(horarioFin)) {
            count++
          }
        }
      }
    }
  })

  return count
}

// ⭐ HELPER NUEVO: Validar cupo disponible - POLÍTICA ESTRICTA
export const validarCupoDisponible = (usuarioId, fecha, horario, tareasEnPanel) => {
  // CASO 1: Error de configuración - BLOQUEANTE
  if (horario.cupo === null) {
    return {
      disponible: false,
      error: "CUPO_NO_DEFINIDO",
      mensaje: `ERROR: Cupo no definido para este horario (${horario.inicio}-${horario.fin})`,
      esBloqueante: true,
    }
  }

  // CASO 2: Error de configuración - BLOQUEANTE
  if (horario.cupo < 0) {
    return {
      disponible: false,
      error: "CUPO_NEGATIVO",
      mensaje: `ERROR: Cupo negativo (${horario.cupo}) no permitido`,
      esBloqueante: true,
    }
  }

  // CASO 3: Cupo ilimitado - Solo validar horario
  if (horario.cupo === 0) {
    return {
      disponible: true,
      cupoActual: 0,
      cupoMaximo: 0,
      mensaje: `Cupo ilimitado (${horario.inicio}-${horario.fin})`,
      esIlimitado: true,
    }
  }

  // CASO 4: Cupo limitado - Contar y validar
  const tareasAsignadas = contarTareasEnHorario(usuarioId, fecha, horario, tareasEnPanel)
  const disponible = tareasAsignadas < horario.cupo

  return {
    disponible,
    tareasAsignadas,
    cupoMaximo: horario.cupo,
    cupoActual: tareasAsignadas,
    mensaje: disponible
      ? `Cupo disponible: ${tareasAsignadas}/${horario.cupo}`
      : `ERROR: Cupo excedido (${tareasAsignadas}/${horario.cupo})`,
    esBloqueante: !disponible,
  }
}

// ⭐ HELPER NUEVO: Validar si tarea está dentro de horario permitido
/**
 * Valida si una tarea está completamente dentro de un horario permitido
 * Versión robusta con mejor manejo de errores
 */
export const validarTareaEnHorario = (horaInicio, duracionMinutos, horariosDisponibles) => {
  console.log("🔍 validarTareaEnHorario llamado con:", { horaInicio, duracionMinutos, horariosDisponibles })

  // 1. Validaciones básicas del input
  if (!horaInicio || typeof horaInicio !== "string" || horaInicio.trim() === "") {
    return {
      valido: false,
      horarioEncontrado: null,
      mensaje: "ERROR: Hora de inicio no proporcionada o inválida",
    }
  }

  // 2. Validar formato HH:mm estricto
  const horaRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/ // HH:mm estricto (siempre 2 dígitos)
  if (!horaRegex.test(horaInicio)) {
    // Intentar corregir formato H:mm -> HH:mm
    const correctedHora = horaInicio.padStart(5, "0")
    if (horaRegex.test(correctedHora)) {
      horaInicio = correctedHora
    } else {
      return {
        valido: false,
        horarioEncontrado: null,
        mensaje: `ERROR: Formato de hora "${horaInicio}" inválido. Use formato HH:mm (ej: 08:30, 14:00)`,
      }
    }
  }

  // 3. Crear objetos Day.js con validación
  let horaInicioObj, horaFinObj

  try {
    // Usar una fecha base para comparar solo horas
    const fechaBase = "2000-01-01"
    const fechaHoraInicio = `${fechaBase}T${horaInicio}`

    console.log("📅 Creando Day.js con:", fechaHoraInicio)

    horaInicioObj = dayjs(fechaHoraInicio)

    // Validar que Day.js se creó correctamente
    if (!horaInicioObj || typeof horaInicioObj.isValid !== "function") {
      throw new Error("Day.js no se inicializó correctamente")
    }

    if (!horaInicioObj.isValid()) {
      throw new Error(`Hora inválida: ${horaInicio}`)
    }

    horaFinObj = horaInicioObj.add(duracionMinutos, "minutes")

    if (!horaFinObj.isValid()) {
      throw new Error(`Error al calcular hora final`)
    }

    console.log("✅ Objetos Day.js creados:", {
      horaInicioObj: horaInicioObj.format(),
      horaFinObj: horaFinObj.format(),
      isValid: horaInicioObj.isValid() && horaFinObj.isValid(),
    })
  } catch (error) {
    console.error("❌ Error al crear objetos Day.js:", error)
    return {
      valido: false,
      horarioEncontrado: null,
      mensaje: `ERROR: ${error.message}`,
    }
  }

  // 4. Verificar que los objetos tengan los métodos necesarios
  if (typeof horaInicioObj.isSameOrAfter !== "function" || typeof horaInicioObj.isSameOrBefore !== "function") {
    console.error("❌ Objeto Day.js no tiene métodos necesarios:", horaInicioObj)
    return {
      valido: false,
      horarioEncontrado: null,
      mensaje: "ERROR: Objeto de tiempo no tiene métodos de comparación",
    }
  }

  // 5. Validar contra horarios disponibles
  if (!Array.isArray(horariosDisponibles) || horariosDisponibles.length === 0) {
    return {
      valido: false,
      horarioEncontrado: null,
      mensaje: "ERROR: No hay horarios disponibles para validar",
    }
  }

  for (const horario of horariosDisponibles) {
    // Validar formato del horario
    if (!horario.inicio || !horario.fin) {
      console.warn("⚠️ Horario sin inicio o fin:", horario)
      continue
    }

    // Asegurar formato HH:mm para horarios
    let inicioHorarioStr = horario.inicio
    let finHorarioStr = horario.fin

    if (!horaRegex.test(inicioHorarioStr)) {
      inicioHorarioStr = inicioHorarioStr.padStart(5, "0")
    }
    if (!horaRegex.test(finHorarioStr)) {
      finHorarioStr = finHorarioStr.padStart(5, "0")
    }

    try {
      const fechaBase = "2000-01-01"
      const inicioHorarioObj = dayjs(`${fechaBase}T${inicioHorarioStr}`)
      const finHorarioObj = dayjs(`${fechaBase}T${finHorarioStr}`)

      // Validar objetos Day.js del horario
      if (!inicioHorarioObj.isValid() || !finHorarioObj.isValid()) {
        console.warn("⚠️ Horario con formato inválido:", horario)
        continue
      }

      // Verificar métodos
      if (typeof inicioHorarioObj.isSameOrAfter !== "function") {
        console.error("❌ Horario Day.js no tiene métodos:", inicioHorarioObj)
        continue
      }

      console.log("🔄 Comparando:", {
        tarea: `${horaInicioObj.format("HH:mm")}-${horaFinObj.format("HH:mm")}`,
        horario: `${inicioHorarioObj.format("HH:mm")}-${finHorarioObj.format("HH:mm")}`,
      })

      // Tarea debe estar COMPLETAMENTE dentro del horario
      const estaCompletamenteDentro =
        horaInicioObj.isSameOrAfter(inicioHorarioObj) && horaFinObj.isSameOrBefore(finHorarioObj)

      console.log("📊 Resultado comparación:", estaCompletamenteDentro)

      if (estaCompletamenteDentro) {
        return {
          valido: true,
          horarioEncontrado: horario,
          mensaje: `Dentro de horario: ${inicioHorarioStr}-${finHorarioStr}`,
        }
      }
    } catch (error) {
      console.error("❌ Error al comparar con horario:", horario, error)
      continue
    }
  }

  return {
    valido: false,
    horarioEncontrado: null,
    mensaje: "ERROR: La tarea no se encuentra completamente dentro de ningún horario permitido",
  }
}

// ⭐ HELPER NUEVO: Obtener horarios del usuario para una fecha específica
export const obtenerHorariosUsuario = (usrcodigo, fecha, horariosUsuarios) => {
  if (!horariosUsuarios || !horariosUsuarios[usrcodigo]) {
    return {
      error: "USUARIO_NO_ENCONTRADO",
      horarios: [],
      mensaje: `Usuario ${usrcodigo} no encontrado en sistema de horarios`,
    }
  }

  const diaSemana = dayjs(fecha).day() + 1 // Day.js: 0=Domingo, 1=Lunes → convertir a 1-7
  const usuarioHorarios = horariosUsuarios[usrcodigo]
  const horariosDia = usuarioHorarios.horariosPorDia[diaSemana] || []

  if (horariosDia.length === 0) {
    return {
      error: "SIN_HORARIOS_DIA",
      horarios: [],
      mensaje: `Usuario no tiene horarios configurados para este día (${dayjs(fecha).format("dddd")})`,
    }
  }

  // Validar configuración de cupos
  const horariosConErrores = horariosDia.filter((h) => h.cupo === null || h.cupo < 0)
  if (horariosConErrores.length > 0) {
    const horarioConError = horariosConErrores[0]
    const tipoError = horarioConError.cupo === null ? "CUPO_NO_DEFINIDO" : "CUPO_NEGATIVO"

    return {
      error: tipoError,
      horarios: horariosDia,
      mensaje: `Error en configuración de cupo: ${tipoError} para horario ${horarioConError.inicio}-${horarioConError.fin}`,
    }
  }

  return {
    diaSemana,
    horarios: horariosDia,
    tieneHorarios: true,
    mensaje: `Horarios encontrados: ${horariosDia.length} intervalo(s)`,
  }
}

// ⭐ HELPER NUEVO: Formatear horarios para tooltip simple
export const formatearHorariosParaTooltip = (usuarioId, fecha, horariosUsuarios) => {
  if (!usuarioId || !fecha) {
    return {
      tieneHorarios: false,
      mensaje: "No hay usuario o fecha seleccionada",
      contenido: "Seleccione un usuario y fecha",
    }
  }

  const horariosUsuario = obtenerHorariosUsuario(usuarioId, fecha, horariosUsuarios)

  if (horariosUsuario.error || !horariosUsuario.horarios || horariosUsuario.horarios.length === 0) {
    return {
      tieneHorarios: false,
      mensaje: horariosUsuario.mensaje || "No hay horarios configurados",
      contenido: horariosUsuario.mensaje || "Sin horarios disponibles",
    }
  }

  const nombreDia = dayjs(fecha).format("dddd")
  const horariosFormateados = horariosUsuario.horarios.map((horario, index) => {
    const cupoTexto = horario.cupo === 0 ? "∞ Ilimitado" : `${horario.cupo} cupo(s)`
    const estado = horario.cupo === null ? "❌ Sin cupo" : horario.cupo < 0 ? "❌ Cupo negativo" : "✅"

    return `${index + 1}. ${horario.inicio} - ${horario.fin} (${cupoTexto}) ${estado}`
  })

  const contenido = [
    `📅 ${nombreDia} - ${fecha}`,
    `👤 ${usuarioId}`,
    ``,
    `Horarios disponibles:`,
    ...horariosFormateados,
    ``,
    `ℹ️ Total: ${horariosFormateados.length} horario(s)`,
  ].join("\n")

  return {
    tieneHorarios: true,
    diaSemana: horariosUsuario.diaSemana,
    nombreDia,
    mensaje: `${horariosFormateados.length} horarios disponibles`,
    contenido,
  }
}

// ⭐ HELPER NUEVO: Validación completa de tarea con horarios y cupos
export const validarTareaCompleta = (tarea, horariosUsuarios, tareasEnPanel) => {
  const errores = []

  // Validaciones básicas
  if (!tarea.usuarioAsignado) {
    errores.push("ERROR: No tiene usuario asignado")
    return { errores, tieneErrores: true }
  }

  if (!tarea.fechaInicio) {
    errores.push("ERROR: No tiene fecha de inicio")
    return { errores, tieneErrores: true }
  }

  const usrcodigo = tarea.usuarioAsignado.usrcodigo
  const fecha = tarea.fechaInicio

  // 1. Validar que usuario tenga horarios configurados
  const resultadoHorarios = obtenerHorariosUsuario(usrcodigo, fecha, horariosUsuarios)

  if (resultadoHorarios.error) {
    errores.push(`ERROR: ${resultadoHorarios.mensaje}`)
    return { errores, tieneErrores: true }
  }

  // 2. Validar que tarea esté dentro de horario permitido
  const validacionHorario = validarTareaEnHorario(tarea.horaInicio, tarea.duracionActual, resultadoHorarios.horarios)

  if (!validacionHorario.valido) {
    errores.push(`ERROR: ${validacionHorario.mensaje}`)
    return { errores, tieneErrores: true }
  }

  // 3. Validar cupo disponible
  const validacionCupo = validarCupoDisponible(usrcodigo, fecha, validacionHorario.horarioEncontrado, tareasEnPanel)

  if (validacionCupo.error) {
    errores.push(`ERROR: ${validacionCupo.mensaje}`)
    return { errores, tieneErrores: true }
  }

  if (!validacionCupo.disponible && !validacionCupo.esIlimitado) {
    errores.push(`ERROR: ${validacionCupo.mensaje}`)
    return { errores, tieneErrores: true }
  }

  return { errores, tieneErrores: false, datosValidacion: { validacionHorario, validacionCupo } }
}

// ⭐ HELPER NUEVO: Obtener primer horario del usuario para una fecha
export const obtenerPrimerHorarioUsuario = (usuarioId, fecha, horariosUsuarios) => {
  if (!usuarioId || !fecha) return "08:00" // fallback

  const horariosUsuario = obtenerHorariosUsuario(usuarioId, fecha, horariosUsuarios)

  if (horariosUsuario.error || !horariosUsuario.horarios || horariosUsuario.horarios.length === 0) {
    return "08:00" // fallback si no hay horarios
  }

  // Tomar el primer horario del día
  return horariosUsuario.horarios[0].inicio // ej: "08:00" o "09:00"
}
