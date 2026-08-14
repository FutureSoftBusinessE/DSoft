/* eslint-disable camelcase */
import React, { useState, useEffect } from "react"
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Grid,
  CircularProgress,
  IconButton,
  TextField,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from "@mui/material"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { Groups } from "@mui/icons-material"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import FullCalendar from "@fullcalendar/react"
import esLocale from "@fullcalendar/core/locales/es"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import CustomBackdrop from "../../../components/CustomBackdrop"
import ModalUsuariosReadable from "./components/ModalUsuariosReadable"
import ModalEjecucionTarea from "./components/ModalEjecucionTarea"
import { showSuccess, showError, showConfirmation, showServerError } from "./utils/alertUtils"
import dayjs from "./utils/dayjsConfig"
import { useQuery } from "@tanstack/react-query"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import { useNavigate } from "react-router-dom"

const getColorByStatus = (status) => {
  switch (status) {
    case "PENDIENTE":
      return "#ffeb3b"
    case "EN_PROCESO":
      return "#2196f3"
    case "COMPLETADA":
      return "#4caf50"
    case "CANCELADA":
      return "#f44336"
    case "REPROGRAMADA":
      return "#ff9800"
    default:
      return "#9e9e9e"
  }
}

const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(8),
  flexGrow: 1,
  padding: "0 16px",
  height: "100vh",
}))

const theme = createTheme({
  palette: {
    primary: {
      main: "#196C87",
    },
    secondary: {
      main: "#196C87",
    },
  },
})

// Renderizado optimizado de eventos
const renderEventContent = (eventInfo) => {
  const event = eventInfo.event
  const startTime = event.start ? dayjs(event.start).format("HH:mm") : ""
  const endTime = event.end ? dayjs(event.end).format("HH:mm") : ""

  return (
    <div
      style={{
        padding: "2px 4px",
        fontSize: "0.7rem",
        lineHeight: "1.1",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: "0.65rem",
          marginBottom: "1px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {startTime} - {endTime}
      </div>
      <div
        style={{
          wordWrap: "break-word",
          wordBreak: "break-word",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          flex: 1,
        }}
      >
        {eventInfo.event.title}
      </div>
    </div>
  )
}

// Tooltip mejorado con la nueva estructura de datos
const handleEventDidMount = (info) => {
  const event = info.event
  const startTime = event.start ? dayjs(event.start).format("HH:mm") : ""
  const endTime = event.end ? dayjs(event.end).format("HH:mm") : ""
  const extendedProps = event.extendedProps || {}

  const tooltip = `
    Título: ${event.title}
    Estado: ${extendedProps.status || "Sin estado"}
    Cliente: ${extendedProps.cliente || extendedProps.clinombre || "Sin cliente"}
    Usuario: ${extendedProps.usuario || extendedProps.usrnombre || "Sin usuario"}
    Horario: ${startTime} - ${endTime}
    Duración: ${extendedProps.duracion || 0} minutos
    Avance: ${extendedProps.avance || 0}%
    ${extendedProps.recurrencia ? `Recurrencia: ${extendedProps.recurrencia}` : ""}
  `.trim()

  info.el.setAttribute("title", tooltip)
}

// Función para obtener eventos desde la API
function useGetEventos(filtros) {
  return useQuery({
    queryKey: ["CrearEjecucionTareas", "getAllEventsCalendar", filtros],
    queryFn: async () => {
      try {
        const options = {
          method: "POST",
          body: JSON.stringify({
            fecha_inicio: filtros.fechaInicio,
            fecha_fin: filtros.fechaFin,
            estados: filtros.estados,
            usuarios: filtros.usuarios,
          }),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }

        const response = await fetchwrapper(`/EjecucionTareas/getAllEventsCalendar`, options)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message || "Error al obtener eventos")
        }

        return result.data
      } catch (error) {
        console.error("Error fetching eventos:", error)
        throw error
      }
    },
    enabled: true,
    onError: (error) => {
      console.log("Error fetching eventos:", error.message)
    },
  })
}

