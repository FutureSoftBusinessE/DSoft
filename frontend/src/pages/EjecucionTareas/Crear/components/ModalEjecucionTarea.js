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
import dayjs, { formatDateForDisplay, parseStringToDayjs } from "../utils/dayjsConfig"
import { showError } from "../utils/alertUtils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import fetchwrapper from "../../../../services/interceptors/fetchwrapper"
import CustomAutocomplete from "../../../../components/CustomAutocomplete"
import { useQuery as CustomUseQuery } from "../../../../api"
import CustomModalCreateCliente from "../../../../components/CustomModalCreateCliente"
import ModalCreatePlacas from "../../../PlanificacionDeTareas/components/ModalCreatePlacas"

// --- IMPORTACIONES NUEVAS PARA EL MODAL DE DOCUMENTOS ---
import DocumentosAsociadosTabla from "../../../components/Global/DocumentosAsociadosModal/DocumentosAsociadosTabla"
import DocumentosAsociadosModal from "../../../components/Global/DocumentosAsociadosModal"
import AttachFileIcon from "@mui/icons-material/AttachFile"
// --------------------------------------------------------

// Función para obtener color según estado
const getColorByStatus = (status) => {
  switch (status) {
    case "PENDIENTE":
      return "warning"
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
// QUERY PARA OBTENER DATOS DEL EVENTO
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

      return response.data
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    onError: (error) => {
      console.log("Error fetching evento data:", error.message)
    },
  })
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ModalEjecucionTarea = ({ open, onClose, eventocodigo, onGuardarEjecucion }) => {
  const [modalOpenCliente, setModalOpenCliente] = useState(false)
  const handleOpenModalCliente = () => setModalOpenCliente(true)
  const handleCloseModalCliente = () => setModalOpenCliente(false)

  const [modalOpenPlacas, setModalOpenPlacas] = useState(false)
  const handleOpenModalPlacas = () => setModalOpenPlacas(true)
  const handleCloseModalPlacas = () => setModalOpenPlacas(false)

  // --- ESTADOS PARA DOCUMENTOS ASOCIADOS ---
  const queryClient = useQueryClient()
  const [modalOpenDocumentos, setModalOpenDocumentos] = useState(false)
  const [nextSecuencia, setNextSecuencia] = useState(1)
  // ------------------------------------------------

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

  const [clienteSelectedCB, setClienteSelectedCB] = useState(null)
  const [placaSelectedCB, setPlacaSelectedCB] = useState(null)
  const [esTareaConProcesoTecnicentro, setEsTareaConProcesoTecnicentro] = useState(false)

  const {
    data: allClientesCB = [],
    isLoading: isLoadingAllClientesCB,
    refetch: refetchAllClientesCB,
  } = useQuery({
    queryKey: ["clientesPlanificacion"],
    queryFn: async () => {
      const response = await fetchwrapper(`/PlanificacionTareas/getAllClientes`)
      const result = await response.json()
      return result.data
    },
    enabled: esTareaConProcesoTecnicentro,
  })

  const {
    data: { data: allPlacasCB } = [],
    isLoading: isLoadingAllPlacasCB,
    refetch: refetchAllPlacasCB,
  } = CustomUseQuery({
    queryKey: ["isLoadingAllPlacasCB"],
    url: "/PlanificacionTareas/getAllPlacasCB",
    enabled: esTareaConProcesoTecnicentro,
  })

  const {
    data: eventoDataResponse = {},
    isLoading: isLoadingEventoData,
    isError: isErrorEventoData,
    isFetching: isFetchingEventoData,
  } = useGetEventoData(eventocodigo, setEsTareaConProcesoTecnicentro, setClienteSelectedCB, setPlacaSelectedCB)

  const eventoData = eventoDataResponse?.data || eventoDataResponse || {}
  const evento = eventoData.evento || {}

  // LÓGICA CLAVE: Extraemos dinámicamente el código del cliente para enviarlo a la tabla de documentos
  const clienteIdParaDocumentos = esTareaConProcesoTecnicentro ? clienteSelectedCB?.value : evento?.clicodigo

  useEffect(() => {
    if (evento?.procesocod === "TECNICENTRO") {
      setEsTareaConProcesoTecnicentro(true)

      if (evento?.clicodigo && evento?.clinombre) {
        setClienteSelectedCB({
          value: evento.clicodigo,
          label: `${evento.clinombre.replace(/\s*\(\d+\)$/, "")} (${evento.clicodigo})`,
          clinombre: evento.clinombre.replace(/\s*\(\d+\)$/, ""),
        })
      } else {
        setClienteSelectedCB(null)
      }

      if (evento?.placa) {
        setPlacaSelectedCB({
          value: evento.placa,
          label: evento.placa,
        })
      } else {
        setPlacaSelectedCB(null)
      }
    } else {
      setEsTareaConProcesoTecnicentro(false)
      setClienteSelectedCB(null)
      setPlacaSelectedCB(null)
    }
  }, [evento])

  const estadosPermitidos = {
    PENDIENTE: ["EN_PROCESO", "COMPLETADA", "CANCELADA", "REPROGRAMADA"],
    EN_PROCESO: ["EN_PROCESO", "COMPLETADA", "CANCELADA", "REPROGRAMADA"],
    COMPLETADA: ["EN_PROCESO"],
    CANCELADA: [],
    REPROGRAMADA: [],
  }

  const tarea = eventoData.tarea || {}
  const opcionesTarea = eventoData.opcionesTarea || []
  const historialEjecuciones = eventoData.historialEjecuciones || []
  const respuestaTextoLibre = eventoData.respuestaTextoLibre || ""
  const respuestaListaSecuencia = eventoData.respuestaListaSecuencia || null
  const respuestaMultipleSecuencias = eventoData.respuestaMultipleSecuencias || []

  useEffect(() => {
    if (open && evento && Object.keys(evento).length > 0) {
      setFormData({
        status: evento.eventostatus || "PENDIENTE",
        porcentaje: evento.porcentajeavance || 0,
        comentario: "",
        respuestaTextoLibre: respuestaTextoLibre || "",
        respuestaListaSecuencia: respuestaListaSecuencia || null,
        respuestaMultipleSecuencias: respuestaMultipleSecuencias || [],
      })
      verificarHorarioEjecucion()
    }
  }, [open, evento, respuestaTextoLibre, respuestaListaSecuencia, respuestaMultipleSecuencias])

  const verificarHorarioEjecucion = () => {
    if (!evento || !evento.eventofecha || !evento.eventohorainicio || !evento.eventohorafin) return

    const ahora = dayjs()
    const fechaEvento = parseStringToDayjs(evento.eventofecha)
    const inicioProgramado = parseStringToDayjs(evento.eventohorainicio)
    const finProgramado = parseStringToDayjs(evento.eventohorafin)

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
    if (!formData.comentario.trim() || formData.comentario.trim().length < 10) {
      showError("Debe escribir un comentario de al menos 10 caracteres")
      return false
    }

    const estadoActual = evento.eventostatus || "PENDIENTE"
    const estadosValidos = estadosPermitidos[estadoActual] || []

    if (formData.status !== estadoActual && !estadosValidos.includes(formData.status)) {
      showError(`No puede cambiar de ${estadoActual} a ${formData.status}`)
      return false
    }

    if (["CANCELADA", "REPROGRAMADA"].includes(formData.status)) {
      const confirm = window.confirm(
        `⚠️ ATENCIÓN: Al marcar como ${formData.status}, la tarea quedará BLOQUEADA permanentemente.\n\n¿Está completamente seguro?`,
      )
      if (!confirm) return false
    }

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

    if (formData.status === "COMPLETADA") {
      if (formData.fechaEjecucionReal && !formData.fechaEjecucionReal.isValid()) {
        showError("La fecha seleccionada no es válida")
        return false
      }
    }
    return true
  }

  const handleGuardar = async () => {
    if (!validarGuardado()) return

    setLoading(true)

    try {
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

      await onGuardarEjecucion(datosGuardar)
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const esEstadoTerminal = ["CANCELADA", "REPROGRAMADA"].includes(evento.eventostatus)
  const esEditable = !esEstadoTerminal
  const isLoading = isLoadingEventoData || isFetchingEventoData

  if (!open) return null

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

        {ejecucionFueraRango.fuera && (
          <Alert severity="warning" sx={{ mb: 3 }} icon={ejecucionFueraRango.tipo === "ANTICIPADA" ? "⏰" : "⚠️"}>
            <Typography variant="body2">
              <strong>EJECUCIÓN FUERA DE RANGO:</strong> {ejecucionFueraRango.mensaje}
            </Typography>
            <Typography variant="caption">Esto es solo informativo. Puede continuar normalmente.</Typography>
          </Alert>
        )}

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

        {esEditable && (
          <>
            <Grid container spacing={3}>
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
                        fechaEjecucionReal: value ? dayjs(value) : null,
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

        <Typography variant="h6" gutterBottom>
          Historial de ejecuciones
        </Typography>

        {historialEjecuciones.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic" }}>
            No hay historial registrado
          </Typography>
        ) : (
          <Box sx={{ maxHeight: 200, overflow: "auto" }}>
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

                  <Typography variant="caption" color="primary" sx={{ display: "block", mt: 0.5 }}>
                    {item.statusAnterior === item.statusNuevo
                      ? `Estado: ${item.statusNuevo}`
                      : `Estado: ${item.statusAnterior} → ${item.statusNuevo}`}

                    {" | "}

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

        {/* --- INICIO NUEVA SECCIÓN DE DOCUMENTOS ASOCIADOS --- */}
        <Box sx={{ display: "flex", mb: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AttachFileIcon />}
            onClick={() => setModalOpenDocumentos(true)}
            disabled={esEstadoTerminal || loading}
          >
            Asociar Documento / Credencial
          </Button>
        </Box>

        {/* GRILLA DE VISUALIZACIÓN DE DOCUMENTOS (Apunta a los documentos del Cliente y sus Eventos) */}
        {clienteIdParaDocumentos && (
          <DocumentosAsociadosTabla
            qgenero={clienteIdParaDocumentos}
            procqgenero="CXCMCLI"
            onDataLoaded={(proximaSecuencia) => setNextSecuencia(proximaSecuencia)}
          />
        )}

        {/* MODAL DE ADJUNTOS CONSOLIDADO (Sube la información atada estrictamente a este Evento) */}
        <DocumentosAsociadosModal
          isOpen={modalOpenDocumentos}
          onClose={() => setModalOpenDocumentos(false)}
          contexto={{
            docqgenero: eventocodigo,
            docprocqgenero: "gdocmeventos",
            docsecuen: nextSecuencia,
          }}
          onSuccess={() => {
            // Al guardar exitosamente, invalidamos la cache del componente DocumentosAsociadosTabla
            // para que traiga la data fresca (incluyendo este nuevo documento del evento).
            if (clienteIdParaDocumentos) {
              queryClient.invalidateQueries(["documentosAsociados", clienteIdParaDocumentos, "CXCMCLI"])
            }
          }}
        />
        {/* --- FIN NUEVA SECCIÓN DE DOCUMENTOS ASOCIADOS --- */}
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
