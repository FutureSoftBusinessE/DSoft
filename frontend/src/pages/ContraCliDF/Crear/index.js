/* eslint-disable no-unmodified-loop-condition */
import { useState, useContext, useEffect } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Paper,
  TextField,
  Tooltip,
  IconButton,
  Grid,
  Typography,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, useQuery, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import DeleteIcon from "@mui/icons-material/Delete"
import AddCircleIcon from "@mui/icons-material/AddCircle"
import AutorenewIcon from "@mui/icons-material/Autorenew"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import AssignmentIcon from "@mui/icons-material/Assignment"
import ListAltIcon from "@mui/icons-material/ListAlt"
import DateRangeIcon from "@mui/icons-material/DateRange"
import { handlePrintContraCliPDF } from "../utils/printContraCliHelper"

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

const accordionStyles = {
  mb: 2,
  border: "1px solid",
  borderColor: "divider",
  borderRadius: "8px !important",
  boxShadow: "none",
  "&:before": { display: "none" },
}

const getTodayDate = () => new Date().toISOString().split("T")[0]

const CrearContraCliDF = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo, infoHome } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    concodcontrato: "AUTOGENERADO",
    clicodigo: "",
    clinombre: "",
    concodigo: "",
    condescri: "",
    confecinicio: getTodayDate(),
    confecfin: getTodayDate(),
    confecfirma: getTodayDate(),
    confecinifac: getTodayDate(),
    confrecuencia: "MENSUAL",
    convalor: 0.0,
    constatus: "A",
  })

  const [servicios, setServicios] = useState([])
  const [periodos, setPeriodos] = useState([])

  const { data: rawInitialData, isLoading: isLoadingCombos } = useQuery({
    queryKey: ["getInitialDataContraCli"],
    queryFn: async () => {
      try {
        const response = await api.post("/ContraCliDF/getInitialDataDF")
        return response?.data?.data?.data || response?.data?.data || {}
      } catch (error) {
        return { clientes: [], tiposContrato: [], articulos: [] }
      }
    },
    refetchOnWindowFocus: false,
  })

  const listaClientes = (Array.isArray(rawInitialData?.clientes) ? rawInitialData.clientes : []).map((i) => ({
    id: i.clicodigo,
    label: `${i.clicodigo} - ${i.clinombre || ""}`,
    nombre: i.clinombre,
  }))
  const listaTipos = (Array.isArray(rawInitialData?.tiposContrato) ? rawInitialData.tiposContrato : []).map((i) => ({
    id: i.concodigo,
    label: `${i.concodigo} - ${i.condescri || ""}`,
    frecuencia: i.confrecuencia,
    descri: i.condescri,
  }))
  const listaArticulos = (Array.isArray(rawInitialData?.articulos) ? rawInitialData.articulos : []).map((i) => ({
    id: i.artcodigo,
    label: `${i.artcodigo} - ${i.artdescri || ""}`,
    invcodigo: i.invcodigo,
    artdescri: i.artdescri,
    precio1: i.precio1,
  }))

  const { mutateAsync: SaveCreacion, isPending: isSaving } = useMutation({
    queryKey: ["isCreatingContraCliDF"],
    fn: async (dataPayload) => (await api.post("/ContraCliDF/createContraCliDF", dataPayload)).data,
    showError: "modal",
    showSuccess: "toast", // Retornamos el toast de éxito estándar de SIAC
    onSuccess: (res) => {
      // CORRECCIÓN: Usar el window.confirm estándar del navegador
      const confirmacion = window.confirm(`${res.data}\n\n¿Desea imprimir el documento en PDF ahora?`)

      if (confirmacion) {
        // Extraemos el código real generado por el backend del mensaje (ej: COA2600000101)
        const codigoGenerado = res.data.split(" ")[1]
        handlePrintContraCliPDF({ ...formData, concodcontrato: codigoGenerado }, servicios, periodos, infoHome)
      }

      navigate(-1)
    },
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: typeof value === "string" ? value.toUpperCase() : value }))
  }

  const handleTipoContratoChange = (newValue) => {
    const codigo = newValue ? newValue.id : ""
    const frecuencia = newValue ? newValue.frecuencia : "MENSUAL"
    setFormData((prev) => ({ ...prev, concodigo: codigo, confrecuencia: frecuencia }))
  }

  useEffect(() => {
    const subtotal = servicios?.reduce((acc, curr) => acc + (parseFloat(curr.contotal) || 0), 0)
    setFormData((prev) => ({ ...prev, convalor: (subtotal * (periodos.length || 1)).toFixed(2) }))
  }, [servicios, periodos])

  const generarPeriodos = () => {
    if (!formData.confecinifac || !formData.confecfin) return showWarning("Complete las fechas.")
    const start = new Date(formData.confecinifac + "T00:00:00")
    const end = new Date(formData.confecfin + "T00:00:00")
    if (start > end) return showWarning("Fecha de inicio no puede ser mayor a la final.")
    const current = new Date(start)
    const newPeriodos = []
    while (current <= end) {
      newPeriodos.push({ conmes: current.getMonth() + 1, conanio: current.getFullYear(), constatus: "A" })
      if (formData.confrecuencia === "MENSUAL") current.setMonth(current.getMonth() + 1)
      else current.setFullYear(current.getFullYear() + 1)
    }
    setPeriodos(newPeriodos)
  }

  const handleRemovePeriodo = (idx) => {
    const newPer = [...periodos]
    newPer.splice(idx, 1)
    setPeriodos(newPer)
  }

  const handleServicioChangeAuto = (idx, newValue) => {
    const n = [...servicios]
    if (newValue) {
      n[idx].invcodigo = newValue.invcodigo
      n[idx].artcodigo = newValue.id
      n[idx].artdescri = newValue.artdescri
      n[idx].convalor = parseFloat(newValue.precio1 || 0).toFixed(2)
      n[idx].contotal = (parseFloat(n[idx].concantidad || 1) * parseFloat(newValue.precio1 || 0)).toFixed(2)
    } else {
      n[idx].invcodigo = "01"
      n[idx].artcodigo = ""
      n[idx].artdescri = ""
      n[idx].convalor = "0.00"
      n[idx].contotal = "0.00"
    }
    setServicios(n)
  }

  const handleServicioGridChange = (idx, field, value) => {
    const n = [...servicios]
    n[idx][field] = typeof value === "string" ? value.toUpperCase() : value
    if (field === "concantidad" || field === "convalor") {
      const cant = parseFloat(n[idx].concantidad) || 0
      const val = parseFloat(n[idx].convalor) || 0
      n[idx].contotal = (cant * val).toFixed(2)
    }
    setServicios(n)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!formData.clicodigo || !formData.concodigo) return showWarning("Seleccione Cliente y Tipo de Contrato.")
    if (servicios.length === 0) return showWarning("Debe añadir al menos un servicio.")
    if (periodos.length === 0) return showWarning("Debe generar la proyección de períodos.")
    await SaveCreacion({ ...formData, servicios, periodos })
  }

  const action = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "GRABAR")

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <Box sx={{ mb: 2 }}>
          {action && (
            <Tooltip title={action.acccaption}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSaving || isLoadingCombos}
                sx={{ border: "1px solid #ddd", bgcolor: "white" }}
              >
                {getIconComponent(action.accnameicono, action.acctipoico)}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px" }}>
          <b>Creación de Contrato de Cliente</b>
        </div>
        <CustomBackdrop isLoading={isSaving || isLoadingCombos} />
        <Box sx={StyledRoot} component="form" onSubmit={handleSubmit}>
          <Accordion defaultExpanded sx={accordionStyles}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AssignmentIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                  DATOS GENERALES
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    disabled
                    fullWidth
                    label="Nº Contrato"
                    value={formData.concodcontrato}
                    sx={{ bgcolor: "#f0f0f0" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={listaClientes}
                    getOptionLabel={(o) => o.label || ""}
                    value={listaClientes.find((c) => c.id === formData.clicodigo) || null}
                    onChange={(e, v) => {
                      setFormData((prev) => ({
                        ...prev,
                        clicodigo: v ? v.id : "",
                        clinombre: v ? v.nombre : "",
                      }))
                    }}
                    renderInput={(p) => <TextField {...p} label="Cliente *" InputLabelProps={{ shrink: true }} />}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Autocomplete
                    options={listaTipos}
                    getOptionLabel={(o) => o.label || ""}
                    value={listaTipos.find((t) => t.id === formData.concodigo) || null}
                    onChange={(e, v) => handleTipoContratoChange(v)}
                    renderInput={(p) => <TextField {...p} label="Tipo Contrato *" InputLabelProps={{ shrink: true }} />}
                  />
                </Grid>
                <Grid item xs={12} sm={9}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={formData.condescri}
                    onChange={(e) => handleInputChange("condescri", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label="Estado"
                    value={formData.constatus}
                    onChange={(e) => handleInputChange("constatus", e.target.value)}
                  >
                    <MenuItem value="A">ACTIVO</MenuItem>
                    <MenuItem value="I">INACTIVO</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="F. Inicio"
                    InputLabelProps={{ shrink: true }}
                    value={formData.confecinicio}
                    onChange={(e) => handleInputChange("confecinicio", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="F. Fin"
                    InputLabelProps={{ shrink: true }}
                    value={formData.confecfin}
                    onChange={(e) => handleInputChange("confecfin", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="F. Firma"
                    InputLabelProps={{ shrink: true }}
                    value={formData.confecfirma}
                    onChange={(e) => handleInputChange("confecfirma", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="F. Facturación"
                    InputLabelProps={{ shrink: true }}
                    value={formData.confecinifac}
                    onChange={(e) => handleInputChange("confecinifac", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Frecuencia"
                    value={formData.confrecuencia}
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: "#f9f9f9" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total ($)"
                    value={formData.convalor}
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: "#f0f0f0" }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded sx={accordionStyles}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ListAltIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                  DETALLE DE SERVICIOS
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  startIcon={<AddCircleIcon />}
                  onClick={() =>
                    setServicios([
                      ...servicios,
                      {
                        invcodigo: "01",
                        artcodigo: "",
                        artdescri: "",
                        concantidad: 1,
                        convalor: "0.00",
                        contotal: "0.00",
                      },
                    ])
                  }
                >
                  Añadir Línea
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell sx={{ width: "50px" }}>
                        <b>Inv</b>
                      </TableCell>
                      <TableCell sx={{ minWidth: "250px" }}>
                        <b>Buscar Servicio (Cód - Desc)</b>
                      </TableCell>
                      <TableCell sx={{ minWidth: "200px" }}>
                        <b>Descripción Editable</b>
                      </TableCell>
                      <TableCell align="right" sx={{ width: "80px" }}>
                        <b>Cant.</b>
                      </TableCell>
                      <TableCell align="right" sx={{ width: "100px" }}>
                        <b>Valor Uni.</b>
                      </TableCell>
                      <TableCell align="right" sx={{ width: "100px" }}>
                        <b>Subtotal</b>
                      </TableCell>
                      <TableCell align="center" sx={{ width: "50px" }}>
                        <b>X</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {servicios?.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell padding="none" sx={{ px: 1 }}>
                          <TextField disabled variant="standard" fullWidth value={row.invcodigo} />
                        </TableCell>
                        <TableCell padding="none" sx={{ px: 1 }}>
                          <Autocomplete
                            options={listaArticulos}
                            getOptionLabel={(o) => o.label || ""}
                            value={listaArticulos.find((a) => a.id === row.artcodigo) || null}
                            onChange={(e, v) => handleServicioChangeAuto(idx, v)}
                            renderInput={(p) => (
                              <TextField {...p} variant="standard" placeholder="Escriba para buscar..." />
                            )}
                          />
                        </TableCell>
                        <TableCell padding="none" sx={{ px: 1 }}>
                          <TextField
                            variant="standard"
                            fullWidth
                            value={row.artdescri}
                            onChange={(e) => handleServicioGridChange(idx, "artdescri", e.target.value)}
                          />
                        </TableCell>
                        <TableCell padding="none" sx={{ px: 1 }}>
                          <TextField
                            type="number"
                            variant="standard"
                            inputProps={{ style: { textAlign: "right" } }}
                            value={row.concantidad}
                            onChange={(e) => handleServicioGridChange(idx, "concantidad", e.target.value)}
                          />
                        </TableCell>
                        <TableCell padding="none" sx={{ px: 1 }}>
                          <TextField
                            type="number"
                            variant="standard"
                            inputProps={{ style: { textAlign: "right" }, step: "0.01" }}
                            value={row.convalor}
                            onChange={(e) => handleServicioGridChange(idx, "convalor", e.target.value)}
                          />
                        </TableCell>
                        <TableCell padding="none" sx={{ px: 1 }}>
                          <Typography align="right" variant="body2">
                            ${row.contotal}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" padding="none">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => {
                              const n = [...servicios]
                              n.splice(idx, 1)
                              setServicios(n)
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded sx={accordionStyles}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DateRangeIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                  PROYECCIÓN DE FACTURACIÓN
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" color="secondary" startIcon={<AutorenewIcon />} onClick={generarPeriodos}>
                  Generar Períodos
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell align="center">
                        <b>#</b>
                      </TableCell>
                      <TableCell align="center">
                        <b>Mes</b>
                      </TableCell>
                      <TableCell align="center">
                        <b>Año</b>
                      </TableCell>
                      <TableCell align="center">
                        <b>Estado</b>
                      </TableCell>
                      <TableCell align="center">
                        <b>X</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {periodos?.map((per, idx) => (
                      <TableRow key={idx}>
                        <TableCell align="center">{idx + 1}</TableCell>
                        <TableCell align="center">{per.conmes}</TableCell>
                        <TableCell align="center">{per.conanio}</TableCell>
                        <TableCell align="center">ACTIVO</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => handleRemovePeriodo(idx)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearContraCliDF
