import React, { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  RadioGroup,
  FormLabel,
  FormControl,
  Divider,
  Paper,
  IconButton,
  Tabs,
  Tab,
  Dialog,
} from "@mui/material"
import { DataGrid } from "@mui/x-data-grid"

import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material"
import Swal from "sweetalert2"

import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import CustomBackdrop from "../../../components/CustomBackdrop"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"

// =================================================================
// ESTILOS Y TEMA (Modo Consulta - Solo Lectura)
// =================================================================
const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  padding: "0 16px",
  minHeight: "80vh",
}))

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" }, error: { main: "#d32f2f" } },
})

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

// =================================================================
// OPCIONES ESTÁTICAS
// =================================================================
const opcIdentificacion = [
  { id: "C", label: "Cédula" },
  { id: "R", label: "R.U.C." },
  { id: "P", label: "Pasaporte" },
  { id: "O", label: "No Aplica" },
]
const opcSexo = [
  { id: "M", label: "Masculino" },
  { id: "F", label: "Femenino" },
]
const opcEstCiv = [
  { id: "SOLTERO", label: "Soltero" },
  { id: "CASADO", label: "Casado" },
  { id: "DIVORCIADO", label: "Divorciado" },
  { id: "VIUDO", label: "Viudo" },
  { id: "UNION LIBRE", label: "Unión Libre" },
]
const opcPersona = [
  { id: "N", label: "Natural" },
  { id: "J", label: "Jurídica" },
]
const opcOrigenIng = [
  { id: "B", label: "Empleado Público" },
  { id: "V", label: "Empleado Privado" },
  { id: "I", label: "Independiente" },
  { id: "A", label: "Ama de Casa / Estudiante" },
  { id: "R", label: "Rentista" },
  { id: "H", label: "Jubilado" },
  { id: "M", label: "Remesas del Exterior" },
]

const initialMaestroState = {
  clicodigo: "",
  cliruc: "",
  clinombre: "",
  cliidentifica: "C",
  tipcodigo: "",
  clidirec: "",
  clidirec2: "",
  clitelef1: "",
  clitelef2: "",
  clifax: "",
  cliemail: "",
  website: "",
  clisexo: "",
  cliestciv: "",
  clifecnac: "",
  clipersona: "",
  cliprofesion: "",
  cliintersec: "",
  clistatus: "A",
  procodigo: "",
  ciucodigo: "",
  zoncodigo: "",
  regcodigo: "",
  parrocodigo: "",
  activicodigo: "",
  sectorcodigo: "",
  usrcodigo: "",
  cliorigening: "I",
  calfcodigo: "",
  clirucrepres: "",
  clirepres: "",
  cliidenrep: "O",
  cliidencon: "O",
  cliruccon: "",
  clinombrecon: "",
  clidireccon: "",
  cliprofesioncon: "",
  clidiascrs: 0,
  climontocrs: 0,
  cliprefac: 1,
  cliapliiva: -1,
  clibloqueo: 0,
  cliobserva: "",
  clitipodomicilio: "",
  clitiempodomicilio: "",
  cliubicacionrapido: "",
  tarenviosta: "D",
  cliparterel: 0,
  cliconespecial: 0,
  clireferencia1: "",
  cliparentesco1: "",
  clireftelefono1: "",
  clireferencia2: "",
  cliparentesco2: "",
  clireftelefono2: "",
  clirucmatriz: "",
  clinommatriz: "",
  clifecmsys: null,
  clihormsys: null,
  cliusuisys: "",
  clifecisys: "",
  cliusumsys: "",
}

const mapToValueLabel = (arr) => (arr ? arr.map((item) => ({ value: item.id || item.value, label: item.label })) : [])

