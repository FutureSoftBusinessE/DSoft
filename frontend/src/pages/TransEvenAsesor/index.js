/* eslint-disable camelcase */
import React, { useContext, useState, useEffect } from "react"
import Header from "../../layouts/Header"
import BackIcon from "../../components/BackIcon"
import {
  Box,
  Paper,
  TextField,
  Tooltip,
  IconButton,
  Grid,
  Typography,
  Autocomplete,
  Divider,
  Alert,
  Chip,
  Button,
  Checkbox,
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../components/CustomBackdrop"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import normalFormatDate from "../utils/date/DDMMYYYFormatDate"
import { useMutation, useQuery, api, showWarning, showSuccess } from "../../api"
import { GlobalContext } from "../../contexts/GlobalContext"
import getIconComponent from "../utils/getIconComponent"
import { useNavigate } from "react-router-dom"

// Íconos estándar
import Save from "@mui/icons-material/Save"
import EventNoteIcon from "@mui/icons-material/EventNote"
import SelectAllIcon from "@mui/icons-material/SelectAll"
import DeselectIcon from "@mui/icons-material/Deselect"

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" }, warning: { main: "#ed6c02" } },
})

const StyledRoot = {
  width: "100%",
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

// =====================================================================
// BUS DE EVENTOS Y SMART CHECKBOX (Para evitar memoización estricta de la tabla)
// =====================================================================
const selectionBus = {
  listeners: new Set(),
  selected: [],
  set(newSelected) {
    this.selected = newSelected
    this.listeners.forEach((listener) => listener(this.selected))
  },
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  },
}

const SmartCheckbox = ({ eventocodigo, onToggle }) => {
  const [checked, setChecked] = useState(() => selectionBus.selected.includes(eventocodigo))

  useEffect(() => {
    // Suscripción reactiva independiente de la tabla
    const unsubscribe = selectionBus.subscribe((currentSelected) => {
      setChecked(currentSelected.includes(eventocodigo))
    })
    // Forzar lectura inicial por si el bus cambió antes del montaje
    setChecked(selectionBus.selected.includes(eventocodigo))
    return unsubscribe
  }, [eventocodigo])

  return <Checkbox checked={checked} onChange={() => onToggle(eventocodigo)} color="primary" sx={{ padding: 0 }} />
}

// Helper seguro para extraer solo la hora de un campo datetime de SQL Server
const formatTime = (timeString) => {
  if (!timeString) return ""
  try {
    const d = new Date(timeString)
    if (isNaN(d.getTime())) return timeString
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  } catch (error) {
    return timeString
  }
}

