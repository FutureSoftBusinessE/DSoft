/* eslint-disable camelcase */
import React, { useEffect, useState, useContext } from "react"
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
  Checkbox,
  Button,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../components/CustomBackdrop"
import { useMutation, useQuery, api, showWarning } from "../../api"
import { GlobalContext } from "../../contexts/GlobalContext"
import getIconComponent from "../utils/getIconComponent"
import Save from "@mui/icons-material/Save"
import SearchIcon from "@mui/icons-material/Search"

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
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

const AsignacionDeClientesAUsu = () => {
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estados Principales
  const [selectedUser, setSelectedUser] = useState(null)

  // Listas de Transferencia (Nivel 1)
  const [leftClients, setLeftClients] = useState([])
  const [rightClients, setRightClients] = useState([])
  const [checkedLeft, setCheckedLeft] = useState([])
  const [checkedRight, setCheckedRight] = useState([])

  // Búsqueda con Debounce
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Estado del Nivel 2 (Configuración Granular)
  const [selectedRightClient, setSelectedRightClient] = useState(null)
  const [permissionsConfig, setPermissionsConfig] = useState({})

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // =====================================================================
  // QUERIES (CONEXIÓN AL BACKEND ORIGINAL)
  // =====================================================================

  // Query: Obtener Usuarios Activos (Con lógica defensiva)
  const { data: rawUsuarios, isLoading: isLoadUsuarios } = useQuery({
    queryKey: ["getUsuariosActivosAsig"],
    queryFn: async () => {
      try {
        const response = await api.get("/AsignacionDeClientesAUsu/getUsuariosActivos")
        // Desestructuración defensiva para asegurar el arreglo
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

  // Query: Obtener Clientes Asignados
  const { isLoading: isLoadAsignados } = useQuery({
    queryKey: ["getClientesAsignados", selectedUser?.usrcodigo],
    queryFn: async () => {
      if (!selectedUser) return []
      const res = await api.post("/AsignacionDeClientesAUsu/getClientesAsignados", {
        usrcodigo: selectedUser.usrcodigo,
      })

      // EXTRACCIÓN SEGURA (Busca en los 3 niveles de anidación que muestra tu backend)
      const asignados = res?.data?.data?.data || res?.data?.data || res?.data || []
      const dataToSet = Array.isArray(asignados) ? asignados : []
      setRightClients(dataToSet)

      const initConfig = {}
      dataToSet.forEach((cli) => {
        initConfig[cli.clicodigo] = { hereda: cli.hereda_documentos, docs: [] }
      })
      setPermissionsConfig(initConfig)
      setSelectedRightClient(null)

      return dataToSet
    },
    enabled: !!selectedUser,
  })

  // Query: Obtener Clientes Disponibles
  const { isLoading: isLoadDisponibles } = useQuery({
    queryKey: ["getClientesDisponibles", selectedUser?.usrcodigo, debouncedSearch, rightClients],
    queryFn: async () => {
      if (!selectedUser) return []
      const res = await api.post("/AsignacionDeClientesAUsu/getClientesDisponibles", {
        usrcodigo: selectedUser.usrcodigo,
        search: debouncedSearch,
        page: 1,
      })

      // EXTRACCIÓN SEGURA (Busca en los 3 niveles de anidación que muestra tu backend)
      const disponibles = res?.data?.data?.data || res?.data?.data || res?.data || []
      const arrDisponibles = Array.isArray(disponibles) ? disponibles : []
      const safeRightClients = Array.isArray(rightClients) ? rightClients : []

      const filtered = arrDisponibles.filter((d) => !safeRightClients.some((r) => r.clicodigo === d.clicodigo))
      setLeftClients(filtered)
      return filtered
    },
    enabled: !!selectedUser,
  })

  // Query: Obtener Documentos del Cliente
  const {
    data: rawDocumentos,
    isLoading: isLoadDocs,
    isFetching: isFetchingDocs,
  } = useQuery({
    queryKey: ["getDocumentosCliente", selectedUser?.usrcodigo, selectedRightClient?.clicodigo],
    queryFn: async () => {
      if (!selectedUser || !selectedRightClient) return []
      const res = await api.post("/AsignacionDeClientesAUsu/getDocumentosCliente", {
        usrcodigo: selectedUser.usrcodigo,
        clicodigo: selectedRightClient.clicodigo,
      })

      // EXTRACCIÓN SEGURA (Busca en los 3 niveles de anidación que muestra tu backend)
      const docs = res?.data?.data?.data || res?.data?.data || res?.data || []
      const arrDocs = Array.isArray(docs) ? docs : []

      setPermissionsConfig((prev) => {
        const copy = { ...prev }
        if (!copy[selectedRightClient.clicodigo]) {
          copy[selectedRightClient.clicodigo] = { hereda: false, docs: [] }
        }
        if (copy[selectedRightClient.clicodigo].docs.length === 0) {
          const uuidsPermitidos = arrDocs.filter((d) => d.permiso_ver).map((d) => d.documentouuid)
          copy[selectedRightClient.clicodigo].docs = uuidsPermitidos
        }
        return copy
      })

      return arrDocs
    },
    enabled: !!selectedRightClient,
  })

  const listaDocumentos = Array.isArray(rawDocumentos) ? rawDocumentos : []

  // =====================================================================
  // MUTACIÓN TRANSACCIONAL
  // =====================================================================
  const { mutateAsync: SaveAsignacion, isPending: isSaving } = useMutation({
    queryKey: ["isSavingAsignacionCartera"],
    fn: async (payload) => {
      const response = await api.post("/AsignacionDeClientesAUsu/saveAsignacionCartera", payload)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
  })

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!selectedUser) {
      return showWarning("Debe seleccionar un Usuario primero.")
    }

    const safeRightClients = Array.isArray(rightClients) ? rightClients : []
    const asignacionesPayload = safeRightClients.map((cli) => {
      const config = permissionsConfig[cli.clicodigo] || { hereda: false, docs: [] }
      return {
        clicodigo: cli.clicodigo,
        hereda_documentos: config.hereda,
        documentos: config.docs,
      }
    })

    const payload = {
      usrcodigo: selectedUser.usrcodigo,
      asignaciones: asignacionesPayload,
    }

    try {
      await SaveAsignacion(payload)
    } catch (error) {
      console.error("Error al guardar la asignación:", error)
    }
  }

  // =====================================================================
  // LÓGICA DEL TRANSFER LIST Y NIVEL 2
  // =====================================================================
  const handleToggle = (value, isLeft) => () => {
    const currentChecked = isLeft ? checkedLeft : checkedRight
    const setChecked = isLeft ? setCheckedLeft : setCheckedRight
    const currentIndex = currentChecked.indexOf(value)
    const newChecked = [...currentChecked]

    if (currentIndex === -1) newChecked.push(value)
    else newChecked.splice(currentIndex, 1)

    setChecked(newChecked)
  }

  const moveRight = () => {
    const safeLeftClients = Array.isArray(leftClients) ? leftClients : []
    const itemsToMove = safeLeftClients.filter((c) => checkedLeft.includes(c.clicodigo))
    const newConfig = { ...permissionsConfig }

    itemsToMove.forEach((c) => {
      newConfig[c.clicodigo] = { hereda: false, docs: [] }
    })

    setPermissionsConfig(newConfig)
    setRightClients((prev) => {
      const prevArray = Array.isArray(prev) ? prev : []
      return [...prevArray, ...itemsToMove].sort((a, b) => a.clinombre.localeCompare(b.clinombre))
    })
    setLeftClients((prev) => {
      const prevArray = Array.isArray(prev) ? prev : []
      return prevArray.filter((c) => !checkedLeft.includes(c.clicodigo))
    })
    setCheckedLeft([])
  }

  const moveLeft = () => {
    const safeRightClients = Array.isArray(rightClients) ? rightClients : []
    const itemsToMove = safeRightClients.filter((c) => checkedRight.includes(c.clicodigo))

    setLeftClients((prev) => {
      const prevArray = Array.isArray(prev) ? prev : []
      return [...prevArray, ...itemsToMove].sort((a, b) => a.clinombre.localeCompare(b.clinombre))
    })
    setRightClients((prev) => {
      const prevArray = Array.isArray(prev) ? prev : []
      return prevArray.filter((c) => !checkedRight.includes(c.clicodigo))
    })
    setCheckedRight([])

    if (selectedRightClient && checkedRight.includes(selectedRightClient.clicodigo)) {
      setSelectedRightClient(null)
    }
  }

  const handleToggleHereda = (e) => {
    const checked = e.target.checked
    if (selectedRightClient) {
      setPermissionsConfig((prev) => ({
        ...prev,
        [selectedRightClient.clicodigo]: { ...prev[selectedRightClient.clicodigo], hereda: checked },
      }))
    }
  }

  const handleToggleDoc = (uuid) => {
    if (!selectedRightClient) return
    setPermissionsConfig((prev) => {
      const config = prev[selectedRightClient.clicodigo] || { hereda: false, docs: [] }
      const currentDocs = [...config.docs]
      const idx = currentDocs.indexOf(uuid)

      if (idx === -1) currentDocs.push(uuid)
      else currentDocs.splice(idx, 1)

      return {
        ...prev,
        [selectedRightClient.clicodigo]: { ...config, docs: currentDocs },
      }
    })
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
          label: grabarAction.acccaption,
          key: grabarAction.acccaption,
          icon: getIconComponent(grabarAction.accnameicono, grabarAction.acctipoico),
        },
      ]
    : []

  const isLoadingGlobal = isLoadUsuarios || isLoadAsignados || isLoadDisponibles || isSaving

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
                disabled={isLoadingGlobal}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, mr: 1, background: "white" }}
              >
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>

        <div style={{ display: "flex", justifyContent: "center", margin: "0 30px 20px 30px", fontSize: "25px" }}>
          <b>Asignación de Clientes y Permisos</b>
        </div>

        <CustomBackdrop isLoading={isLoadingGlobal} />

        <Box sx={StyledRoot}>
          {/* CABECERA: SELECTOR DE USUARIO */}
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={listaUsuarios}
                  getOptionLabel={(option) => `${option.usrcodigo} - ${option.usrnombre || "SIN NOMBRE"}`}
                  value={selectedUser}
                  isOptionEqualToValue={(option, value) => option.usrcodigo === value?.usrcodigo}
                  onChange={(e, newValue) => {
                    setSelectedUser(newValue)
                    setLeftClients([])
                    setSearchTerm("")
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Seleccione el Usuario para gestionar sus Clienes *"
                      placeholder="Buscar usuario..."
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>

          {selectedUser && (
            <Grid container spacing={3}>
              {/* CAJA IZQUIERDA: DISPONIBLES */}
              <Grid item xs={12} md={5}>
                <Paper elevation={3} sx={{ p: 2, height: "450px", display: "flex", flexDirection: "column" }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                    Clientes Disponibles (Libres)
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="Buscar por RUC o Nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{ endAdornment: <SearchIcon color="action" /> }}
                    sx={{ mb: 2 }}
                  />
                  <List
                    dense
                    component="div"
                    role="list"
                    sx={{ flexGrow: 1, overflow: "auto", border: "1px solid #eee", borderRadius: 1 }}
                  >
                    {(Array.isArray(leftClients) ? leftClients : []).map((client) => (
                      <ListItem key={client.clicodigo} button onClick={handleToggle(client.clicodigo, true)}>
                        <ListItemIcon>
                          <Checkbox
                            checked={checkedLeft.indexOf(client.clicodigo) !== -1}
                            tabIndex={-1}
                            disableRipple
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${client.cliruc} - ${client.clinombre}`}
                          secondary={`Código: ${client.clicodigo}`}
                        />
                      </ListItem>
                    ))}
                    {Array.isArray(leftClients) && leftClients.length === 0 && !isLoadDisponibles && (
                      <Typography
                        variant="caption"
                        sx={{ p: 2, display: "block", textAlign: "center", color: "text.secondary" }}
                      >
                        Utilice el buscador para cargar clientes.
                      </Typography>
                    )}
                  </List>
                </Paper>
              </Grid>

              {/* BOTONES CENTRALES */}
              <Grid
                item
                xs={12}
                md={2}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  size="small"
                  onClick={moveRight}
                  disabled={checkedLeft.length === 0}
                  aria-label="move selected right"
                >
                  Asignar &gt;
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={moveLeft}
                  disabled={checkedRight.length === 0}
                  aria-label="move selected left"
                >
                  &lt; Revocar
                </Button>
              </Grid>

              {/* CAJA DERECHA: ASIGNADOS (NIVEL 1) */}
              <Grid item xs={12} md={5}>
                <Paper
                  elevation={3}
                  sx={{ p: 2, height: "450px", display: "flex", flexDirection: "column", border: "2px solid #196C87" }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                    Clientes Asignados
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 2 }}>
                    Seleccione un cliente de esta lista para configurar sus permisos de documentos.
                  </Typography>
                  <List
                    dense
                    component="div"
                    role="list"
                    sx={{ flexGrow: 1, overflow: "auto", border: "1px solid #eee", borderRadius: 1 }}
                  >
                    {(Array.isArray(rightClients) ? rightClients : []).map((client) => {
                      const isConfigSelected = selectedRightClient?.clicodigo === client.clicodigo
                      return (
                        <ListItem
                          key={client.clicodigo}
                          sx={{ backgroundColor: isConfigSelected ? "#e3f2fd" : "inherit" }}
                        >
                          <ListItemIcon onClick={handleToggle(client.clicodigo, false)} sx={{ cursor: "pointer" }}>
                            <Checkbox
                              checked={checkedRight.indexOf(client.clicodigo) !== -1}
                              tabIndex={-1}
                              disableRipple
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${client.cliruc} - ${client.clinombre}`}
                            secondary={
                              permissionsConfig[client.clicodigo]?.hereda
                                ? "🔐 Acceso Total Heredado"
                                : "📄 Acceso Granular"
                            }
                            onClick={() => setSelectedRightClient(client)}
                            sx={{ cursor: "pointer" }}
                          />
                        </ListItem>
                      )
                    })}
                  </List>
                </Paper>
              </Grid>

              {/* PANEL INFERIOR: NIVEL 2 (DOCUMENTOS Y CLAVES) */}
              {selectedRightClient && (
                <Grid item xs={12}>
                  <Paper elevation={4} sx={{ p: 3, mt: 1, borderRadius: 2, backgroundColor: "#fafafa" }}>
                    <Typography variant="h6" color="secondary" gutterBottom>
                      Configuración de Permisos - {selectedRightClient.clinombre}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={permissionsConfig[selectedRightClient.clicodigo]?.hereda || false}
                          onChange={handleToggleHereda}
                          color="secondary"
                        />
                      }
                      label={<b>Heredar acceso total (Visualizar todos los Documentos y Claves actuales/futuros)</b>}
                    />

                    {/* SI NO HEREDA, MOSTRAMOS LOS CHECKBOXES */}
                    {!permissionsConfig[selectedRightClient.clicodigo]?.hereda && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Seleccione individualmente los documentos y claves permitidos:
                        </Typography>

                        {isFetchingDocs ? (
                          <Typography variant="caption">Cargando documentos...</Typography>
                        ) : (
                          <Grid container spacing={2}>
                            {listaDocumentos.map((doc) => {
                              const docsSeleccionados = permissionsConfig[selectedRightClient.clicodigo]?.docs || []
                              const isChecked = docsSeleccionados.includes(doc.documentouuid)

                              return (
                                <Grid item xs={12} sm={6} md={4} key={doc.documentouuid}>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={isChecked}
                                        onChange={() => handleToggleDoc(doc.documentouuid)}
                                        size="small"
                                      />
                                    }
                                    label={
                                      <Typography variant="body2">
                                        {doc.docnombre} ({doc.docextension})
                                      </Typography>
                                    }
                                  />
                                </Grid>
                              )
                            })}
                            {listaDocumentos.length === 0 && (
                              <Typography variant="caption" sx={{ ml: 2 }}>
                                Este cliente no tiene documentos registrados.
                              </Typography>
                            )}
                          </Grid>
                        )}
                      </Box>
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default AsignacionDeClientesAUsu