const ConsultarCreacionClientes = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const clienteEdit = location.state

  const [isLoading, setIsLoading] = useState(false)
  const [maestro, setMaestro] = useState(initialMaestroState)

  // Tablas Hijas y Auditoría (Solo Lectura)
  const [agencias, setAgencias] = useState([])
  const [contactos, setContactos] = useState([])
  const [referencias, setReferencias] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [descuentosLinea, setDescuentosLinea] = useState([])
  const [descuentosArticulo, setDescuentosArticulo] = useState([])
  const [historial, setHistorial] = useState([])
  const [imagenes, setImagenes] = useState([])

  const [auditCliente, setAuditCliente] = useState([])
  const [auditDescLinea, setAuditDescLinea] = useState([])
  const [auditDescArt, setAuditDescArt] = useState([])

  // Variables para las nuevas tablas Analíticas
  const [protestos, setProtestos] = useState([])
  const [saldos, setSaldos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [garantias, setGarantias] = useState([]) // Para la pestaña Línea/CR

  const [imagenAmpliada, setImagenAmpliada] = useState(null)
  const [tabAuditoria, setTabAuditoria] = useState(0)
  const [catalogos, setCatalogos] = useState({})

  // NUEVAS VARIABLES PARA LOS FILTROS ANALÍTICOS Y SPINNERS
  const hoy = new Date().toISOString().split("T")[0]
  const primerDia = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]

  const [filtrosAnalitica, setFiltrosAnalitica] = useState({
    protestos: { desde: primerDia, hasta: hoy, alcance: "CIA" },
    saldos: { desde: primerDia, hasta: hoy, alcance: "CIA" },
    movimientos: { desde: primerDia, hasta: hoy, alcance: "CIA" },
    garantias: { desde: primerDia, hasta: hoy, alcance: "CIA" },
  })

  const [loadingAnalitica, setLoadingAnalitica] = useState({
    protestos: false,
    saldos: false,
    movimientos: false,
    garantias: false,
  })

  useEffect(() => {
    // Seguro de vida: Si accede directo a la URL sin cliente, lo devuelve a la grilla
    if (!clienteEdit || !clienteEdit.clicodigo) {
      navigate(-1)
      return
    }
    cargarEntorno()
  }, [])

  const fetchImagenes = async (clicodigo) => {
    try {
      const res = await fetchwrapper("/CreacionCliente/getImagenesCliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clicodigo }),
      })
      const data = await res.json()
      if (data.success) setImagenes(data.data)
    } catch (err) {
      console.error("Error al cargar imágenes", err)
    }
  }

  const cargarEntorno = async () => {
    setIsLoading(true)
    try {
      const resCat = await (await fetchwrapper("/CreacionCliente/getCatalogosCliente", { method: "POST" })).json()
      if (resCat?.success) setCatalogos(resCat.data)

      // Aquí solicitamos la data transaccional y analítica del cliente
      const reqCompleto = await fetchwrapper("/CreacionCliente/getClienteCompleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clicodigo: clienteEdit.clicodigo }),
      })
      const resCompleto = await reqCompleto.json()

      if (resCompleto?.success) {
        const mData = resCompleto.data.maestro
        if (mData.clifecnac) mData.clifecnac = mData.clifecnac.split(" ")[0]
        setMaestro({ ...initialMaestroState, ...mData })

        setAgencias((resCompleto.data.agencias || []).map((a, i) => ({ id: `ag_${i}`, ...a })))
        setContactos((resCompleto.data.contactos || []).map((c, i) => ({ id: `co_${i}`, ...c })))
        setReferencias((resCompleto.data.referencias || []).map((r, i) => ({ id: `ref_${i}`, ...r })))
        setVendedores((resCompleto.data.vendedores || []).map((v, i) => ({ id: `ven_${i}`, ...v })))
        setDescuentosLinea((resCompleto.data.descuentosLinea || []).map((d, i) => ({ id: `dl_${i}`, ...d })))
        setDescuentosArticulo((resCompleto.data.descuentosArticulo || []).map((d, i) => ({ id: `da_${i}`, ...d })))
        setHistorial((resCompleto.data.historial || []).map((h, i) => ({ id: `h_${i}`, ...h })))

        setAuditCliente((resCompleto.data.auditCliente || []).map((a, i) => ({ id: `ac_${i}`, ...a })))
        setAuditDescLinea((resCompleto.data.auditDescLinea || []).map((a, i) => ({ id: `al_${i}`, ...a })))
        setAuditDescArt((resCompleto.data.auditDescArt || []).map((a, i) => ({ id: `aa_${i}`, ...a })))

        fetchImagenes(clienteEdit.clicodigo)
      }
    } catch (error) {
      Swal.fire("Error de Conexión", error.message, "error")
    } finally {
      setIsLoading(false)
    }
  }

  // NUEVA FUNCIÓN PARA EJECUTAR LA BÚSQUEDA ESPECÍFICA DE ANALÍTICA (Como cmdProtesto_Click en VB6)
  const handleFetchAnalitica = async (modulo) => {
    if (!maestro.clicodigo || !maestro.cliruc) return
    setLoadingAnalitica((prev) => ({ ...prev, [modulo]: true }))
    try {
      const res = await fetchwrapper("/CreacionCliente/getAnaliticaCliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clicodigo: maestro.clicodigo,
          cliruc: maestro.cliruc,
          modulo: modulo.toUpperCase(),
          fechaDesde: filtrosAnalitica[modulo].desde,
          fechaHasta: filtrosAnalitica[modulo].hasta,
          alcance: filtrosAnalitica[modulo].alcance,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const arr = data.data.map((x, i) => ({ id: `${modulo}_${i}`, ...x }))
        if (modulo === "protestos") setProtestos(arr)
        if (modulo === "saldos") setSaldos(arr)
        if (modulo === "movimientos") setMovimientos(arr)
        if (modulo === "garantias") setGarantias(arr)
      } else {
        Swal.fire("Aviso", data.message, "warning")
      }
    } catch (error) {
      Swal.fire("Error", "Error al conectar con la Analítica", "error")
    } finally {
      setLoadingAnalitica((prev) => ({ ...prev, [modulo]: false }))
    }
  }

  // COMPONENTE VISUAL PARA RENDERIZAR LA BARRA DE FILTROS DENTRO DE LOS ACORDEONES
  const renderFiltrosBar = (modulo) => (
    <Grid
      container
      spacing={2}
      alignItems="center"
      sx={{ mb: 2, bgcolor: "#f9fafb", p: 1, borderRadius: 1, border: "1px solid #e0e0e0" }}
    >
      <Grid item xs={12} md={3}>
        <TextField
          type="date"
          label="Fecha Desde"
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={filtrosAnalitica[modulo].desde}
          onChange={(e) =>
            setFiltrosAnalitica({
              ...filtrosAnalitica,
              [modulo]: { ...filtrosAnalitica[modulo], desde: e.target.value },
            })
          }
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          type="date"
          label="Fecha Hasta"
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={filtrosAnalitica[modulo].hasta}
          onChange={(e) =>
            setFiltrosAnalitica({
              ...filtrosAnalitica,
              [modulo]: { ...filtrosAnalitica[modulo], hasta: e.target.value },
            })
          }
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          select
          label="Alcance de Búsqueda"
          size="small"
          fullWidth
          value={filtrosAnalitica[modulo].alcance}
          onChange={(e) =>
            setFiltrosAnalitica({
              ...filtrosAnalitica,
              [modulo]: { ...filtrosAnalitica[modulo], alcance: e.target.value },
            })
          }
        >
          <MenuItem value="LOC">1. Solo esta Localidad</MenuItem>
          <MenuItem value="CIA">2. Toda esta Compañía</MenuItem>
          <MenuItem value="ALL">3. Consolidado (Todas las CIAs)</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} md={2}>
        <Button
          variant="contained"
          fullWidth
          onClick={() => handleFetchAnalitica(modulo)}
          disabled={loadingAnalitica[modulo]}
          sx={{ fontWeight: "bold" }}
        >
          {loadingAnalitica[modulo] ? "Buscando..." : "Consultar"}
        </Button>
      </Grid>
    </Grid>
  )

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <CustomBackdrop isLoading={isLoading} />

      <div className="main main-app p-2 p-lg-3" style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          p={2}
          bgcolor="white"
          borderRadius={2}
          boxShadow={1}
        >
          <Box display="flex" alignItems="center">
            <BackIcon />
            <Typography variant="h5" fontWeight="bold" color="primary.main" ml={2}>
              Visor Analítico del Cliente: {maestro.clicodigo || ""}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ fontWeight: "bold" }}
          >
            VOLVER AL MAESTRO
          </Button>
        </Box>

        <StyledRoot>
          {/* ======================= ACORDEÓN 1: GENERALES (SOLO LECTURA) ======================= */}
          <Accordion defaultExpanded elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#e1f5fe" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.dark">
                1. Generales y Ubicación
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} pt={1}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Cód. Cliente"
                    value={maestro.clicodigo}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de Ident."
                    value={maestro.cliidentifica || ""}
                    disabled
                    size="small"
                  >
                    {opcIdentificacion.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Nº Identificación"
                    value={maestro.cliruc || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField select fullWidth label="Estado" value={maestro.clistatus || ""} disabled size="small">
                    <MenuItem value="A">ACTIVO</MenuItem>
                    <MenuItem value="P">POTENCIAL</MenuItem>
                    <MenuItem value="I">INACTIVO</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label="Razón Social / Nombre"
                    value={maestro.clinombre || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="RUC Matriz (Si aplica)"
                    value={maestro.clirucmatriz || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={9}>
                  <TextField
                    fullWidth
                    label="Nombre Matriz (Si aplica)"
                    value={maestro.clinommatriz || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset" disabled>
                    <FormLabel component="legend" sx={{ fontSize: "0.8rem" }}>
                      Tipo de Domicilio
                    </FormLabel>
                    <RadioGroup row value={maestro.clitipodomicilio || ""}>
                      <FormControlLabel value="P" control={<Radio size="small" />} label="Propio" />
                      <FormControlLabel value="A" control={<Radio size="small" />} label="Arrienda" />
                      <FormControlLabel value="F" control={<Radio size="small" />} label="Familiar" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tiempo de Residencia"
                    value={maestro.clitiempodomicilio || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observaciones Adicionales"
                    value={maestro.cliobserva || ""}
                    InputProps={{ readOnly: true }}
                    multiline
                    rows={3}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label="Referencia rápido Ubicación"
                    value={maestro.cliubicacionrapido || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label="Dirección Domicilio"
                    value={maestro.clidirec || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Actividad Económica"
                    value={maestro.activicodigo || ""}
                    disabled
                    size="small"
                  >
                    {catalogos.actividades?.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Sector Público"
                    value={maestro.sectorcodigo || ""}
                    disabled
                    size="small"
                  >
                    {catalogos.sectores?.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Profesión"
                    value={maestro.cliprofesion || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Teléfono 1"
                    value={maestro.clitelef1 || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Teléfono 2"
                    value={maestro.clitelef2 || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Fax"
                    value={maestro.clifax || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Celular"
                    value={maestro.cliintersec || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={maestro.cliemail || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Web Site"
                    value={maestro.website || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de Cliente"
                    value={maestro.tipcodigo || ""}
                    disabled
                    size="small"
                  >
                    {catalogos.tiposCliente?.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Estado Civil"
                    value={maestro.cliestciv || ""}
                    disabled
                    size="small"
                  >
                    {opcEstCiv.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fec. Const/Nacimiento"
                    value={maestro.clifecnac || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField select fullWidth label="Sexo" value={maestro.clisexo || ""} disabled size="small">
                    {opcSexo.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField select fullWidth label="Persona" value={maestro.clipersona || ""} disabled size="small">
                    {opcPersona.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Origen de Ingresos"
                    value={maestro.cliorigening || ""}
                    disabled
                    size="small"
                  >
                    {opcOrigenIng.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Calificación"
                    value={maestro.calfcodigo || ""}
                    disabled
                    size="small"
                  >
                    {catalogos.calificaciones?.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    disabled
                    control={<Switch checked={maestro.cliparterel !== 0} />}
                    label="Parte Relacionada (ATS)"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    disabled
                    control={<Switch checked={maestro.cliconespecial !== 0} color="secondary" />}
                    label="Contribuyente Especial"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 2: CRÉDITO ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                2. Crédito, Oficial y Referencias
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Plazo Máx (Días)"
                    value={maestro.clidiascrs}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cupo Crédito ($)"
                    value={maestro.climontocrs}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Lista de Precios"
                    value={maestro.cliprefac}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Oficial de Crédito"
                    value={maestro.usrcodigo || ""}
                    disabled
                    size="small"
                  >
                    {catalogos.oficialesCredito?.map((o, idx) => (
                      <MenuItem key={`ofi_${o.value || o.id || idx}`} value={o.value || o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    disabled
                    control={<Switch checked={maestro.clibloqueo !== 0} />}
                    label="Bloqueo Crédito"
                  />
                  <FormControlLabel
                    disabled
                    control={<Switch checked={maestro.cliapliiva !== 0} color="secondary" />}
                    label="Aplica I.V.A."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption">Datos del Representante Legal</Typography>
                  </Divider>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Id. Representante"
                    value={maestro.cliidenrep || ""}
                    disabled
                    size="small"
                  >
                    {opcIdentificacion.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Nº Identificación Rep."
                    value={maestro.clirucrepres || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre Representante Legal"
                    value={maestro.clirepres || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption">Referencias Personales / Familiares</Typography>
                  </Divider>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Referencia 1"
                    value={maestro.clireferencia1 || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Parentesco 1"
                    value={maestro.cliparentesco1 || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Teléfono 1"
                    value={maestro.clireftelefono1 || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Referencia 2"
                    value={maestro.clireferencia2 || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Parentesco 2"
                    value={maestro.cliparentesco2 || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Teléfono 2"
                    value={maestro.clireftelefono2 || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box sx={{ height: 250, mt: 3 }}>
                <Typography variant="subtitle2" color="primary">
                  Referencias Bancarias / Tarjetas
                </Typography>
                <DataGrid
                  rows={referencias}
                  disableRowSelectionOnClick
                  density="compact"
                  columns={[
                    { field: "bcotipo", headerName: "Tipo", width: 130 },
                    {
                      field: "bcocodigo",
                      headerName: "Banco / Tarjeta",
                      width: 250,
                      valueFormatter: (params) =>
                        catalogos.bancos?.find((b) => b.value === params.value)?.label || params.value,
                    },
                    { field: "bconumcta", headerName: "Nº Cuenta/Tarjeta", width: 180 },
                    { field: "boccalifi", headerName: "Calificación", width: 100 },
                    {
                      field: "bcofecape",
                      headerName: "Fec. Apertura",
                      type: "date",
                      width: 130,
                      valueGetter: (params) => (params.value ? new Date(params.value) : null),
                    },
                  ]}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 3: UBICACIÓN Y VENDEDORES ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                3. Vendedor / Ubicación (Rutas)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField select fullWidth label="Región" value={maestro.regcodigo || ""} disabled size="small">
                    {catalogos.regiones?.map((o) => (
                      <MenuItem key={`reg_${o.id}`} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Zona Comercial"
                    value={maestro.zoncodigo || ""}
                    disabled
                    size="small"
                  >
                    {catalogos.zonas?.map((o) => (
                      <MenuItem key={`zon_${o.id || o.value}`} value={o.id || o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField select fullWidth label="Provincia" value={maestro.procodigo || ""} disabled size="small">
                    {catalogos.provincias?.map((o) => (
                      <MenuItem key={`pro_${o.id}`} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Cantón / Ciudad"
                    value={maestro.ciucodigo || ""}
                    disabled
                    size="small"
                  >
                    {catalogos.ciudades?.map((o) => (
                      <MenuItem key={`ciu_${o.id}`} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Parroquia (DINARDAP)"
                    value={maestro.parrocodigo || ""}
                    disabled
                    size="small"
                  >
                    {catalogos.parroquias?.map((o) => (
                      <MenuItem key={`par_${o.id}`} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ height: 250, mt: 1 }}>
                    <DataGrid
                      rows={vendedores}
                      disableRowSelectionOnClick
                      density="compact"
                      columns={[
                        {
                          field: "vencodigo",
                          headerName: "Vendedor Asignado",
                          width: 300,
                          valueFormatter: (params) =>
                            catalogos.vendedores?.find((b) => b.value === params.value)?.label || params.value,
                        },
                        {
                          field: "loccodigo",
                          headerName: "Localidad",
                          width: 250,
                          valueFormatter: (params) =>
                            catalogos.localidades?.find((b) => b.value === params.value)?.label || params.value,
                        },
                      ]}
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 4: AGENCIAS Y CONTACTOS ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                4. Agencias y Contactos
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary">
                    Agencias / Sucursales
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <DataGrid
                      rows={agencias}
                      disableRowSelectionOnClick
                      density="compact"
                      columns={[
                        { field: "agencodigo", headerName: "Código", width: 90 },
                        { field: "agendescri", headerName: "Nombre de Agencia", width: 180 },
                        { field: "agendirec", headerName: "Dirección", width: 200 },
                        { field: "agentelef1", headerName: "Teléfono 1", width: 120 },
                        { field: "agenemail", headerName: "Email", width: 180 },
                        {
                          field: "regcodigo",
                          headerName: "Región",
                          width: 150,
                          valueFormatter: (params) =>
                            catalogos.regiones?.find((b) => b.id === params.value)?.label || params.value,
                        },
                        {
                          field: "procodigo",
                          headerName: "Provincia",
                          width: 150,
                          valueFormatter: (params) =>
                            catalogos.provincias?.find((b) => b.id === params.value)?.label || params.value,
                        },
                        {
                          field: "ciucodigo",
                          headerName: "Ciudad",
                          width: 150,
                          valueFormatter: (params) =>
                            catalogos.ciudades?.find((b) => b.id === params.value)?.label || params.value,
                        },
                        {
                          field: "zoncodigo",
                          headerName: "Zona",
                          width: 150,
                          valueFormatter: (params) =>
                            catalogos.zonas?.find((b) => b.id === params.value)?.label || params.value,
                        },
                      ]}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" mt={2}>
                    Contactos
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <DataGrid
                      rows={contactos}
                      disableRowSelectionOnClick
                      density="compact"
                      columns={[
                        { field: "agencodigo", headerName: "Cod. Agencia", width: 100 },
                        { field: "condescri", headerName: "Nombre Contacto", width: 180 },
                        { field: "concargo", headerName: "Cargo", width: 120 },
                        { field: "contelef1", headerName: "Teléfono", width: 120 },
                        { field: "concelular", headerName: "Celular", width: 120 },
                        { field: "conemail", headerName: "Email", width: 160 },
                        { field: "areadescri", headerName: "Área de Trabajo", width: 160 },
                        { field: "concomenta", headerName: "Comentario", width: 200 },
                      ]}
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 5: DESCUENTOS ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                5. Descuentos
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">
                    Descuentos por Línea / Marca
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <DataGrid
                      rows={descuentosLinea}
                      disableRowSelectionOnClick
                      density="compact"
                      columns={[
                        {
                          field: "lincodigo",
                          headerName: "Línea",
                          width: 180,
                          valueFormatter: (params) =>
                            catalogos.lineas?.find((b) => b.value === params.value)?.label || params.value,
                        },
                        {
                          field: "marcodigo",
                          headerName: "Marca",
                          width: 180,
                          valueFormatter: (params) =>
                            catalogos.marcas?.find((b) => b.value === params.value)?.label || params.value,
                        },
                        { field: "desporcentaje", headerName: "% Desc", width: 100 },
                        { field: "deslistaprecio", headerName: "Lista", width: 80 },
                      ]}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">
                    Descuentos por Artículo
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <DataGrid
                      rows={descuentosArticulo}
                      disableRowSelectionOnClick
                      density="compact"
                      columns={[
                        {
                          field: "artcodigo",
                          headerName: "Artículo",
                          width: 250,
                          valueFormatter: (params) =>
                            catalogos.articulos?.find((b) => b.value === params.value)?.label || params.value,
                        },
                        { field: "desporcentaje", headerName: "% Desc", width: 100 },
                        { field: "deslistaprecio", headerName: "Lista", width: 80 },
                      ]}
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 6: OTROS Y CONYUGE ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                6. Otros Datos / Cónyuge
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary">
                    Datos del Cónyuge
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Id. Cónyuge"
                    value={maestro.cliidencon || ""}
                    disabled
                    size="small"
                  >
                    {opcIdentificacion.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Nº Identificación"
                    value={maestro.cliruccon || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    value={maestro.clinombrecon || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    value={maestro.clidireccon || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Profesión"
                    value={maestro.cliprofesioncon || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 7: HISTORIAL ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                7. Historial de Observaciones
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ height: 300 }}>
                <DataGrid
                  rows={historial}
                  disableRowSelectionOnClick
                  density="compact"
                  columns={[
                    { field: "obsusuisys", headerName: "Usuario", width: 120 },
                    { field: "obsfecisys", headerName: "Fecha", width: 120 },
                    { field: "obshorisys", headerName: "Hora", width: 120 },
                    { field: "obsestisys", headerName: "Estación", width: 150 },
                    { field: "obsobserva", headerName: "Observación / Acción", width: 450 },
                  ]}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 8: IMÁGENES ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                8. Imágenes
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} container spacing={2} mt={1}>
                  {imagenes.map((img) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={img.secuencia}>
                      <Paper elevation={3} sx={{ p: 1, position: "relative", cursor: "zoom-in" }}>
                        <img
                          src={img.imagenBase64}
                          alt={`Cliente ${img.secuencia}`}
                          style={{ width: "100%", height: "200px", objectFit: "contain" }}
                          onClick={() => setImagenAmpliada(img.imagenBase64)}
                        />
                        <Typography variant="caption" display="block" align="center" mt={1}>
                          Sec: {img.secuencia} | {img.fecha}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                  {imagenes.length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" align="center">
                        No hay imágenes registradas.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>
              <Dialog open={!!imagenAmpliada} onClose={() => setImagenAmpliada(null)} maxWidth="xl">
                <Box p={2} position="relative" bgcolor="#000">
                  <IconButton
                    onClick={() => setImagenAmpliada(null)}
                    sx={{ position: "absolute", top: 10, right: 10, bgcolor: "rgba(255,255,255,0.3)", color: "#fff" }}
                  >
                    <CloseIcon />
                  </IconButton>
                  <img
                    src={imagenAmpliada}
                    alt="Zoom"
                    style={{ width: "100%", maxHeight: "85vh", objectFit: "contain" }}
                  />
                </Box>
              </Dialog>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 9: AUDITORÍA VB6 ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff3e0" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#e65100">
                9. Auditoría de Modificaciones
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ width: "100%" }}>
                <Tabs
                  value={tabAuditoria}
                  onChange={(e, newValue) => setTabAuditoria(newValue)}
                  sx={{ borderBottom: 1, borderColor: "divider" }}
                >
                  <Tab label="Cliente" icon={<HistoryIcon />} iconPosition="start" />
                  <Tab label="Descuentos por Línea" />
                  <Tab label="Descuentos por Artículos" />
                </Tabs>

                <CustomTabPanel value={tabAuditoria} index={0}>
                  <Box sx={{ height: 350 }}>
                    <DataGrid
                      rows={auditCliente}
                      disableRowSelectionOnClick
                      density="compact"
                      columns={[
                        { field: "cliaccion", headerName: "Acción", width: 100 },
                        { field: "cliusumsys", headerName: "Usuario Modificó", width: 140 },
                        { field: "clifecmsys", headerName: "Fecha Modificó", width: 130 },
                        { field: "clihormsys", headerName: "Hora Modificó", width: 120 },
                        { field: "clicodigo", headerName: "Código Cliente", width: 130 },
                        { field: "clinombre", headerName: "Nombre del Cliente", width: 250 },
                        {
                          field: "cliidentifica",
                          headerName: "Tipo de Identificación",
                          width: 160,
                          renderCell: ({ value }) => {
                            const m = {
                              C: "Cédula de Identidad",
                              R: "R.U.C.",
                              P: "Pasaporte",
                              F: "Consumidor Final",
                              O: "No Aplica",
                            }
                            return <span>{m[value] || value}</span>
                          },
                        },
                        { field: "cliruc", headerName: "Número de Identificación", width: 180 },
                        { field: "clidiascrs", headerName: "Días de Crédito", width: 120 },
                        { field: "climontocrs", headerName: "Monto del Crédito", width: 140 },
                        { field: "cliprefac", headerName: "Lista de Precio al Facturar", width: 180 },
                        {
                          field: "clibloqueo",
                          headerName: "Bloqueo de Crédito",
                          width: 140,
                          renderCell: ({ value }) => <span>{value === 0 ? "NO" : "SI"}</span>,
                        },
                        {
                          field: "calificacion",
                          headerName: "Cuotas Vencidas",
                          width: 130,
                          renderCell: ({ value }) => <span>{value === 0 || value === "0" ? "NO" : "SI"}</span>,
                        },
                        {
                          field: "cliapliiva",
                          headerName: "Aplica Iva",
                          width: 100,
                          renderCell: ({ value }) => <span>{value === 0 ? "NO" : "SI"}</span>,
                        },
                        { field: "clidiasrecibefac1", headerName: "Días de Demora", width: 130 },
                        { field: "clidiaentregafac", headerName: "Días de Entrega", width: 130 },
                        { field: "cliemail", headerName: "email", width: 220 },
                        { field: "cliintersec", headerName: "Número Celular", width: 130 },
                        { field: "clitelef1", headerName: "Teléfono 1", width: 120 },
                        { field: "clitelef2", headerName: "Teléfono 2", width: 120 },
                        { field: "clifax", headerName: "Fax", width: 120 },
                        { field: "cliubicacionrapido", headerName: "Referencia rápido Ubicación", width: 300 },
                        { field: "clidirec", headerName: "Dirección", width: 350 },
                        { field: "clidirec2", headerName: "Dirección Laboral", width: 350 },
                        { field: "website", headerName: "Web Site", width: 200 },
                        { field: "clireferencia1", headerName: "Referencia 1", width: 200 },
                        { field: "cliparentesco1", headerName: "Parentesco 1", width: 150 },
                        { field: "clireftelefono1", headerName: "Teléfono Ref. 1", width: 130 },
                        { field: "clireferencia2", headerName: "Referencia 2", width: 200 },
                        { field: "cliparentesco2", headerName: "Parentesco 2", width: 150 },
                        { field: "clireftelefono2", headerName: "Teléfono Ref. 2", width: 130 },
                      ]}
                    />
                  </Box>
                </CustomTabPanel>

                <CustomTabPanel value={tabAuditoria} index={1}>
                  <Box sx={{ height: 350 }}>
                    <DataGrid
                      rows={auditDescLinea}
                      disableRowSelectionOnClick
                      density="compact"
                      columns={[
                        { field: "desaccion", headerName: "Acción", width: 100 },
                        { field: "desusumsys", headerName: "Usuario Modificó", width: 140 },
                        { field: "desfecmsys", headerName: "Fecha Modificó", width: 130 },
                        { field: "deshormsys", headerName: "Hora Modificó", width: 120 },
                        { field: "lincodigo", headerName: "Línea", width: 150 },
                        { field: "marcodigo", headerName: "Marca", width: 150 },
                        { field: "desporcentaje", headerName: "% Descuento", width: 120 },
                        { field: "deslistaprecio", headerName: "Lista Precio", width: 120 },
                      ]}
                    />
                  </Box>
                </CustomTabPanel>

                <CustomTabPanel value={tabAuditoria} index={2}>
                  <Box sx={{ height: 350 }}>
                    <DataGrid
                      rows={auditDescArt}
                      disableRowSelectionOnClick
                      density="compact"
                      columns={[
                        { field: "desaccion", headerName: "Acción", width: 100 },
                        { field: "desusumsys", headerName: "Usuario Modificó", width: 140 },
                        { field: "desfecmsys", headerName: "Fecha Modificó", width: 130 },
                        { field: "deshormsys", headerName: "Hora Modificó", width: 120 },
                        { field: "artcodigo", headerName: "Artículo", width: 200 },
                        { field: "desporcentaje", headerName: "% Descuento", width: 120 },
                        { field: "deslistaprecio", headerName: "Lista Precio", width: 120 },
                      ]}
                    />
                  </Box>
                </CustomTabPanel>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 10: PROTESTOS (NUEVO ANALÍTICO) ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#e0f7fa" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#006064">
                10. Cheques Protestados
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFiltrosBar("protestos")}
              <Box sx={{ height: 300 }}>
                <DataGrid
                  rows={protestos}
                  loading={loadingAnalitica.protestos}
                  disableRowSelectionOnClick
                  density="compact"
                  columns={[
                    { field: "ciacodigo", headerName: "Cía", width: 80 },
                    { field: "loccodigo", headerName: "Local", width: 80 },
                    { field: "facnumfac", headerName: "Nota de Débito", width: 180 },
                    { field: "tranumbco", headerName: "Transac. Bancaria", width: 180 },
                    { field: "obsvalche", headerName: "Valor", width: 120, type: "number" },
                    { field: "obsnumche", headerName: "Cheque", width: 150 },
                    { field: "obsfecisys", headerName: "Fecha", width: 130 },
                    { field: "clicodigo", headerName: "Cliente", width: 120 },
                    { field: "obsobserva", headerName: "Observación", width: 350 },
                  ]}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 11: SALDOS (NUEVO ANALÍTICO) ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff8e1" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#ff8f00">
                11. Análisis de Saldos
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFiltrosBar("saldos")}
              <Box sx={{ height: 300 }}>
                <DataGrid
                  rows={saldos}
                  loading={loadingAnalitica.saldos}
                  disableRowSelectionOnClick
                  density="compact"
                  columns={[
                    { field: "anio", headerName: "Año", width: 100 },
                    { field: "mes", headerName: "Mes", width: 150 },
                    { field: "facturado", headerName: "Facturado", width: 130, type: "number" },
                    { field: "pagado", headerName: "Pagado", width: 130, type: "number" },
                    { field: "diferencia", headerName: "Diferencias", width: 130, type: "number" },
                    { field: "proyectos", headerName: "Proyectos", width: 130, type: "number" },
                    { field: "lineas", headerName: "Líneas/Crédito", width: 130, type: "number" },
                  ]}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 12: MOVIMIENTOS (NUEVO ANALÍTICO) ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f3e5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#6a1b9a">
                12. Movimientos / Estado de Cuenta
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFiltrosBar("movimientos")}
              <Box sx={{ height: 350 }}>
                <DataGrid
                  rows={movimientos}
                  loading={loadingAnalitica.movimientos}
                  disableRowSelectionOnClick
                  density="compact"
                  columns={[
                    { field: "ciacodigo", headerName: "Cía", width: 80 },
                    { field: "loccodigo", headerName: "Local", width: 80 },
                    { field: "tipo", headerName: "Tipo", width: 150 },
                    {
                      field: "doc",
                      headerName: "Documento",
                      width: 200,
                      renderCell: (params) => (
                        <Typography color="primary" fontWeight="bold">
                          {params.value}
                        </Typography>
                      ),
                    },
                    { field: "emi", headerName: "Emisión", width: 120 },
                    { field: "usu", headerName: "Usuario", width: 120 },
                    { field: "vence", headerName: "Vencimiento", width: 120 },
                    { field: "diasmora", headerName: "DíasMora", width: 100, type: "number" },
                    { field: "sta", headerName: "Estado", width: 120 },
                    { field: "valor", headerName: "Valor", width: 130, type: "number" },
                    { field: "abono", headerName: "Abono/Aplicado", width: 130, type: "number" },
                    {
                      field: "saldo",
                      headerName: "Saldo",
                      width: 130,
                      type: "number",
                      renderCell: (params) => <Typography fontWeight="bold">{params.value}</Typography>,
                    },
                  ]}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 13: LÍNEA / CR (NUEVO ANALÍTICO) ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#e8f5e9" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#2e7d32">
                13. Garantías de Terceros (Línea/CR)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFiltrosBar("garantias")}
              <Box sx={{ height: 300 }}>
                <DataGrid
                  rows={garantias}
                  loading={loadingAnalitica.garantias}
                  disableRowSelectionOnClick
                  density="compact"
                  columns={[
                    { field: "ciacodigo", headerName: "Cía", width: 80 },
                    { field: "loccodigo", headerName: "Local", width: 80 },
                    {
                      field: "facnumfac",
                      headerName: "Documento",
                      width: 200,
                      renderCell: (params) => (
                        <Typography color="secondary" fontWeight="bold">
                          {params.value}
                        </Typography>
                      ),
                    },
                    { field: "factotal", headerName: "Valor", width: 130, type: "number" },
                    { field: "facabono", headerName: "Abono", width: 130, type: "number" },
                    {
                      field: "facsaldo",
                      headerName: "Saldo",
                      width: 130,
                      type: "number",
                      renderCell: (params) => <Typography fontWeight="bold">{params.value}</Typography>,
                    },
                    { field: "facfecemi", headerName: "Emisión", width: 120 },
                    { field: "clicodigo", headerName: "Cliente", width: 120 },
                    { field: "clinombre", headerName: "Nombre", width: 250 },
                    { field: "facdetalle", headerName: "Observación", width: 300 },
                  ]}
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        </StyledRoot>
      </div>
    </ThemeProvider>
  )
}

export default ConsultarCreacionClientes