const TransEvenAsesorIndex = () => {
  const { selectedMenuInfo } = useContext(GlobalContext)
  const navigate = useNavigate()

  // Estados de Selección
  const [selectedUserOrigen, setSelectedUserOrigen] = useState(null)
  const [selectedUserDestino, setSelectedUserDestino] = useState(null)

  // Estado principal de selecciones de los checkboxes
  const [selectedEvents, setSelectedEvents] = useState([])

  // Llave para forzar el refresco de la tabla de eventos
  const [refreshTableKey, setRefreshTableKey] = useState(1)

  // =====================================================================
  // QUERIES
  // =====================================================================

  // Query: Obtener Usuarios Activos
  const { data: rawUsuarios, isLoading: isLoadUsuarios } = useQuery({
    queryKey: ["getUsuariosActivosTransEventos"],
    queryFn: async () => {
      try {
        const response = await api.get("/AsignacionDeClientesAUsu/getUsuariosActivos")
        return response?.data?.data || response?.data || response || []
      } catch (error) {
        console.error("Error al cargar usuarios:", error)
        return []
      }
    },
    refetchOnWindowFocus: false,
  })

  const usuariosValidados = Array.isArray(rawUsuarios)
    ? rawUsuarios
    : Array.isArray(rawUsuarios?.data)
      ? rawUsuarios.data
      : []
  const listaUsuarios = usuariosValidados.filter((user) => user.usrstatus === "A")

  // Query Background: Obtener TODOS los eventos del origen para el contador y el "Seleccionar Todos"
  const { data: rawEventosOrigen, isLoading: isLoadEventos } = useQuery({
    queryKey: ["getEventosActivosOrigenAll", selectedUserOrigen?.usrcodigo],
    queryFn: async () => {
      if (!selectedUserOrigen) return []
      const res = await api.post("/TransEvenAsesor/getEventosOrigen", {
        page: 1,
        perPage: 99999, // Un número alto para traer el universo completo de IDs
        externalFilters: { usrcodigo_origen: selectedUserOrigen.usrcodigo },
      })
      const eventos = res?.data?.data?.data || res?.data?.data || res?.data || []
      return Array.isArray(eventos) ? eventos : []
    },
    enabled: !!selectedUserOrigen,
  })

  const listaEventosOrigen = Array.isArray(rawEventosOrigen) ? rawEventosOrigen : []

  // Auto-seleccionar todos los eventos por defecto al cargar el origen
  useEffect(() => {
    if (listaEventosOrigen.length > 0) {
      setSelectedEvents(listaEventosOrigen.map((e) => e.eventocodigo))
    } else {
      setSelectedEvents([])
    }
  }, [rawEventosOrigen])

  // Sincronizar el estado de React con el Bus de Eventos para que los SmartCheckboxes reaccionen
  useEffect(() => {
    selectionBus.set(selectedEvents)
  }, [selectedEvents])

  // =====================================================================
  // CONTROLADORES DE SELECCIÓN DE EVENTOS
  // =====================================================================
  const handleToggleEvent = (eventocodigo) => {
    setSelectedEvents((prev) =>
      prev.includes(eventocodigo) ? prev.filter((id) => id !== eventocodigo) : [...prev, eventocodigo],
    )
  }

  const handleSelectAll = () => {
    setSelectedEvents(listaEventosOrigen.map((e) => e.eventocodigo))
  }

  const handleDeselectAll = () => {
    setSelectedEvents([])
  }

  // =====================================================================
  // MUTACIÓN TRANSACCIONAL
  // =====================================================================
  const { mutateAsync: TransferirEventos, isPending: isSaving } = useMutation({
    queryKey: ["isTransferingEventos"],
    fn: async (payload) => {
      const response = await api.post("/TransEvenAsesor/transferirEventos", payload)
      return response.data
    },
    showError: "modal",
    onSuccess: async (res) => {
      const mensaje = res?.data || res?.message || "Transferencia de eventos exitosa."
      await showSuccess(mensaje)

      // Refrescamos la vista para limpiar caché y estados
      navigate(0)
    },
  })

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    if (!selectedUserOrigen) return showWarning("Debe seleccionar un Asesor de Origen.")
    if (!selectedUserDestino) return showWarning("Debe seleccionar un Asesor de Destino.")
    if (selectedUserOrigen.usrcodigo === selectedUserDestino.usrcodigo) {
      return showWarning("El Asesor de origen y destino no pueden ser el mismo.")
    }
    if (listaEventosOrigen.length === 0) {
      return showWarning("El Asesor de origen no tiene eventos activos para transferir.")
    }
    if (selectedEvents.length === 0) {
      return showWarning("Debe seleccionar al menos un evento para transferir.")
    }

    const payload = {
      usrcodigo_origen: selectedUserOrigen.usrcodigo,
      usrcodigo_destino: selectedUserDestino.usrcodigo,
      eventos_seleccionados: selectedEvents,
    }

    if (
      window.confirm(
        `¿Está seguro que desea transferir ${selectedEvents.length} evento(s) activo(s) de ${selectedUserOrigen.usrcodigo} hacia ${selectedUserDestino.usrcodigo}?\n\nEsta acción registrará auditoría en el historial de tareas.`,
      )
    ) {
      await TransferirEventos(payload)
    }
  }

  // =====================================================================
  // RENDERIZADO DE BARRA SUPERIOR (TOP BAR)
  // =====================================================================
  const grabarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")

  const toolbarActions = grabarAction
    ? [
        {
          label: "Transferir Eventos",
          key: grabarAction.acccaption,
          icon: getIconComponent(grabarAction.accnameicono, grabarAction.acctipoico),
        },
      ]
    : [{ label: "Transferir Eventos", key: "GRABAR", icon: <Save /> }]

  const isLoadingGlobal = isLoadUsuarios || isSaving

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        <Box sx={{ mb: 2 }}>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton
                onClick={handleSubmit}
                disabled={isLoadingGlobal || !selectedUserOrigen || !selectedUserDestino || selectedEvents.length === 0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, mr: 1, background: "white" }}
              >
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>

        <div style={{ display: "flex", justifyContent: "center", margin: "0 30px 20px 30px", fontSize: "25px" }}>
          <b>Transferencia Masiva de Eventos y Tareas</b>
        </div>

        <CustomBackdrop isLoading={isLoadingGlobal} />

        <Box sx={StyledRoot}>
          {/* CABECERA: SELECTORES DE USUARIO */}
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Parámetros de Reasignación
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={4} alignItems="center">
              {/* USUARIO ORIGEN */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Asesor Origen (Actual responsable de las tareas)
                </Typography>
                <Autocomplete
                  options={listaUsuarios}
                  getOptionLabel={(option) => `${option.usrcodigo} - ${option.usrnombre || "SIN NOMBRE"}`}
                  value={selectedUserOrigen}
                  isOptionEqualToValue={(option, value) => option.usrcodigo === value?.usrcodigo}
                  onChange={(e, newValue) => {
                    setSelectedUserOrigen(newValue)
                    if (newValue && selectedUserDestino && newValue.usrcodigo === selectedUserDestino.usrcodigo) {
                      setSelectedUserDestino(null)
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Seleccione Asesor Origen *"
                      placeholder="Buscar usuario..."
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              {/* USUARIO DESTINO */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Asesor Destino (Nuevo responsable)
                </Typography>
                <Autocomplete
                  options={listaUsuarios}
                  getOptionLabel={(option) => `${option.usrcodigo} - ${option.usrnombre || "SIN NOMBRE"}`}
                  value={selectedUserDestino}
                  isOptionEqualToValue={(option, value) => option.usrcodigo === value?.usrcodigo}
                  onChange={(e, newValue) => {
                    setSelectedUserDestino(newValue)
                    if (newValue && selectedUserOrigen && newValue.usrcodigo === selectedUserOrigen.usrcodigo) {
                      showWarning("El origen y el destino no pueden ser el mismo.")
                      setSelectedUserDestino(null)
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Seleccione Asesor Destino *"
                      placeholder="Buscar usuario..."
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* VISOR DE AUDITORÍA (GRILLA DE EVENTOS ACTIVOS) */}
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" color="secondary" sx={{ display: "flex", alignItems: "center" }}>
                <EventNoteIcon sx={{ mr: 1 }} />
                Eventos Activos a Transferir
              </Typography>
              {listaEventosOrigen.length > 0 && (
                <Box>
                  <Button
                    size="small"
                    startIcon={<SelectAllIcon />}
                    onClick={handleSelectAll}
                    sx={{ mr: 1 }}
                    variant="outlined"
                  >
                    Todos
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeselectIcon />}
                    onClick={handleDeselectAll}
                    variant="outlined"
                    color="error"
                  >
                    Ninguno
                  </Button>
                </Box>
              )}
            </Box>

            {selectedUserOrigen ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Se reasignarán <b>{selectedEvents.length}</b> de <b>{listaEventosOrigen.length}</b> eventos vinculados a{" "}
                <b>{selectedUserOrigen.usrcodigo}</b> al asesor destino.
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Seleccione un Asesor Origen para cargar la lista de eventos activos.
              </Alert>
            )}

            <CustomConditionalActionsTableServer
              key={refreshTableKey}
              endpoint={selectedUserOrigen ? "/TransEvenAsesor/getEventosOrigen" : ""}
              endpointJson={{
                externalFilters: {
                  usrcodigo_origen: selectedUserOrigen?.usrcodigo || "",
                },
              }}
              errorMsgFilterSearch="Error al cargar los eventos del asesor seleccionado."
              queryKeyModal="TransEvenData"
              perPage={10}
              columnsTable={[
                // Uso del SmartCheckbox que ignora la memoización de la tabla
                {
                  id: "seleccion",
                  header: "Sel.",
                  size: 50,
                  Cell: ({ row }) => (
                    <SmartCheckbox eventocodigo={row.original.eventocodigo} onToggle={handleToggleEvent} />
                  ),
                },
                {
                  accessorKey: "eventocodigo",
                  header: "Cód. Evento",
                  size: 130,
                  Cell: ({ cell }) => <span style={{ fontWeight: "bold" }}>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "eventofecha",
                  header: "Fecha",
                  size: 110,
                  Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
                },
                {
                  accessorKey: "eventohorainicio",
                  header: "Hora Inicio",
                  size: 100,
                  Cell: ({ cell }) => <span>{formatTime(cell.getValue())}</span>,
                },
                {
                  accessorKey: "eventohorafin",
                  header: "Hora Fin",
                  size: 100,
                  Cell: ({ cell }) => <span>{formatTime(cell.getValue())}</span>,
                },
                {
                  accessorKey: "clicodigo",
                  header: "Cód. Cliente",
                  size: 110,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "clinombre",
                  header: "Cliente",
                  size: 250,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "pregdescri",
                  header: "Tarea Asignada",
                  size: 250,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "eventostatus",
                  header: "Estado",
                  size: 120,
                  Cell: ({ cell }) => {
                    const status = cell.getValue()
                    const color = status === "EN_PROCESO" ? "warning" : "primary"
                    return (
                      <Chip
                        label={status}
                        color={color}
                        size="small"
                        sx={{ fontWeight: "bold", fontSize: "0.75rem" }}
                      />
                    )
                  },
                },
              ]}
            />
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default TransEvenAsesorIndex
