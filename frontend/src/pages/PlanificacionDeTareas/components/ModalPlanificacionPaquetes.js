import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  Alert,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  Tooltip,
  Divider,
  Paper,
} from "@mui/material"
import { Schedule, Delete, Add, Error as ErrorIcon, Warning, CheckCircle, Info } from "@mui/icons-material"
import dayjs from "../utils/dayjsConfig"
import { useQuery } from "@tanstack/react-query"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { showSuccess, showError } from "../utils/alertUtils"
import { useNavigate } from "react-router-dom"
import {
  obtenerTareasDePaquete,
  obtenerTareaPorCodigo,
  crearTareaParaPanel,
  calcularHorariosParaTareas,
  generarFechasRecurrentes,
  haySuperposicion,
  validarTareaCompleta,
  obtenerPrimerHorarioUsuario,
  formatearHorariosParaTooltip,
} from "../utils/planificacionHelpers"
import CustomAutocomplete from "../../../components/CustomAutocomplete"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomModalCreateCliente from "../../../components/CustomModalCreateCliente"
import ModalCreatePlacas from "./ModalCreatePlacas"
import { useQuery as CustomUseQuery } from "../../../api"

function formatearEventosParaMostrarenEnFrontendCalendario(data) {
  const { tareas } = data
  const nuevosEventos = []
  let contadorEventos = 0

  tareas.forEach((tarea) => {
    const numeroRepeticiones = Math.max(1, tarea.repeticiones || 1)
    const fechaBaseEvento = dayjs(tarea.fechaBase)

    for (let i = 0; i < numeroRepeticiones; i++) {
      let fechaEvento

      if (tarea.recurrencia && tarea.recurrencia !== "" && i > 0) {
        switch (tarea.recurrencia.toLowerCase()) {
          case "diaria":
            fechaEvento = fechaBaseEvento.add(i, "day")
            break
          case "semanal":
            fechaEvento = fechaBaseEvento.add(i, "week")
            break
          case "mensual":
            fechaEvento = fechaBaseEvento.add(i, "month")
            break
          case "anual":
            fechaEvento = fechaBaseEvento.add(i, "year")
            break
          default:
            fechaEvento = fechaBaseEvento
        }
      } else {
        fechaEvento = fechaBaseEvento
      }

      const horaInicio = dayjs(`${fechaEvento.format("YYYY-MM-DD")}T${tarea.horaInicio}`)
      const horaFin = horaInicio.add(tarea.duracion, "minute")

      contadorEventos++

      nuevosEventos.push({
        id: `${tarea.usuario}-${tarea.pregcodigo}-${i + 1}-${Date.now()}-${contadorEventos}`,
        title: `${tarea.pregdescri} - ${tarea.clienteNombre || ""}`,
        start: horaInicio.toISOString(),
        end: horaFin.toISOString(),
        backgroundColor: "#196C87",
        textColor: "#fff",
        extendedProps: {
          usrcodigo: tarea.usuario,
          usuarioNombre: tarea.usuarioNombre || tarea.usuario,
          clienteId: tarea.clienteId,
          clienteNombre: tarea.clienteNombre,
          tareaCodigo: tarea.pregcodigo,
          tareaDescripcion: tarea.pregdescri,
          duracionMinutos: tarea.duracion,
          paqueteCodigo: tarea.paqueteCodigo,
          origenPlanificacion: tarea.origen,
          esEliminable: tarea.esEliminable,
          recurrencia: tarea.recurrencia || "",
          numRepeticionSecuen: i + 1,
          numTotalRepeticiones: numeroRepeticiones,
          esRecurrente: !!(tarea.recurrencia && tarea.recurrencia !== "" && numeroRepeticiones > 1),
          fechaOriginal: fechaBaseEvento.format("YYYY-MM-DD"),
          fechaEjecucion: fechaEvento.format("YYYY-MM-DD"),
          formsecuen: tarea.formsecuen,
          pregrecuren: tarea.pregrecuren,
          pregrecurennum: tarea.pregrecurennum,
        },
      })
    }
  })

  return nuevosEventos
}

const transformarParaAutocomplete = (datosPlanificacion) => {
  const { paquetes = [], tareas = [] } = datosPlanificacion
  const opcionesTransformadas = []

  paquetes.forEach((paquete) => {
    opcionesTransformadas.push({
      value: `PAQUETE_${paquete.formcodigo}`,
      label: `📦 ${paquete.formdescri} - ${paquete.procesocod || "Sin proceso"}`,
    })
  })

  tareas.forEach((tarea) => {
    opcionesTransformadas.push({
      value: `TAREA_${tarea.pregcodigo}`,
      label: `📝 ${tarea.pregdescri} (${tarea.pregdurmin} min)`,
    })
  })

  return opcionesTransformadas
}

