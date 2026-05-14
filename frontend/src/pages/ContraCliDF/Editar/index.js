import { useState, useContext, useEffect } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import { 
  Box, Paper, TextField, Tooltip, IconButton, Grid, Typography, 
  MenuItem, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Accordion, AccordionSummary, AccordionDetails, Alert, Autocomplete
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, useQuery, api } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import AssignmentIcon from "@mui/icons-material/Assignment"
import ListAltIcon from "@mui/icons-material/ListAlt"
import DateRangeIcon from "@mui/icons-material/DateRange"
import { handlePrintContraCliPDF } from "../utils/printContraCliHelper"

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

const getTodayDate = () => new Date().toISOString().split("T")[0]

const EditarContraCliDF = () => {
  const navigate = useNavigate(); 
  const { state } = useLocation(); 
  const { selectedMenuInfo, infoHome } = useContext(GlobalContext)
  const concodcontratoViejo = state?.concodcontrato ?? ""

  const [isEditable, setIsEditable] = useState(true); 
  const [lockReason, setLockReason] = useState("")
  
  const [formData, setFormData] = useState({
    concodcontrato: "", clicodigo: "", clinombre: "", concodigo: "", condescri: "",
    confecinicio: getTodayDate(), confecfin: getTodayDate(),
    confecfirma: getTodayDate(), confecinifac: getTodayDate(),
    confrecuencia: "MENSUAL", convalor: 0.0, constatus: "A"
  })
  
  const [servicios, setServicios] = useState([]); 
  const [periodos, setPeriodos] = useState([])

  // 1. CARGA DE COMBOS (Segura)
  const { data: rawInitialData, isLoading: isLoadingCombos } = useQuery({
    queryKey: ["getInitialDataContraCli"],
    queryFn: async () => {
      try {
        const response = await api.post("/ContraCliDF/getInitialDataDF")
        return response?.data?.data?.data || response?.data?.data || {}
      } catch (error) { return { clientes: [], tiposContrato: [], articulos: [] } }
    },
    refetchOnWindowFocus: false
  })

  const listaClientes = (Array.isArray(rawInitialData?.clientes) ? rawInitialData.clientes : []).map(i => ({ id: i.clicodigo, label: `${i.clicodigo} - ${i.clinombre || ""}`, nombre: i.clinombre }))
  const listaTipos = (Array.isArray(rawInitialData?.tiposContrato) ? rawInitialData.tiposContrato : []).map(i => ({ id: i.concodigo, label: `${i.concodigo} - ${i.condescri || ""}`, frecuencia: i.confrecuencia }))
  const listaArticulos = (Array.isArray(rawInitialData?.articulos) ? rawInitialData.articulos : []).map(i => ({ id: i.artcodigo, label: `${i.artcodigo} - ${i.artdescri || ""}` }))

  // 2. CARGA DEL CONTRATO (Extractor agresivo de anidamiento JSON)
  const { data: fetchedData, isLoading: isFetching } = useQuery({
    queryKey: ["getContraCliById", concodcontratoViejo],
    queryFn: async () => {
      const response = await api.post("/ContraCliDF/getByIdContraCliDF", { concodcontrato: concodcontratoViejo })
      let dataExtracted = response?.data;
      if (dataExtracted?.data?.concodcontrato) dataExtracted = dataExtracted.data;
      else if (dataExtracted?.data?.data?.concodcontrato) dataExtracted = dataExtracted.data.data;
      return dataExtracted || {};
    },
    enabled: !!concodcontratoViejo,
    refetchOnWindowFocus: false
  })

  // 3. POBLAR FORMULARIO
  useEffect(() => {
    if (fetchedData && fetchedData.concodcontrato) {
      setFormData(prev => ({
        ...prev,
        concodcontrato: fetchedData.concodcontrato || "",
        clicodigo: fetchedData.clicodigo || "",
        clinombre: fetchedData.clinombre || "", // IMPORTANTE: Se añade para la impresión
        concodigo: fetchedData.concodigo || "",
        condescri: fetchedData.condescri || "",
        confecinicio: fetchedData.confecinicio || "",
        confecfin: fetchedData.confecfin || "",
        confecfirma: fetchedData.confecfirma || "",
        confecinifac: fetchedData.confecinifac || "",
        confrecuencia: fetchedData.confrecuencia || "MENSUAL",
        convalor: fetchedData.convalor || 0.0,
        constatus: fetchedData.constatus || "A"
      }))
      setServicios(fetchedData.servicios || [])
      setPeriodos(fetchedData.periodos || [])

      // Reglas de Negocio VB6
      const hasFacturas = (fetchedData.periodos || []).some(p => p.facnumfac && p.facnumfac.trim() !== "");
      if (fetchedData.constatus === 'I') {
        setIsEditable(false); setLockReason("El contrato ya está INACTIVO.");
      } else if (new Date(fetchedData.confecfin) < new Date(getTodayDate())) {
        setIsEditable(false); setLockReason("El contrato ha VENCIDO.");
      } else if (hasFacturas) {
        setIsEditable(false); setLockReason("El contrato tiene FACTURAS emitidas. Edición bloqueada.");
      } else {
        setIsEditable(true); setLockReason("");
      }
    }
  }, [fetchedData])

  const { mutateAsync: SaveEdicion, isPending: isSaving } = useMutation({
    queryKey: ["isEditingContraCliDF"],
    fn: async (d) => (await api.post("/ContraCliDF/updateContraCliDF", d)).data,
    showSuccess: "toast", onSuccess: () => navigate(-1)
  })

  const actionGrabar = selectedMenuInfo?.data?.barraAcciones?.find(a => a.acccaption === "GRABAR")
  const actionImprimir = selectedMenuInfo?.data?.barraAcciones?.find(a => a.acccaption === "IMPRIMIR")

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
          {actionGrabar && isEditable && (
            <Tooltip title="Grabar Cambios">
              <IconButton onClick={() => SaveEdicion({ ...formData, servicios, periodos })} disabled={isSaving || isFetching || isLoadingCombos} sx={{ border: "1px solid #ddd", bgcolor: "white" }}>
                {getIconComponent(actionGrabar.accnameicono, actionGrabar.acctipoico)}
              </IconButton>
            </Tooltip>
          )}

          {actionImprimir && (
            <Tooltip title="Imprimir Contrato">
              <IconButton 
                onClick={() => handlePrintContraCliPDF(formData, servicios, periodos, infoHome)} 
                disabled={isFetching || !formData.concodcontrato}
                sx={{ border: "1px solid #ddd", bgcolor: "white", color: "#196C87" }}
              >
                {getIconComponent(actionImprimir.accnameicono, actionImprimir.acctipoico)}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px" }}><b>Visualización y Edición de Contrato</b></div>
        
        <CustomBackdrop isLoading={isSaving || isFetching || isLoadingCombos} />
        
        <Box sx={StyledRoot}>
          {!isEditable && !isFetching && lockReason !== "" && (
            <Alert severity="warning" sx={{ mb: 3 }}><b>Aviso:</b> {lockReason} Solo puede visualizar o imprimir.</Alert>
          )}
          
          <Accordion defaultExpanded sx={accordionStyles}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AssignmentIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold" color="primary">DATOS GENERALES (Solo Lectura)</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}><TextField disabled fullWidth label="Nº Contrato" InputLabelProps={{ shrink: true }} value={formData.concodcontrato} sx={{ bgcolor: "#f0f0f0" }} /></Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    disabled // Siempre bloqueado
                    options={listaClientes} getOptionLabel={(o) => o.label || ""}
                    value={listaClientes.find((c) => c.id === formData.clicodigo) || (formData.clicodigo ? { id: formData.clicodigo, label: formData.clicodigo } : null)}
                    renderInput={(p) => <TextField {...p} label="Cliente" InputLabelProps={{ shrink: true }} />}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Autocomplete
                    disabled // Siempre bloqueado
                    options={listaTipos} getOptionLabel={(o) => o.label || ""}
                    value={listaTipos.find((t) => t.id === formData.concodigo) || (formData.concodigo ? { id: formData.concodigo, label: formData.concodigo } : null)}
                    renderInput={(p) => <TextField {...p} label="Tipo" InputLabelProps={{ shrink: true }} />}
                  />
                </Grid>
                <Grid item xs={12} sm={9}>
                  <TextField disabled fullWidth label="Descripción" InputLabelProps={{ shrink: true }} value={formData.condescri} />
                </Grid>
                
                {/* ESTE ES EL ÚNICO CAMPO QUE PUEDE SER EDITABLE (A -> I) */}
                <Grid item xs={12} sm={3}>
                  <TextField 
                    select 
                    disabled={!isEditable} // Se bloquea si el contrato ya no es editable
                    fullWidth 
                    label="Estado" 
                    value={formData.constatus} 
                    onChange={(e) => setFormData(prev => ({ ...prev, constatus: e.target.value }))}
                  >
                    <MenuItem value="A">ACTIVO</MenuItem>
                    <MenuItem value="I">INACTIVO</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={3}><TextField disabled fullWidth type="date" label="F. Inicio" InputLabelProps={{ shrink: true }} value={formData.confecinicio} /></Grid>
                <Grid item xs={12} sm={3}><TextField disabled fullWidth type="date" label="F. Fin" InputLabelProps={{ shrink: true }} value={formData.confecfin} /></Grid>
                <Grid item xs={12} sm={3}><TextField disabled fullWidth type="date" label="F. Firma" InputLabelProps={{ shrink: true }} value={formData.confecfirma} /></Grid>
                <Grid item xs={12} sm={3}><TextField disabled fullWidth type="date" label="Inicio Facturación" InputLabelProps={{ shrink: true }} value={formData.confecinifac} /></Grid>
                <Grid item xs={12} sm={6}><TextField disabled fullWidth label="Frecuencia" InputLabelProps={{ shrink: true }} value={formData.confrecuencia} /></Grid>
                <Grid item xs={12} sm={6}><TextField disabled fullWidth label="Total ($)" InputLabelProps={{ shrink: true }} value={formData.convalor} /></Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded sx={accordionStyles}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ListAltIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold" color="primary">DETALLE DE SERVICIOS (Solo Lectura)</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell>Cód. Art</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Cant</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {servicios?.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ minWidth: "200px" }}>
                          <Autocomplete
                            disabled // Siempre bloqueado
                            options={listaArticulos} getOptionLabel={(o) => o.label || ""}
                            value={listaArticulos.find((a) => a.id === row.artcodigo) || (row.artcodigo ? { id: row.artcodigo, label: row.artcodigo } : null)}
                            renderInput={(p) => <TextField {...p} variant="standard" />}
                          />
                        </TableCell>
                        <TableCell><TextField disabled variant="standard" fullWidth value={row.artdescri} /></TableCell>
                        <TableCell><TextField disabled type="number" variant="standard" inputProps={{ style: { textAlign: "right" } }} value={row.concantidad} /></TableCell>
                        <TableCell><TextField disabled type="number" variant="standard" inputProps={{ style: { textAlign: "right" } }} value={row.convalor} /></TableCell>
                        <TableCell align="right">${row.contotal}</TableCell>
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
                <Typography variant="subtitle2" fontWeight="bold" color="primary">PROYECCIÓN DE FACTURACIÓN (Solo Lectura)</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell align="center">#</TableCell>
                      <TableCell align="center">Mes</TableCell>
                      <TableCell align="center">Año</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Factura Relacionada</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {periodos?.map((per, idx) => (
                      <TableRow key={idx}>
                        <TableCell align="center">{per.consecuen || (idx + 1)}</TableCell>
                        <TableCell align="center">{per.conmes}</TableCell>
                        <TableCell align="center">{per.conanio}</TableCell>
                        <TableCell align="center">{per.constatus === 'A' ? "ACTIVO" : "INACTIVO"}</TableCell>
                        <TableCell align="center">
                          {per.facnumfac ? (
                            <Typography variant="body2" color="error" fontWeight="bold">{per.facnumfac}</Typography>
                          ) : "-"}
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
export default EditarContraCliDF;