// Componente Principal
const CrearEjecucionTareas = () => {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState([])
  const [showEjecucionModal, setShowEjecucionModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [modalUsuariosOpen, setModalUsuariosOpen] = useState(false)
  const [loading, setLoading] = useState({ eventos: true })

  // Filtros aplicados (los que se envían al backend)
  const [filtros, setFiltros] = useState({
    fechaInicio: dayjs().startOf("month").format("YYYY-MM-DD"),
    fechaFin: dayjs().endOf("month").format("YYYY-MM-DD"),
    estados: ["PENDIENTE", "EN_PROCESO", "COMPLETADA", "REPROGRAMADA", "CANCELADA"],
    usuarios: [],
  })

  // Filtros temporales (los que el usuario está editando)
  const [filtrosTemp, setFiltrosTemp] = useState({
    fechaInicio: dayjs().startOf("month").format("YYYY-MM-DD"),
    fechaFin: dayjs().endOf("month").format("YYYY-MM-DD"),
    estados: ["PENDIENTE", "EN_PROCESO", "COMPLETADA", "REPROGRAMADA", "CANCELADA"],
    usuarios: [],
  })

  // Query para obtener eventos desde la API
  const {
    data: eventosApi = [],
    isLoading: isLoadingEventos,
    isError: isErrorEventos,
    isFetching: isFetchingEventos,
    refetch: refetchEventos,
  } = useGetEventos(filtros)

  const {
    data: usuariosFake = [],
    isLoading: isLoadingUsuarios,
    isError: isErrorUsuarios,
    isFetching: isFetchingUsuarios,
  } = useGetDataUsuarios()

  function useGetDataUsuarios() {
    return useQuery({
      queryKey: ["CrearEjecucionTareas", "getAllUsuariosAsignados"],
      queryFn: async () => {
        const response = await fetchwrapper(`/EjecucionTareas/getAllUsuariosAsignados`)
        const result = await response.json()
        return result.data
      },
      onError: () => {
        console.log("Error fetching data")
      },
    })
  }

  const {
    data: paquetesFake = { tareas: [], paquetes: [] },
    isLoading: isLoadingPaquetes,
    isError: isErrorPaquetes,
    isFetching: isFetchingPaquetes,
  } = useGetDataUPaquetes()

  function useGetDataUPaquetes() {
    return useQuery({
      queryKey: ["CrearEjecucionTareas", "getAllPaquetes"],
      queryFn: async () => {
        const response = await fetchwrapper(`/PlanificacionTareas/getAllPaquetesYTareas`)
        const result = await response.json()
        return result.data
      },
      onError: () => {
        console.log("Error fetching data")
      },
    })
  }

  // Refetch cuando se aplican filtros nuevos
  useEffect(() => {
    refetchEventos()
  }, [filtros])

  // Actualizar eventos cuando lleguen de la API
  useEffect(() => {
    if (eventosApi && Array.isArray(eventosApi)) {
      setEventos(eventosApi)
      setLoading({ eventos: false })
    }
  }, [eventosApi])

  // Manejar error de eventos
  useEffect(() => {
    if (isErrorEventos) {
      showError("Error al cargar los eventos del calendario")
      setLoading({ eventos: false })
    }
  }, [isErrorEventos])

  const handleEventClick = (info) => {
    // Obtener el evento completo con sus propiedades extendidas
    const clickedEvent = {
      ...info.event,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      id: info.event.id,
      backgroundColor: info.event.backgroundColor,
      textColor: info.event.textColor,
      extendedProps: info.event.extendedProps || {},
    }

    setSelectedEvent(clickedEvent)
    setShowEjecucionModal(true)
  }

  const handleGuardarEjecucion = async (datosEjecucion) => {
    try {
      console.log("Guardando ejecución:", datosEjecucion)

      const options = {
        method: "POST",
        body: JSON.stringify({ ...datosEjecucion }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
      await fetchwrapper("/EjecucionTareas/saveEjecucionEvento", options)

      // Mostrar éxito
      await showSuccess("Ejecución guardada exitosamente")

      if (datosEjecucion.eventostatus === "REPROGRAMADA") {
        await showSuccess("Evento marcado como REPROGRAMADO")

        const planificarAhora = window.confirm(
          "✅ Evento marcado como REPROGRAMADO\n\n" +
            "¿Desea planificar este evento ahora?\n\n" +
            "• Sí: Se abrirá planificación \n" +
            "• No: Solo quedará como REPROGRAMADO",
        )

        if (planificarAhora) {
          setShowEjecucionModal(false)

          navigate("../dashboard/PlanificacionTareas")
        }
      }

      // Refrescar datos desde la API
      refetchEventos()

      // Cerrar el modal
      setShowEjecucionModal(false)
      setSelectedEvent(null)

      return { success: true }
    } catch (error) {
      console.error("Error al guardar ejecución:", error)
      await showError(error?.details?.message, "Error al guardar la ejecución")
    }
  }

  const handleDeleteTarea = async (tarea) => {
    if (!tarea) return

    try {
      const result = await showConfirmation("¡No podrás revertir esta acción!")

      if (!result.isConfirmed) return

      // Aquí deberías llamar a tu API para eliminar
      console.log("Eliminando tarea:", tarea.id)

      // Eliminar evento del estado
      setEventos((prev) => prev.filter((evento) => evento.id !== tarea.id))
      setShowDetailsModal(false)
      setSelectedEvent(null)

      await showSuccess("La tarea ha sido eliminada.")
    } catch (error) {
      console.error("Error al eliminar tarea:", error)
      await showServerError(error, "Error al eliminar la tarea")
    }
  }

  // Manejar cambio de checkboxes de estados (filtros temporales)
  const handleEstadoChange = (estado) => {
    setFiltrosTemp((prev) => {
      const estadosActuales = prev.estados
      const estadoExiste = estadosActuales.includes(estado)

      let nuevosEstados
      if (estadoExiste) {
        nuevosEstados = estadosActuales.filter((e) => e !== estado)
      } else {
        nuevosEstados = [...estadosActuales, estado]
      }

      return {
        ...prev,
        estados: nuevosEstados,
      }
    })
  }

  // Manejar cambio de usuarios (multitag)
  const handleUsuariosChange = (event, newValue) => {
    setFiltrosTemp((prev) => ({
      ...prev,
      usuarios: newValue.map((u) => u.usrcodigo),
    }))
  }

  // Aplicar filtros (pasar de temp a aplicados)
  const handleAplicarFiltros = () => {
    setFiltros(filtrosTemp)
    // El useEffect detectará el cambio en 'filtros' y hará refetch
  }

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    const filtrosDefault = {
      fechaInicio: dayjs().startOf("month").format("YYYY-MM-DD"),
      fechaFin: dayjs().endOf("month").format("YYYY-MM-DD"),
      estados: ["PENDIENTE", "EN_PROCESO", "COMPLETADA", "REPROGRAMADA", "CANCELADA"],
      usuarios: [],
    }

    setFiltrosTemp(filtrosDefault)
    setFiltros(filtrosDefault)
    // El useEffect detectará el cambio y hará refetch
  }

  // Calcular estadísticas
  const estadisticas = {
    totalEventos: eventos.length,
    eventosPendientes: eventos.filter((e) => e.extendedProps?.status === "PENDIENTE").length,
    eventosEnProceso: eventos.filter((e) => e.extendedProps?.status === "EN_PROCESO").length,
    eventosCompletados: eventos.filter((e) => e.extendedProps?.status === "COMPLETADA").length,
    eventosReprogramados: eventos.filter((e) => e.extendedProps?.status === "REPROGRAMADA").length,
    eventosCancelados: eventos.filter((e) => e.extendedProps?.status === "CANCELADA").length,
  }

  const isLoading = isLoadingEventos || isFetchingEventos

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 30px 30px 30px",
            fontSize: "25px",
          }}
        >
          <b>Ejecución de Tareas</b>
        </div>

        {isLoading ? (
          <CustomBackdrop
            isLoading={isLoadingUsuarios || isFetchingUsuarios || isLoadingPaquetes || isFetchingPaquetes || isLoading}
          />
        ) : (
          <Box className="row">
            {/* Calendar Sidebar */}
            <div className="col-xxl-3 col-xl-4 theiaStickySidebar">
              <div className="stickybar">
                <div className="card">
                  <div className="card-body p-3">
                    {/* Filtros */}
                    <div className="border-bottom pb-4 mb-4">
                      <h5 className="mb-3">Filtros</h5>

                      {/* Filtro de fechas */}
                      <TextField
                        label="Fecha inicio"
                        type="date"
                        value={filtrosTemp.fechaInicio}
                        onChange={(e) => setFiltrosTemp((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="Fecha fin"
                        type="date"
                        value={filtrosTemp.fechaFin}
                        onChange={(e) => setFiltrosTemp((prev) => ({ ...prev, fechaFin: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        size="small"
                        sx={{ mb: 2 }}
                      />

                      {/* Filtro de estados */}
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Estados
                      </Typography>
                      {["PENDIENTE", "EN_PROCESO", "COMPLETADA", "REPROGRAMADA", "CANCELADA"].map((estado) => (
                        <FormControlLabel
                          key={estado}
                          control={
                            <Checkbox
                              checked={filtrosTemp.estados.includes(estado)}
                              onChange={() => handleEstadoChange(estado)}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="body2">{estado.charAt(0) + estado.slice(1).toLowerCase()}</Typography>
                          }
                          sx={{ display: "flex", mb: 0.5 }}
                        />
                      ))}

                      {/* Filtro de usuarios (multitag) */}
                      <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
                        Usuarios
                      </Typography>
                      <Autocomplete
                        multiple
                        options={usuariosFake}
                        value={usuariosFake.filter((u) => filtrosTemp.usuarios.includes(u.usrcodigo))}
                        onChange={handleUsuariosChange}
                        getOptionLabel={(option) => `${option.usrnombre} (${option.usrcodigo})`}
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Seleccionar usuarios..." size="small" />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              key={option.usrcodigo}
                              label={option.usrnombre}
                              size="small"
                              {...getTagProps({ index })}
                            />
                          ))
                        }
                        limitTags={2}
                        sx={{ mb: 2 }}
                      />

                      {/* Botones de acción */}
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          onClick={handleAplicarFiltros}
                          sx={{ flex: 2 }}
                        >
                          Aplicar Filtros
                        </Button>
                        <Button variant="outlined" size="small" onClick={handleLimpiarFiltros} sx={{ flex: 1 }}>
                          Limpiar
                        </Button>
                      </Box>
                    </div>

                    <div className="border-bottom pb-4 mb-4">
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <h5 className="mb-0">Usuarios</h5>
                        <IconButton
                          size="small"
                          onClick={() => setModalUsuariosOpen(true)}
                          sx={{
                            backgroundColor: "primary.main",
                            color: "white",
                            "&:hover": { backgroundColor: "primary.dark" },
                          }}
                        >
                          <Groups />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Total: {usuariosFake.length} usuarios
                      </Typography>
                      <Button fullWidth variant="outlined" onClick={() => setModalUsuariosOpen(true)} sx={{ mt: 1 }}>
                        Ver todos los usuarios
                      </Button>
                    </div>

                    <div className="border-bottom pb-4 mb-4">
                      <h5 className="mb-2">
                        Estadísticas de Eventos
                        <span className="badge badge-success rounded-pill ms-2">{estadisticas.totalEventos}</span>
                      </h5>
                      <Box display="flex" flexDirection="column" gap={1} mt={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Pendientes:</Typography>
                          <Chip
                            label={estadisticas.eventosPendientes}
                            size="small"
                            sx={{
                              bgcolor: "#ffeb3b",
                              color: "#000",
                              fontWeight: "bold",
                            }}
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">En proceso:</Typography>
                          <Chip
                            label={estadisticas.eventosEnProceso}
                            size="small"
                            sx={{
                              bgcolor: "#2196f3",
                              color: "#fff",
                              fontWeight: "bold",
                            }}
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Completados:</Typography>
                          <Chip
                            label={estadisticas.eventosCompletados}
                            size="small"
                            sx={{
                              bgcolor: "#4caf50",
                              color: "#fff",
                              fontWeight: "bold",
                            }}
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Reprogramados:</Typography>
                          <Chip
                            label={estadisticas.eventosReprogramados}
                            size="small"
                            sx={{
                              bgcolor: "#ff9800",
                              color: "#000",
                              fontWeight: "bold",
                            }}
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Cancelados:</Typography>
                          <Chip
                            label={estadisticas.eventosCancelados}
                            size="small"
                            sx={{
                              bgcolor: "#f44336",
                              color: "#fff",
                              fontWeight: "bold",
                            }}
                          />
                        </Box>
                      </Box>
                    </div>

                    <div className="mb-4">
                      <h6 className="mb-2">Paquetes Disponibles</h6>
                      {paquetesFake?.paquetes?.map((paquete) => (
                        <div key={paquete.formcodigo} className="d-flex align-items-center mb-1">
                          <i className="ti ti-package text-info me-2"></i>
                          <small>
                            {paquete.formdescri} [{paquete.formcodigo}]
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Main */}
            <div className="col-xxl-9 col-xl-8 theiaStickySidebar">
              <div className="stickybar">
                <div className="card border-0">
                  <div className="card-body" style={{ padding: "10px" }}>
                    {isLoading && (
                      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                        <CircularProgress size={24} sx={{ mr: 2 }} />
                        <Typography>Cargando eventos...</Typography>
                      </Box>
                    )}
                    {!isLoading && (
                      <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale={esLocale}
                        firstDay={0}
                        events={eventos}
                        headerToolbar={{
                          start: "today,prev,next",
                          center: "title",
                          end: "dayGridMonth,timeGridWeek,timeGridDay",
                        }}
                        eventClick={handleEventClick}
                        selectable={false} // DESACTIVADO: No se puede seleccionar fechas vacías
                        height="auto"
                        eventDisplay="block"
                        // CONFIGURACIÓN PARA MOSTRAR TODOS LOS EVENTOS SIN OCULTAR:
                        dayMaxEvents={false} // DESACTIVADO - no limita eventos por día
                        dayMaxEventRows={false} // DESACTIVADO - no limita filas de eventos
                        moreLinkClick={false} // DESACTIVADO - no muestra enlaces "más"
                        eventMaxStack={999} // Número muy alto
                        eventOrder="start,title"
                        eventTimeFormat={{
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }}
                        eventContent={renderEventContent}
                        // CONFIGURACIÓN DE VISTAS SIN LÍMITES:
                        views={{
                          dayGridMonth: {
                            dayMaxEventRows: false, // SIN LÍMITE
                            dayMaxEvents: false, // SIN LÍMITE
                            dayCellMaxEvents: 999, // Número muy alto
                            dayCellContent: (cellInfo) => {
                              const dateStr = dayjs(cellInfo.date).format("YYYY-MM-DD")
                              const eventosDelDia = eventos.filter(
                                (evento) => dayjs(evento.start).format("YYYY-MM-DD") === dateStr,
                              )

                              return {
                                html: `
            <div style="display: flex; flex-direction: column;">
              <div>${cellInfo.dayNumberText}</div>
              ${
                eventosDelDia.length > 0
                  ? `
                <div style="font-size: 0.7rem; color: #666; margin-top: 2px;">
                  ${eventosDelDia.length} evento${eventosDelDia.length !== 1 ? "s" : ""}
                </div>
              `
                  : ""
              }
            </div>
          `,
                              }
                            },
                          },
                          timeGridWeek: {
                            dayMaxEvents: false, // SIN LÍMITE
                            allDaySlot: false,
                            slotMinTime: "00:00:00",
                            slotMaxTime: "24:00:00",
                            expandRows: true, // IMPORTANTE: expande las filas según necesidad
                          },
                          timeGridDay: {
                            dayMaxEvents: false, // SIN LÍMITE
                            allDaySlot: false,
                            slotMinTime: "00:00:00",
                            slotMaxTime: "24:00:00",
                            expandRows: true, // IMPORTANTE: expande las filas según necesidad
                          },
                        }}
                        eventDidMount={handleEventDidMount}
                        eventLongPressDelay={100}
                        longPressDelay={100}
                        loading={isLoading}
                        // ESTILOS PARA MEJOR VISUALIZACIÓN:
                        eventBackgroundColor="transparent" // Usa colores personalizados
                        eventBorderColor="transparent"
                        // CONFIGURACIÓN DE ALTURA DINÁMICA:
                        contentHeight="auto"
                        aspectRatio={1.35} // Proporción para mejor visualización
                        // DESACTIVAR COMPORTAMIENTOS DE SCROLL QUE PUEDEN OCULTAR:
                        scrollTimeReset={false}
                        scrollTime={false}
                        // CONFIGURACIÓN DE CELDAS MÁS GRANDES:
                        fixedWeekCount={false}
                        showNonCurrentDates={true}
                        navLinks={true}
                        // DESACTIVAR LA CREACIÓN DE NUEVOS EVENTOS CON CLIC:
                        editable={false}
                        droppable={false}
                        selectMirror={false}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Box>
        )}

        {/* Modal de Ejecución de Tarea */}
        <ModalEjecucionTarea
          open={showEjecucionModal}
          onClose={() => {
            setShowEjecucionModal(false)
            setSelectedEvent(null)
          }}
          eventocodigo={selectedEvent?.id}
          onGuardarEjecucion={handleGuardarEjecucion}
        />

        {/* Modal Detalles del Evento */}
        <Dialog open={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Detalles de la Tarea</DialogTitle>
          <DialogContent>
            {selectedEvent && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedEvent.title}</Typography>
                  <Box display="flex" gap={1} alignItems="center" mb={2}>
                    <Chip
                      label={selectedEvent.extendedProps?.status || "Sin estado"}
                      size="small"
                      sx={{
                        backgroundColor: selectedEvent.backgroundColor,
                        color: selectedEvent.textColor,
                        fontWeight: "bold",
                      }}
                    />
                    <Chip label={selectedEvent.extendedProps?.cliente || "Sin cliente"} color="primary" size="small" />
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Fecha:
                  </Typography>
                  <Typography>{dayjs(selectedEvent.start).format("DD/MM/YYYY")}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Horario:
                  </Typography>
                  <Typography>
                    {dayjs(selectedEvent.start).format("HH:mm")} - {dayjs(selectedEvent.end).format("HH:mm")}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Duración:
                  </Typography>
                  <Typography>{selectedEvent.extendedProps?.duracion || 0} minutos</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Avance:
                  </Typography>
                  <Typography>{selectedEvent.extendedProps?.avance || 0}%</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Usuario:
                  </Typography>
                  <Typography>{selectedEvent.extendedProps?.usuario || "Sin usuario"}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Cliente:
                  </Typography>
                  <Typography>{selectedEvent.extendedProps?.cliente || "Sin cliente"}</Typography>
                </Grid>

                {selectedEvent.extendedProps?.recurrencia && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Recurrencia:
                    </Typography>
                    <Typography>
                      {selectedEvent.extendedProps.recurrencia}
                      {selectedEvent.extendedProps.recurrencia_num &&
                        ` (${selectedEvent.extendedProps.recurrencia_secuen || 0}/${selectedEvent.extendedProps.recurrencia_num})`}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    ID Evento:
                  </Typography>
                  <Typography variant="caption">{selectedEvent.id}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Código Cliente:
                  </Typography>
                  <Typography variant="caption">{selectedEvent.extendedProps?.clicodigo || "N/A"}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Código Usuario:
                  </Typography>
                  <Typography variant="caption">{selectedEvent.extendedProps?.usrcodigo || "N/A"}</Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDetailsModal(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Usuarios */}
        <ModalUsuariosReadable
          open={modalUsuariosOpen}
          onClose={() => setModalUsuariosOpen(false)}
          usuarios={usuariosFake}
          eventos={eventos}
          onDeleteTarea={handleDeleteTarea}
          loading={isLoading}
          onEventClick={handleEventClick}
        />
      </div>
    </ThemeProvider>
  )
}

export default CrearEjecucionTareas
