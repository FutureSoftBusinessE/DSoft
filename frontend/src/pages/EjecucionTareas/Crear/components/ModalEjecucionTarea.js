import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
  CircularProgress,
} from "@mui/material"
import dayjs, { formatDateForDisplay, parseStringToDayjs } from "../utils/dayjsConfig" // Importar utilidades
import { showError } from "../utils/alertUtils"
import { useQuery } from "@tanstack/react-query"
// import datosEjecucionPorTipo from "../data/datosFake"
import fetchwrapper from "../../../../services/interceptors/fetchwrapper"
import DocumentosAsociadosComponent from "../../../../components/DocumentosAsociadosComponent/DocumentosAsociadosComponent"
import CustomAutocomplete from "../../../../components/CustomAutocomplete"
import { useQuery as CustomUseQuery } from "../../../../api"
import CustomModalCreateCliente from "../../../../components/CustomModalCreateCliente"
import ModalCreatePlacas from "../../../PlanificacionDeTareas/components/ModalCreatePlacas"

// Función para obtener color según estado
const getColorByStatus = (status) => {
  switch (status) {
    case "PENDIENTE":
      return "warning" // Usar nombre de color de Material-UI
    case "EN_PROCESO":
      return "primary"
    case "COMPLETADA":
      return "success"
    case "CANCELADA":
      return "error"
    case "REPROGRAMADA":
      return "default"
    default:
      return "default"
  }
}

// ============================================
// COMPONENTES INTERNOS PARA LOS TIPOS DE TAREA
// ============================================

const TipoTareaTexto = ({ value, onChange, disabled, obligatoria }) => {
  return (
    <TextField
      fullWidth
      label="Texto libre"
      multiline
      rows={4}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      margin="normal"
      size="small"
      disabled={disabled}
      placeholder="Escriba aquí..."
      required={obligatoria}
      inputProps={{ maxLength: 5000 }}
    />
  )
}

