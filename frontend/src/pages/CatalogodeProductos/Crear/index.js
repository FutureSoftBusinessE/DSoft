/* eslint-disable camelcase */
/* eslint-disable react/jsx-key */
import React, { useState, useEffect, useContext, useRef, useCallback } from "react"
import Webcam from "react-webcam" // <-- Agregar esto
import { useNavigate } from "react-router-dom"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  IconButton,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material"
import {
  DataGrid,
  GridActionsCellItem,
  GridRowModes,
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid"

import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  CameraAlt as CameraAltIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material"
import Swal from "sweetalert2"

import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import { useMutation, useQuery, api, showWarning } from "../../../api"

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

const initialFormData = {
  invcodigo: "",
  artcodigo: "",
  artnumparte: "",
  artdescri: "",
  artalias: "",
  artetiqueta: "S",
  lincodigo: "",
  lindescri: "",
  marcodigo: "",
  medcodigo: "",
  precodigo: "",
  jefecodigo: "",
  paiscodigo: "",
  artstatus: "A",

  artvolumen: 0,
  artpesogm2: 0,
  artancho: 0,
  artcantbulto: 0,
  artcomentario: "",
  artobservacion: "",
  artwebsite: "",

  artprodven: true,
  artapliiva: true,
  artretiene: false,
  artnocompra: false,
  artfaccero: false,
  artservicio: false,
  artexplosion: false,
  artmodpvp: false,
  artdecimales: false,
  artfacsinstock: false,
  artsincosto: false,
  artminimo: 0,
  artmaximo: 0,
  artdiasrep: 0,
  artdiaseg: 0,
  artfrecllegada: 0,
  artpergarantia: 0,
  artapligarantia: false,
  artnoimprimeseries: false,
  artnogeneraseries: false,
  artserie: false,
  artseriedesp: false,
  artlote: false,
  artconfirmaingreso: false,
  arttiposerie: "",

  artcantinicial: 0,
  artcantactual: 0,
  artcanttranfer: 0,
  artcantimporta: 0,
  artcostoinicial: 0,
  artcostoactual: 0,
  artcif: 0,
  artfob: 0,

  artprecventa1: "",
  artprecventa2: "",
  artprecventa3: "",
  artprecventa4: "",
  artprecventa5: "",
  artprecventa6: "",

  inencodigo: "",
  inendescri: "",
  parcodigo: "",
  pardescri: "",
  parporcentaje: 0,
  calfcodigo: "",
}

const fetchCatalog = async (endpoint, payload = null) => {
  try {
    const response = payload ? await api.post(endpoint, payload) : await api.get(endpoint)
    const rawData = response?.data?.data || response?.data || response || []
    return Array.isArray(rawData) ? rawData : Array.isArray(rawData?.data) ? rawData.data : []
  } catch (error) {
    console.error(`Error cargando catálogo desde ${endpoint}:`, error)
    return []
  }
}

const ModalBuscadorLinea = ({ open, onClose, onSelect }) => {
  const { data: listLineas = [], isLoading } = useQuery({
    queryKey: ["modal_lineas_activas"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getLineasModalFull"),
    enabled: open,
  })

  const columns = [
    { field: "lincodigo", headerName: "Cód. Línea", width: 140 },
    { field: "lindescri", headerName: "Descripción", width: 350 },
    {
      field: "lintipo",
      headerName: "Tipo",
      width: 130,
      renderCell: (params) => (
        <Typography fontWeight="bold" color={params.value === "T" ? "secondary" : "primary"}>
          {params.value === "T" ? "Transaccional" : "Mayor"}
        </Typography>
      ),
    },
    { field: "linlindes", headerName: "Nivel Sup.", width: 140 },
  ]

  const handleRowDoubleClick = (params) => {
    if (params.row.lintipo !== "T") {
      Swal.fire("Selección Inválida", "Solo puede seleccionar una Línea de tipo Transaccional (T).", "warning")
      return
    }
    onSelect(params.row)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#196C87",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Buscador de Líneas (Doble clic para seleccionar)
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, height: "500px" }}>
        <DataGrid
          rows={listLineas.map((row, index) => ({ id: row.lincodigo || index, ...row }))}
          columns={columns}
          loading={isLoading}
          onRowDoubleClick={handleRowDoubleClick}
          disableRowSelectionOnClick
          density="compact"
          slots={{
            toolbar: () => (
              <Box sx={{ p: 1 }}>
                <GridToolbarQuickFilter placeholder="Buscar por nombre, código o nivel..." sx={{ width: "100%" }} />
              </Box>
            ),
          }}
          initialState={{
            filter: { filterModel: { items: [], quickFilterValues: [] } },
            pagination: { paginationModel: { pageSize: 15 } },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error" variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ------------------------------------------------------------------
//                        WebcamSelector
// ------------------------------------------------------------------
const WebcamSelector = ({ webcamRef }) => {
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState("")

  const handleDevices = useCallback(
    (mediaDevices) => setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
    [setDevices],
  )

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices)
  }, [handleDevices])

  const videoConstraints = {
    facingMode: deviceId ? undefined : { ideal: "environment" },
    deviceId: deviceId ? { exact: deviceId } : undefined,
    width: 400,
    height: 300,
    aspectRatio: 4 / 3,
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#333" }}>
          Seleccionar cámara
        </Typography>
        <select
          onChange={(e) => setDeviceId(e.target.value)}
          value={deviceId}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            fontFamily: "inherit",
            fontSize: "14px",
          }}
        >
          <option value="">-- Cámara por defecto --</option>
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Cámara ${index + 1}`}
            </option>
          ))}
        </select>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          borderRadius: "8px",
          overflow: "hidden",
          border: "2px solid #e0e0e0",
        }}
      >
        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} />
      </Box>
    </Box>
  )
}

const CrearCatalogodeProductos = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState(initialFormData)

  const [openModalLinea, setOpenModalLinea] = useState(false)
  const [imagenAmpliada, setImagenAmpliada] = useState(null)

  // Estados para la Cámara Web
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const webcamRef = useRef(null)

  // Función para capturar y guardar la foto en el arreglo "imagenes"
  const handleCapture = () => {
    const screenshot = webcamRef.current.getScreenshot()
    if (screenshot) {
      setImagenes((prev) => [...prev, { id: Date.now(), base64: screenshot }])
    }
    setIsCameraOpen(false)
  }

  const [imagenes, setImagenes] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [proveedoresProd, setProveedoresProd] = useState([])
  const [rowModesProv, setRowModesProv] = useState({})
  const [barrasProd, setBarrasProd] = useState([])
  const [rowModesBarras, setRowModesBarras] = useState({})
  const [sustitutos, setSustitutos] = useState([])
  const [rowModesSust, setRowModesSust] = useState({})
  const [principiosProd, setPrincipiosProd] = useState([])
  const [rowModesPrin, setRowModesPrin] = useState({})

  const { data: listInventarios = [] } = useQuery({
    queryKey: ["inv_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaInventarios"),
  })
  const { data: listMarcas = [] } = useQuery({
    queryKey: ["mar_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaMarcas"),
  })
  const { data: listMedidas = [] } = useQuery({
    queryKey: ["med_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaMedidas"),
  })
  const { data: listPresentaciones = [] } = useQuery({
    queryKey: ["pre_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaPresentaciones"),
  })
  const { data: listJefes = [] } = useQuery({
    queryKey: ["jef_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaJefes"),
  })
  const { data: listPaises = [] } = useQuery({
    queryKey: ["pai_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaPaises"),
  })
  const { data: listProveedores = [] } = useQuery({
    queryKey: ["provl_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaProveedores"),
  })
  const { data: listArticulos = [] } = useQuery({
    queryKey: ["artl_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaArticulos"),
  })
  const { data: listPrincipios = [] } = useQuery({
    queryKey: ["prinl_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaPrincipiosActivos"),
  })

  const { data: ciaParams = [] } = useQuery({
    queryKey: ["param_cia"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getParametrosCia"),
  })

  const formatoCostoStr = ciaParams[0]?.ciacostfor || "#,##0.00"
  const numeroDecimales = formatoCostoStr.includes(".") ? formatoCostoStr.split(".")[1].length : 2
  const codartsec = ciaParams[0]?.codartsec || 0

  // ====================================================================================
  // EFECTO: OBTENER CÓDIGO TEMPORAL SI APLICA (CORRECCIÓN [object Object])
  // ====================================================================================
  useEffect(() => {
    if (codartsec !== 0) {
      const fetchSecuencia = async () => {
        try {
          const res = await api.post("/CatalogodeProductos/getSecuenciaArticulo", { artprodven: formData.artprodven })

          // Extracción rigurosa para evitar problemas con interceptores de Axios
          let newCodigo = ""
          if (res?.data?.data !== undefined) {
            newCodigo = res.data.data
          } else if (res?.data !== undefined) {
            newCodigo = res.data
          } else {
            newCodigo = res
          }

          // Si por alguna razón sigue siendo un objeto, intentar forzar la llave 'data' o 'secnumero'
          if (typeof newCodigo === "object" && newCodigo !== null) {
            newCodigo = newCodigo.data || newCodigo.secnumero || ""
          }

          setFormData((prev) => ({ ...prev, artcodigo: String(newCodigo) }))
        } catch (error) {
          console.error("Error obteniendo secuencia:", error)
        }
      }
      fetchSecuencia()
    }
  }, [codartsec, formData.artprodven])

  const { mutateAsync: SaveCreacionProducto, isPending } = useMutation({
    queryKey: ["isCreatingProducto"],
    fn: async (payload) => {
      const response = await api.post("/CatalogodeProductos/createCatalogodeProductos", payload)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    if (field === "artwebsite") {
      setFormData((prev) => ({ ...prev, [field]: value }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: typeof value === "string" ? value.toUpperCase() : value }))
    }
  }

  const handleCheckboxChange = (field, checked) => setFormData((prev) => ({ ...prev, [field]: checked }))

  const handleFormatPrice = (field, value) => {
    const floatValue = parseFloat(value)
    if (!isNaN(floatValue)) {
      setFormData((prev) => ({ ...prev, [field]: floatValue.toFixed(numeroDecimales) }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleGuardar = async () => {
    if (!formData.invcodigo) return showWarning("Debe seleccionar un Inventario.")
    if (codartsec === 0 && !formData.artcodigo.trim()) return showWarning("El Código del Artículo es obligatorio.")
    if (!formData.artdescri.trim()) return showWarning("La Descripción del Artículo es obligatoria.")
    if (!formData.lincodigo) return showWarning("Debe seleccionar una Línea.")

    const payload = {
      ...formData,
      artprodven: formData.artprodven ? 1 : 0,
      artapliiva: formData.artapliiva ? 1 : 0,
      artretiene: formData.artretiene ? 1 : 0,
      artnocompra: formData.artnocompra ? 1 : 0,
      artfaccero: formData.artfaccero ? 1 : 0,
      artservicio: formData.artservicio ? 1 : 0,
      artexplosion: formData.artexplosion ? 1 : 0,
      artmodpvp: formData.artmodpvp ? 1 : 0,
      artdecimales: formData.artdecimales ? 1 : 0,
      artfacsinstock: formData.artfacsinstock ? 1 : 0,
      artsincosto: formData.artsincosto ? 1 : 0,
      artapligarantia: formData.artapligarantia ? 1 : 0,
      artnoimprimeseries: formData.artnoimprimeseries ? 1 : 0,
      artnogeneraseries: formData.artnogeneraseries ? 1 : 0,
      artserie: formData.artserie ? 1 : 0,
      artseriedesp: formData.artseriedesp ? 1 : 0,
      artlote: formData.artlote ? 1 : 0,
      artconfirmaingreso: formData.artconfirmaingreso ? 1 : 0,

      artprecventa1: parseFloat(formData.artprecventa1) || 0,
      artprecventa2: parseFloat(formData.artprecventa2) || 0,
      artprecventa3: parseFloat(formData.artprecventa3) || 0,
      artprecventa4: parseFloat(formData.artprecventa4) || 0,
      artprecventa5: parseFloat(formData.artprecventa5) || 0,
      artprecventa6: parseFloat(formData.artprecventa6) || 0,
      parporcentaje: parseFloat(formData.parporcentaje) || 0,

      proveedores: proveedoresProd.filter((p) => p.provcodigo),
      barras: Array.isArray(barrasProd) ? barrasProd.filter((b) => b.codigobarra) : [],
      sustitutos: sustitutos.filter((s) => s.artsustituto),
      principios: principiosProd.filter((p) => p.pricodigo),
      imagenes: imagenes.map((img) => img.base64),
      documentos_pdf: documentos.map((doc) => doc.base64),
    }
    await SaveCreacionProducto(payload)
  }

  const processFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const base64 = await processFileToBase64(file)
      if (type === "image") {
        setImagenes((prev) => [...prev, { id: Date.now(), base64 }])
      } else if (type === "pdf") {
        setDocumentos((prev) => [...prev, { id: Date.now(), base64, nombre: file.name }])
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo procesar el archivo.", "error")
    }
  }

  const deleteFile = (id, type) => {
    if (type === "image") setImagenes(imagenes.filter((img) => img.id !== id))
    if (type === "pdf") setDocumentos(documentos.filter((doc) => doc.id !== id))
  }

  const grabarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "GRABAR")

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <CustomBackdrop isLoading={isPending} />

      <ModalBuscadorLinea
        open={openModalLinea}
        onClose={() => setOpenModalLinea(false)}
        onSelect={(linea) => {
          setFormData({ ...formData, lincodigo: linea.lincodigo, lindescri: linea.lindescri })
          setOpenModalLinea(false)
        }}
      />

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
              Crear Nuevo Producto
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            startIcon={
              grabarAction ? getIconComponent(grabarAction.accnameicono, grabarAction.acctipoico) : <SaveIcon />
            }
            onClick={handleGuardar}
            sx={{ fontWeight: "bold", px: 4, py: 1 }}
          >
            {grabarAction ? grabarAction.acccaption : "GRABAR PRODUCTO"}
          </Button>
        </Box>

        <StyledRoot>
          {/* ======================= PESTAÑA 1: IDENTIFICACIÓN Y CLASIFICACIÓN ======================= */}
          <Accordion defaultExpanded elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#e1f5fe" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.dark">
                1. Identificación y Clasificación
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} pt={1}>
                {/* FILA 1 */}
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    options={listInventarios}
                    getOptionLabel={(option) => option.label || ""}
                    value={listInventarios.find((c) => c.invcodigo === formData.invcodigo) || null}
                    onChange={(e, nv) => handleInputChange("invcodigo", nv ? nv.invcodigo : "")}
                    isOptionEqualToValue={(option, value) => option.invcodigo === value?.invcodigo}
                    renderInput={(params) => <TextField {...params} label="Inventario *" size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label={codartsec !== 0 ? "Código Artículo (Generado Automáticamente)" : "Código Artículo *"}
                    value={formData.artcodigo}
                    onChange={(e) => handleInputChange("artcodigo", e.target.value)}
                    size="small"
                    InputProps={{
                      readOnly: codartsec !== 0,
                      style: { backgroundColor: codartsec !== 0 ? "#f5f5f5" : "transparent" },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Estado *"
                    value={formData.artstatus}
                    onChange={(e) => handleInputChange("artstatus", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="A">ACTIVO</MenuItem>
                    <MenuItem value="P">POTENCIAL</MenuItem>
                    <MenuItem value="I">INACTIVO</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Número de Parte / Entrada"
                    value={formData.artnumparte}
                    onChange={(e) => handleInputChange("artnumparte", e.target.value)}
                    size="small"
                  />
                </Grid>

                {/* FILA 2: DESCRIPCIÓN Y ALIAS */}
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Descripción del Producto *"
                    value={formData.artdescri}
                    onChange={(e) => handleInputChange("artdescri", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Alias (Nombre Corto / Comercial)"
                    value={formData.artalias}
                    onChange={(e) => handleInputChange("artalias", e.target.value)}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* FILA 3: CLASIFICACIÓN */}
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Línea *"
                    value={formData.lincodigo ? `${formData.lincodigo} - ${formData.lindescri}` : ""}
                    size="small"
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setOpenModalLinea(true)} edge="end" color="primary">
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    onClick={() => setOpenModalLinea(true)}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    options={listMarcas}
                    getOptionLabel={(option) => option.label || ""}
                    value={listMarcas.find((c) => c.marcodigo === formData.marcodigo) || null}
                    onChange={(e, nv) => handleInputChange("marcodigo", nv ? nv.marcodigo : "")}
                    isOptionEqualToValue={(option, value) => option.marcodigo === value?.marcodigo}
                    renderInput={(params) => <TextField {...params} label="Marca *" size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    options={listMedidas}
                    getOptionLabel={(option) => option.label || ""}
                    value={listMedidas.find((c) => c.medcodigo === formData.medcodigo) || null}
                    onChange={(e, nv) => handleInputChange("medcodigo", nv ? nv.medcodigo : "")}
                    isOptionEqualToValue={(option, value) => option.medcodigo === value?.medcodigo}
                    renderInput={(params) => <TextField {...params} label="Medida/Clase *" size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    options={listPresentaciones}
                    getOptionLabel={(option) => option.label || ""}
                    value={listPresentaciones.find((c) => c.precodigo === formData.precodigo) || null}
                    onChange={(e, nv) => handleInputChange("precodigo", nv ? nv.precodigo : "")}
                    isOptionEqualToValue={(option, value) => option.precodigo === value?.precodigo}
                    renderInput={(params) => <TextField {...params} label="Presentación/Modelo *" size="small" />}
                  />
                </Grid>

                {/* FILA 4: EXTRAS Y ETIQUETA */}
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={listJefes}
                    getOptionLabel={(option) => option.label || ""}
                    value={listJefes.find((c) => c.jefecodigo === formData.jefecodigo) || null}
                    onChange={(e, nv) => handleInputChange("jefecodigo", nv ? nv.jefecodigo : "")}
                    isOptionEqualToValue={(option, value) => option.jefecodigo === value?.jefecodigo}
                    renderInput={(params) => <TextField {...params} label="Jefe de Producto" size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={listPaises}
                    getOptionLabel={(option) => option.label || ""}
                    value={listPaises.find((c) => c.paiscodigo === formData.paiscodigo) || null}
                    onChange={(e, nv) => handleInputChange("paiscodigo", nv ? nv.paiscodigo : "")}
                    isOptionEqualToValue={(option, value) => option.paiscodigo === value?.paiscodigo}
                    renderInput={(params) => <TextField {...params} label="País de Origen" size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de Etiqueta"
                    value={formData.artetiqueta}
                    onChange={(e) => handleInputChange("artetiqueta", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="S">ESTÁNDAR (SÍ)</MenuItem>
                    <MenuItem value="N">SIN ETIQUETA (NO)</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* SSFRAME: OTROS DATOS */}
                <Grid item xs={12} md={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Otros Datos
                    </legend>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Registro Sanitario"
                          value={formData.artregissani}
                          onChange={(e) => handleInputChange("artregissani", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Concentración"
                          value={formData.artconcentra}
                          onChange={(e) => handleInputChange("artconcentra", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Volumen presentación (cm3)"
                          value={formData.artvolumen}
                          onChange={(e) => handleInputChange("artvolumen", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Peso GM2/oz"
                          value={formData.artpesogm2}
                          onChange={(e) => handleInputChange("artpesogm2", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Ancho CMS"
                          value={formData.artancho}
                          onChange={(e) => handleInputChange("artancho", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Cantidad Recipiente"
                          value={formData.artcantrecip}
                          onChange={(e) => handleInputChange("artcantrecip", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Cantidad Bulto"
                          value={formData.artcantbulto}
                          onChange={(e) => handleInputChange("artcantbulto", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Web Site"
                          value={formData.artwebsite}
                          onChange={(e) => handleInputChange("artwebsite", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Comentario (se visualiza al Proformar)"
                          value={formData.artcomentario}
                          onChange={(e) => handleInputChange("artcomentario", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Observación"
                          value={formData.artobservacion}
                          onChange={(e) => handleInputChange("artobservacion", e.target.value)}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>

                {/* SSFRAME: LISTAS DE PRECIOS */}
                <Grid item xs={12} md={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Listas de Precios de Venta
                    </legend>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          type="number"
                          inputProps={{ step: "any" }}
                          label="Precio Lista 1"
                          value={formData.artprecventa1}
                          onChange={(e) => setFormData((prev) => ({ ...prev, artprecventa1: e.target.value }))}
                          onBlur={(e) => handleFormatPrice("artprecventa1", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          type="number"
                          inputProps={{ step: "any" }}
                          label="Precio Lista 2"
                          value={formData.artprecventa2}
                          onChange={(e) => setFormData((prev) => ({ ...prev, artprecventa2: e.target.value }))}
                          onBlur={(e) => handleFormatPrice("artprecventa2", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          type="number"
                          inputProps={{ step: "any" }}
                          label="Precio Lista 3"
                          value={formData.artprecventa3}
                          onChange={(e) => setFormData((prev) => ({ ...prev, artprecventa3: e.target.value }))}
                          onBlur={(e) => handleFormatPrice("artprecventa3", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          type="number"
                          inputProps={{ step: "any" }}
                          label="Precio Lista 4"
                          value={formData.artprecventa4}
                          onChange={(e) => setFormData((prev) => ({ ...prev, artprecventa4: e.target.value }))}
                          onBlur={(e) => handleFormatPrice("artprecventa4", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          type="number"
                          inputProps={{ step: "any" }}
                          label="Precio Lista 5"
                          value={formData.artprecventa5}
                          onChange={(e) => setFormData((prev) => ({ ...prev, artprecventa5: e.target.value }))}
                          onBlur={(e) => handleFormatPrice("artprecventa5", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          type="number"
                          inputProps={{ step: "any" }}
                          label="Precio Lista 6"
                          value={formData.artprecventa6}
                          onChange={(e) => setFormData((prev) => ({ ...prev, artprecventa6: e.target.value }))}
                          onBlur={(e) => handleFormatPrice("artprecventa6", e.target.value)}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 2: PARÁMETROS ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                2. Parámetros Físicos y Control
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* 1. SSFRAME PARÁMETROS GENERALES */}
                <Grid item xs={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Parámetros Generales
                    </legend>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artprodven}
                              onChange={(e) => handleCheckboxChange("artprodven", e.target.checked)}
                            />
                          }
                          label="Para Venta"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artapliiva}
                              onChange={(e) => handleCheckboxChange("artapliiva", e.target.checked)}
                            />
                          }
                          label="Aplica I.V.A."
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artretiene}
                              onChange={(e) => handleCheckboxChange("artretiene", e.target.checked)}
                            />
                          }
                          label="Retiene"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artnocompra}
                              onChange={(e) => handleCheckboxChange("artnocompra", e.target.checked)}
                            />
                          }
                          label="No Compra"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artfaccero}
                              onChange={(e) => handleCheckboxChange("artfaccero", e.target.checked)}
                            />
                          }
                          label="Permite facturar con Valor Cero"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artservicio}
                              onChange={(e) => handleCheckboxChange("artservicio", e.target.checked)}
                            />
                          }
                          label="Servicio"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artexplosion}
                              onChange={(e) => handleCheckboxChange("artexplosion", e.target.checked)}
                            />
                          }
                          label="Explosión de Insumos"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artmodpvp}
                              onChange={(e) => handleCheckboxChange("artmodpvp", e.target.checked)}
                            />
                          }
                          label="Modifica P.V.P."
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artdecimales}
                              onChange={(e) => handleCheckboxChange("artdecimales", e.target.checked)}
                            />
                          }
                          label="Cantidad permite decimales"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artfacsinstock}
                              onChange={(e) => handleCheckboxChange("artfacsinstock", e.target.checked)}
                            />
                          }
                          label="Factura sin Stock"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artsincosto}
                              onChange={(e) => handleCheckboxChange("artsincosto", e.target.checked)}
                            />
                          }
                          label="Sin Costo (Consumo Interno)"
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>

                {/* 2. SSFRAME PARÁMETROS DE CONTROL */}
                <Grid item xs={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Parámetros de Control
                    </legend>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4} md={2}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Cantidad Mínima"
                          value={formData.artminimo}
                          onChange={(e) => handleInputChange("artminimo", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={2}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Cantidad Máxima"
                          value={formData.artmaximo}
                          onChange={(e) => handleInputChange("artmaximo", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={2}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Días Reposición"
                          value={formData.artdiasrep}
                          onChange={(e) => handleInputChange("artdiasrep", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={2}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Días de Seguridad"
                          value={formData.artdiaseg}
                          onChange={(e) => handleInputChange("artdiaseg", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Frecuencia de Llegada (Días)"
                          value={formData.artfrecllegada}
                          onChange={(e) => handleInputChange("artfrecllegada", e.target.value)}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>

                {/* 3. SSFRAME GARANTÍAS */}
                <Grid item xs={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Garantías
                    </legend>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Periodo de Garantía (Meses)"
                          value={formData.artpergarantia}
                          onChange={(e) => handleInputChange("artpergarantia", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={8} md={9}>
                        <Grid container spacing={1}>
                          <Grid item xs={12} md={4}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formData.artapligarantia}
                                  onChange={(e) => handleCheckboxChange("artapligarantia", e.target.checked)}
                                />
                              }
                              label="Aplica Garantía"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formData.artnoimprimeseries}
                                  onChange={(e) => handleCheckboxChange("artnoimprimeseries", e.target.checked)}
                                />
                              }
                              label="NO Imprime Series en Certificado"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formData.artnogeneraseries}
                                  onChange={(e) => handleCheckboxChange("artnogeneraseries", e.target.checked)}
                                />
                              }
                              label="NO Genera Series Automáticas"
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>

                {/* 4. SSFRAME SERIES / LOTES */}
                <Grid item xs={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Series / Lotes
                    </legend>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artserie}
                              onChange={(e) => handleCheckboxChange("artserie", e.target.checked)}
                            />
                          }
                          label="Series"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artseriedesp}
                              onChange={(e) => handleCheckboxChange("artseriedesp", e.target.checked)}
                            />
                          }
                          label="Series Despacho"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artlote}
                              onChange={(e) => handleCheckboxChange("artlote", e.target.checked)}
                            />
                          }
                          label="Lote"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.artconfirmaingreso}
                              onChange={(e) => handleCheckboxChange("artconfirmaingreso", e.target.checked)}
                            />
                          }
                          label="Confirmación de Ingreso (Firma Químico)"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          select
                          fullWidth
                          label="Tipo de Serie"
                          value={formData.arttiposerie}
                          onChange={(e) => handleInputChange("arttiposerie", e.target.value)}
                          size="small"
                        >
                          <MenuItem value="">
                            <em>NINGUNO</em>
                          </MenuItem>
                          <MenuItem value="E">ELECTRODOMESTICOS</MenuItem>
                          <MenuItem value="O">OTROS</MenuItem>
                          <MenuItem value="C">GIFT CARD</MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 3: IMÁGENES ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                3. Imágenes
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} display="flex" gap={2}>
                  <Button variant="contained" component="label" startIcon={<CloudUploadIcon />} color="primary">
                    Subir de Galería
                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, "image")} />
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CameraAltIcon />}
                    color="primary"
                    onClick={() => setIsCameraOpen(true)}
                  >
                    Tomar Foto
                  </Button>
                </Grid>
                <Grid item xs={12} container spacing={2} mt={1}>
                  {imagenes.map((img, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={img.id}>
                      <Paper elevation={3} sx={{ p: 1, position: "relative", cursor: "zoom-in" }}>
                        <img
                          src={img.base64}
                          alt={`Preview ${index}`}
                          style={{ width: "100%", height: "200px", objectFit: "contain" }}
                          onClick={() => setImagenAmpliada(img.base64)}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          sx={{ position: "absolute", top: 5, right: 5, bgcolor: "rgba(255,255,255,0.7)" }}
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteFile(img.id, "image")
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                  {imagenes.length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" align="center">
                        No hay imágenes adjuntas. Las imágenes se guardarán junto con el producto.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {/* Visor Modal de Imágenes */}
              <Dialog open={!!imagenAmpliada} onClose={() => setImagenAmpliada(null)} maxWidth="xl">
                <Box p={2} position="relative" bgcolor="#000">
                  <IconButton
                    onClick={() => setImagenAmpliada(null)}
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      bgcolor: "rgba(255,255,255,0.3)",
                      color: "#fff",
                      zIndex: 10,
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                  <img
                    src={imagenAmpliada}
                    alt="Zoom Preview"
                    style={{ width: "100%", maxHeight: "85vh", objectFit: "contain" }}
                  />
                </Box>
              </Dialog>

              {/* Dialog para la cámara */}
              <Dialog open={isCameraOpen} onClose={() => setIsCameraOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, backgroundColor: "#f5f7fa" }}>Capturar Nueva Imagen</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  <WebcamSelector webcamRef={webcamRef} />
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                  <Button onClick={() => setIsCameraOpen(false)} variant="outlined">
                    Cancelar
                  </Button>
                  <Button onClick={handleCapture} variant="contained" color="primary">
                    Capturar Imagen
                  </Button>
                </DialogActions>
              </Dialog>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 4: DOCUMENTOS ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                4. Documentos (PDF)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button variant="contained" component="label" startIcon={<PdfIcon />} color="primary">
                    Adjuntar PDF
                    <input type="file" hidden accept="application/pdf" onChange={(e) => handleFileChange(e, "pdf")} />
                  </Button>
                </Grid>
                <Grid item xs={12} container spacing={2} mt={1}>
                  {documentos.map((doc) => (
                    <Grid item xs={12} md={6} lg={4} key={doc.id}>
                      <Paper
                        elevation={2}
                        sx={{ p: 2, position: "relative", display: "flex", flexDirection: "column" }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Box display="flex" alignItems="center">
                            <PdfIcon color="error" sx={{ mr: 1 }} />
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {doc.nombre}
                            </Typography>
                          </Box>
                          <IconButton size="small" color="error" onClick={() => deleteFile(doc.id, "pdf")}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        <iframe
                          src={doc.base64}
                          width="100%"
                          height="300px"
                          title={`PDF Preview ${doc.id}`}
                          style={{ border: "1px solid #eee", borderRadius: "4px" }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 5: CÓDIGO PROVEEDOR Y BARRAS ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                5. Código Proveedor y Barras
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* SSFRAME: CÓDIGO DE PROVEEDOR */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Código de Proveedor
                    </legend>
                    <Box sx={{ height: 300, mt: 1 }}>
                      <DataGrid
                        rows={proveedoresProd}
                        editMode="row"
                        rowModesModel={rowModesProv}
                        onRowModesModelChange={setRowModesProv}
                        processRowUpdate={(newRow) => {
                          const updatedRow = { ...newRow, isNew: false }
                          setProveedoresProd(proveedoresProd.map((r) => (r.id === newRow.id ? updatedRow : r)))
                          return updatedRow
                        }}
                        slots={{
                          toolbar: () => (
                            <GridToolbarContainer>
                              <Button
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                  const id = Date.now()
                                  setProveedoresProd((old) => [
                                    ...old,
                                    { id, provcodigo: "", codigoprov: "", isNew: true },
                                  ])
                                  setRowModesProv((old) => ({
                                    ...old,
                                    [id]: { mode: GridRowModes.Edit, fieldToFocus: "provcodigo" },
                                  }))
                                }}
                              >
                                Añadir Proveedor
                              </Button>
                            </GridToolbarContainer>
                          ),
                        }}
                        columns={[
                          {
                            field: "provcodigo",
                            headerName: "Proveedor",
                            width: 300,
                            editable: true,
                            type: "singleSelect",
                            valueOptions: listProveedores.map((p) => ({
                              value: p.provcodigo || p.id || p.value,
                              label: p.label || p.provdescri,
                            })),
                          },
                          { field: "codigoprov", headerName: "Código del Producto", width: 220, editable: true },
                          {
                            field: "actions",
                            type: "actions",
                            headerName: "Acc.",
                            width: 100,
                            getActions: ({ id }) => {
                              const isInEditMode = rowModesProv[id]?.mode === GridRowModes.Edit
                              if (isInEditMode) {
                                return [
                                  <GridActionsCellItem
                                    icon={<SaveIcon />}
                                    label="Guardar"
                                    onClick={() =>
                                      setRowModesProv({ ...rowModesProv, [id]: { mode: GridRowModes.View } })
                                    }
                                  />,
                                  <GridActionsCellItem
                                    icon={<CancelIcon />}
                                    label="Cancelar"
                                    onClick={() =>
                                      setRowModesProv({
                                        ...rowModesProv,
                                        [id]: { mode: GridRowModes.View, ignoreModifications: true },
                                      })
                                    }
                                  />,
                                ]
                              }
                              return [
                                <GridActionsCellItem
                                  icon={<EditIcon />}
                                  label="Editar"
                                  onClick={() =>
                                    setRowModesProv({ ...rowModesProv, [id]: { mode: GridRowModes.Edit } })
                                  }
                                />,
                                <GridActionsCellItem
                                  icon={<DeleteIcon />}
                                  label="Eliminar"
                                  onClick={() => setProveedoresProd(proveedoresProd.filter((row) => row.id !== id))}
                                />,
                              ]
                            },
                          },
                        ]}
                      />
                    </Box>
                  </fieldset>
                </Grid>

                {/* SSFRAME: CÓDIGO DE BARRAS */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Códigos de Barras Relacionados
                    </legend>
                    <Box sx={{ height: 300, mt: 1 }}>
                      <DataGrid
                        rows={Array.isArray(barrasProd) ? barrasProd : []}
                        editMode="row"
                        rowModesModel={rowModesBarras}
                        onRowModesModelChange={setRowModesBarras}
                        processRowUpdate={(newRow) => {
                          const updatedRow = { ...newRow, isNew: false }
                          setBarrasProd(barrasProd.map((r) => (r.id === newRow.id ? updatedRow : r)))
                          return updatedRow
                        }}
                        slots={{
                          toolbar: () => (
                            <GridToolbarContainer>
                              <Button
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                  const id = Date.now()
                                  setBarrasProd((old) => [
                                    ...(Array.isArray(old) ? old : []),
                                    { id, codigobarra: "", isNew: true },
                                  ])
                                  setRowModesBarras((old) => ({
                                    ...old,
                                    [id]: { mode: GridRowModes.Edit, fieldToFocus: "codigobarra" },
                                  }))
                                }}
                              >
                                Añadir Cód. de Barras
                              </Button>
                            </GridToolbarContainer>
                          ),
                        }}
                        columns={[
                          { field: "codigobarra", headerName: "Código de Barras", width: 400, editable: true },
                          {
                            field: "actions",
                            type: "actions",
                            headerName: "Acc.",
                            width: 100,
                            getActions: ({ id }) => {
                              const isInEditMode = rowModesBarras[id]?.mode === GridRowModes.Edit
                              if (isInEditMode) {
                                return [
                                  <GridActionsCellItem
                                    icon={<SaveIcon />}
                                    label="Guardar"
                                    onClick={() =>
                                      setRowModesBarras({ ...rowModesBarras, [id]: { mode: GridRowModes.View } })
                                    }
                                  />,
                                  <GridActionsCellItem
                                    icon={<CancelIcon />}
                                    label="Cancelar"
                                    onClick={() =>
                                      setRowModesBarras({
                                        ...rowModesBarras,
                                        [id]: { mode: GridRowModes.View, ignoreModifications: true },
                                      })
                                    }
                                  />,
                                ]
                              }
                              return [
                                <GridActionsCellItem
                                  icon={<EditIcon />}
                                  label="Editar"
                                  onClick={() =>
                                    setRowModesBarras({ ...rowModesBarras, [id]: { mode: GridRowModes.Edit } })
                                  }
                                />,
                                <GridActionsCellItem
                                  icon={<DeleteIcon />}
                                  label="Eliminar"
                                  onClick={() => setBarrasProd(barrasProd.filter((row) => row.id !== id))}
                                />,
                              ]
                            },
                          },
                        ]}
                      />
                    </Box>
                  </fieldset>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 6: PRODUCTOS SUSTITUTOS Y PRINCIPIO ACTIVO ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                6. Productos Sustitutos y Principio Activo
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* SSFRAME: PRODUCTO SUSTITUTO */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Producto Sustituto
                    </legend>
                    <Box sx={{ height: 300, mt: 1 }}>
                      <DataGrid
                        rows={sustitutos}
                        editMode="row"
                        rowModesModel={rowModesSust}
                        onRowModesModelChange={setRowModesSust}
                        processRowUpdate={(newRow) => {
                          const updatedRow = { ...newRow, isNew: false }
                          setSustitutos(sustitutos.map((r) => (r.id === newRow.id ? updatedRow : r)))
                          return updatedRow
                        }}
                        slots={{
                          toolbar: () => (
                            <GridToolbarContainer>
                              <Button
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                  const id = Date.now()
                                  setSustitutos((old) => [...old, { id, artsustituto: "", isNew: true }])
                                  setRowModesSust((old) => ({
                                    ...old,
                                    [id]: { mode: GridRowModes.Edit, fieldToFocus: "artsustituto" },
                                  }))
                                }}
                              >
                                Añadir Sustituto
                              </Button>
                            </GridToolbarContainer>
                          ),
                        }}
                        columns={[
                          {
                            field: "artsustituto",
                            headerName: "Producto Sustituto",
                            width: 350,
                            editable: true,
                            type: "singleSelect",
                            valueOptions: listArticulos.map((a) => ({
                              value: a.artcodigo || a.id || a.value,
                              label: a.label || a.artdescri,
                            })),
                          },
                          {
                            field: "actions",
                            type: "actions",
                            headerName: "Acc.",
                            width: 100,
                            getActions: ({ id }) => {
                              const isInEditMode = rowModesSust[id]?.mode === GridRowModes.Edit
                              if (isInEditMode) {
                                return [
                                  <GridActionsCellItem
                                    icon={<SaveIcon />}
                                    label="Guardar"
                                    onClick={() =>
                                      setRowModesSust({ ...rowModesSust, [id]: { mode: GridRowModes.View } })
                                    }
                                  />,
                                  <GridActionsCellItem
                                    icon={<CancelIcon />}
                                    label="Cancelar"
                                    onClick={() =>
                                      setRowModesSust({
                                        ...rowModesSust,
                                        [id]: { mode: GridRowModes.View, ignoreModifications: true },
                                      })
                                    }
                                  />,
                                ]
                              }
                              return [
                                <GridActionsCellItem
                                  icon={<EditIcon />}
                                  label="Editar"
                                  onClick={() =>
                                    setRowModesSust({ ...rowModesSust, [id]: { mode: GridRowModes.Edit } })
                                  }
                                />,
                                <GridActionsCellItem
                                  icon={<DeleteIcon />}
                                  label="Eliminar"
                                  onClick={() => setSustitutos(sustitutos.filter((row) => row.id !== id))}
                                />,
                              ]
                            },
                          },
                        ]}
                      />
                    </Box>
                  </fieldset>
                </Grid>

                {/* SSFRAME: PRINCIPIO ACTIVO */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Principio Activo
                    </legend>
                    <Box sx={{ height: 300, mt: 1 }}>
                      <DataGrid
                        rows={principiosProd}
                        editMode="row"
                        rowModesModel={rowModesPrin}
                        onRowModesModelChange={setRowModesPrin}
                        processRowUpdate={(newRow) => {
                          if (newRow.priprimario) {
                            setPrincipiosProd(
                              principiosProd.map((p) =>
                                p.id === newRow.id ? { ...newRow, isNew: false } : { ...p, priprimario: false },
                              ),
                            )
                            return { ...newRow, isNew: false }
                          }
                          const updatedRow = { ...newRow, isNew: false }
                          setPrincipiosProd(principiosProd.map((r) => (r.id === newRow.id ? updatedRow : r)))
                          return updatedRow
                        }}
                        slots={{
                          toolbar: () => (
                            <GridToolbarContainer>
                              <Button
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                  const id = Date.now()
                                  setPrincipiosProd((old) => [
                                    ...old,
                                    { id, pricodigo: "", priprimario: false, isNew: true },
                                  ])
                                  setRowModesPrin((old) => ({
                                    ...old,
                                    [id]: { mode: GridRowModes.Edit, fieldToFocus: "pricodigo" },
                                  }))
                                }}
                              >
                                Añadir Princ. Activo
                              </Button>
                            </GridToolbarContainer>
                          ),
                        }}
                        columns={[
                          {
                            field: "pricodigo",
                            headerName: "Principio Activo",
                            width: 250,
                            editable: true,
                            type: "singleSelect",
                            valueOptions: listPrincipios.map((p) => ({
                              value: p.pricodigo || p.id || p.value,
                              label: p.label || p.pridescri,
                            })),
                          },
                          {
                            field: "priprimario",
                            headerName: "Primario",
                            width: 100,
                            editable: true,
                            type: "boolean",
                          },
                          {
                            field: "actions",
                            type: "actions",
                            headerName: "Acc.",
                            width: 100,
                            getActions: ({ id }) => {
                              const isInEditMode = rowModesPrin[id]?.mode === GridRowModes.Edit
                              if (isInEditMode) {
                                return [
                                  <GridActionsCellItem
                                    icon={<SaveIcon />}
                                    label="Guardar"
                                    onClick={() =>
                                      setRowModesPrin({ ...rowModesPrin, [id]: { mode: GridRowModes.View } })
                                    }
                                  />,
                                  <GridActionsCellItem
                                    icon={<CancelIcon />}
                                    label="Cancelar"
                                    onClick={() =>
                                      setRowModesPrin({
                                        ...rowModesPrin,
                                        [id]: { mode: GridRowModes.View, ignoreModifications: true },
                                      })
                                    }
                                  />,
                                ]
                              }
                              return [
                                <GridActionsCellItem
                                  icon={<EditIcon />}
                                  label="Editar"
                                  onClick={() =>
                                    setRowModesPrin({ ...rowModesPrin, [id]: { mode: GridRowModes.Edit } })
                                  }
                                />,
                                <GridActionsCellItem
                                  icon={<DeleteIcon />}
                                  label="Eliminar"
                                  onClick={() => setPrincipiosProd(principiosProd.filter((row) => row.id !== id))}
                                />,
                              ]
                            },
                          },
                        ]}
                      />
                    </Box>
                  </fieldset>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 7: PARTIDA ARANCELARIA Y CÓDIGO INEN ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                7. Partida Arancelaria y Codigo INEN
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* SSFRAME: PARTIDA ARANCELARIA */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Partida Arancelaria
                    </legend>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Código"
                          value={formData.parcodigo}
                          onChange={(e) => handleInputChange("parcodigo", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          label="Descripción"
                          value={formData.pardescri}
                          onChange={(e) => handleInputChange("pardescri", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          type="number"
                          inputProps={{ step: "any" }}
                          label="Porcentaje (%)"
                          value={formData.parporcentaje}
                          onChange={(e) => handleInputChange("parporcentaje", e.target.value)}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>

                {/* SSFRAME: INEN */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      INEN
                    </legend>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Código"
                          value={formData.inencodigo}
                          onChange={(e) => handleInputChange("inencodigo", e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          label="Descripción"
                          value={formData.inendescri}
                          onChange={(e) => handleInputChange("inendescri", e.target.value)}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </StyledRoot>
      </div>
    </ThemeProvider>
  )
}

export default CrearCatalogodeProductos
