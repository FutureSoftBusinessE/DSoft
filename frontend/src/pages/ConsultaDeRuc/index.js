import React, { useContext, useState } from "react"
import Header from "../../layouts/Header"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { 
  Box, Paper, Grid, TextField, Button, Typography, IconButton, 
  Alert, Chip, Stack, Tooltip, Accordion, AccordionSummary, AccordionDetails 
} from "@mui/material"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import BackIcon from "../../components/BackIcon"
import { useMutation, api } from "../../api"
import CustomBackdrop from "../../components/CustomBackdrop"
import SearchIcon from "@mui/icons-material/Search"
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import BusinessIcon from '@mui/icons-material/Business'
import EventIcon from '@mui/icons-material/Event'
import GavelIcon from '@mui/icons-material/Gavel'

const theme = createTheme({
  palette: { 
    primary: { main: "#196C87" }, 
    secondary: { main: "#2e7d32" },
    warning: { main: "#ed6c02" },
    error: { main: "#d32f2f" }
  },
})

const StyledRootStyles = {
  width: "100%", maxWidth: "1200px", margin: "64px auto 0 auto", padding: "20px",
  backgroundColor: "#f5f7fa", borderRadius: "12px", minHeight: "100vh"
}

const DataFieldStyles = {
  padding: "12px", backgroundColor: "#fcfcfc", border: "1px solid #e0e0e0", 
  borderRadius: "4px", display: "flex", flexDirection: "column", minHeight: "58px", justifyContent: "center"
}

