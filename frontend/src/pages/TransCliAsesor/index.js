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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Checkbox,
  Button,
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../components/CustomBackdrop"
import { useMutation, useQuery, api, showWarning, showSuccess } from "../../api"
import { GlobalContext } from "../../contexts/GlobalContext"
import getIconComponent from "../utils/getIconComponent"
import Save from "@mui/icons-material/Save"
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd"
import PersonIcon from "@mui/icons-material/Person"
import SelectAllIcon from "@mui/icons-material/SelectAll"
import DeselectIcon from "@mui/icons-material/Deselect"
import { useNavigate } from "react-router-dom"

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const StyledRoot = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const TransCliAsesorIndex = () => {
  const { selectedMenuInfo } = useContext(GlobalContext)
  const navigate = useNavigate()

  // Estados de Selección
  const [selectedUserOrigen, setSelectedUserOrigen] = useState(null)
  const [selectedUserDestino, setSelectedUserDestino] = useState(null)
  const [selectedClients, setSelectedClients] = useState([]) // Almacena los clicodigo seleccionados

  // =====================================================================
  // QUERIES (Reutilizando los endpoints del módulo de Asignaciones)
  // =====================================================================

  // Query: Obtener Usuarios Activos
  const { data: rawUsuarios, isLoading: isLoadUsuarios } = useQuery({
    queryKey: ["getUsuariosActivosTransferencia"],
    queryFn: async () => {
      try {
        const response = await api.get("/AsignacionDeClientesAUsu/getUsuariosActivos")
        return response?.data?.data || response?.data || response || []
      } catch (error) {
        console.error("Error al cargar usuarios:", error)
        return []
      }
    },
  })

  // Validación y filtrado exclusivo para usuarios "A" (Activos)
  const usuariosValidados = Array.isArray(rawUsuarios)
    ? rawUsuarios
    : Array.isArray(rawUsuarios?.data)
      ? rawUsuarios.data
      : []
  const listaUsuarios = usuariosValidados.filter((user) => user.usrstatus === "A")

  // Query: Obtener Clientes del Usuario Origen (Para el visor de auditoría)
  const {
    data: rawClientesOrigen,
    isLoading: isLoadAsignados,
    refetch: refetchOrigen,
  } = useQuery({
    queryKey: ["getClientesOrigen", selectedUserOrigen?.usrcodigo],
    queryFn: async () => {
      if (!selectedUserOrigen) return []
      const res = await api.post("/AsignacionDeClientesAUsu/getClientesAsignados", {
        usrcodigo: selectedUserOrigen.usrcodigo,
      })
      const asignados = res?.data?.data?.data || res?.data?.data || res?.data || []
      return Array.isArray(asignados) ? asignados : []
    },
    enabled: !!selectedUserOrigen,
  })

  const listaClientesOrigen = Array.isArray(rawClientesOrigen) ? rawClientesOrigen : []

  // Efecto para auto-seleccionar todos los clientes cuando se carga la cartera del origen
  useEffect(() => {
    if (listaClientesOrigen.length > 0) {
      setSelectedClients(listaClientesOrigen.map((c) => c.clicodigo))
    } else {
      setSelectedClients([])
    }
  }, [rawClientesOrigen])

  // =====================================================================
  // CONTROLADORES DE SELECCIÓN DE CLIENTES
  // =====================================================================
  const handleToggleClient = (clicodigo) => {
    setSelectedClients((prev) =>
      prev.includes(clicodigo) ? prev.filter((id) => id !== clicodigo) : [...prev, clicodigo],
    )
  }

  const handleSelectAll = () => {
    setSelectedClients(listaClientesOrigen.map((c) => c.clicodigo))
  }

  const handleDeselectAll = () => {
    setSelectedClients([])
  }

  // =====================================================================
  // MUTACIÓN TRANSACCIONAL
  // =====================================================================
  const { mutateAsync: TransferirCartera, isPending: isSaving } = useMutation({
    queryKey: ["isTransferingCartera"],
    fn: async (payload) => {
      const response = await api.post("/TransCliAsesor/transferirCartera", payload)
      return response.data
    },
    showError: "modal",
    onSuccess: async (res) => {
      const mensaje = res?.data || res?.message || "Transferencia exitosa."

      // Esperamos a que el usuario cierre la alerta de éxito
      await showSuccess(mensaje)

      // Recargamos la página para limpiar la caché de React Query y la vista
      navigate(0)
    },
  })

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    // Validaciones del frontend
    if (!selectedUserOrigen) return showWarning("Debe seleccionar un Asesor de Origen.")
    if (!selectedUserDestino) return showWarning("Debe seleccionar un Asesor de Destino.")
    if (selectedUserOrigen.usrcodigo === selectedUserDestino.usrcodigo) {
      return showWarning("El Asesor de origen y destino no pueden ser el mismo.")
    }
    if (listaClientesOrigen.length === 0) {
      return showWarning("El Asesor de origen no tiene clientes asignados para transferir.")
    }
    if (selectedClients.length === 0) {
      return showWarning("Debe seleccionar al menos un cliente para transferir.")
    }

    const payload = {
      usrcodigo_origen: selectedUserOrigen.usrcodigo,
      usrcodigo_destino: selectedUserDestino.usrcodigo,
      clientes_seleccionados: selectedClients,
    }

    if (
      window.confirm(
        `¿Está seguro que desea transferir ${selectedClients.length} cliente(s) de ${selectedUserOrigen.usrcodigo} hacia ${selectedUserDestino.usrcodigo}?`,
      )
    ) {
      await TransferirCartera(payload)
    }
  }

  // =====================================================================
  // RENDERIZADO DE BARRA SUPERIOR (TOP BAR)
  // =====================================================================
  const grabarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) =>
    ["GRABAR"].includes(action?.acccaption?.toUpperCase()),
  )

  const toolbarActions = grabarAction
    ? [
        {
          label: "Transferir Cartera",
          key: grabarAction.acccaption,
          icon: getIconComponent(grabarAction.accnameicono, grabarAction.acctipoico),
        },
      ]
    : [{ label: "Transferir Cartera", key: "GRABAR", icon: <Save /> }]

  const isLoadingGlobal = isLoadUsuarios || isLoadAsignados || isSaving

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
                disabled={isLoadingGlobal || selectedClients.length === 0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, mr: 1, background: "white" }}
              >
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>

        <div style={{ display: "flex", justifyContent: "center", margin: "0 30px 20px 30px", fontSize: "25px" }}>
          <b>Transferencia Masiva de Cartera de Clientes</b>
        </div>

        <CustomBackdrop isLoading={isLoadingGlobal} />

        <Box sx={StyledRoot}>
          {/* CABECERA: SELECTORES DE USUARIO */}
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Parámetros de Transferencia
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={4} alignItems="center">
              {/* USUARIO ORIGEN */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Asesor Origen (Quien entrega la cartera)
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
                  Asesor Destino (Quien recibe la cartera)
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

          {/* VISOR DE AUDITORÍA (LISTA DE CLIENTES DEL ORIGEN) */}
          {selectedUserOrigen && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" color="secondary" sx={{ display: "flex", alignItems: "center" }}>
                  <AssignmentIndIcon sx={{ mr: 1 }} />
                  Cartera a Transferir
                </Typography>
                {listaClientesOrigen.length > 0 && (
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

              <Alert severity="info" sx={{ mb: 2 }}>
                Se transferirán <b>{selectedClients.length}</b> de <b>{listaClientesOrigen.length}</b> clientes junto
                con sus permisos de documentos al usuario destino.
              </Alert>

              <List
                dense
                component="div"
                role="list"
                sx={{
                  maxHeight: "400px",
                  overflow: "auto",
                  border: "1px solid #eee",
                  borderRadius: 1,
                  bgcolor: "#fafafa",
                }}
              >
                {listaClientesOrigen.map((client) => {
                  const isSelected = selectedClients.includes(client.clicodigo)
                  return (
                    <ListItem
                      key={client.clicodigo}
                      divider
                      button
                      onClick={() => handleToggleClient(client.clicodigo)}
                      sx={{
                        backgroundColor: isSelected ? "rgba(25, 108, 135, 0.04)" : "transparent",
                        "&:hover": { backgroundColor: "rgba(25, 108, 135, 0.08)" },
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox edge="start" checked={isSelected} tabIndex={-1} disableRipple color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={isSelected ? "bold" : "regular"}>
                            {client.cliruc} - {client.clinombre}
                          </Typography>
                        }
                        secondary={
                          client.hereda_documentos
                            ? `Código: ${client.clicodigo} | 🔐 Hereda permisos`
                            : `Código: ${client.clicodigo} | 📄 Permisos granulares`
                        }
                      />
                    </ListItem>
                  )
                })}

                {listaClientesOrigen.length === 0 && !isLoadAsignados && (
                  <Typography
                    variant="body2"
                    sx={{ p: 4, display: "block", textAlign: "center", color: "text.secondary" }}
                  >
                    Este asesor no tiene clientes asignados actualmente en su cartera.
                  </Typography>
                )}
              </List>
            </Paper>
          )}
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default TransCliAsesorIndex
