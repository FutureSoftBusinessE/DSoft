import React, { useState, useEffect } from "react"
import Header from "../../layouts/Header"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { 
  Box, Grid, TextField, Button, Typography, Stack, Accordion, 
  AccordionSummary, AccordionDetails, Alert, List, Chip, Dialog, 
  DialogTitle, DialogContent, DialogActions, Paper as MuiPaper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton 
} from "@mui/material"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import BackIcon from "../../components/BackIcon"
import { api, showWarning } from "../../api"
import CustomBackdrop from "../../components/CustomBackdrop"

import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import FilePresentIcon from '@mui/icons-material/FilePresent'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import CheckIcon from '@mui/icons-material/Check'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import QrCode2Icon from '@mui/icons-material/QrCode2'

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2e7d32" }, info: { main: "#0288d1" } },
})

const StyledRootStyles = { width: "100%", maxWidth: "1200px", margin: "64px auto 0 auto", padding: "20px" }

// TAMAÑO ESTIMADO DE LA FIRMA (en píxeles de DOM)
const SIGNATURE_WIDTH = 150;
const SIGNATURE_HEIGHT = 60;

const FirmarPDFDF = () => {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [openPreview, setOpenPreview] = useState(false)
  
  const [p12Info, setP12Info] = useState(null)
  const [validacionResult, setValidacionResult] = useState(null)
  
  const [pdfPrincipal, setPdfPrincipal] = useState(null)
  const [p12File, setP12File] = useState(null)
  const [password, setPassword] = useState("") 
  
  const [currentPage, setCurrentPage] = useState(1)
  const [coords, setCoords] = useState({ x: 0, y: 0, page: 0 })

  const handleOpenPreview = (file) => {
    if (!file) return showWarning("Cargue un archivo PDF primero")
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setOpenPreview(true)
  }

  const handlePdfClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const rawX = Math.round(e.clientX - rect.left)
    const rawY = Math.round(rect.height - (e.clientY - rect.top))

    const x = Math.round(rawX - (SIGNATURE_WIDTH / 2));
    const y = Math.round(rawY - (SIGNATURE_HEIGHT / 2));

    setCoords({ x, y, page: currentPage - 1 })
    setOpenPreview(false)
    showWarning(`Firma ubicada en Página ${currentPage}. Tu clic fue el centro. Coordenadas de estampado (inferior izquierda): X:${x}, Y:${y}`)
  }

  useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) } }, [previewUrl])

  const handleFirmarVisual = async () => {
    if (!pdfPrincipal || !p12File || !password || !coords.x) return showWarning("Faltan datos: PDF, Firma, Clave o Ubicación")
    
    const formData = new FormData()
    formData.append("documento", pdfPrincipal)
    formData.append("firma", p12File)
    formData.append("password", password)
    formData.append("x", coords.x)
    formData.append("y", coords.y)
    formData.append("page", coords.page)
    
    if (p12Info && p12Info.sujeto_completo) {
        formData.append("duenoFirma", p12Info.sujeto_completo);
    }

    setLoading(true)
    try {
      let foundToken = "";
      const storages = [localStorage, sessionStorage];
      
      for (let storage of storages) {
        for (let i = 0; i < storage.length; i++) {
          let val = storage.getItem(storage.key(i));
          if (typeof val === 'string' && val.includes('.') && val.split('.').length === 3 && val.includes('eyJ')) {
            foundToken = val; break;
          }
          try {
            let obj = JSON.parse(val);
            if (obj && typeof obj === 'object') {
              for (let key in obj) {
                if (typeof obj[key] === 'string' && obj[key].split('.').length === 3 && obj[key].includes('eyJ')) {
                  foundToken = obj[key]; break;
                }
              }
            }
          } catch(e) {}
          if (foundToken) break;
        }
        if (foundToken) break;
      }

      if (!foundToken && api.defaults?.headers?.common?.Authorization) {
        foundToken = api.defaults.headers.common.Authorization.replace('Bearer ', '');
      }

      if (!foundToken) {
        setLoading(false);
        return showWarning("No se detectó sesión activa. Por favor, recargue la página.");
      }

      const authHeader = `Bearer ${foundToken.replace(/"/g, '')}`;
      const baseUrl = (api.defaults && api.defaults.baseURL) ? api.defaults.baseURL : 'http://127.0.0.1:5000';

      const response = await fetch(`${baseUrl}/FirmarPDFDF/firmarDocumentoVisualDF`, {
        method: 'POST',
        headers: { 'Authorization': authHeader },
        body: formData
      });

      if (!response.ok) {
        let errorMsg = "Error técnico al firmar el documento";
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch(e) {}
        showWarning(errorMsg);
        setLoading(false);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SIAC_FIRMADO_QR_${pdfPrincipal.name}`);
      document.body.appendChild(link); 
      link.click(); 
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      showWarning("Error de comunicación con el servidor");
    }
    setLoading(false)
  }

  const handleValidarP12 = async () => {
    if (!p12File || !password) return showWarning("Debe cargar el archivo .p12 e ingresar la clave")
    const formData = new FormData()
    formData.append("firma", p12File); formData.append("password", password)

    setLoading(true)
    try {
      const res = await api.post("/FirmarPDFDF/validarFirmaP12", formData, { headers: { "Content-Type": "multipart/form-data" } })
      if (res.data && res.data.success) setP12Info(res.data.data)
    } catch (err) {}
    setLoading(false)
  }

  const handleVerificarDocumento = async () => {
    if (!pdfPrincipal) return showWarning("Cargue el PDF firmado")
    const formData = new FormData()
    formData.append("documento", pdfPrincipal)
    
    setLoading(true)
    try {
      const res = await api.post("/FirmarPDFDF/verificarFirmaPDF", formData, { headers: { "Content-Type": "multipart/form-data" } })
      if (res.data && res.data.success) setValidacionResult(res.data.data)
    } catch (err) {}
    setLoading(false)
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon /><CustomBackdrop isLoading={loading} />
        
        <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: "#196C87", color: "white", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Ubicación de Firma QR - Página {currentPage}</Typography>
            <Stack direction="row" spacing={1}>
              <IconButton color="inherit" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ArrowBackIosIcon fontSize="small" /></IconButton>
              <IconButton color="inherit" onClick={() => setCurrentPage(p => p + 1)}><ArrowForwardIosIcon fontSize="small" /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 0, height: '75vh', position: 'relative', overflow: 'hidden' }}>
            <Box onClick={handlePdfClick} sx={{ cursor: 'crosshair', width: '100%', height: '100%', overflow: 'hidden' }}>
              <iframe 
                key={currentPage} 
                title="Preview" 
                src={`${previewUrl}#page=${currentPage}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`} 
                width="100%" height="100%" style={{ border: 'none', pointerEvents: 'none', overflow: 'hidden' }} 
              />
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }} />
            </Box>
          </DialogContent>
          <DialogActions><Button onClick={() => setOpenPreview(false)}>Cancelar</Button></DialogActions>
        </Dialog>

        <Box sx={StyledRootStyles}>
          <Typography variant="h4" sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold', color: "#196C87" }}>FIRMA ELECTRÓNICA SIAC</Typography>
          <Stack spacing={3}>
            {/* --- 1. FIRMAR PDF --- */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Stack direction="row" spacing={1}><QrCode2Icon color="primary" /><Typography sx={{ fontWeight: 'bold' }}>1. FIRMAR CON CÓDIGO QR</Typography></Stack></AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}><Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{ height: '56px', borderStyle: 'dashed' }}>{pdfPrincipal ? pdfPrincipal.name : "Subir PDF"}<input type="file" hidden accept=".pdf" onChange={(e) => { setPdfPrincipal(e.target.files[0]); setCurrentPage(1); }} /></Button></Grid>
                  <Grid item xs={12} md={6}><Button variant="contained" color="info" fullWidth sx={{ height: '56px' }} disabled={!pdfPrincipal} onClick={() => handleOpenPreview(pdfPrincipal)}>UBICAR QR EN PÁGINA</Button></Grid>
                  <Grid item xs={12} md={6}><Button variant="outlined" component="label" fullWidth sx={{ height: '56px' }}>{p12File ? "Firma Cargada ✓" : "Cargar Archivo .p12"}<input type="file" hidden accept=".p12" onChange={(e) => setP12File(e.target.files[0])} /></Button></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth label="Clave de Firma" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Grid>
                  <Grid item xs={12}>
                    {coords.x > 0 && <Alert severity="info" sx={{ mb: 2 }}>Listo para estampar código QR en <b>Página {coords.page + 1}</b></Alert>}
                    <Button variant="contained" fullWidth size="large" onClick={handleFirmarVisual} disabled={!coords.x || !password || !p12File}>GENERAR DOCUMENTO FIRMADO</Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* --- 2. VALIDAR --- */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Stack direction="row" spacing={1}><VerifiedUserIcon color="primary" /><Typography sx={{ fontWeight: 'bold' }}>2. VALIDAR VIGENCIA DE FIRMA (.P12)</Typography></Stack></AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={5}><Button variant="outlined" component="label" fullWidth sx={{ height: '56px' }}>{p12File ? p12File.name : "Seleccionar .p12"}<input type="file" hidden accept=".p12" onChange={(e) => setP12File(e.target.files[0])} /></Button></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Clave de Validación" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Grid>
                  <Grid item xs={12} md={3}><Button variant="contained" fullWidth sx={{ height: '56px' }} onClick={handleValidarP12}>VERIFICAR</Button></Grid>
                </Grid>
                {p12Info && (
                  <MuiPaper variant="outlined" sx={{ mt: 3, p: 3, bgcolor: "#ffffff", border: "1px solid #cbd5e0" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center', borderBottom: '1px solid #eee', pb: 1 }}>RESULTADOS DE VERIFICACIÓN</Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}><Typography variant="body2"><b>Emitido por:</b> {p12Info.emitido_por}</Typography></Grid>
                      <Grid item xs={12}><Typography variant="body2"><b>Titular:</b> {p12Info.sujeto_completo}</Typography></Grid>
                      <Grid item xs={12}><Typography variant="body2"><b>Emisión:</b> {p12Info.valido_desde}</Typography></Grid>
                      <Grid item xs={12}><Typography variant="body2"><b>Expiración:</b> {p12Info.valido_hasta}</Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2"><b>Expirado:</b> <span style={{ color: p12Info.expirado === 'SÍ' ? 'red' : 'green', fontWeight: 'bold' }}>{p12Info.expirado}</span></Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2"><b>Revocado:</b> {p12Info.revocado}</Typography></Grid>
                    </Grid>
                  </MuiPaper>
                )}
              </AccordionDetails>
            </Accordion>

            {/* --- 3. ANALIZAR --- */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Stack direction="row" spacing={1}><FilePresentIcon color="primary" /><Typography sx={{ fontWeight: 'bold' }}>3. ANALIZAR INTEGRIDAD DE DOCUMENTO</Typography></Stack></AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={9}><Button variant="outlined" component="label" fullWidth startIcon={<FilePresentIcon />}>{pdfPrincipal ? pdfPrincipal.name : "Subir PDF firmado"}<input type="file" hidden accept=".pdf" onChange={(e) => setPdfPrincipal(e.target.files[0])} /></Button></Grid>
                  <Grid item xs={12} md={3}><Button variant="contained" fullWidth onClick={handleVerificarDocumento}>ANALIZAR</Button></Grid>
                </Grid>
                {validacionResult && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}><b>Total firmantes:</b> {validacionResult.total_firmas}</Typography>
                    <TableContainer component={MuiPaper} variant="outlined" sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "#f4f6f8" }}>
                          <TableRow>
                            <TableCell>Cédula / Nombres</TableCell>
                            <TableCell>Razón</TableCell>
                            <TableCell>Fecha Firmado</TableCell>
                            <TableCell>Entidad</TableCell>
                            <TableCell>Emisión</TableCell>
                            <TableCell>Expiración</TableCell>
                            <TableCell>Válido</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {validacionResult.detalles?.map((f, i) => (
                            <TableRow key={i}>
                              <TableCell sx={{ whiteSpace: 'pre-line' }}>{f.nombres}</TableCell>
                              <TableCell sx={{ whiteSpace: 'pre-line' }}>{f.razon_loc}</TableCell>
                              <TableCell sx={{ whiteSpace: 'pre-line' }}>{f.fecha_firmado}</TableCell>
                              <TableCell sx={{ whiteSpace: 'pre-line' }}>{f.entidad}</TableCell>
                              <TableCell sx={{ whiteSpace: 'pre-line' }}>{f.emision}</TableCell>
                              <TableCell sx={{ whiteSpace: 'pre-line' }}>{f.expiracion}</TableCell>
                              <TableCell align="center">{f.valido ? <CheckIcon sx={{ color: 'green' }} /> : <HighlightOffIcon sx={{ color: 'red' }} />}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>
      </div>
    </ThemeProvider>
  )
}
export default FirmarPDFDF;