const TipoTareaLista = ({ opciones, value, onChange, disabled, obligatoria, opcionCorrecta }) => {
  return (
    <FormControl fullWidth size="small" margin="normal" required={obligatoria}>
      <InputLabel>Seleccione una opción</InputLabel>
      <Select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        label="Seleccione una opción"
        disabled={disabled}
      >
        {opciones.map((opcion) => (
          <MenuItem key={opcion.pregsecuen} value={opcion.pregsecuen}>
            {opcion.pregdescri}
            {opcion.pregRespuesta && " ✅"}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

const TipoTareaMultiple = ({ opciones, value, onChange, disabled, obligatoria }) => {
  const handleChange = (secuencia) => {
    const newValue = Array.isArray(value) ? [...value] : []
    const index = newValue.indexOf(secuencia)

    if (index === -1) {
      newValue.push(secuencia)
    } else {
      newValue.splice(index, 1)
    }

    onChange(newValue.sort((a, b) => a - b))
  }

  return (
    <FormControl fullWidth size="small" margin="normal" required={obligatoria}>
      <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
        Seleccione una o más opciones
      </Typography>
      <Box sx={{ maxHeight: 200, overflow: "auto", border: "1px solid #ccc", borderRadius: 1, p: 1 }}>
        {opciones.map((opcion) => (
          <FormControlLabel
            key={opcion.pregsecuen}
            control={
              <Checkbox
                checked={Array.isArray(value) && value.includes(opcion.pregsecuen)}
                onChange={() => handleChange(opcion.pregsecuen)}
                disabled={disabled}
                size="small"
              />
            }
            label={opcion.pregdescri}
            sx={{ mb: 0.5 }}
          />
        ))}
      </Box>
    </FormControl>
  )
}

// ============================================
// QUERY PARA OBTENER DATOS DEL EVENTO (FAKE)
// ============================================

const useGetEventoData = (eventocodigo, setEsTareaConProcesoTecnicentro, setClienteSelectedCB, setPlacaSelectedCB) => {
  return useQuery({
    queryKey: ["EjecucionTareas", "getEventoData", eventocodigo],
    queryFn: async () => {
      if (!eventocodigo) return

      const options = {
        method: "POST",
        body: JSON.stringify({ eventocodigo }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
      let response = await fetchwrapper("/EjecucionTareas/getSpecificEvent", options)
      response = await response.json()

      // if (response?.data?.evento?.procesocod === "TECNICENTRO") {
      //   setEsTareaConProcesoTecnicentro(true)
      //   if (response?.data?.evento?.clicodigo && response?.data?.evento?.clinombre) {
      //     setClienteSelectedCB({
      //       value: response?.data?.evento?.clicodigo,
      //       label: `${response?.data?.evento?.clinombre} (${response?.data?.evento?.clicodigo})`,
      //     })
      //   }

      //   if (response?.data?.evento?.placa) {
      //     setPlacaSelectedCB({ value: response?.data?.evento?.placa, label: response?.data?.evento?.placa })
      //   }
      // }

      return response.data
    },
    // enabled: !!eventocodigo,
    refetchOnWindowFocus: false, // No recargar al cambiar de ventana
    refetchOnMount: false, // No recargar al montar si ya hay datos en caché
    refetchOnReconnect: false, // No recargar al reconectar
    onError: (error) => {
      console.log("Error fetching evento data:", error.message)
    },
  })
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ModalEjecucionTarea = ({
  open,
  onClose,
  eventocodigo, // Solo recibe el código del evento
  onGuardarEjecucion,
}) => {
  // Modal de creacion de cliente
  const [modalOpenCliente, setModalOpenCliente] = useState(false)
  const handleOpenModalCliente = () => {
    setModalOpenCliente(true)
  }
  const handleCloseModalCliente = () => {
    setModalOpenCliente(false)
  }
  // Modal de placas
  const [modalOpenPlacas, setModalOpenPlacas] = useState(false)
  const handleOpenModalPlacas = () => {
    setModalOpenPlacas(true)
  }
  const handleCloseModalPlacas = () => {
    setModalOpenPlacas(false)
  }

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    status: "",
    porcentaje: 0,
    comentario: "",
    respuestaTextoLibre: "",
    respuestaListaSecuencia: null,
    respuestaMultipleSecuencias: [],
    fechaEjecucionReal: null,
  })

  const [ejecucionFueraRango, setEjecucionFueraRango] = useState({
    fuera: false,
    tipo: "",
    mensaje: "",
  })

  // SOLO SIRVE PARA TECNICENTRO
  const [clienteSelectedCB, setClienteSelectedCB] = useState(null)
  const [placaSelectedCB, setPlacaSelectedCB] = useState(null)
  const [esTareaConProcesoTecnicentro, setEsTareaConProcesoTecnicentro] = useState(false)

  const {
    data: allClientesCB = [],
    isLoading: isLoadingAllClientesCB,
    refetch: refetchAllClientesCB,
    isRefetching: isRefetchAllClientesCB,
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
    enabled: esTareaConProcesoTecnicentro,
  })

  const {
    data: { data: allPlacasCB } = [],
    isLoading: isLoadingAllPlacasCB,
    refetch: refetchAllPlacasCB,
    isRefetching: isRefetchAllPlacasCB,
  } = CustomUseQuery({
    queryKey: ["isLoadingAllPlacasCB"],
    url: "/PlanificacionTareas/getAllPlacasCB",
    enabled: esTareaConProcesoTecnicentro,
  })

  // Query para obtener datos del evento
  const {
    data: eventoDataResponse = {},
    isLoading: isLoadingEventoData,
    isError: isErrorEventoData,
    isFetching: isFetchingEventoData,
  } = useGetEventoData(eventocodigo, setEsTareaConProcesoTecnicentro, setClienteSelectedCB, setPlacaSelectedCB)

  // Extraer datos de la respuesta
  const eventoData = eventoDataResponse?.data || eventoDataResponse || {}

  useEffect(() => {
    if (eventoData?.evento?.procesocod === "TECNICENTRO") {
      setEsTareaConProcesoTecnicentro(true)

      if (eventoData?.evento?.clicodigo && eventoData?.evento?.clinombre) {
        setClienteSelectedCB({
          value: eventoData?.evento?.clicodigo,
          label: `${eventoData?.evento?.clinombre.replace(/\s*\(\d+\)$/, "")} (${eventoData?.evento?.clicodigo})`,
          clinombre: eventoData?.evento?.clinombre.replace(/\s*\(\d+\)$/, ""),
        })
      } else {
        setClienteSelectedCB(null)
      }

      if (eventoData?.evento?.placa) {
        setPlacaSelectedCB({
          value: eventoData?.evento?.placa,
          label: eventoData?.evento?.placa,
        })
      } else {
        setPlacaSelectedCB(null)
      }
    } else {
      setEsTareaConProcesoTecnicentro(false)
      setClienteSelectedCB(null)
      setPlacaSelectedCB(null)
    }
  }, [eventoData])

  // Estados disponibles según reglas de negocio
  const estadosPermitidos = {
    PENDIENTE: ["EN_PROCESO", "COMPLETADA", "CANCELADA", "REPROGRAMADA"],
    EN_PROCESO: ["EN_PROCESO", "COMPLETADA", "CANCELADA", "REPROGRAMADA"],
    COMPLETADA: ["EN_PROCESO"],
    CANCELADA: [],
    REPROGRAMADA: [],
  }

  // Obtener los datos de manera convencional
  const evento = eventoData.evento || {}
  const tarea = eventoData.tarea || {}
  const opcionesTarea = eventoData.opcionesTarea || []
  const historialEjecuciones = eventoData.historialEjecuciones || []
  const respuestaTextoLibre = eventoData.respuestaTextoLibre || ""
  const respuestaListaSecuencia = eventoData.respuestaListaSecuencia || null
  const respuestaMultipleSecuencias = eventoData.respuestaMultipleSecuencias || []

  // Inicializar datos cuando se abre el modal y se cargan los datos
  useEffect(() => {
    if (open && evento && Object.keys(evento).length > 0) {
      // Cargar datos iniciales
      setFormData({
        status: evento.eventostatus || "PENDIENTE",
        porcentaje: evento.porcentajeavance || 0,
        comentario: "",
        respuestaTextoLibre: respuestaTextoLibre || "",
        respuestaListaSecuencia: respuestaListaSecuencia || null,
        respuestaMultipleSecuencias: respuestaMultipleSecuencias || [],
      })

      // Verificar si ejecución está fuera de rango
      verificarHorarioEjecucion()
    }
  }, [open, evento, respuestaTextoLibre, respuestaListaSecuencia, respuestaMultipleSecuencias])

  const verificarHorarioEjecucion = () => {
    if (!evento || !evento.eventofecha || !evento.eventohorainicio || !evento.eventohorafin) return

    const ahora = dayjs()

    // Parsear fechas usando la función robusta que ya tienes
    const fechaEvento = parseStringToDayjs(evento.eventofecha)
    const inicioProgramado = parseStringToDayjs(evento.eventohorainicio)
    const finProgramado = parseStringToDayjs(evento.eventohorafin)

    // Crear fechas completas combinando fecha del evento con horas programadas
    const inicioCompleto = fechaEvento
      .set("hour", inicioProgramado.hour())
      .set("minute", inicioProgramado.minute())
      .set("second", inicioProgramado.second())
      .set("millisecond", 0)

    const finCompleto = fechaEvento
      .set("hour", finProgramado.hour())
      .set("minute", finProgramado.minute())
      .set("second", finProgramado.second())
      .set("millisecond", 0)

    let fuera = false
    let tipo = ""
    let mensaje = ""

    if (ahora.isBefore(inicioCompleto)) {
      fuera = true
      tipo = "ANTICIPADA"
      const minutosAnticipacion = inicioCompleto.diff(ahora, "minutes")
      const horas = Math.floor(minutosAnticipacion / 60)
      const minutos = minutosAnticipacion % 60

      if (horas > 0) {
        mensaje = `Se está ejecutando ${horas} hora${horas !== 1 ? "s" : ""} y ${minutos} minuto${minutos !== 1 ? "s" : ""} antes del horario programado`
      } else {
        mensaje = `Se está ejecutando ${minutos} minuto${minutos !== 1 ? "s" : ""} antes del horario programado`
      }

      mensaje += ` (Ejecución: ${formatDateForDisplay(ahora)} | Programado: ${formatDateForDisplay(inicioCompleto)})`
    } else if (ahora.isAfter(finCompleto)) {
      fuera = true
      tipo = "ATRASADA"
      const minutosAtraso = ahora.diff(finCompleto, "minutes")
      const horas = Math.floor(minutosAtraso / 60)
      const minutos = minutosAtraso % 60

      if (horas > 0) {
        mensaje = `Se está ejecutando ${horas} hora${horas !== 1 ? "s" : ""} y ${minutos} minuto${minutos !== 1 ? "s" : ""} después del horario programado`
      } else {
        mensaje = `Se está ejecutando ${minutos} minuto${minutos !== 1 ? "s" : ""} después del horario programado`
      }

      mensaje += ` (Ejecución: ${formatDateForDisplay(ahora)} | Horario límite: ${formatDateForDisplay(finCompleto)})`
    }

    setEjecucionFueraRango({ fuera, tipo, mensaje })
  }

  const handleChange = (field) => (event) => {
    const value = event.target.value

    // REGLA ESPECIAL: Si estado cambia a COMPLETADA, forzar 100%
    if (field === "status" && value === "COMPLETADA") {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        porcentaje: 100,
        fechaEjecucionReal: null,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleRespuestaChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validarGuardado = () => {
    // Validación 1: Comentario obligatorio
    if (!formData.comentario.trim() || formData.comentario.trim().length < 10) {
      showError("Debe escribir un comentario de al menos 10 caracteres")
      return false
    }

    // Validación 2: Transición de estado permitida
    const estadoActual = evento.eventostatus || "PENDIENTE"
    const estadosValidos = estadosPermitidos[estadoActual] || []

    if (formData.status !== estadoActual && !estadosValidos.includes(formData.status)) {
      showError(`No puede cambiar de ${estadoActual} a ${formData.status}`)
      return false
    }

    // Validación 3: Estados terminales requieren confirmación
    if (["CANCELADA", "REPROGRAMADA"].includes(formData.status)) {
      const confirm = window.confirm(
        `⚠️ ATENCIÓN: Al marcar como ${formData.status}, la tarea quedará BLOQUEADA permanentemente.\n\n¿Está completamente seguro?`,
      )
      if (!confirm) return false
    }

    // Validación 4: Tarea obligatoria según tipo
    if (tarea.pregobligatoria) {
      const tipo = tarea.pregtipo

      if (tipo === "U" && !formData.respuestaTextoLibre?.trim()) {
        showError("Debe completar el campo de texto libre (tarea obligatoria)")
        return false
      }

      if (tipo === "L" && !formData.respuestaListaSecuencia) {
        showError("Debe seleccionar una opción (tarea obligatoria)")
        return false
      }

      if (
        tipo === "M" &&
        (!Array.isArray(formData.respuestaMultipleSecuencias) || formData.respuestaMultipleSecuencias.length === 0)
      ) {
        showError("Debe seleccionar al menos una opción (tarea obligatoria)")
        return false
      }
    }

    // Validación 5 (Solo para tecnicentro): Obligatorio tener seleccionado un cliente y placa

    if (esTareaConProcesoTecnicentro) {
      if (!clienteSelectedCB) {
        showError("Es obligatorio seleccionar un cliente")
        return false
      }

      if (!placaSelectedCB) {
        showError("Es obligatorio seleccionar una placa")
        return false
      }
    }

    // Si el estado es COMPLETADA, validar la fecha (solo si se proporcionó)
    if (formData.status === "COMPLETADA") {
      // Si el usuario ingresó una fecha, validar que sea válida
      if (formData.fechaEjecucionReal && !formData.fechaEjecucionReal.isValid()) {
        showError("La fecha seleccionada no es válida")
        return false
      }
      // Si no hay fecha, está bien (se guardara fecha actual al backend)
    }
    return true
  }

  const handleGuardar = async () => {
    if (!validarGuardado()) return

    setLoading(true)

    try {
      // Preparar datos para guardar según tipo
      const datosGuardar = {
        eventocodigo,
        eventostatus: formData.status,
        porcentajeavance: formData.porcentaje,
        comentario: formData.comentario,
        ejecucionFueraRango: ejecucionFueraRango.fuera,
        tipoFueraRango: ejecucionFueraRango.fuera ? ejecucionFueraRango.tipo : null,
        respuestaTextoLibre: null,
        respuestaListaSecuencia: null,
        respuestaMultipleSecuencias: null,

        // Agregar fecha de ejecución real si el estado es COMPLETADA
        ...(formData.status === "COMPLETADA" && {
          fechaEjecucionReal: formData.fechaEjecucionReal
            ? formData.fechaEjecucionReal.format("YYYY-MM-DD HH:mm:ss")
            : null,
        }),

        procesocod: eventoData?.evento?.procesocod,
        ...(esTareaConProcesoTecnicentro
          ? {
              placa: placaSelectedCB.value,
              clicodigo: clienteSelectedCB.value,
              clinombre: clienteSelectedCB.clinombre,
            }
          : {}),
      }

      // Agregar respuesta según tipo
      const tipo = tarea.pregtipo
      if (tipo === "U") {
        datosGuardar.respuestaTextoLibre = formData.respuestaTextoLibre
      } else if (tipo === "L") {
        datosGuardar.respuestaListaSecuencia = formData.respuestaListaSecuencia
      } else if (tipo === "M") {
        datosGuardar.respuestaMultipleSecuencias = Array.isArray(formData.respuestaMultipleSecuencias)
          ? formData.respuestaMultipleSecuencias
          : []
      }

      // Llamar a función de guardado del componente padre
      await onGuardarEjecucion(datosGuardar)
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Si el evento está en estado terminal, mostrar sólo lectura
  const esEstadoTerminal = ["CANCELADA", "REPROGRAMADA"].includes(evento.eventostatus)
  const esEditable = !esEstadoTerminal

  // Loading state
  const isLoading = isLoadingEventoData || isFetchingEventoData

  if (!open) return null

  // Mostrar loading mientras se cargan los datos
  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>Cargando datos del evento...</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    )
  }

  if (isErrorEventoData) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">Error al cargar los datos del evento. Intente nuevamente.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    )
  }

  if (!evento || Object.keys(evento).length === 0) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Alert severity="warning">No se encontraron datos para el evento seleccionado.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    )
  }

  const pregtipo = tarea.pregtipo
  const pregobligatoria = tarea.pregobligatoria
  const instidescri = tarea.instidescri
  const esPresencial = tarea.esPresencial
  const opcionesActivas = opcionesTarea.filter((op) => op.pregstatus === "A")

  // Calcular texto de recurrencia
  const textoRecurrencia =
    evento.eventorecurennum > 0
      ? `${evento.eventorecuren} (${evento.eventorecurensecuen}/${evento.eventorecurennum})`
      : null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {evento.eventocodigo} - {evento.pregdescri}
          </Typography>
          <Chip label={evento.eventostatus} color={getColorByStatus(evento.eventostatus)} size="small" />
        </Box>
        <Typography variant="body2" color="textSecondary">
          Usuario: {evento.usrnombre}
        </Typography>
        {!esTareaConProcesoTecnicentro && (
          <Typography variant="body2" color="textSecondary">
            Cliente: {evento.clinombre}
          </Typography>
        )}
        <Typography variant="body2" color="textSecondary">
          Institución:{instidescri || "Ninguno"}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Es presencial: {esPresencial ? "Si" : "No"}
        </Typography>
        {esTareaConProcesoTecnicentro && (
          <>
            <CustomAutocomplete
              label="Cliente *"
              selectedOption={clienteSelectedCB}
              setSelectedOption={setClienteSelectedCB}
              options={allClientesCB || []}
            />

            <CustomAutocomplete
              label="Placas *"
              selectedOption={placaSelectedCB}
              setSelectedOption={setPlacaSelectedCB}
              options={allPlacasCB || []}
            />

            <Box display="flex" alignItems="center" gap={2} sx={{ mt: 1 }}>
              <Button onClick={() => handleOpenModalCliente()} variant="contained" sx={{ mr: 1 }}>
                Crear nuevo cliente
              </Button>
              <CustomModalCreateCliente
                open={modalOpenCliente}
                onClose={handleCloseModalCliente}
                onSuccess={() => {
                  refetchAllClientesCB()
                }}
              />
              <Button onClick={() => handleOpenModalPlacas()} variant="contained" sx={{ mr: 1 }}>
                Crear nueva placa
              </Button>
              <ModalCreatePlacas
                open={modalOpenPlacas}
                onClose={handleCloseModalPlacas}
                onSuccess={() => {
                  refetchAllPlacasCB()
                }}
              />
            </Box>
          </>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {/* Información del evento */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Fecha programada:
            </Typography>
            <Typography variant="body1">
              {evento.eventofecha ? parseStringToDayjs(evento.eventofecha).format("DD/MM/YYYY") : "N/A"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Horario programado:
            </Typography>
            <Typography variant="body1">
              {evento.eventohorainicio ? parseStringToDayjs(evento.eventohorainicio).format("HH:mm") : "N/A"} -
              {evento.eventohorafin ? parseStringToDayjs(evento.eventohorafin).format("HH:mm") : "N/A"}
            </Typography>
          </Grid>

          {evento.paquetecodigo && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                Paquete:
              </Typography>
              <Typography variant="body1">
                {evento.paquetecodigo} [{evento.formsecuen}]
              </Typography>
            </Grid>
          )}

          {textoRecurrencia && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                Recurrencia:
              </Typography>
              <Typography variant="body1">{textoRecurrencia}</Typography>
            </Grid>
          )}

          {evento.eventofechabase && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Fecha base recurrencia:
              </Typography>
              <Typography variant="body1">{formatDateForDisplay(evento.eventofechabase)}</Typography>
            </Grid>
          )}
        </Grid>

        {/* Alerta si está fuera de rango */}
        {ejecucionFueraRango.fuera && (
          <Alert severity="warning" sx={{ mb: 3 }} icon={ejecucionFueraRango.tipo === "ANTICIPADA" ? "⏰" : "⚠️"}>
            <Typography variant="body2">
              <strong>EJECUCIÓN FUERA DE RANGO:</strong> {ejecucionFueraRango.mensaje}
            </Typography>
            <Typography variant="caption">Esto es solo informativo. Puede continuar normalmente.</Typography>
          </Alert>
        )}

        {/* Alerta si es estado terminal */}
        {esEstadoTerminal && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>TAREA {evento.eventostatus} - NO EDITABLE</strong>
            </Typography>
            <Typography variant="caption">
              Esta tarea ha sido marcada como estado terminal. No se permiten más cambios.
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Controles de ejecución (solo si editable) */}
        {esEditable && (
          <>
            <Grid container spacing={3}>
              {/* Estado y Porcentaje */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small" margin="normal">
                  <InputLabel>Estado</InputLabel>
                  <Select value={formData.status} onChange={handleChange("status")} label="Estado" disabled={loading}>
                    {estadosPermitidos[evento.eventostatus || "PENDIENTE"].map((estado) => (
                      <MenuItem key={estado} value={estado}>
                        {estado}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Porcentaje de avance"
                  type="number"
                  value={formData.porcentaje}
                  onChange={handleChange("porcentaje")}
                  margin="normal"
                  size="small"
                  disabled={loading || formData.status === "COMPLETADA"}
                  InputProps={{
                    inputProps: { min: 0, max: 100 },
                  }}
                  helperText={formData.status === "COMPLETADA" ? "Estado COMPLETADA = 100% avance" : ""}
                />

                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                  {[0, 25, 50, 75, 100].map((percent) => (
                    <Button
                      key={percent}
                      variant="outlined"
                      size="small"
                      onClick={() => handleChange("porcentaje")({ target: { value: percent } })}
                      disabled={formData.status === "COMPLETADA"}
                    >
                      {percent}%
                    </Button>
                  ))}
                </Box>
              </Grid>

              {/* Tipo de tarea */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Tipo de tarea:{" "}
                  {pregtipo === "U" ? "Texto Libre" : pregtipo === "L" ? "Lista de Opciones" : "Opciones Múltiples"}
                  {pregobligatoria && " *"}
                </Typography>

                {pregtipo === "U" && (
                  <TipoTareaTexto
                    value={formData.respuestaTextoLibre}
                    onChange={(value) => handleRespuestaChange("respuestaTextoLibre", value)}
                    disabled={loading}
                    obligatoria={pregobligatoria}
                  />
                )}

                {pregtipo === "L" && (
                  <TipoTareaLista
                    opciones={opcionesActivas}
                    value={formData.respuestaListaSecuencia}
                    onChange={(value) => handleRespuestaChange("respuestaListaSecuencia", value)}
                    disabled={loading}
                    obligatoria={pregobligatoria}
                    opcionCorrecta={opcionesActivas.find((op) => op.pregRespuesta)?.pregsecuen}
                  />
                )}

                {pregtipo === "M" && (
                  <TipoTareaMultiple
                    opciones={opcionesActivas}
                    value={formData.respuestaMultipleSecuencias}
                    onChange={(value) => handleRespuestaChange("respuestaMultipleSecuencias", value)}
                    disabled={loading}
                    obligatoria={pregobligatoria}
                  />
                )}
              </Grid>

              {/* Campo de Fecha de Ejecución Real (solo visible cuando estado es COMPLETADA) */}
              {formData.status === "COMPLETADA" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Fecha y hora real de ejecución (opcional)"
                    type="datetime-local"
                    value={formData.fechaEjecucionReal ? formData.fechaEjecucionReal.format("YYYY-MM-DDTHH:mm") : ""}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        fechaEjecucionReal: value ? dayjs(value) : null, // Si hay valor, crea dayjs, si no, null
                      }))
                    }}
                    margin="normal"
                    size="small"
                    disabled={loading}
                    helperText="Dejar vacío para usar la fecha actual automáticamente"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}

              {/* Comentario obligatorio */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Comentario (obligatorio)"
                  multiline
                  rows={3}
                  value={formData.comentario}
                  onChange={handleChange("comentario")}
                  margin="normal"
                  size="small"
                  disabled={loading}
                  required
                  helperText={`Mínimo 10 caracteres (${formData.comentario.length}/1000)`}
                  error={formData.comentario.length > 0 && formData.comentario.length < 10}
                  inputProps={{ maxLength: 1000 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
          </>
        )}

        {/* Historial */}
        <Typography variant="h6" gutterBottom>
          Historial de ejecuciones
        </Typography>

        {historialEjecuciones.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic" }}>
            No hay historial registrado
          </Typography>
        ) : (
          <Box sx={{ maxHeight: 200, overflow: "auto" }}>
            {/* Dentro del mapeo del historialEjecuciones */}
            {historialEjecuciones
              .slice()
              .reverse()
              .map((item, index) => (
                <Box key={index} sx={{ mb: 2, p: 1, bgcolor: "background.default", borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" fontWeight="bold">
                      {dayjs(item.fechaEjecucionReal).format("DD/MM/YYYY HH:mm")}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      por {item.tranusuisys}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {item.comentario}
                  </Typography>

                  {/* INFORMACIÓN DE CAMBIOS - SIEMPRE VISIBLE */}
                  <Typography variant="caption" color="primary" sx={{ display: "block", mt: 0.5 }}>
                    {/* Estado: siempre mostrar */}
                    {item.statusAnterior === item.statusNuevo
                      ? `Estado: ${item.statusNuevo}`
                      : `Estado: ${item.statusAnterior} → ${item.statusNuevo}`}

                    {" | "}

                    {/* Porcentaje: siempre mostrar con referencia al anterior */}
                    {item.porcentajeAnterior === item.porcentajeavance
                      ? `Avance: ${item.porcentajeavance}%`
                      : `Avance: ${item.porcentajeAnterior}% → ${item.porcentajeavance}%`}
                  </Typography>

                  {item.respuestaTextoLibre && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 0.5 }}>
                      Respuesta: {item.respuestaTextoLibre}
                    </Typography>
                  )}
                </Box>
              ))}
          </Box>
        )}

        <br />
        <br />

        <DocumentosAsociadosComponent
          entidadId={eventocodigo} // ID del evento
          tipoEntidad="gdocmeventos" // Tipo de entidad
          readOnly={esEstadoTerminal} // Solo lectura si es estado terminal
          onDocumentoAgregado={(doc) => console.log("Documento agregado:", doc)}
          onDocumentoEliminado={(uuid) => console.log("Documento eliminado:", uuid)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {esEstadoTerminal ? "Cerrar" : "Cancelar"}
        </Button>

        {esEditable && (
          <Button onClick={handleGuardar} variant="contained" disabled={loading || formData.comentario.length < 10}>
            {loading ? "Guardando..." : "Guardar Ejecución"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ModalEjecucionTarea
