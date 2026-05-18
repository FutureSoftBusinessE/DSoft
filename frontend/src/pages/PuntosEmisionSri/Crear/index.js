import { useState, useContext, useEffect } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import { 
  Box, Paper, TextField, Tooltip, IconButton, Grid, Typography, 
  MenuItem, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Accordion, AccordionSummary, AccordionDetails, Autocomplete
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, useQuery, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import StorefrontIcon from "@mui/icons-material/Storefront"
import AssignmentIcon from "@mui/icons-material/Assignment"
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered"

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const StyledRoot = {
  width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "20px",
  backgroundColor: "#f5f7fa", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const accordionStyles = {
  mb: 2, border: "1px solid", borderColor: "divider", borderRadius: "8px !important",
  boxShadow: "none", "&:before": { display: "none" }
}

const CrearPuntosEmisionSri = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    cjacodigo: "",
    cjadescri: "",
    loccodigo: "",
    sripreauto: "",
    sriautnumero: null,
    sriserie01: "",
    sriserie02: "",
    cjastatus: "A"
  })

  // Grilla fija con los documentos base del SRI
  const [detalles, setDetalles] = useState([
    { srisecdoc: "01", desc: "Factura", srisecini: 1, srisecfin: "", srisecact: 0 },
    { srisecdoc: "03", desc: "Liquidación de compra de Bienes o Prestación de servicio", srisecini: 1, srisecfin: "", srisecact: 0 },
    { srisecdoc: "04", desc: "Nota de Crédito", srisecini: 1, srisecfin: "", srisecact: 0 },
    { srisecdoc: "05", desc: "Nota de Débito", srisecini: 1, srisecfin: "", srisecact: 0 },
    { srisecdoc: "06", desc: "Guía de Remisión", srisecini: 1, srisecfin: "", srisecact: 0 },
    { srisecdoc: "07", desc: "Comprobante de Retención", srisecini: 1, srisecfin: "", srisecact: 0 },
  ])

  // Carga de Combos desde el Backend
  const { data: rawInitialData, isLoading: isLoadingCombos } = useQuery({
    queryKey: ["getInitialDataPuntosEmision"],
    queryFn: async () => {
      try {
        const response = await api.post("/PuntosEmisionSri/getInitialDataPuntosEmision")
        // CORRECCIÓN: Buscamos en las capas de anidamiento correctas generadas por @api_endpoint
        const resData = response?.data;
        if (resData?.data?.data) return resData.data.data;
        if (resData?.data) return resData.data;
        return { localidades: [], autorizaciones: [] }
      } catch (error) { 
        return { localidades: [], autorizaciones: [] } 
      }
    },
    refetchOnWindowFocus: false
  })

  const listaLocalidades = Array.isArray(rawInitialData?.localidades) ? rawInitialData.localidades : []
  const listaAutorizaciones = Array.isArray(rawInitialData?.autorizaciones) ? rawInitialData.autorizaciones : []

  // Mutación para guardar
  const { mutateAsync: SaveCreacion, isPending: isSaving } = useMutation({
    queryKey: ["isCreatingPuntoEmisionSri"],
    fn: async (dataPayload) => (await api.post("/PuntosEmisionSri/createPuntosEmisionSri", dataPayload)).data,
    showError: "modal", 
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: typeof value === "string" ? value.toUpperCase() : value }));
  }

  // Manejo del cambio de autorización para bloquear la grilla si es Electrónica
  const handleAutorizacionChange = (newValue) => {
    const preauto = newValue ? newValue.sripreauto : ""
    const autnumero = newValue ? newValue.sriautnumero : null
    
    setFormData(prev => ({ ...prev, sripreauto: preauto, sriautnumero: autnumero }))

    // Autocompletar grilla si es electrónica, caso contrario limpiar
    const newDetalles = detalles.map(d => ({
      ...d,
      srisecfin: preauto === "E" ? 999999999 : ""
    }))
    setDetalles(newDetalles)
  }

  const handleDetailChange = (idx, value) => {
    const n = [...detalles]
    n[idx].srisecfin = value
    setDetalles(n)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.cjacodigo || formData.cjacodigo.length > 3) return showWarning("Código de caja requerido (máx. 3 caracteres).");
    if (!formData.cjadescri) return showWarning("Descripción de la caja requerida.");
    if (!formData.loccodigo) return showWarning("Debe seleccionar una Localidad.");
    if (!formData.sriautnumero) return showWarning("Debe seleccionar una Autorización SRI.");
    if (formData.sriserie01.length !== 3 || formData.sriserie02.length !== 3) {
      return showWarning("El Establecimiento y el Punto de Emisión deben tener exactamente 3 dígitos (Ej. 001).");
    }

    // Validar que en documentos preimpresos el usuario haya llenado la secuencia final
    if (formData.sripreauto !== "E") {
      const faltanSecuencias = detalles.some(d => !d.srisecfin || Number(d.srisecfin) <= 0);
      if (faltanSecuencias) return showWarning("Debe ingresar la secuencia final mayor a cero para todos los documentos.");
    }

    await SaveCreacion({ ...formData, detalles });
  }

  const action = selectedMenuInfo?.data?.barraAcciones?.find(a => a.acccaption === "GRABAR")

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <Box sx={{ mb: 2 }}>
          {action && (
            <Tooltip title={action.acccaption}>
              <IconButton onClick={handleSubmit} disabled={isSaving || isLoadingCombos} sx={{ border: "1px solid #ddd", bgcolor: "white" }}>
                {getIconComponent(action.accnameicono, action.acctipoico)}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px", textAlign: "center" }}>
          <b>Creación de Punto de Emisión (Caja)</b>
        </div>
        
        <CustomBackdrop isLoading={isSaving || isLoadingCombos} />
        
        <Box sx={StyledRoot} component="form" onSubmit={handleSubmit}>
          
          <Accordion defaultExpanded sx={accordionStyles}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><StorefrontIcon color="primary" fontSize="small" /><Typography variant="subtitle2" fontWeight="bold" color="primary">DATOS DE LA CAJA</Typography></Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2}>
                  <TextField 
                    fullWidth label="Código *" value={formData.cjacodigo} 
                    onChange={(e) => handleInputChange("cjacodigo", e.target.value)} 
                    inputProps={{ maxLength: 3 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth label="Descripción *" value={formData.cjadescri} 
                    onChange={(e) => handleInputChange("cjadescri", e.target.value)} 
                    inputProps={{ maxLength: 40 }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField select fullWidth label="Estado" value={formData.cjastatus} onChange={(e) => handleInputChange("cjastatus", e.target.value)}>
                    <MenuItem value="A">ACTIVO</MenuItem>
                    <MenuItem value="I">INACTIVO</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={12}>
                  <Autocomplete
                    options={listaLocalidades} 
                    getOptionLabel={(o) => o.label || ""}
                    value={listaLocalidades.find((l) => l.id === formData.loccodigo) || null}
                    onChange={(e, v) => handleInputChange("loccodigo", v ? v.id : "")}
                    renderInput={(p) => <TextField {...p} label="Localidad *" InputLabelProps={{ shrink: true }} />}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded sx={accordionStyles}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><AssignmentIcon color="primary" fontSize="small" /><Typography variant="subtitle2" fontWeight="bold" color="primary">PARÁMETROS DEL SRI</Typography></Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={listaAutorizaciones} 
                    getOptionLabel={(o) => o.label || ""}
                    value={listaAutorizaciones.find((a) => a.sriautnumero === formData.sriautnumero) || null}
                    onChange={(e, v) => handleAutorizacionChange(v)}
                    renderInput={(p) => <TextField {...p} label="Nº de Autorización Disponible *" InputLabelProps={{ shrink: true }} />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth label="Establecimiento (Ej. 001) *" value={formData.sriserie01} 
                    onChange={(e) => handleInputChange("sriserie01", e.target.value.replace(/\D/g, ""))} 
                    inputProps={{ maxLength: 3 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth label="Punto de Emisión (Ej. 001) *" value={formData.sriserie02} 
                    onChange={(e) => handleInputChange("sriserie02", e.target.value.replace(/\D/g, ""))} 
                    inputProps={{ maxLength: 3 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded sx={accordionStyles}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><FormatListNumberedIcon color="primary" fontSize="small" /><Typography variant="subtitle2" fontWeight="bold" color="primary">TIPO DE DOCUMENTOS</Typography></Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell sx={{ width: "80px" }}><b>Código</b></TableCell>
                      <TableCell><b>Descripción</b></TableCell>
                      <TableCell align="center" sx={{ width: "120px" }}><b>Sec. Inicial</b></TableCell>
                      <TableCell align="center" sx={{ width: "150px" }}><b>Sec. Final</b></TableCell>
                      <TableCell align="center" sx={{ width: "120px" }}><b>Sec. Actual</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalles.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell padding="none" sx={{ px: 2 }}>{row.srisecdoc}</TableCell>
                        <TableCell padding="none" sx={{ px: 2 }}>{row.desc}</TableCell>
                        <TableCell align="center" padding="none">
                          <TextField disabled variant="standard" inputProps={{ style: { textAlign: "center" } }} value={row.srisecini} />
                        </TableCell>
                        <TableCell align="center" padding="none" sx={{ px: 1 }}>
                          <TextField 
                            type="number"
                            variant="outlined" 
                            size="small"
                            fullWidth
                            disabled={formData.sripreauto === "E"}
                            inputProps={{ style: { textAlign: "center", backgroundColor: formData.sripreauto === "E" ? "#e0e0e0" : "#fff" } }} 
                            value={row.srisecfin} 
                            onChange={(e) => handleDetailChange(idx, e.target.value.replace(/\D/g, ""))} 
                          />
                        </TableCell>
                        <TableCell align="center" padding="none">
                          <TextField disabled variant="standard" inputProps={{ style: { textAlign: "center" } }} value={row.srisecact} />
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

export default CrearPuntosEmisionSri;