// components/ModalUsuarios.js
import React, { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Typography,
  Box,
  Divider,
  IconButton,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Collapse,
} from "@mui/material"
import {
  Search,
  Close,
  ArrowBack,
  Delete,
  Warning,
  ExpandMore,
  ExpandLess,
  Person,
  Business,
} from "@mui/icons-material"

const getColorByStatus = (status) => {
  switch (status) {
    case "PENDIENTE":
      return "warning"
    case "EN_PROCESO":
      return "info"
    case "COMPLETADA":
      return "success"
    case "CANCELADA":
      return "error"
    case "REPROGRAMADA":
      return "secondary"
    default:
      return "default"
  }
}

const ModalUsuarios = ({ open, onClose, usuarios, eventos, onDeleteTarea, loading }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [tareasSeleccionadas, setTareasSeleccionadas] = useState({})
  const [busquedaTareas, setBusquedaTareas] = useState("")
  const [tareaExpandida, setTareaExpandida] = useState(null) // Para controlar qué tarea muestra detalles

  // Filtrar usuarios por nombre o código
  const usuariosFiltrados = useMemo(
    () =>
      usuarios.filter(
        (usuario) =>
          usuario.usrnombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          usuario.usrcodigo.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [usuarios, searchTerm],
  )

  // Obtener tareas por usuario
  const getTareasPorUsuario = useMemo(() => {
    const tareasPorUsuario = {}
    eventos.forEach((evento) => {
      const usrcodigo = evento.extendedProps.usrcodigo
      if (!tareasPorUsuario[usrcodigo]) {
        tareasPorUsuario[usrcodigo] = []
      }
      tareasPorUsuario[usrcodigo].push(evento)
    })
    return tareasPorUsuario
  }, [eventos])

  // Filtrar tareas del usuario seleccionado
  const tareasFiltradas = useMemo(() => {
    if (!usuarioSeleccionado) return []

    const tareasUsuario = getTareasPorUsuario[usuarioSeleccionado.usrcodigo] || []

    if (!busquedaTareas) return tareasUsuario

    return tareasUsuario.filter(
      (tarea) =>
        tarea.extendedProps.locdescri?.toLowerCase().includes(busquedaTareas.toLowerCase()) ||
        tarea.extendedProps.tareaDescripcion?.toLowerCase().includes(busquedaTareas.toLowerCase()) ||
        tarea.extendedProps.clinombre?.toLowerCase().includes(busquedaTareas.toLowerCase()) ||
        tarea.extendedProps.clicodigo?.toLowerCase().includes(busquedaTareas.toLowerCase()) ||
        tarea.title.toLowerCase().includes(busquedaTareas.toLowerCase()) ||
        new Date(tarea.start).toLocaleDateString().includes(busquedaTareas),
    )
  }, [usuarioSeleccionado, getTareasPorUsuario, busquedaTareas])

  // Obtener solo las tareas pendientes de las seleccionadas
  const tareasPendientesSeleccionadas = useMemo(() => {
    return tareasFiltradas.filter(
      (tarea) => tareasSeleccionadas[tarea.id] && tarea.extendedProps.status === "PENDIENTE",
    )
  }, [tareasFiltradas, tareasSeleccionadas])

  // Contador de tareas pendientes seleccionadas
  const tareasPendientesSeleccionadasCount = useMemo(
    () => tareasPendientesSeleccionadas.length,
    [tareasPendientesSeleccionadas],
  )

  // Contador de todas las tareas seleccionadas (incluyendo no pendientes)
  const tareasSeleccionadasCount = useMemo(
    () => Object.values(tareasSeleccionadas).filter((selected) => selected).length,
    [tareasSeleccionadas],
  )

  // Verificar si todas las tareas están seleccionadas
  const todasSeleccionadas = useMemo(() => {
    if (!usuarioSeleccionado || tareasFiltradas.length === 0) return false
    return tareasFiltradas.every((tarea) => tareasSeleccionadas[tarea.id])
  }, [tareasFiltradas, tareasSeleccionadas, usuarioSeleccionado])

  const handleUsuarioClick = (usuario) => {
    setUsuarioSeleccionado(usuario)
    setTareasSeleccionadas({})
    setBusquedaTareas("")
    setTareaExpandida(null)
  }

  const handleBackToList = () => {
    setUsuarioSeleccionado(null)
    setTareasSeleccionadas({})
    setBusquedaTareas("")
    setTareaExpandida(null)
  }

  const handleSeleccionarTarea = (tareaId) => (event) => {
    setTareasSeleccionadas((prev) => ({
      ...prev,
      [tareaId]: event.target.checked,
    }))
  }

  const handleSeleccionarTodas = (event) => {
    const nuevasSeleccionadas = {}
    tareasFiltradas.forEach((tarea) => {
      nuevasSeleccionadas[tarea.id] = event.target.checked
    })
    setTareasSeleccionadas(nuevasSeleccionadas)
  }

  const handleEliminarSeleccionadas = async () => {
    if (tareasPendientesSeleccionadasCount === 0) return

    // Preparar el arreglo de tareas pendientes para eliminar
    const tareasAEliminar = tareasPendientesSeleccionadas.map((tarea) => ({
      id: tarea.id,
      ...tarea.extendedProps,
    }))

    try {
      // Llamar a onDeleteTarea con el arreglo completo
      await onDeleteTarea(tareasAEliminar)

      // Limpiar selección después de eliminar
      setTareasSeleccionadas({})
    } catch (error) {
      console.error("Error al eliminar tareas:", error)
    }
  }

  const handleToggleExpandir = (tareaId) => {
    setTareaExpandida(tareaExpandida === tareaId ? null : tareaId)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getHorarioTarea = (tarea) => {
    const startTime = formatTime(tarea.start)
    const endTime = formatTime(tarea.end)
    return `${startTime} - ${endTime}`
  }

  // Función para verificar si una tarea es pendiente
  const esTareaPendiente = (tarea) => {
    return tarea.extendedProps.status === "PENDIENTE"
  }

  // Calcular duración en formato legible
  const calcularDuracion = (tarea) => {
    const duracionMinutos = tarea.extendedProps.duracion || 0
    const horas = Math.floor(duracionMinutos / 60)
    const minutos = duracionMinutos % 60

    if (horas > 0 && minutos > 0) return `${horas}h ${minutos}m`
    if (horas > 0) return `${horas}h`
    return `${minutos}m`
  }

  useEffect(() => {
    if (!open) {
      // Se cerró el modal, reseteamos todo
      setUsuarioSeleccionado(null)
      setTareasSeleccionadas({})
      setBusquedaTareas("")
      setSearchTerm("")
      setTareaExpandida(null)
    }
  }, [open])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {usuarioSeleccionado ? (
            <>
              <IconButton onClick={handleBackToList} size="small">
                <ArrowBack />
              </IconButton>
              <Typography variant="h6">{usuarioSeleccionado.usrnombre}</Typography>
              <div style={{ width: 48 }} />
            </>
          ) : (
            <>
              <Typography variant="h6">Lista de Usuarios</Typography>
              <IconButton onClick={onClose} size="small">
                <Close />
              </IconButton>
            </>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {!usuarioSeleccionado ? (
          <>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar usuario por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
              }}
              sx={{ mb: 2 }}
            />

            <List>
              {usuariosFiltrados.map((usuario) => (
                <React.Fragment key={usuario.usrcodigo}>
                  <ListItem
                    button
                    onClick={() => handleUsuarioClick(usuario)}
                    sx={{
                      "&:hover": { backgroundColor: "action.hover" },
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">{usuario.usrnombre}</Typography>
                          <Chip
                            label={`Código: ${usuario.usrcodigo}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary">
                          {getTareasPorUsuario[usuario.usrcodigo]?.length || 0} tareas programadas
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip label={getTareasPorUsuario[usuario.usrcodigo]?.length || 0} color="primary" size="small" />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>

            {usuariosFiltrados.length === 0 && (
              <Typography textAlign="center" color="text.secondary" sx={{ py: 4 }}>
                No se encontraron usuarios
              </Typography>
            )}
          </>
        ) : (
          <Box>
            {/* Alerta informativa */}
            <Alert severity="info" sx={{ mb: 2 }} icon={<Warning />}>
              Solo se pueden eliminar tareas con estado "PENDIENTE"
            </Alert>

            {/* Barra de búsqueda de tareas */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar tareas por localidad, cliente, descripción o fecha..."
              value={busquedaTareas}
              onChange={(e) => setBusquedaTareas(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
              }}
              sx={{ mb: 2 }}
            />

            {/* Controles de selección múltiple */}
            {tareasFiltradas.length > 0 && (
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={todasSeleccionadas}
                      onChange={handleSeleccionarTodas}
                      indeterminate={tareasSeleccionadasCount > 0 && !todasSeleccionadas}
                    />
                  }
                  label={`Seleccionar todas (${tareasSeleccionadasCount})`}
                />
                {tareasPendientesSeleccionadasCount > 0 && (
                  <Typography variant="body2" color="primary">
                    {tareasPendientesSeleccionadasCount} tarea(s) pendiente(s) seleccionada(s)
                  </Typography>
                )}
              </Box>
            )}

            {loading && (
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total de tareas: {tareasFiltradas.length} | Tareas pendientes:{" "}
                {tareasFiltradas.filter((t) => esTareaPendiente(t)).length}
              </Typography>

              {tareasFiltradas.length > 0 ? (
                <List>
                  {tareasFiltradas.map((tarea, index) => (
                    <React.Fragment key={tarea.id}>
                      <ListItem
                        sx={{
                          flexDirection: "column",
                          alignItems: "flex-start",
                          backgroundColor: tareasSeleccionadas[tarea.id] ? "action.selected" : "transparent",
                          borderRadius: 1,
                          mb: 1,
                          opacity: esTareaPendiente(tarea) ? 1 : 0.6,
                          position: "relative",
                        }}
                      >
                        <Box display="flex" alignItems="flex-start" width="100%">
                          <Tooltip
                            title={
                              esTareaPendiente(tarea)
                                ? "Tarea pendiente - Se puede eliminar"
                                : `No se puede eliminar - Estado: ${tarea.extendedProps.status || "NO DEFINIDO"}`
                            }
                          >
                            <Checkbox
                              checked={!!tareasSeleccionadas[tarea.id]}
                              onChange={handleSeleccionarTarea(tarea.id)}
                              disabled={!esTareaPendiente(tarea)}
                              sx={{ mr: 1, mt: 0.5 }}
                            />
                          </Tooltip>

                          <Box flex={1}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                              <Box>
                                <Typography variant="subtitle2">{formatDate(tarea.start)}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {tarea.extendedProps.locdescri || "Sin localidad"}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                  label={tarea.extendedProps.status}
                                  size="small"
                                  color={getColorByStatus(tarea.extendedProps.status)}
                                  variant="outlined"
                                />
                                <Chip label={getHorarioTarea(tarea)} size="small" variant="outlined" color="primary" />
                              </Box>
                            </Box>

                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body1" fontWeight="medium">
                                {tarea.title}
                              </Typography>
                              <IconButton size="small" onClick={() => handleToggleExpandir(tarea.id)}>
                                {tareaExpandida === tarea.id ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </Box>

                            {/* Detalles expandibles */}
                            <Collapse in={tareaExpandida === tarea.id}>
                              <Box
                                sx={{
                                  mt: 1,
                                  p: 2,
                                  backgroundColor: "grey.50",
                                  borderRadius: 1,
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                              >
                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                  <Business sx={{ mr: 0.5, verticalAlign: "middle" }} fontSize="small" />
                                  Información del Cliente
                                </Typography>

                                <Box sx={{ pl: 2, mb: 1 }}>
                                  <Typography variant="body2">
                                    <strong>Nombre:</strong>{" "}
                                    {tarea.extendedProps.clinombre || tarea.extendedProps.cliente || "No disponible"}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Código:</strong> {tarea.extendedProps.clicodigo || "No disponible"}
                                  </Typography>
                                  {tarea.extendedProps.clidireccion && (
                                    <Typography variant="body2">
                                      <strong>Dirección:</strong> {tarea.extendedProps.clidireccion}
                                    </Typography>
                                  )}
                                </Box>

                                {tarea.extendedProps.tareaDescripcion && (
                                  <>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                      Detalles de la Tarea
                                    </Typography>
                                    <Box sx={{ pl: 2, mb: 1 }}>
                                      <Typography variant="body2">
                                        <strong>Descripción:</strong> {tarea.extendedProps.tareaDescripcion}
                                      </Typography>
                                      <Typography variant="body2">
                                        <strong>Duración:</strong> {calcularDuracion(tarea)}
                                      </Typography>
                                      {tarea.extendedProps.avance !== undefined && (
                                        <Typography variant="body2">
                                          <strong>Avance:</strong> {tarea.extendedProps.avance}%
                                        </Typography>
                                      )}
                                    </Box>
                                  </>
                                )}

                                <Typography variant="caption" color="textSecondary">
                                  ID: {tarea.id}
                                </Typography>
                              </Box>
                            </Collapse>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < tareasFiltradas.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography textAlign="center" color="text.secondary" sx={{ py: 4 }}>
                  {busquedaTareas
                    ? "No se encontraron tareas que coincidan con la búsqueda"
                    : "No hay tareas programadas para este usuario"}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Button onClick={usuarioSeleccionado ? handleBackToList : onClose}>
            {usuarioSeleccionado ? "Volver a la lista" : "Cerrar"}
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Mostrar alerta si hay tareas seleccionadas no pendientes */}
            {usuarioSeleccionado && tareasSeleccionadasCount > 0 && tareasPendientesSeleccionadasCount === 0 && (
              <Alert severity="warning" sx={{ py: 0 }}>
                Solo se pueden eliminar tareas con estado "PENDIENTE"
              </Alert>
            )}

            {usuarioSeleccionado && tareasPendientesSeleccionadasCount > 0 && (
              <Button
                variant="contained"
                color="error"
                onClick={handleEliminarSeleccionadas}
                disabled={loading}
                startIcon={<Delete />}
              >
                Eliminar Pendientes ({tareasPendientesSeleccionadasCount})
              </Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default ModalUsuarios
