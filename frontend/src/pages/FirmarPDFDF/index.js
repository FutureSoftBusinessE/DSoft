/* eslint-disable camelcase */
import React, { useState, useEffect } from "react"
import Header from "../../layouts/Header"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper as MuiPaper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import BackIcon from "../../components/BackIcon"
import { api, showWarning } from "../../api"
import CustomBackdrop from "../../components/CustomBackdrop"
import { useQuery } from "@tanstack/react-query"

import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser"
import FilePresentIcon from "@mui/icons-material/FilePresent"
import CheckIcon from "@mui/icons-material/Check"
import HighlightOffIcon from "@mui/icons-material/HighlightOff"
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos"
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos"
import QrCode2Icon from "@mui/icons-material/QrCode2"
import LayersIcon from "@mui/icons-material/Layers"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import fetchwrapper from "../../services/interceptors/fetchwrapper"

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2e7d32" }, info: { main: "#0288d1" } },
})

const StyledRootStyles = { width: "100%", maxWidth: "1200px", margin: "64px auto 0 auto", padding: "20px" }

// AJUSTE: Altura de la firma reducida a 48 Puntos PDF (Aprox -4mm)
const SIGNATURE_WIDTH = 200
const SIGNATURE_HEIGHT = 48

const FirmarPDFDF = () => {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [openPreview, setOpenPreview] = useState(false)

  const [p12Info, setP12Info] = useState(null)
  const [validacionResult, setValidacionResult] = useState(null)

  const [pdfPrincipal, setPdfPrincipal] = useState(null)
  const [p12File, setP12File] = useState(null)
  const [password, setPassword] = useState("")

  // Modo de selección de firma para Gerentes: "CORP" o "MANUAL"
  const [tipoFirmaGerente, setTipoFirmaGerente] = useState("CORP")

  // Control de páginas y visualizador
  const [currentPage, setCurrentPage] = useState(1)
  const [maxPages, setMaxPages] = useState(1)

  // Modo de estampado: 'SINGLE' o 'MULTI'
  const [stampMode, setStampMode] = useState("SINGLE")

  // Estado para estampado de una sola página
  const [coords, setCoords] = useState({ x: 0, y: 0, page: 0, renderBox: null })

  // Estado para estampado multipágina
  const [multiCoords, setMultiCoords] = useState({})

  // Cuadro de previsualización temporal dentro del modal antes de aceptar
  const [tempStamp, setTempStamp] = useState(null)

  const { data: config = {}, isLoading: configLoading } = useQuery({
    queryKey: ["configFirmarPDF"],
    queryFn: async () => {
      const res = await api.get("/FirmarPDFDF/getConfigFirmarPDF")
      return res.data.data || res.data
    },
    refetchOnWindowFocus: false,
  })

  const isGerente = config.is_gerente || false
  const hasGlobalFirma = config.has_global_firma || false

  const handlePdfUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setPdfPrincipal(file)
    setCurrentPage(1)
    setCoords({ x: 0, y: 0, page: 0, renderBox: null })
    setMultiCoords({})
    setTempStamp(null)

    const reader = new FileReader()
    reader.readAsBinaryString(file)
    reader.onloadend = () => {
      const text = reader.result
      const matches = text.match(/\/Type\s*\/Page\b/g)
      if (matches && matches.length > 0) {
        setMaxPages(matches.length)
      } else {
        setMaxPages(1)
      }
    }
  }

  const handleOpenPreviewModal = (mode = "SINGLE") => {
    if (!pdfPrincipal) return showWarning("Cargue un archivo PDF primero")
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(pdfPrincipal))
    setStampMode(mode)
    setTempStamp(null)
    setOpenPreview(true)
  }

  // --- CÁLCULO DE COORDENADAS TOP-LEFT Y PREVIEW DE SELLO ---
  const handlePdfClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const A4_RATIO = 842 / 595
    const containerRatio = rect.height / rect.width

    let pdfRenderWidth, pdfRenderHeight, offsetX, offsetY

    if (containerRatio > A4_RATIO) {
      pdfRenderWidth = rect.width
      pdfRenderHeight = rect.width * A4_RATIO
      offsetX = 0
      offsetY = (rect.height - pdfRenderHeight) / 2
    } else {
      pdfRenderHeight = rect.height
      pdfRenderWidth = rect.height / A4_RATIO
      offsetX = (rect.width - pdfRenderWidth) / 2
      offsetY = 0
    }

    let xInsidePdf = clickX - offsetX
    let yInsidePdf = clickY - offsetY

    xInsidePdf = Math.max(0, Math.min(xInsidePdf, pdfRenderWidth))
    yInsidePdf = Math.max(0, Math.min(yInsidePdf, pdfRenderHeight))

    const yFromBottom = pdfRenderHeight - yInsidePdf

    const ptX = Math.round((xInsidePdf / pdfRenderWidth) * 595)
    const ptY = Math.round((yFromBottom / pdfRenderHeight) * 842)

    // PyHanko lee coordenadas desde bottom-left.
    // Al restar la altura de la firma, nos aseguramos que el CLICK corresponda exactamente
    // a la ESQUINA SUPERIOR IZQUIERDA de la caja de la firma.
    const finalX = ptX
    const finalY = ptY - SIGNATURE_HEIGHT

    const safeX = Math.max(0, finalX)
    const safeY = Math.max(0, finalY)

    // Escala del cuadro simulado en la pantalla
    const stampVisualWidth = (SIGNATURE_WIDTH / 595) * pdfRenderWidth
    const stampVisualHeight = (SIGNATURE_HEIGHT / 842) * pdfRenderHeight

    setTempStamp({
      page: currentPage,
      pageIndex: currentPage - 1,
      ptX: safeX,
      ptY: safeY,
      renderBox: {
        left: offsetX + xInsidePdf,
        top: offsetY + yInsidePdf,
        width: stampVisualWidth,
        height: stampVisualHeight,
      },
    })
  }

  // Confirmar la ubicación seleccionada
  const handleConfirmLocation = () => {
    if (!tempStamp) return showWarning("Haga clic sobre el documento para definir la ubicación de la firma.")

    if (stampMode === "SINGLE") {
      // Guardamos la configuración y el renderBox para mostrarlo si el usuario vuelve a abrir el modal
      setCoords({ x: tempStamp.ptX, y: tempStamp.ptY, page: tempStamp.pageIndex, renderBox: tempStamp.renderBox })
      setOpenPreview(false)
      showWarning(`Firma fijada en Página ${tempStamp.page}.`)
    } else {
      // Modo Multipágina: Guardamos la coordenada y su renderBox para mantenerla visible en la página actual
      setMultiCoords((prev) => ({
        ...prev,
        [tempStamp.page]: {
          x: tempStamp.ptX,
          y: tempStamp.ptY,
          page: tempStamp.pageIndex,
          pageNumber: tempStamp.page,
          renderBox: tempStamp.renderBox,
        },
      }))
      setTempStamp(null)
      showWarning(`Firma fijada. Puede continuar navegando y firmando otras páginas.`)
    }
  }

  // Eliminar firma de una página específica en modo múltiple
  const handleRemovePageCoord = (pageNumber) => {
    setMultiCoords((prev) => {
      const copy = { ...prev }
      delete copy[pageNumber]
      return copy
    })
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFirmarVisual = async () => {
    if (!pdfPrincipal) return showWarning("Debe cargar un documento PDF.")

    const multiList = Object.values(multiCoords)
    const isMultiActive = stampMode === "MULTI" && multiList.length > 0

    if (!isMultiActive && (!coords || coords.x <= 0)) {
      return showWarning("Debe definir la ubicación de la firma en el documento.")
    }

    if (isGerente && tipoFirmaGerente === "MANUAL" && (!p12File || !password)) {
      return showWarning("Debe cargar su archivo .p12 e ingresar la contraseña.")
    }
    if (!isGerente && !hasGlobalFirma) {
      return showWarning("No existe firma corporativa configurada.")
    }

    const formData = new FormData()
    formData.append("documento", pdfPrincipal)

    if (isMultiActive) {
      formData.append("firmas_coords", JSON.stringify(multiList.map((m) => ({ page: m.page, x: m.x, y: m.y }))))
    } else {
      formData.append("x", coords.x)
      formData.append("y", coords.y)
      formData.append("page", coords.page)
    }

    if (isGerente && tipoFirmaGerente === "MANUAL" && p12File && password) {
      formData.append("firma", p12File)
      formData.append("password", password)
    }

    if (p12Info && p12Info.sujeto_completo) {
      formData.append("duenoFirma", p12Info.sujeto_completo)
    }

    setLoading(true)
    try {
      let foundToken = ""
      const storages = [localStorage, sessionStorage]

      for (const storage of storages) {
        for (let i = 0; i < storage.length; i++) {
          const val = storage.getItem(storage.key(i))
          if (typeof val === "string" && val.includes(".") && val.split(".").length === 3 && val.includes("eyJ")) {
            foundToken = val
            break
          }
          try {
            const obj = JSON.parse(val)
            if (obj && typeof obj === "object") {
              for (const key in obj) {
                if (typeof obj[key] === "string" && obj[key].split(".").length === 3 && obj[key].includes("eyJ")) {
                  foundToken = obj[key]
                  break
                }
              }
            }
          } catch (e) {}
          if (foundToken) break
        }
        if (foundToken) break
      }

      if (!foundToken && api.defaults?.headers?.common?.Authorization) {
        foundToken = api.defaults.headers.common.Authorization.replace("Bearer ", "")
      }

      if (!foundToken) {
        setLoading(false)
        return showWarning("No se detectó sesión activa. Por favor, recargue la página.")
      }

      const response = await fetchwrapper(`/FirmarPDFDF/firmarDocumentoVisualDF`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorMsg = "Error técnico al firmar el documento"
        try {
          const errorData = await response.json()
          errorMsg = errorData.message || errorMsg
        } catch (e) {}
        showWarning(errorMsg)
        setLoading(false)
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `DSOFT_FIRMADO_EC_${pdfPrincipal.name}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showWarning("Error de comunicación con el servidor")
    }
    setLoading(false)
  }

  const handleValidarP12 = async () => {
    if (isGerente && tipoFirmaGerente === "MANUAL" && (!p12File || !password)) {
      return showWarning("Debe cargar el archivo .p12 e ingresar la clave")
    }

    const formData = new FormData()
    if (isGerente && tipoFirmaGerente === "MANUAL" && p12File && password) {
      formData.append("firma", p12File)
      formData.append("password", password)
    }

    setLoading(true)
    try {
      const res = await api.post("/FirmarPDFDF/validarFirmaP12", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
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
      const res = await api.post("/FirmarPDFDF/verificarFirmaPDF", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      if (res.data && res.data.success) setValidacionResult(res.data.data)
    } catch (err) {}
    setLoading(false)
  }

  const totalPaginasFirmadas = Object.keys(multiCoords).length

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <CustomBackdrop isLoading={loading || configLoading} />

        {/* MODAL DE UBICACIÓN INTERACTIVA DE FIRMA */}
        <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
          <DialogTitle
            sx={{
              bgcolor: "#196C87",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              {stampMode === "MULTI" ? "Estampado Multipágina" : "Ubicación de Firma"} - Página {currentPage} de{" "}
              {maxPages}
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton
                color="inherit"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1))
                  setTempStamp(null)
                }}
                disabled={currentPage <= 1}
              >
                <ArrowBackIosIcon fontSize="small" />
              </IconButton>
              <IconButton
                color="inherit"
                onClick={() => {
                  setCurrentPage((p) => Math.min(maxPages, p + 1))
                  setTempStamp(null)
                }}
                disabled={currentPage >= maxPages}
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent
            sx={{ p: 0, height: "75vh", position: "relative", overflow: "hidden", backgroundColor: "#525659" }}
          >
            <Box
              onClick={handlePdfClick}
              sx={{ cursor: "crosshair", width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
            >
              <iframe
                key={currentPage}
                title="Preview"
                src={`${previewUrl}#page=${currentPage}&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                width="100%"
                height="100%"
                style={{ border: "none", pointerEvents: "none", overflow: "hidden" }}
              />

              {/* Capa invisible para atrapar clics */}
              <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 5 }} />

              {/* DIBUJADO DE PREVISUALIZACIÓN DEL SELLO (TEMPORAL ANTES DE ACEPTAR) */}
              {tempStamp && tempStamp.page === currentPage && (
                <Box
                  sx={{
                    position: "absolute",
                    left: tempStamp.renderBox.left,
                    top: tempStamp.renderBox.top,
                    width: tempStamp.renderBox.width,
                    height: tempStamp.renderBox.height,
                    border: "2px dashed #196C87",
                    backgroundColor: "rgba(255, 255, 255, 0.92)",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                >
                  <Box
                    sx={{
                      width: "36px",
                      height: "36px",
                      border: "1px solid #333",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 1,
                    }}
                  >
                    <QrCode2Icon sx={{ fontSize: "28px", color: "#196C87" }} />
                  </Box>
                  <Box sx={{ overflow: "hidden" }}>
                    <Typography variant="caption" sx={{ fontSize: "8px", display: "block", color: "#555" }}>
                      Firmado electrónicamente por:
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: "9px", fontWeight: "bold", color: "#000" }}>
                      FIRMA ELECTRÓNICA
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* DIBUJADO DE FIRMA FIJADA EN ESTA PÁGINA (MODO MULTI) */}
              {stampMode === "MULTI" && multiCoords[currentPage] && !tempStamp && (
                <Box
                  sx={{
                    position: "absolute",
                    left: multiCoords[currentPage].renderBox.left,
                    top: multiCoords[currentPage].renderBox.top,
                    width: multiCoords[currentPage].renderBox.width,
                    height: multiCoords[currentPage].renderBox.height,
                    border: "2px solid #2e7d32",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                    zIndex: 9,
                    pointerEvents: "none",
                  }}
                >
                  <Box
                    sx={{
                      width: "36px",
                      height: "36px",
                      border: "1px solid #2e7d32",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 1,
                    }}
                  >
                    <QrCode2Icon sx={{ fontSize: "28px", color: "#2e7d32" }} />
                  </Box>
                  <Box sx={{ overflow: "hidden" }}>
                    <Typography variant="caption" sx={{ fontSize: "8px", display: "block", color: "#555" }}>
                      Firmado electrónicamente por:
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: "9px", fontWeight: "bold", color: "#2e7d32" }}>
                      FIRMA FIJADA
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* DIBUJADO DE FIRMA FIJADA (MODO SINGLE) */}
              {stampMode === "SINGLE" && coords.renderBox && coords.page === currentPage - 1 && !tempStamp && (
                <Box
                  sx={{
                    position: "absolute",
                    left: coords.renderBox.left,
                    top: coords.renderBox.top,
                    width: coords.renderBox.width,
                    height: coords.renderBox.height,
                    border: "2px solid #2e7d32",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                    zIndex: 9,
                    pointerEvents: "none",
                  }}
                >
                  <Box
                    sx={{
                      width: "36px",
                      height: "36px",
                      border: "1px solid #2e7d32",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 1,
                    }}
                  >
                    <QrCode2Icon sx={{ fontSize: "28px", color: "#2e7d32" }} />
                  </Box>
                  <Box sx={{ overflow: "hidden" }}>
                    <Typography variant="caption" sx={{ fontSize: "8px", display: "block", color: "#555" }}>
                      Firmado electrónicamente por:
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: "9px", fontWeight: "bold", color: "#2e7d32" }}>
                      FIRMA FIJADA
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
            <Button onClick={() => setOpenPreview(false)} color="inherit">
              {stampMode === "MULTI" ? "Listo / Cerrar" : "Cancelar"}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={handleConfirmLocation}
              disabled={!tempStamp}
            >
              Aceptar y Fijar Ubicación
            </Button>
          </DialogActions>
        </Dialog>

        <Box sx={StyledRootStyles}>
          <Typography variant="h4" sx={{ textAlign: "center", mb: 4, fontWeight: "bold", color: "#196C87" }}>
            FIRMA ELECTRÓNICA DSOFT
          </Typography>
          <Stack spacing={3}>
            {/* --- 1. FIRMAR PDF --- */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1}>
                  <QrCode2Icon color="primary" />
                  <Typography sx={{ fontWeight: "bold" }}>1. FIRMAR DOCUMENTO</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<CloudUploadIcon />}
                      sx={{ height: "56px", borderStyle: "dashed" }}
                    >
                      {pdfPrincipal ? pdfPrincipal.name : "Subir PDF a Firmar"}
                      <input type="file" hidden accept=".pdf" onChange={handlePdfUpload} />
                    </Button>
                  </Grid>

                  {/* OPCIÓN PARA GERENTES: SELECCIÓN DE FIRMA CORPORATIVA O MANUAL */}
                  {isGerente && (
                    <Grid item xs={12}>
                      <MuiPaper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
                        <FormControl component="fieldset">
                          <FormLabel component="legend" sx={{ fontWeight: "bold", color: "#196C87" }}>
                            Origen de la Firma Electrónica:
                          </FormLabel>
                          <RadioGroup
                            row
                            value={tipoFirmaGerente}
                            onChange={(e) => setTipoFirmaGerente(e.target.value)}
                          >
                            <FormControlLabel
                              value="CORP"
                              control={<Radio />}
                              label="Firma Electrónica Corporativa configurada"
                            />
                            <FormControlLabel
                              value="MANUAL"
                              control={<Radio />}
                              label="Cargar Firma diferente (.p12 manual)"
                            />
                          </RadioGroup>
                        </FormControl>
                      </MuiPaper>
                    </Grid>
                  )}

                  {/* CARGA MANUAL SI ES GERENTE Y ELIGIÓ MANUAL */}
                  {isGerente && tipoFirmaGerente === "MANUAL" && (
                    <>
                      <Grid item xs={12} md={6}>
                        <Button variant="outlined" component="label" fullWidth sx={{ height: "56px" }}>
                          {p12File ? p12File.name : "Cargar Archivo .p12"}
                          <input
                            type="file"
                            hidden
                            accept=".p12,.pfx"
                            onChange={(e) => setP12File(e.target.files[0])}
                          />
                        </Button>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Clave de Firma"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </Grid>
                    </>
                  )}

                  {/* MENSAJE PARA USUARIO NORMAL O GERENTE EN MODO CORPORATIVO */}
                  {(!isGerente || (isGerente && tipoFirmaGerente === "CORP")) && (
                    <Grid item xs={12}>
                      <Alert severity={hasGlobalFirma ? "success" : "warning"}>
                        {hasGlobalFirma
                          ? "El sistema utilizará la Firma Electrónica Corporativa configurada."
                          : "No existe una Firma Corporativa configurada en esta localidad. Contacte al administrador."}
                      </Alert>
                    </Grid>
                  )}

                  {/* BOTONES DE DEFINICIÓN DE COORDENADAS */}
                  <Grid item xs={12} md={6}>
                    <Button
                      variant="contained"
                      color="info"
                      fullWidth
                      sx={{ height: "56px" }}
                      disabled={!pdfPrincipal}
                      onClick={() => handleOpenPreviewModal("SINGLE")}
                    >
                      UBICAR FIRMA EN UNA PÁGINA
                    </Button>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      startIcon={<LayersIcon />}
                      sx={{ height: "56px" }}
                      disabled={!pdfPrincipal}
                      onClick={() => handleOpenPreviewModal("MULTI")}
                    >
                      UBICAR FIRMAS EN MÚLTIPLES PÁGINAS
                    </Button>
                  </Grid>

                  {/* RESUMEN DE UBICACIÓN */}
                  <Grid item xs={12}>
                    {stampMode === "SINGLE" && coords.x > 0 && (
                      <Alert severity="info">
                        Firma individual configurada para estamparse en <b>Página {coords.page + 1}</b>.
                      </Alert>
                    )}

                    {stampMode === "MULTI" && totalPaginasFirmadas > 0 && (
                      <MuiPaper variant="outlined" sx={{ p: 2, bgcolor: "#f1f8e9" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, color: "#2e7d32" }}>
                          Páginas seleccionadas para firmar ({totalPaginasFirmadas}):
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {Object.values(multiCoords).map((m) => (
                            <Chip
                              key={m.pageNumber}
                              label={`Página ${m.pageNumber}`}
                              color="success"
                              onDelete={() => handleRemovePageCoord(m.pageNumber)}
                            />
                          ))}
                        </Stack>
                      </MuiPaper>
                    )}
                  </Grid>

                  {/* BOTÓN FINAL DE GENERACIÓN */}
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={handleFirmarVisual}
                      disabled={
                        !pdfPrincipal ||
                        (stampMode === "SINGLE" && coords.x <= 0) ||
                        (stampMode === "MULTI" && totalPaginasFirmadas === 0) ||
                        (!isGerente && !hasGlobalFirma) ||
                        (isGerente && tipoFirmaGerente === "MANUAL" && (!password || !p12File))
                      }
                      sx={{ height: "56px", fontWeight: "bold" }}
                    >
                      GENERAR DOCUMENTO FIRMADO
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* --- 2. VALIDAR --- */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1}>
                  <VerifiedUserIcon color="primary" />
                  <Typography sx={{ fontWeight: "bold" }}>2. VALIDAR VIGENCIA DE FIRMA (.P12)</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {isGerente && tipoFirmaGerente === "MANUAL" ? (
                    <>
                      <Grid item xs={12} md={5}>
                        <Button variant="outlined" component="label" fullWidth sx={{ height: "56px" }}>
                          {p12File ? p12File.name : "Seleccionar .p12"}
                          <input
                            type="file"
                            hidden
                            accept=".p12,.pfx"
                            onChange={(e) => setP12File(e.target.files[0])}
                          />
                        </Button>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Clave de Validación"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </Grid>
                    </>
                  ) : (
                    <Grid item xs={12} md={9}>
                      <Alert
                        severity={hasGlobalFirma ? "info" : "warning"}
                        sx={{ height: "100%", display: "flex", alignItems: "center" }}
                      >
                        {hasGlobalFirma
                          ? "Validación de la Firma Electrónica Corporativa."
                          : "Sin Firma Corporativa disponible."}
                      </Alert>
                    </Grid>
                  )}

                  <Grid item xs={12} md={3}>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ height: "56px" }}
                      onClick={handleValidarP12}
                      disabled={
                        (!isGerente && !hasGlobalFirma) ||
                        (isGerente && tipoFirmaGerente === "MANUAL" && (!p12File || !password))
                      }
                    >
                      VERIFICAR
                    </Button>
                  </Grid>
                </Grid>

                {p12Info && (
                  <MuiPaper variant="outlined" sx={{ mt: 3, p: 3, bgcolor: "#ffffff", border: "1px solid #cbd5e0" }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", mb: 2, textAlign: "center", borderBottom: "1px solid #eee", pb: 1 }}
                    >
                      RESULTADOS DE VERIFICACIÓN
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <b>Emitido por:</b> {p12Info.emitido_por}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <b>Titular:</b> {p12Info.sujeto_completo}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <b>Emisión:</b> {p12Info.valido_desde}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <b>Expiración:</b> {p12Info.valido_hasta}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <b>Expirado:</b>{" "}
                          <span style={{ color: p12Info.expirado === "SÍ" ? "red" : "green", fontWeight: "bold" }}>
                            {p12Info.expirado}
                          </span>
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <b>Revocado:</b> {p12Info.revocado}
                        </Typography>
                      </Grid>
                    </Grid>
                  </MuiPaper>
                )}
              </AccordionDetails>
            </Accordion>

            {/* --- 3. ANALIZAR --- */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1}>
                  <FilePresentIcon color="primary" />
                  <Typography sx={{ fontWeight: "bold" }}>3. ANALIZAR INTEGRIDAD DE DOCUMENTO</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={9}>
                    <Button variant="outlined" component="label" fullWidth startIcon={<FilePresentIcon />}>
                      {pdfPrincipal ? pdfPrincipal.name : "Subir PDF firmado"}
                      <input type="file" hidden accept=".pdf" onChange={(e) => setPdfPrincipal(e.target.files[0])} />
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button variant="contained" fullWidth onClick={handleVerificarDocumento} disabled={!pdfPrincipal}>
                      ANALIZAR
                    </Button>
                  </Grid>
                </Grid>
                {validacionResult && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      <b>Total firmantes:</b> {validacionResult.total_firmas}
                    </Typography>
                    <TableContainer component={MuiPaper} variant="outlined" sx={{ overflowX: "auto" }}>
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
                              <TableCell sx={{ whiteSpace: "pre-line" }}>{f.nombres}</TableCell>
                              <TableCell sx={{ whiteSpace: "pre-line" }}>{f.razon_loc}</TableCell>
                              <TableCell sx={{ whiteSpace: "pre-line" }}>{f.fecha_firmado}</TableCell>
                              <TableCell sx={{ whiteSpace: "pre-line" }}>{f.entidad}</TableCell>
                              <TableCell sx={{ whiteSpace: "pre-line" }}>{f.emision}</TableCell>
                              <TableCell sx={{ whiteSpace: "pre-line" }}>{f.expiracion}</TableCell>
                              <TableCell align="center">
                                {f.valido ? (
                                  <CheckIcon sx={{ color: "green" }} />
                                ) : (
                                  <HighlightOffIcon sx={{ color: "red" }} />
                                )}
                              </TableCell>
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
export default FirmarPDFDF