const ConsultaRuc = () => {
  const [ruc, setRuc] = useState("")
  const [rucData, setRucData] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")

  const { mutateAsync: searchRuc, isPending: isSearching } = useMutation({
    fn: async (num) => await api.get(`/ConsultaDeRuc/getInfoRucSRI/${num}`),
    showError: "modal",
    onSuccess: (response) => {
      const data = response?.data || response;
      if (data && data.numeroRuc) {
        setRucData(data);
        setErrorMsg("");
      } else {
        setErrorMsg("El servicio del SRI no devolvió datos válidos.");
      }
    }
  })

  const handleSearch = async () => {
    if (ruc.trim().length !== 13) { setErrorMsg("El RUC debe tener 13 dígitos."); return; }
    setErrorMsg("");
    try { await searchRuc(ruc.trim()); } catch (err) {}
  };

  const fDate = (d) => {
    if (!d || d === "" || d === "null") return "N/A";
    return d.toString().split(" ")[0];
  };

  const getStatusColor = (status) => {
    if (status === "ACTIVO") return "secondary";
    if (status === "SUSPENDIDO") return "warning";
    return "error";
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: "#196C87" }}>
            CONSULTA INTEGRAL DE RUC - SRI
          </Typography>
        </Box>

        <CustomBackdrop isLoading={isSearching} />

        <Box sx={StyledRootStyles}>
          <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: 2, border: '1px solid #cbd5e0' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={9}>
                <TextField fullWidth label="Número de RUC *" variant="outlined" value={ruc}
                  onChange={(e) => setRuc(e.target.value.replace(/\D/g, '').substring(0, 13))}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth variant="contained" size="large" startIcon={<SearchIcon />} 
                  onClick={handleSearch} sx={{ height: "56px" }}>CONSULTAR</Button>
              </Grid>
            </Grid>
            {errorMsg && <Alert severity="error" sx={{ mt: 2 }}>{errorMsg}</Alert>}
          </Paper>

          {rucData && (
            <Stack spacing={2}>
              <Stack spacing={1}>
                {rucData.ya_registrado && (
                  <Alert icon={<CheckCircleIcon />} severity="info">
                    SISTEMA SIAC: Registrado como Proveedor ({rucData.local_codigo})
                  </Alert>
                )}
                {rucData.estadoContribuyenteRuc !== "ACTIVO" && (
                  <Alert severity="warning">
                    <b>AVISO:</b> Contribuyente {rucData.estadoContribuyenteRuc}. {rucData.motivoCancelacionSuspension && `Motivo: ${rucData.motivoCancelacionSuspension}`}
                  </Alert>
                )}
              </Stack>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BusinessIcon color="primary" />
                    <Typography sx={{ fontWeight: 'bold' }}>DATOS DEL CONTRIBUYENTE</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Razón Social / Nombres Completos</Typography>
                      <Box sx={DataFieldStyles}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ fontWeight: "bold", color: "#196C87" }}>{rucData.razonSocial}</Typography>
                          <IconButton size="small" onClick={() => navigator.clipboard.writeText(rucData.razonSocial)}><ContentCopyIcon fontSize="small" /></IconButton>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Estado del RUC</Typography>
                      <Box sx={DataFieldStyles}>
                        <Chip label={rucData.estadoContribuyenteRuc} color={getStatusColor(rucData.estadoContribuyenteRuc)} sx={{ fontWeight: 'bold' }} />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Actividad Económica Principal</Typography>
                      <Box sx={DataFieldStyles}>
                        <Typography variant="body2">{rucData.actividadEconomicaPrincipal || "INFORMACIÓN NO DISPONIBLE"}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <GavelIcon color="primary" />
                    <Typography sx={{ fontWeight: 'bold' }}>IDENTIFICACIÓN TRIBUTARIA</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}><Typography variant="caption">Tipo</Typography><Box sx={DataFieldStyles}><Typography variant="body2">{rucData.tipoContribuyente}</Typography></Box></Grid>
                    <Grid item xs={12} md={4}><Typography variant="caption">Régimen</Typography><Box sx={DataFieldStyles}><Typography sx={{ fontWeight: 'bold' }}>{rucData.regimen}</Typography></Box></Grid>
                    <Grid item xs={12} md={4}><Typography variant="caption">Categoría</Typography><Box sx={DataFieldStyles}><Typography>{rucData.categoria || "N/A"}</Typography></Box></Grid>
                    <Grid item xs={12} md={4}><Typography variant="caption">Contabilidad</Typography><Box sx={DataFieldStyles}><Typography sx={{ fontWeight: 'bold' }}>{rucData.obligadoLlevarContabilidad}</Typography></Box></Grid>
                    <Grid item xs={12} md={4}><Typography variant="caption">Retención</Typography><Box sx={DataFieldStyles}><Typography>{rucData.agenteRetencion}</Typography></Box></Grid>
                    <Grid item xs={12} md={4}><Typography variant="caption">Especial</Typography><Box sx={DataFieldStyles}><Typography>{rucData.contribuyenteEspecial}</Typography></Box></Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EventIcon color="primary" />
                    <Typography sx={{ fontWeight: 'bold' }}>CRONOLOGÍA DE ACTIVIDADES</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}><Typography variant="caption">Inicio</Typography><Box sx={DataFieldStyles}><Typography>{fDate(rucData.informacionFechasContribuyente?.fechaInicioActividades)}</Typography></Box></Grid>
                    <Grid item xs={12} md={3}><Typography variant="caption">Reinicio</Typography><Box sx={DataFieldStyles}><Typography>{fDate(rucData.informacionFechasContribuyente?.fechaReinicioActividades)}</Typography></Box></Grid>
                    <Grid item xs={12} md={3}><Typography variant="caption">Cese</Typography><Box sx={DataFieldStyles}><Typography sx={{ color: rucData.informacionFechasContribuyente?.fechaCese ? 'error.main' : 'inherit' }}>{fDate(rucData.informacionFechasContribuyente?.fechaCese) || "VIGENTE"}</Typography></Box></Grid>
                    <Grid item xs={12} md={3}><Typography variant="caption">Actualización</Typography><Box sx={DataFieldStyles}><Typography>{fDate(rucData.informacionFechasContribuyente?.fechaActualizacion)}</Typography></Box></Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Stack>
          )}
        </Box>
      </div>
    </ThemeProvider>
  )
}
export default ConsultaRuc