const ModalPlanificacionTareas = ({ open, onClose, selectedDate, onGuardarPlanificacion }) => {
  // Modal de creacion de cliente
  const [modalOpen, setModalOpen] = useState(false)
  const handleOpenModal = () => {
    setModalOpen(true)
  }
  const handleCloseModal = () => {
    setModalOpen(false)
  }

  const [modalOpenPlacas, setModalOpenPlacas] = useState(false)
  const handleOpenModalPlacas = () => {
    setModalOpenPlacas(true)
  }
  const handleCloseModalPlacas = () => {
    setModalOpenPlacas(false)
  }

  const navigate = useNavigate()
  // ⭐ ESTADOS
  const [formData, setFormData] = useState({
    cliente: null,
    clicodigo: "",
    clinombre: "",
    seleccionCombobox: "",
  })

  // SOLO SIRVE PARA TECNICENTRO
  const [placaSelectedCB, setPlacaSelectedCB] = useState(null)
  const [existenTareasConProcesoTecnicentro, setExistenTareasConProcesoTecnicentro] = useState(false)

  const {
    data: { data: allPlacasCB } = [],
    isLoading: isLoadingAllPlacasCB,
    refetch: refetchAllPlacasCB,
    isRefetching: isRefetchAllPlacasCB,
  } = CustomUseQuery({
    queryKey: ["isLoadingAllPlacasCB"],
    url: "/PlanificacionTareas/getAllPlacasCB",
    enabled: existenTareasConProcesoTecnicentro,
  })

  const [tareasEnPanel, setTareasEnPanel] = useState([])
  const [opcionesCombobox, setOpcionesCombobox] = useState([])
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null)
  const [tareaAdicionalSeleccionadaCombobox, setTareaAdicionalSeleccionadaCombobox] = useState(null)
  const [opcionesTareasAdicionales, setOpcionesTareasAdicionales] = useState([])
  const [datosPlanificacion, setDatosPlanificacion] = useState({ tareas: [], paquetes: [] })

  const [loading, setLoading] = useState(false)
  const [guardandoBackend, setGuardandoBackend] = useState(false)
  const [errores, setErrores] = useState([])
  const [conflictosBackend, setConflictosBackend] = useState([])
  const [showAgregarTarea, setShowAgregarTarea] = useState(false)
  const [tareaAAgregar, setTareaAAgregar] = useState("")

  const [showAgregarTareaReprogramar, setShowAgregarTareaReprogramar] = useState(false)
  const [tareaReprogramarAgregar, setTareaReprogramarAgregar] = useState("")
  const [tareaReprogramarSeleccionadaCombobox, setTareaReprogramarSeleccionadaCombobox] = useState(null)

  // ⭐ NUEVO: Estados para validación de horarios y cupos
  const [conflictosPanel, setConflictosPanel] = useState([])
  const [tareasConConflictos, setTareasConConflictos] = useState(new Set())
  const [validacionesPorTarea, setValidacionesPorTarea] = useState({})

  // ⭐ NUEVO: Estado para usuario de ayuda
  const [usuarioAyuda, setUsuarioAyuda] = useState(null)

  // ⭐ QUERIES
  const { data: datosSimulados = { tareas: [], paquetes: [] }, isLoading: cargandoDatos } = useQuery({
    queryKey: ["planificacionData"],
    queryFn: async () => {
      const response = await fetchwrapper(`/PlanificacionTareas/getAllPaquetesYTareas`)
      const result = await response.json()
      return result.data
      // return {

      //   tareas: [
      //     {
      //       pregcodigo: "TAA2500000301",
      //       pregdescri: "crear el usuario del sistema y asignar el perfil",
      //       pregdurmin: 5,
      //       pregrecuren: "",
      //       pregrecurennum: 0,
      //       pregstatus: "A",
      //     },
      //     {
      //       pregcodigo: "TAA2500000401",
      //       pregdescri: "envió de correo con credenciales",
      //       pregdurmin: 5,
      //       pregrecuren: "semanal",
      //       pregrecurennum: 4,
      //       pregstatus: "A",
      //     },
      //   ],
      //   paquetes: [
      //     {
      //       formcodigo: "PAA2500000501",
      //       formdescri: "PLAN SISTEMA CON FIRMA",
      //       procesocod: "Control SRI",
      //       tareasRelacionadas: [
      //         { pregcodigo: "TAA2500000301", formsecuen: 1 },
      //         { pregcodigo: "TAA2500000401", formsecuen: 2 },
      //       ],
      //     },
      //   ],
      // }
    },
    enabled: open,
  })

  const { data: usuariosFake = [], isLoading: cargandoUsuarios } = useQuery({
    queryKey: ["usuariosPlanificacion"],
    queryFn: async () => {
      const response = await fetchwrapper(`/PlanificacionTareas/getAllUsuariosCB`)
      const result = await response.json()
      return result.data
      // return [
      //   { value: "USR001", label: "Ana García (USR001)", usrcodigo: "USR001", usrnombre: "Ana García" },
      //   { value: "USR002", label: "Carlos López (USR002)", usrcodigo: "USR002", usrnombre: "Carlos López" },
      //   { value: "USR003", label: "María Rodríguez (USR003)", usrcodigo: "USR003", usrnombre: "María Rodríguez" },
      // ]
    },
  })

  const {
    data: clientesFake = [],
    isLoading: cargandoClientes,
    refetch: refetchAllClientes,
    isRefetching: isRefetchingAllClientes,
  } = useQuery({
    queryKey: ["clientesPlanificacion"],
    queryFn: async () => {
      const response = await fetchwrapper(`/PlanificacionTareas/getAllClientes`)
      const result = await response.json()
      return result.data
      // return [
      //   { value: "001", label: "CL Pedor García (001)", clicodigo: "001", clinombre: "CL Pedor García" },
      //   { value: "002", label: "CL Zamara López (002)", clicodigo: "002", clinombre: "CL Zamara López" },
      // ]
    },
  })

  const { data: horariosUsuariosFake = {}, isLoading: cargandoHorariosUsuarios } = useQuery({
    queryKey: ["horariosUsuarios"],
    queryFn: async () => {
      const response = await fetchwrapper(`/PlanificacionTareas/getAllHorariosUsuarios`)
      const result = await response.json()
      return result.data
    },
  })

  const { data: dataTareasAReprogramar = [], isLoading: cargandodataTareasAReprogramar } = useQuery({
    queryKey: ["tareasAReprogramar"],
    queryFn: async () => {
      const response = await fetchwrapper(`/PlanificacionTareas/getTareasAReprogramar`)
      const result = await response.json()
      return result.data || []
    },
  })

  // ⭐ EFECTO: Cargar datos de tareas y paquetes
  useEffect(() => {
    if (open && datosSimulados) {
      setDatosPlanificacion(datosSimulados)
      const opcionesAutocomplete = transformarParaAutocomplete(datosSimulados)
      setOpcionesCombobox(opcionesAutocomplete)

      const soloTareas = datosSimulados.tareas.map((t) => ({
        value: t.pregcodigo,
        label: `📝 ${t.pregdescri} (${t.pregdurmin} min)`,
        ...t,
      }))
      setOpcionesTareasAdicionales(soloTareas)

      resetearEstado()
    }
  }, [open, datosSimulados])

  // ⭐ EFECTO: Validar tareas cuando cambian
  useEffect(() => {
    if (tareasEnPanel.length > 0) {
      validarTodasLasTareas()
    } else {
      setConflictosPanel([])
      setTareasConConflictos(new Set())
      setValidacionesPorTarea({})
    }
  }, [tareasEnPanel])

  // ⭐ FUNCIÓN: Calcular hora fin
  const calcularHoraFin = (horaInicio, duracion) => {
    const [horas, minutos] = horaInicio.split(":").map(Number)
    const minutosTotales = horas * 60 + minutos + duracion
    const horasFin = Math.floor(minutosTotales / 60)
    const minutosFin = minutosTotales % 60
    return `${horasFin.toString().padStart(2, "0")}:${minutosFin.toString().padStart(2, "0")}`
  }

  // ⭐ FUNCIÓN: Resetear estado
  const resetearEstado = () => {
    setFormData({
      cliente: null,
      clicodigo: "",
      clinombre: "",
      seleccionCombobox: "",
    })

    setTareasEnPanel([])
    setErrores([])
    setConflictosBackend([])
    setConflictosPanel([])
    setTareasConConflictos(new Set())
    setValidacionesPorTarea({})
    setShowAgregarTarea(false)
    setTareaAAgregar("")
    setShowAgregarTareaReprogramar(false)
    setTareaReprogramarAgregar("")
    setTareaReprogramarSeleccionadaCombobox(null)
    setOpcionSeleccionada(null)
    setTareaAdicionalSeleccionadaCombobox(null)
    setUsuarioAyuda(null)

    setExistenTareasConProcesoTecnicentro(false)
  }

  // ⭐ FUNCIÓN NUEVA: Validar todas las tareas (horarios y cupos)
  const validarTodasLasTareas = useCallback(() => {
    const conflictos = []
    const tareasConProblemas = new Set()
    const nuevasValidaciones = {}

    tareasEnPanel.forEach((tarea, index) => {
      const validacion = validarTareaCompleta(tarea, horariosUsuariosFake, tareasEnPanel)
      nuevasValidaciones[tarea.id] = validacion

      if (validacion.tieneErrores) {
        tareasConProblemas.add(tarea.id)
        conflictos.push({
          tipo: "error_horario_cupo",
          tareaId: tarea.id,
          tareaNombre: tarea.pregdescri,
          usuario: tarea.usuarioAsignado?.usrnombre || "Sin usuario",
          fecha: tarea.fechaInicio || "Sin fecha",
          mensaje: validacion.errores[0] || "Error en validación",
          esBloqueante: true,
        })
      }
    })

    // También validar overlaps (existente pero mejorado)
    if (tareasEnPanel.length >= 2) {
      const todosLosEventosPanel = []

      tareasEnPanel.forEach((tarea, tareaIndex) => {
        if (!tarea.usuarioAsignado || !tarea.fechaInicio) return

        const repeticiones = Math.max(1, tarea.repeticionesActual)
        const fechaBase = dayjs(tarea.fechaInicio)
        const fechas = generarFechasRecurrentes(fechaBase, tarea.recurrenciaActual, repeticiones)

        fechas.forEach((fecha, repeticionIndex) => {
          const inicio = dayjs(`${fecha.format("YYYY-MM-DD")}T${tarea.horaInicio}`)
          const fin = dayjs(`${fecha.format("YYYY-MM-DD")}T${tarea.horaFin}`)

          todosLosEventosPanel.push({
            tareaIndex,
            tareaId: tarea.id,
            tareaNombre: tarea.pregdescri,
            usuarioCodigo: tarea.usuarioAsignado?.usrcodigo,
            usuarioNombre: tarea.usuarioAsignado?.usrnombre,
            repeticion: repeticionIndex + 1,
            fecha,
            inicio,
            fin,
            tieneRecurrencia: tarea.recurrenciaActual && repeticiones > 1,
          })
        })
      })

      const overlapsEncontrados = new Set()

      for (let i = 0; i < todosLosEventosPanel.length; i++) {
        for (let j = i + 1; j < todosLosEventosPanel.length; j++) {
          const eventoA = todosLosEventosPanel[i]
          const eventoB = todosLosEventosPanel[j]

          const mismoUsuario = eventoA.usuarioCodigo && eventoA.usuarioCodigo === eventoB.usuarioCodigo
          const mismaFecha = eventoA.fecha.isSame(eventoB.fecha, "day")

          if (mismoUsuario && mismaFecha) {
            if (haySuperposicion(eventoA.inicio, eventoA.fin, eventoB.inicio, eventoB.fin)) {
              const key = `${Math.min(i, j)}-${Math.max(i, j)}`
              if (!overlapsEncontrados.has(key)) {
                overlapsEncontrados.add(key)

                tareasConProblemas.add(eventoA.tareaId)
                tareasConProblemas.add(eventoB.tareaId)

                const infoRecurrenciaA = eventoA.tieneRecurrencia ? ` (${eventoA.repeticion}ª repetición)` : ""
                const infoRecurrenciaB = eventoB.tieneRecurrencia ? ` (${eventoB.repeticion}ª repetición)` : ""

                conflictos.push({
                  tipo: "overlap_panel",
                  usuario: eventoA.usuarioNombre,
                  fecha: eventoA.fecha.format("DD/MM/YYYY"),
                  tarea1Id: eventoA.tareaId,
                  tarea2Id: eventoB.tareaId,
                  tarea1: `${eventoA.tareaNombre}${infoRecurrenciaA}`,
                  tarea2: `${eventoB.tareaNombre}${infoRecurrenciaB}`,
                  horario1: `${eventoA.inicio.format("HH:mm")}-${eventoA.fin.format("HH:mm")}`,
                  horario2: `${eventoB.inicio.format("HH:mm")}-${eventoB.fin.format("HH:mm")}`,
                  mensaje: `Usuario "${eventoA.usuarioNombre}" tiene conflicto de horario: "${eventoA.tareaNombre}" se superpone con "${eventoB.tareaNombre}" el ${eventoA.fecha.format("DD/MM/YYYY")}`,
                  esBloqueante: true,
                })
              }
            }
          }
        }
      }
    }

    setConflictosPanel(conflictos)
    setTareasConConflictos(tareasConProblemas)
    setValidacionesPorTarea(nuevasValidaciones)

    return conflictos
  }, [tareasEnPanel])

  // ⭐ FUNCIÓN: Validaciones de UI
  const validarUI = () => {
    const erroresUI = []

    // Validaciones obligatorias globales
    if (!formData.clicodigo) {
      erroresUI.push("ERROR: Seleccione un cliente")
    }

    // Validaciones por tarea
    tareasEnPanel.forEach((tarea, index) => {
      const numeroTarea = index + 1

      if (!tarea.usuarioAsignado) {
        erroresUI.push(`Tarea ${numeroTarea} "${tarea.pregdescri}": ERROR - No tiene usuario asignado`)
      }

      if (!tarea.fechaInicio) {
        erroresUI.push(`Tarea ${numeroTarea} "${tarea.pregdescri}": ERROR - No tiene fecha de inicio`)
      }

      if (tarea.duracionActual < 1) {
        erroresUI.push(`Tarea ${numeroTarea} "${tarea.pregdescri}": ERROR - Duración debe ser mayor a 0 minutos`)
      }

      if (tarea.repeticionesActual > 365) {
        erroresUI.push(`Tarea ${numeroTarea} "${tarea.pregdescri}": ERROR - Máximo 365 repeticiones`)
      }

      const horaInicioRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!horaInicioRegex.test(tarea.horaInicio)) {
        erroresUI.push(`Tarea ${numeroTarea} "${tarea.pregdescri}": ERROR - Hora inicio inválida (${tarea.horaInicio})`)
      }
    })

    // Validaciones de horarios y cupos (de validacionesPorTarea)
    Object.values(validacionesPorTarea).forEach((validacion) => {
      if (validacion.tieneErrores) {
        erroresUI.push(...validacion.errores)
      }
    })

    // Validación de overlaps
    if (conflictosPanel.length > 0) {
      conflictosPanel.forEach((conflicto) => {
        erroresUI.push(`CONFLICTO: ${conflicto.mensaje}`)
      })
    }

    return {
      errores: erroresUI,
      tieneErrores: erroresUI.length > 0,
    }
  }

  // ⭐ FUNCIÓN: Otener el horario que se le asigno en el frontend a la tarea (recordar que un usuairo puede tener asignado 2 horarios para el mismo dia)
  const getHorarioTarea = (tarea) => {
    // 1. PRIMERO: Obtener la validación actual de esta tarea
    const validacionTarea = validacionesPorTarea[tarea.id]

    // 2. EXTRAER los datos del horario si la validación fue exitosa
    if (
      validacionTarea &&
      !validacionTarea.tieneErrores &&
      validacionTarea.datosValidacion?.validacionHorario?.horarioEncontrado
    ) {
      const horarioEncontrado = validacionTarea.datosValidacion.validacionHorario.horarioEncontrado

      // 3. Calcular el día de la semana desde la fecha de la tarea
      const fechaTarea = dayjs(tarea.fechaInicio)
      const diaSemana = fechaTarea.day() + 1 // dayjs: 0=domingo, 1=lunes...

      return {
        hrsecuen: horarioEncontrado.secuencia,
        dia: diaSemana,
        horaini: horarioEncontrado.inicio,
        horafin: horarioEncontrado.fin,
        cupo: horarioEncontrado.cupo,
      }
    }
  }

  // ⭐ FUNCIÓN: Preparar datos para backend
  const prepararDatosParaBackend = () => {
    return {
      cliente: formData.clicodigo,
      clienteNombre: formData.clinombre,
      tareas: tareasEnPanel.map((tarea) => ({
        horario: getHorarioTarea(tarea),
        pregcodigo: tarea.pregcodigo,
        pregdescri: tarea.pregdescri,
        usuario: tarea.usuarioAsignado?.usrcodigo,
        usuarioNombre: tarea.usuarioAsignado?.usrnombre,
        fechaBase: tarea.fechaInicio,
        horaInicio: tarea.horaInicio,
        duracion: tarea.duracionActual,
        recurrencia: tarea.recurrenciaActual || "",
        repeticiones: Math.max(1, tarea.repeticionesActual),
        paqueteCodigo: tarea.paqueteCodigo,
        origen: tarea.origen,
        esEliminable: tarea.esEliminable,
        formsecuen: tarea.formsecuen,
        pregrecuren: tarea.pregrecuren || "",
        pregrecurennum: tarea.pregrecurennum || 0,
        referenciaeventocodigoreprogramado: tarea.eventoOriginalCodigo || null,
        procesocod: tarea?.procesocod || null,
        // Solo las tareas que tengan el proceso TECNICENTRO se enviaran el backend el campo placa
        ...(tarea?.procesocod === "TECNICENTRO" && {
          placa: placaSelectedCB?.value || null, // Puede ser que el administrador ponga o no la placa ya que es opcional
        }),
      })),
    }
  }

  // ⭐ FUNCIÓN: Guardar en backend
  const guardarEnBackend = async () => {
    setGuardandoBackend(true)

    try {
      const datos = prepararDatosParaBackend()
      const options = {
        method: "POST",
        body: JSON.stringify(datos),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
      await fetchwrapper("/PlanificacionTareas/savePlanificacion", options)
    } catch (error) {
      console.error("Error en guardado backend:", error)
      throw error
    } finally {
      setGuardandoBackend(false)
    }
  }

  // ⭐ FUNCIÓN: Guardar planificación
  const manejarGuardar = async () => {
    setLoading(true)
    setErrores([])

    try {
      // 1. Validaciones de UI + horarios + cupos
      const { errores: erroresUI, tieneErrores } = validarUI()

      if (tieneErrores) {
        setErrores(erroresUI)
        setLoading(false)
        return
      }

      // 2. Si hay conflictos en el panel (horarios/cupos/overlaps), no continuar
      if (conflictosPanel.length > 0) {
        setErrores(["Hay conflictos de horario o cupo entre las tareas a planificar. Corríjalos antes de continuar."])
        setLoading(false)
        return
      }

      // 3. Guardar en backend
      await guardarEnBackend()

      // 4. Actualizar frontend
      if (onGuardarPlanificacion) {
        navigate(0)
      }

      // 5. Mostrar éxito
      await showSuccess(
        `✅ Planificación guardada exitosamente\n\n` +
          `• ${tareasEnPanel.length} tareas planificadas\n` +
          `• ${tareasEnPanel.reduce((sum, t) => sum + Math.max(1, t.repeticionesActual), 0)} eventos creados`,
      )

      manejarCerrar()
    } catch (error) {
      if (
        error.details &&
        (error.details.errorType === "CUPO_EXCEDIDO" || error.details.errorType === "VALIDACION_FALLIDA")
      ) {
        // Asignar directamente los validationErrors del backend
        setConflictosBackend(error.details.validationErrors)
      } else if (
        (error.details && error.details.errorType === "ERROR_INTERNO") ||
        (error.details && error.details.errorType === "DATOS_INCOMPLETOS")
      ) {
        setErrores([error.details.message || "Error interno al guardar la planificación en el servidor"])
      } else {
        // Error general si no tiene la estructura esperada
        setErrores([error.message || "Error al guardar la planificación en el servidor"])
      }
    } finally {
      setLoading(false)
    }
  }

  // ⭐ FUNCIÓN: Cerrar modal
  const manejarCerrar = () => {
    resetearEstado()
    onClose()
  }

  // ⭐ FUNCIÓN: Seleccionar en combobox principal
  const manejarSeleccionPrincipal = (valor) => {
    setFormData((prev) => ({ ...prev, seleccionCombobox: valor }))
    setErrores([])
    setConflictosBackend([])
    setConflictosPanel([])
    setTareasConConflictos(new Set())
    setValidacionesPorTarea({})

    if (!valor) {
      setTareasEnPanel([])
      return
    }

    const [tipo, codigo] = valor.split("_")

    // Calcular fecha base
    const fechaActual = selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")

    // Calcular hora inicio base según usuario de ayuda
    let horaInicioBase = "08:00" // default
    if (usuarioAyuda) {
      horaInicioBase = obtenerPrimerHorarioUsuario(usuarioAyuda.usrcodigo, fechaActual, horariosUsuariosFake)
    }

    if (tipo === "PAQUETE") {
      const tareasDelPaquete = obtenerTareasDePaquete(datosPlanificacion, codigo)
      // Verifico si al menos una tarea del paquete (el elemento cero) es de TECNICENTRO para poder mostrar el combobox de placas ya que posteriormente al momento de guardar las tareas tendra referencia esa placa en el registro de la bd (obviamente solo las tareas que tenga relacion con el proceso llamado TECNICENTRO)
      setExistenTareasConProcesoTecnicentro(tareasDelPaquete?.[0]?.procesocod === "TECNICENTRO")

      const tareasParaPanel = tareasDelPaquete.map((tareaDatos) =>
        crearTareaParaPanel(tareaDatos, "automatico", codigo, tareaDatos.formsecuen),
      )

      const tareasConDatosCompletos = tareasParaPanel.map((tarea) => ({
        ...tarea,
        usuarioAsignado: usuarioAyuda, // Usar usuario de ayuda si existe
        fechaInicio: fechaActual,
      }))

      const tareasConHorarios = calcularHorariosParaTareas(tareasConDatosCompletos, horaInicioBase)
      setTareasEnPanel(tareasConHorarios)
    } else if (tipo === "TAREA") {
      const tareaDatos = obtenerTareaPorCodigo(datosPlanificacion, codigo)
      if (tareaDatos) {
        const tareaParaPanel = crearTareaParaPanel(tareaDatos, "automatico", null, null)

        const tareaConDatosCompletos = {
          ...tareaParaPanel,
          usuarioAsignado: usuarioAyuda, // Usar usuario de ayuda si existe
          fechaInicio: fechaActual,
        }

        const tareaConHorario = calcularHorariosParaTareas([tareaConDatosCompletos], horaInicioBase)[0]
        setTareasEnPanel([tareaConHorario])
      }
    }
  }

  // ⭐ FUNCIÓN: Agregar tarea adicional
  const manejarAgregarTarea = () => {
    if (!tareaAAgregar) return

    const tareaDatos = obtenerTareaPorCodigo(datosPlanificacion, tareaAAgregar)
    if (!tareaDatos) return

    const nuevaTarea = crearTareaParaPanel(tareaDatos, "manual", null, null)

    // Calcular fecha y hora base
    const fechaActual = selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")

    let horaInicioBase = "08:00" // default
    if (usuarioAyuda) {
      horaInicioBase = obtenerPrimerHorarioUsuario(usuarioAyuda.usrcodigo, fechaActual, horariosUsuariosFake)
    }

    const nuevaTareaConDatos = {
      ...nuevaTarea,
      usuarioAsignado: usuarioAyuda, // Usar usuario de ayuda si existe
      fechaInicio: fechaActual,
    }

    const ultimaTarea = tareasEnPanel[tareasEnPanel.length - 1]
    const horaInicio = ultimaTarea ? ultimaTarea.horaFin : horaInicioBase
    const nuevaTareaConHorario = calcularHorariosParaTareas([nuevaTareaConDatos], horaInicio)[0]

    setTareasEnPanel((prev) => [...prev, nuevaTareaConHorario])
    setTareaAAgregar("")
    setTareaAdicionalSeleccionadaCombobox(null)
    setShowAgregarTarea(false)
  }

  // ⭐ FUNCIÓN: Agregar tarea reprogramada (CORREGIDA)
  const manejarAgregarTareaReprogramar = () => {
    if (!tareaReprogramarSeleccionadaCombobox) return

    // tareaReprogramarSeleccionadaCombobox es un EVENTO REPROGRAMADO
    const eventoReprogramado = tareaReprogramarSeleccionadaCombobox

    // Crear tarea ESPECIAL para reprogramación
    const nuevaTareaReprogramada = {
      id: `reprogramacion-${eventoReprogramado.eventocodigo}-${Date.now()}`,
      pregcodigo: eventoReprogramado.pregcodigo,
      pregdescri: eventoReprogramado.pregdescri,
      pregdurmin: eventoReprogramado.eventoduracion || eventoReprogramado.pregdurmin || 30,
      usuarioAsignado: {
        value: eventoReprogramado.usrcodigo,
        label: `${eventoReprogramado.usrcodigo} (${eventoReprogramado.usrnombre})`,
        usrcodigo: eventoReprogramado.usrcodigo,
        usrnombre: eventoReprogramado.usrnombre,
      },
      fechaInicio: dayjs().format("YYYY-MM-DD"), // Fecha actual por defecto
      horaInicio: "08:00", // Hora por defecto
      duracionActual: eventoReprogramado.eventoduracion || eventoReprogramado.pregdurmin || 30,
      horaFin: calcularHoraFin("08:00", eventoReprogramado.eventoduracion || eventoReprogramado.pregdurmin || 30),
      // IMPORTANTE: SIN RECURRENCIA en reprogramaciones
      recurrenciaActual: "",
      repeticionesActual: 0,
      // NUEVOS CAMPOS ESPECIALES:
      esReprogramacion: true,
      eventoOriginalCodigo: eventoReprogramado.eventocodigo,
      origen: "reprogramacion", // Diferente de "automatico" y "manual"
      // Datos del cliente
      clienteData: {
        clicodigo: eventoReprogramado.clicodigo,
        clinombre: eventoReprogramado.clinombre,
      },
      // Paquete si tiene
      paqueteCodigo: eventoReprogramado.paquetecodigo,
      formsecuen: eventoReprogramado.formsecuen,
      // Marcar como eliminable
      esEliminable: true,
    }

    // Si no hay cliente seleccionado, pre-cargarlo con el del evento
    if (!formData.clicodigo && eventoReprogramado.clicodigo) {
      setFormData((prev) => ({
        ...prev,
        cliente: {
          value: eventoReprogramado.clicodigo,
          label: `${eventoReprogramado.clinombre} (${eventoReprogramado.clicodigo})`,
          clicodigo: eventoReprogramado.clicodigo,
          clinombre: eventoReprogramado.clinombre,
        },
        clicodigo: eventoReprogramado.clicodigo,
        clinombre: eventoReprogramado.clinombre,
      }))
    }

    // Agregar al panel
    setTareasEnPanel((prev) => [...prev, nuevaTareaReprogramada])

    // Limpiar
    setTareaReprogramarSeleccionadaCombobox(null)
    setShowAgregarTareaReprogramar(false)
  }

  // ⭐ FUNCIÓN: Eliminar tarea
  const manejarEliminarTarea = (tareaId) => {
    const tarea = tareasEnPanel.find((t) => t.id === tareaId)
    if (tarea && (tarea.origen === "manual" || tarea.origen === "reprogramacion")) {
      setTareasEnPanel((prev) => prev.filter((t) => t.id !== tareaId))
    }
  }

  // ⭐ FUNCIÓN: Modificar tarea
  const manejarModificarTarea = (tareaId, campo, valor) => {
    setTareasEnPanel((prev) =>
      prev.map((tarea) => {
        if (tarea.id === tareaId) {
          const actualizada = { ...tarea, [campo]: valor }

          if (campo === "horaInicio" || campo === "duracionActual") {
            const [horas, minutos] = actualizada.horaInicio.split(":").map(Number)
            const minutosTotales = horas * 60 + minutos + actualizada.duracionActual
            const horasFin = Math.floor(minutosTotales / 60)
            const minutosFin = minutosTotales % 60
            actualizada.horaFin = `${horasFin.toString().padStart(2, "0")}:${minutosFin.toString().padStart(2, "0")}`
          }

          // Si es reprogramación, forzar sin recurrencia
          if (tarea.esReprogramacion) {
            actualizada.recurrenciaActual = ""
            actualizada.repeticionesActual = 0
          } else if (campo === "recurrenciaActual" && (!valor || valor === "")) {
            actualizada.repeticionesActual = 0
          }

          return actualizada
        }
        return tarea
      }),
    )
  }

  // ⭐ COMPONENTE: Render tarea CON VALIDACIONES DE HORARIO/CUPO Y SIMPLE ICONO INFO
  const renderTarea = (tarea, index) => {
    const esDelPaquete = tarea.paqueteCodigo !== null
    const esEliminable = tarea.esEliminable
    const tieneRecurrencia = tarea.recurrenciaActual && tarea.repeticionesActual > 1
    const tieneConflicto = tareasConConflictos.has(tarea.id)
    const validacionTarea = validacionesPorTarea[tarea.id]
    const tieneUsuarioYFecha = tarea.usuarioAsignado && tarea.fechaInicio
    const esReprogramacion = tarea.esReprogramacion

    // Determinar estado de validación
    let estadoValidacion = "pendiente"
    let mensajeValidacion = ""
    let infoCupo = ""

    if (validacionTarea) {
      if (validacionTarea.tieneErrores) {
        estadoValidacion = "error"
        mensajeValidacion = validacionTarea.errores[0]
      } else if (validacionTarea.datosValidacion) {
        estadoValidacion = "valido"
        const { validacionHorario, validacionCupo } = validacionTarea.datosValidacion

        if (validacionHorario.horarioEncontrado) {
          mensajeValidacion = validacionHorario.mensaje
        }

        if (validacionCupo.esIlimitado) {
          infoCupo = "∞ (Ilimitado)"
        } else {
          infoCupo = `${validacionCupo.cupoActual}/${validacionCupo.cupoMaximo}`
        }
      }
    }

    // Obtener información de horarios para el tooltip
    let tooltipHorarios = null
    if (tieneUsuarioYFecha) {
      tooltipHorarios = formatearHorariosParaTooltip(
        tarea.usuarioAsignado.usrcodigo,
        tarea.fechaInicio,
        horariosUsuariosFake,
      )
    }

    return (
      <Paper
        key={tarea.id}
        sx={{
          p: 2,
          mb: 2,
          borderLeft: `4px solid ${
            estadoValidacion === "error"
              ? "#f44336"
              : estadoValidacion === "valido"
                ? esDelPaquete
                  ? "#196C87"
                  : esReprogramacion
                    ? "#ff9800"
                    : "#4CAF50"
                : "#ff9800"
          }`,
          bgcolor:
            estadoValidacion === "error"
              ? "#ffebee"
              : esReprogramacion
                ? "#fff8e1"
                : esDelPaquete
                  ? "#f5f9fc"
                  : "#f8f9fa",
          position: "relative",
        }}
      >
        {/* Indicador de estado */}
        {estadoValidacion === "error" && (
          <Tooltip title={mensajeValidacion}>
            <Box sx={{ position: "absolute", top: 8, right: 8, color: "#f44336" }}>
              <ErrorIcon />
            </Box>
          </Tooltip>
        )}

        {estadoValidacion === "valido" && (
          <Tooltip title="Validación correcta">
            <Box sx={{ position: "absolute", top: 8, right: 8, color: "#4CAF50" }}>
              <CheckCircle />
            </Box>
          </Tooltip>
        )}

        {estadoValidacion === "pendiente" && (
          <Tooltip title="Validación pendiente">
            <Box sx={{ position: "absolute", top: 8, right: 8, color: "#ff9800" }}>
              <Warning />
            </Box>
          </Tooltip>
        )}

        {/* Icono de info de horarios - SOLO LECTURA */}
        {tieneUsuarioYFecha && (
          <Box sx={{ position: "absolute", top: 8, right: 40 }}>
            <Tooltip
              title={
                <Box>
                  <Typography variant="caption" sx={{ fontFamily: "monospace", whiteSpace: "pre-line" }}>
                    {tooltipHorarios?.contenido || "Cargando horarios..."}
                  </Typography>
                </Box>
              }
              arrow
              placement="left-start"
              sx={{
                "& .MuiTooltip-tooltip": {
                  maxWidth: 400,
                  bgcolor: "background.paper",
                  color: "text.primary",
                  border: "1px solid",
                  borderColor: "divider",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  whiteSpace: "pre-line",
                },
              }}
            >
              <IconButton
                size="small"
                sx={{
                  color: "info.main",
                  p: 0.5,
                  "&:hover": {
                    bgcolor: "info.light",
                  },
                }}
              >
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <Box display="flex" alignItems="flex-start">
          <Box flex={1}>
            {/* Header con chips de estado */}
            <Box display="flex" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 2 }}>
                {esDelPaquete ? "📦" : esReprogramacion ? "🔄" : "📝"} {tarea.pregdescri}
              </Typography>

              {esDelPaquete && <Chip label="Del paquete" size="small" color="primary" variant="outlined" />}
              {tarea.origen === "manual" && (
                <Chip label="Tarea adicional" size="small" color="warning" variant="outlined" />
              )}
              {tarea.origen === "reprogramacion" && (
                <Chip label={`🔄 Reprog. de ${tarea.eventoOriginalCodigo}`} color="warning" size="small" />
              )}
              {tieneRecurrencia && !esReprogramacion && (
                <Chip
                  label={`${tarea.recurrenciaActual} (${tarea.repeticionesActual}x)`}
                  size="small"
                  color="secondary"
                />
              )}

              {/* Chip de estado de validación */}
              {estadoValidacion === "error" && (
                <Chip icon={<ErrorIcon />} label="Error validación" color="error" size="small" />
              )}
              {estadoValidacion === "valido" && (
                <Chip icon={<CheckCircle />} label="Validado" color="success" size="small" variant="outlined" />
              )}

              {/* Información de horario y cupo */}
              {estadoValidacion === "valido" && mensajeValidacion && (
                <Chip
                  label={mensajeValidacion.replace("Dentro de horario: ", "🕒 ")}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
              {infoCupo && estadoValidacion === "valido" && (
                <Chip label={`📊 ${infoCupo}`} size="small" color="success" />
              )}
            </Box>

            {/* Mensaje de error si existe */}
            {estadoValidacion === "error" && (
              <Alert severity="error" sx={{ mb: 2, py: 0.5 }}>
                <Typography variant="body2">{mensajeValidacion}</Typography>
              </Alert>
            )}

            {/* Controles de configuración por tarea */}
            <Grid container spacing={2}>
              {/* Usuario asignado */}
              <Grid item xs={12} md={6}>
                <CustomAutocomplete
                  label="Usuario asignado *"
                  selectedOption={tarea.usuarioAsignado}
                  setSelectedOption={(usuario) => manejarModificarTarea(tarea.id, "usuarioAsignado", usuario)}
                  options={usuariosFake}
                  error={!tarea.usuarioAsignado}
                  helperText={!tarea.usuarioAsignado ? "ERROR: Seleccione un usuario" : ""}
                  size="small"
                />
              </Grid>

              {/* Fecha inicio */}
              <Grid item xs={12} md={6}>
                <InputLabel>Fecha inicio *</InputLabel>
                <TextField
                  type="date"
                  value={tarea.fechaInicio || ""}
                  onChange={(e) => manejarModificarTarea(tarea.id, "fechaInicio", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                  error={!tarea.fechaInicio}
                  helperText={!tarea.fechaInicio ? "ERROR: Seleccione una fecha" : ""}
                />
              </Grid>

              {/* Hora inicio */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Hora inicio *"
                  value={tarea.horaInicio}
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                  error={tieneConflicto || estadoValidacion === "error"}
                  onChange={(e) => manejarModificarTarea(tarea.id, "horaInicio", e.target.value)}
                />
              </Grid>

              {/* Duración */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Duración (min) *"
                  value={tarea.duracionActual}
                  type="number"
                  fullWidth
                  size="small"
                  inputProps={{ min: 1 }}
                  error={tieneConflicto || estadoValidacion === "error"}
                  onChange={(e) => manejarModificarTarea(tarea.id, "duracionActual", parseInt(e.target.value) || 1)}
                />
              </Grid>

              {/* Hora fin (calculada) */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Hora fin"
                  value={tarea.horaFin}
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                  disabled
                  error={tieneConflicto || estadoValidacion === "error"}
                />
              </Grid>

              {/* Duración original */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Duración original"
                  value={tarea.pregdurmin}
                  type="number"
                  fullWidth
                  size="small"
                  disabled
                  InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
                />
              </Grid>

              {/* Recurrencia - SOLO SI NO ES REPROGRAMACIÓN */}
              {!esReprogramacion && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de recurrencia</InputLabel>
                    <Select
                      value={tarea.recurrenciaActual || ""}
                      label="Tipo de recurrencia"
                      onChange={(e) => manejarModificarTarea(tarea.id, "recurrenciaActual", e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Sin recurrencia</em>
                      </MenuItem>
                      <MenuItem value="diaria">Diaria</MenuItem>
                      <MenuItem value="semanal">Semanal</MenuItem>
                      <MenuItem value="quincenal">Quincenal</MenuItem>
                      <MenuItem value="mensual">Mensual</MenuItem>
                      <MenuItem value="bimestral">Bimestral</MenuItem>
                      <MenuItem value="trimestral">Trimestral</MenuItem>
                      <MenuItem value="semestral">Semestral</MenuItem>
                      <MenuItem value="anual">Anual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Repeticiones - SOLO SI NO ES REPROGRAMACIÓN */}
              {!esReprogramacion && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Repeticiones"
                    value={tarea.repeticionesActual}
                    type="number"
                    fullWidth
                    size="small"
                    disabled={!tarea.recurrenciaActual}
                    inputProps={{ min: 0, max: 365 }}
                    onChange={(e) =>
                      manejarModificarTarea(tarea.id, "repeticionesActual", parseInt(e.target.value) || 0)
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {tarea.recurrenciaActual ? `${tarea.recurrenciaActual}(s)` : "veces"}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Botón eliminar */}
          {esEliminable && (
            <IconButton
              onClick={() => manejarEliminarTarea(tarea.id)}
              color="error"
              sx={{ ml: 2, mt: -1 }}
              title="Eliminar tarea"
            >
              <Delete />
            </IconButton>
          )}
        </Box>
      </Paper>
    )
  }

  // ⭐ Calcular si hay errores bloqueantes
  const hayErroresBloqueantes = useMemo(() => {
    return conflictosPanel.length > 0 || Object.values(validacionesPorTarea).some((v) => v.tieneErrores)
  }, [conflictosPanel, validacionesPorTarea])

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        // Solo permite cerrar con ESC, no con clic fuera
        if (reason !== "backdropClick") {
          manejarCerrar(event, reason)
        }
      }}
      maxWidth="lg"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          width: "90vw",
          maxWidth: "1200px",
          height: "95vh",
          maxHeight: "900px",
          margin: 2,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* TODO: AQUI SOLO CONSIDRERAR ALLPLCAS CB PYA QE USUA TECNICPLAZA */}
      <CustomBackdrop
        isLoading={
          cargandoDatos ||
          cargandoUsuarios ||
          cargandoClientes ||
          isRefetchingAllClientes ||
          loading ||
          cargandoHorariosUsuarios ||
          guardandoBackend ||
          cargandodataTareasAReprogramar ||
          isLoadingAllPlacasCB ||
          isRefetchAllPlacasCB
        }
      />

      {/* TÍTULO */}
      <DialogTitle
        sx={{
          bgcolor: "primary.main",
          color: "white",
          py: 2,
          flexShrink: 0,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Schedule sx={{ mr: 2 }} />
            <Typography variant="h5">Planificar Tareas</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {hayErroresBloqueantes && (
              <Chip
                icon={<ErrorIcon />}
                label={`${conflictosPanel.length + Object.values(validacionesPorTarea).filter((v) => v.tieneErrores).length} errores`}
                color="error"
                size="small"
              />
            )}
            <Chip
              label={`${tareasEnPanel.length} tareas`}
              variant="outlined"
              sx={{ color: "white", borderColor: "white" }}
            />
          </Box>
        </Box>
      </DialogTitle>

      {/* CONTENIDO PRINCIPAL */}
      <DialogContent
        sx={{
          p: 3,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Mensajes de error */}
        <Box sx={{ flexShrink: 0, mb: 3 }}>
          {errores.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrores([])}>
              <Typography variant="subtitle2" gutterBottom>
                Errores de validación:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {errores.slice(0, 5).map((error, i) => (
                  <li key={i}>
                    <Typography variant="body2">{error}</Typography>
                  </li>
                ))}
                {errores.length > 5 && (
                  <li>
                    <Typography variant="body2">... y {errores.length - 5} error(es) más</Typography>
                  </li>
                )}
              </ul>
            </Alert>
          )}

          {conflictosPanel.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                ⚠️ Conflictos detectados ({conflictosPanel.length}):
              </Typography>
              <Box sx={{ maxHeight: 120, overflow: "auto", mt: 1 }}>
                {conflictosPanel.slice(0, 3).map((conflicto, i) => (
                  <Box key={i} sx={{ p: 1, mb: 1, bgcolor: "error.light", borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {conflicto.mensaje}
                    </Typography>
                    {conflicto.horario1 && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {conflicto.horario1} vs {conflicto.horario2}
                      </Typography>
                    )}
                  </Box>
                ))}
                {conflictosPanel.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    ... y {conflictosPanel.length - 3} conflicto(s) más
                  </Typography>
                )}
              </Box>
            </Alert>
          )}

          {conflictosBackend.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setConflictosBackend([])}>
              <Typography variant="subtitle2" gutterBottom>
                {conflictosBackend.length > 1
                  ? `Se encontraron ${conflictosBackend.length} error(es) de validación`
                  : "Se encontró un error de validación"}
              </Typography>
              <Box sx={{ maxHeight: 120, overflow: "auto" }}>
                {conflictosBackend.slice(0, 3).map((conflicto, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1,
                      mb: 1,
                      bgcolor: "error.light",
                      borderRadius: 1,
                      borderLeft: "3px solid",
                      borderColor: "error.main",
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {conflicto.pregdescri} ({conflicto.fecha}): {conflicto.message}
                    </Typography>
                    {conflicto.details && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Código: {conflicto.pregcodigo} • Tipo: {conflicto.error_type}
                        {conflicto.details.intervalo && (
                          <span>
                            • Horario: {conflicto.details.intervalo.horaini}-{conflicto.details.intervalo.horafin}
                          </span>
                        )}
                      </Typography>
                    )}
                  </Box>
                ))}
                {conflictosBackend.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    ... y {conflictosBackend.length - 3} error(es) más
                  </Typography>
                )}
              </Box>
            </Alert>
          )}
        </Box>

        {/* CONTENIDO PRINCIPAL CON SCROLL */}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
          }}
        >
          <Grid
            container
            spacing={3}
            sx={{
              height: "100%",
              flex: 1,
              overflow: "hidden",
            }}
          >
            {/* COLUMNA IZQUIERDA - Configuración */}
            <Grid
              item
              xs={12}
              md={4}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Card
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <CardContent
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "auto",
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "#f1f1f1",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#888",
                      borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: "#555",
                    },
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
                    Configuración
                  </Typography>

                  <Grid container rowSpacing={2} columnSpacing={2}>
                    {/* Cliente */}
                    <Grid item xs={12}>
                      <CustomAutocomplete
                        label="Cliente *"
                        selectedOption={formData.cliente}
                        setSelectedOption={(v) => {
                          setFormData((prev) => ({
                            ...prev,
                            cliente: v,
                            clicodigo: v?.clicodigo ?? null,
                            clinombre: v?.clinombre ?? null,
                          }))
                        }}
                        options={clientesFake}
                        error={!formData.clicodigo}
                        helperText={!formData.clicodigo ? "ERROR: Seleccione un cliente" : ""}
                      />
                    </Grid>

                    {/* COMBOBOX SOLO SIRVE PARA TECNICENTRO */}
                    {existenTareasConProcesoTecnicentro && (
                      <Grid item xs={12}>
                        <CustomAutocomplete
                          label="Placas *"
                          selectedOption={placaSelectedCB}
                          setSelectedOption={setPlacaSelectedCB}
                          options={allPlacasCB}
                          // error={!placaSelectedCB.value}
                          // helperText={!placaSelectedCB.value ? "ERROR: Seleccione una placa" : ""}
                        />
                      </Grid>
                    )}

                    {/* Usuario de ayuda - NUEVO SIMPLIFICADO */}
                    <Grid item xs={12}>
                      <CustomAutocomplete
                        label="Usuario"
                        selectedOption={usuarioAyuda}
                        setSelectedOption={setUsuarioAyuda}
                        options={usuariosFake}
                        disabled={!formData.clicodigo || cargandoUsuarios}
                        placeholder="Seleccione un usuario como ayuda"
                        helperText="Este usuario se asignará a las tareas nuevas como ayuda"
                      />
                    </Grid>

                    {/* Combobox principal */}
                    <Grid item xs={12}>
                      <CustomAutocomplete
                        label="Planificación *"
                        selectedOption={opcionSeleccionada}
                        setSelectedOption={(nuevaOpcion) => {
                          setOpcionSeleccionada(nuevaOpcion)
                          if (nuevaOpcion) {
                            manejarSeleccionPrincipal(nuevaOpcion.value)
                          } else {
                            manejarSeleccionPrincipal("")
                          }
                        }}
                        options={opcionesCombobox || []}
                        disabled={cargandoDatos || loading || !formData.clicodigo}
                        placeholder="Buscar paquete o tarea..."
                        error={!formData.seleccionCombobox && tareasEnPanel.length === 0}
                        helperText={
                          !formData.seleccionCombobox && tareasEnPanel.length === 0
                            ? "ERROR: Seleccione un paquete o tarea"
                            : ""
                        }
                      />
                    </Grid>

                    {existenTareasConProcesoTecnicentro && (
                      <>
                        {/* Espacio flexible */}
                        <Grid item xs={12} sx={{ flex: 1, minHeight: "20px" }} />

                        <Grid item xs={12} sx={{ flexShrink: 0 }}>
                          <Button onClick={() => handleOpenModal()} variant="contained">
                            Crear nuevo cliente
                          </Button>

                          <CustomModalCreateCliente
                            open={modalOpen}
                            onClose={handleCloseModal}
                            onSuccess={() => {
                              refetchAllClientes()
                            }}
                          />
                        </Grid>
                      </>
                    )}

                    {/* BOTON SOLO PARA TECNICENTRO */}
                    {existenTareasConProcesoTecnicentro && (
                      <>
                        {/* Espacio flexible */}
                        <Grid item xs={12} sx={{ flex: 1, minHeight: "20px" }} />
                        <Grid item xs={12} sx={{ flexShrink: 0 }}>
                          <Button onClick={() => handleOpenModalPlacas()} variant="contained">
                            Crear nueva placa
                          </Button>

                          <ModalCreatePlacas
                            open={modalOpenPlacas}
                            onClose={handleCloseModalPlacas}
                            onSuccess={() => {
                              refetchAllPlacasCB()
                            }}
                          />
                        </Grid>
                      </>
                    )}

                    {/* Espacio flexible */}
                    <Grid item xs={12} sx={{ flex: 1, minHeight: "20px" }} />

                    {/* Sección para agregar tareas manuales */}
                    {formData.clicodigo && (
                      <Grid item xs={12} sx={{ flexShrink: 0 }}>
                        <Box sx={{ border: "1px dashed", borderColor: "divider", p: 2, borderRadius: 1 }}>
                          {!showAgregarTarea ? (
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<Add />}
                              onClick={() => setShowAgregarTarea(true)}
                              disabled={loading || !formData.clicodigo}
                            >
                              Agregar tarea manual
                            </Button>
                          ) : (
                            <Box>
                              <CustomAutocomplete
                                label="Seleccionar tarea"
                                selectedOption={tareaAdicionalSeleccionadaCombobox}
                                setSelectedOption={(nuevaOpcion) => {
                                  setTareaAdicionalSeleccionadaCombobox(nuevaOpcion)
                                  if (nuevaOpcion) {
                                    setTareaAAgregar(nuevaOpcion.value)
                                  } else {
                                    setTareaAAgregar("")
                                  }
                                }}
                                options={opcionesTareasAdicionales}
                                disabled={loading}
                              />
                              <Box display="flex" gap={1} mt={1}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={manejarAgregarTarea}
                                  disabled={!tareaAAgregar || loading}
                                  sx={{ flex: 1 }}
                                >
                                  Agregar
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setShowAgregarTarea(false)
                                    setTareaAAgregar("")
                                    setTareaAdicionalSeleccionadaCombobox(null)
                                  }}
                                  disabled={loading}
                                >
                                  Cancelar
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    )}

                    {/* Importar tareas a reprogramar - SIEMPRE VISIBLE */}
                    <Grid item xs={12} sx={{ flexShrink: 0 }}>
                      <Box
                        sx={{
                          border: "1px dashed",
                          borderColor: "warning.main",
                          p: 2,
                          borderRadius: 1,
                          bgcolor: "#fff8e1",
                        }}
                      >
                        {!showAgregarTareaReprogramar ? (
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setShowAgregarTareaReprogramar(true)}
                            disabled={loading || cargandodataTareasAReprogramar}
                            sx={{ color: "warning.dark", borderColor: "warning.light" }}
                          >
                            Agregar tareas a reprogramar
                          </Button>
                        ) : (
                          <Box>
                            <CustomAutocomplete
                              label="Seleccionar evento reprogramado"
                              selectedOption={tareaReprogramarSeleccionadaCombobox}
                              setSelectedOption={setTareaReprogramarSeleccionadaCombobox}
                              options={dataTareasAReprogramar.map((evento) => ({
                                value: evento.eventocodigo,
                                label: `🔄 ${evento.pregdescri} - ${evento.clinombre} (${dayjs(evento.eventofecha).format("DD/MM/YYYY")})`,
                                ...evento,
                              }))}
                              disabled={loading || cargandodataTareasAReprogramar}
                            />
                            <Box display="flex" gap={1} mt={1}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={manejarAgregarTareaReprogramar}
                                disabled={!tareaReprogramarSeleccionadaCombobox || loading}
                                sx={{ flex: 1, bgcolor: "warning.main" }}
                              >
                                Importar
                              </Button>
                              <Button
                                size="small"
                                onClick={() => {
                                  setShowAgregarTareaReprogramar(false)
                                  setTareaReprogramarSeleccionadaCombobox(null)
                                }}
                                disabled={loading}
                              >
                                Cancelar
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* COLUMNA DERECHA - Tareas con validación */}
            <Grid
              item
              xs={12}
              md={8}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Card
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderBottom: 1,
                    borderColor: "divider",
                    flexShrink: 0,
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6">Tareas a planificar</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Configure usuario y fecha para cada tarea - Validación estricta de horarios y cupos
                      </Typography>
                      <Typography variant="caption" color="info.main" display="block">
                        ℹ️ Click en icono ℹ️ para ver horarios del usuario
                      </Typography>
                      {hayErroresBloqueantes && (
                        <Typography variant="caption" color="error" display="block">
                          ⚠️ {conflictosPanel.length} conflicto(s) y{" "}
                          {Object.values(validacionesPorTarea).filter((v) => v.tieneErrores).length} error(es) de
                          validación
                        </Typography>
                      )}
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      {hayErroresBloqueantes && (
                        <Chip
                          icon={<ErrorIcon />}
                          label={`${Object.values(validacionesPorTarea).filter((v) => v.tieneErrores).length} con error`}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      )}
                      <Chip label={`${tareasEnPanel.length} tareas`} color="primary" variant="outlined" />
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ flexShrink: 0 }} />

                {/* CONTENIDO CON SCROLL */}
                <Box
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    p: 3,
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "#f1f1f1",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#888",
                      borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: "#555",
                    },
                  }}
                >
                  {tareasEnPanel.length > 0 ? (
                    <Box>
                      {/* Tareas automáticas */}
                      {tareasEnPanel.filter((t) => t.origen === "automatico").length > 0 && (
                        <Box mb={3}>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Tareas principales:
                          </Typography>
                          {tareasEnPanel.filter((t) => t.origen === "automatico").map(renderTarea)}
                        </Box>
                      )}

                      {/* Tareas manuales y reprogramaciones */}
                      {(tareasEnPanel.filter((t) => t.origen === "manual").length > 0 ||
                        tareasEnPanel.filter((t) => t.origen === "reprogramacion").length > 0) && (
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Tareas adicionales (puede eliminar):
                          </Typography>
                          {tareasEnPanel
                            .filter((t) => t.origen === "manual" || t.origen === "reprogramacion")
                            .map(renderTarea)}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        p: 4,
                        color: "text.secondary",
                      }}
                    >
                      <Schedule sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                      <Typography variant="h6" gutterBottom>
                        No hay tareas para mostrar
                      </Typography>
                      <Typography variant="body2" sx={{ maxWidth: 400 }}>
                        Seleccione un cliente y luego un paquete o tarea individual para comenzar
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      {/* ACCIONES */}
      <DialogActions
        sx={{
          p: 3,
          borderTop: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <Box>
            {tareasEnPanel.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Total eventos a crear: {tareasEnPanel.reduce((sum, t) => sum + Math.max(1, t.repeticionesActual), 0)}
                {hayErroresBloqueantes &&
                  ` • ${Object.values(validacionesPorTarea).filter((v) => v.tieneErrores).length + conflictosPanel.length} error(es)`}
              </Typography>
            )}
          </Box>

          <Box display="flex" gap={2}>
            <Button onClick={manejarCerrar} disabled={loading} size="large" variant="outlined">
              Cancelar
            </Button>
            <Button
              onClick={manejarGuardar}
              variant="contained"
              disabled={loading || tareasEnPanel.length === 0 || hayErroresBloqueantes}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              size="large"
              sx={{ minWidth: 200 }}
            >
              {loading ? "Procesando..." : "Guardar Planificación"}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default ModalPlanificacionTareas
