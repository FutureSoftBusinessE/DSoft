/* eslint-disable camelcase */
import { useState, useContext } from "react"
import {
  Box,
  Paper,
  TextField,
  Tooltip,
  IconButton,
  Grid,
  MenuItem,
  Typography,
  Button,
  Divider,
  Tabs,
  Tab,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import Header from "../../layouts/Header"
import BackIcon from "../../components/BackIcon"
import CustomBackdrop from "../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../api"
import { useQuery } from "@tanstack/react-query"
import { GlobalContext } from "../../contexts/GlobalContext"
import getIconComponent from "../utils/getIconComponent"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import Save from "@mui/icons-material/Save"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn"
import DeleteIcon from "@mui/icons-material/Delete"
import CheckCircleIcon from "@mui/icons-material/CheckCircle" // NUEVO: Importación de icono de Check
import Swal from "sweetalert2"
import dayjs from "dayjs"

// Tema estándar de SIACDEV1.0
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

// ----------------------------------------------------------------------
// Componente Auxiliar para manejar el contenido de cada pestaña
// ----------------------------------------------------------------------
function TabPanel(props) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`perfil-tabpanel-${index}`}
      aria-labelledby={`perfil-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}
// ----------------------------------------------------------------------

const PerfilUsuarioDF = () => {
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado para controlar la Pestaña Activa (0, 1, 2, 3)
  const [currentTab, setCurrentTab] = useState(0)

  // Archivos binarios para las imágenes
  const [logoFile, setLogoFile] = useState(null)
  const [selloFile, setSelloFile] = useState(null)

  // Estado del formulario general
  const [formData, setFormData] = useState({
    ciatipomenu: 0,
    ciacolor: "#196C87",
    ciatipoletra: "Arial",
    ciatamanioletra: "12",
    cialogo_preview: null,
    ciaselloagua_preview: null,
    emailsmtp: "",
    emailmascara: "",
    emailsalida: "",
    emailtema: "",
    emailsubject: "",
    emailmensaje: "",
    locpathxml: "", // NUEVO: Agregamos el estado para el certificado activo
  })

  // =========================================================
  // ESTADOS EXCLUSIVOS PARA LA PESTAÑA DE FIRMA ELECTRÓNICA
  // =========================================================
  const [p12File, setP12File] = useState(null)
  const [passwordP12, setPasswordP12] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [docfecemi, setDocfecemi] = useState(null)
  const [docfecven, setDocfecven] = useState(null)
  const [isValidated, setIsValidated] = useState(false)

  // Cargar la configuración actual (Perfil)
  const { isLoading: isFetching, refetch: refetchPerfil } = useQuery({
    queryKey: ["getAllPerfilUsuarioDF"],
    queryFn: async () => {
      const response = await api.post("/PerfilUsuarioDF/getAllPerfilUsuarioDF")
      const data = response.data.data

      setFormData({
        ciatipomenu: data.ciatipomenu || 0,
        ciacolor: data.ciacolor || "#196C87",
        ciatipoletra: data.ciatipoletra || "Arial",
        ciatamanioletra: data.ciatamanioletra || "12",
        cialogo_preview: data.cialogo_base64 || null,
        ciaselloagua_preview: data.ciaselloagua_base64 || null,
        emailsmtp: data.emailsmtp || "",
        emailmascara: data.emailmascara || "",
        emailsalida: data.emailsalida || "",
        emailtema: data.emailtema || "",
        emailsubject: data.emailsubject || "",
        emailmensaje: data.emailmensaje || "",
        locpathxml: data.locpathxml || "", // NUEVO: Seteo de la firma activa
      })
      return data
    },
    refetchOnWindowFocus: false,
  })

  // =========================================================
  // QUERIES Y MUTACIONES PARA FIRMA ELECTRÓNICA (INLINE)
  // =========================================================
  const {
    data: listaFirmas = [],
    refetch: refetchFirmas,
    isFetching: isFetchingFirmas,
  } = useQuery({
    queryKey: ["documentosFirmaPerfil"],
    queryFn: async () => {
      const res = await api.get("/DocumentosAsociadosComponent/getDocumentosAsociados/PERFIL/FIRMA_ELEC")
      return res.data.data || []
    },
    refetchOnWindowFocus: false,
  })

  const { mutateAsync: uploadFirma, isPending: isUploadingFirma } = useMutation({
    mutationFn: async (payloadFormData) => {
      const response = await api.post("/DocumentosAsociadosComponent/guardarArchivoAdjunto", payloadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return response.data
    },
    onSuccess: () => {
      Swal.fire("Éxito", "Certificado cargado correctamente", "success")
      setP12File(null)
      setPasswordP12("")
      setDocfecemi(null)
      setDocfecven(null)
      setIsValidated(false)
      refetchFirmas()
    },
  })

  const { mutateAsync: setActiveFirma, isPending: isSettingActive } = useMutation({
    mutationFn: async (uuid) => {
      const response = await api.post("/PerfilUsuarioDF/setFirmaActivaDF", { documentouuid: uuid })
      return response.data
    },
    onSuccess: (res) => {
      Swal.fire("Activada", res.data || "Firma electrónica configurada correctamente.", "success")
      refetchPerfil() // NUEVO: Refresca el perfil para actualizar visualmente la firma activa en la tabla
    },
  })

  const { mutateAsync: deleteFirma, isPending: isDeletingFirma } = useMutation({
    mutationFn: async (uuid) => {
      // CORRECCIÓN DEL ERROR DE DESESTRUCTURACIÓN: Agregamos el 'return' y devolvemos res.data
      const response = await api.delete(`/DocumentosAsociadosComponent/deleteDocumento/${uuid}`)
      return response.data
    },
    onSuccess: () => {
      Swal.fire("Eliminado", "El certificado ha sido removido con éxito.", "success")
      refetchFirmas()
    },
  })

  // Mutación de guardado de perfil general
  const { mutateAsync: savePerfil, isPending: isSaving } = useMutation({
    queryKey: ["isUpdatingPerfilUsuario"],
    fn: async (payloadFormData) => {
      const response = await api.post("/PerfilUsuarioDF/updatePerfilUsuarioDF", payloadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => {
      setTimeout(() => window.location.reload(), 1500)
    },
  })

  // =========================================================
  // HANDLERS
  // =========================================================
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    if (type === "logo") {
      setLogoFile(file)
      setFormData((prev) => ({ ...prev, cialogo_preview: objectUrl }))
    } else {
      setSelloFile(file)
      setFormData((prev) => ({ ...prev, ciaselloagua_preview: objectUrl }))
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    // Bloqueamos el guardado del perfil si estamos en la pestaña de firmas
    if (currentTab === 3) return

    const data = new FormData()
    data.append("ciatipomenu", formData.ciatipomenu)
    data.append("ciacolor", formData.ciacolor)
    data.append("ciatipoletra", formData.ciatipoletra)
    data.append("ciatamanioletra", formData.ciatamanioletra)
    data.append("emailsmtp", formData.emailsmtp)
    data.append("emailmascara", formData.emailmascara)
    data.append("emailsalida", formData.emailsalida)
    data.append("emailtema", formData.emailtema)
    data.append("emailsubject", formData.emailsubject)
    data.append("emailmensaje", formData.emailmensaje)

    if (logoFile) data.append("cialogo", logoFile)
    if (selloFile) data.append("ciaselloagua", selloFile)

    try {
      await savePerfil(data)
    } catch (error) {
      console.error("Error al guardar el perfil:", error)
    }
  }

  // --- LÓGICA DE ARCHIVOS P12 ---
  const handleP12Change = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const name = file.name.toLowerCase()
    if (!name.endsWith(".p12") && !name.endsWith(".pfx")) {
      return showWarning("Solo se permiten archivos con extensión .p12 o .pfx")
    }
    setP12File(file)
    setIsValidated(false)
    setDocfecemi(null)
    setDocfecven(null)
  }

  const handleValidarCertificado = async () => {
    if (!p12File || !passwordP12) {
      return Swal.fire("Atención", "Seleccione un archivo y escriba la contraseña", "warning")
    }

    const formDataValidacion = new FormData()
    formDataValidacion.append("firma", p12File)
    formDataValidacion.append("password", passwordP12)

    try {
      Swal.fire({
        title: "Validando...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      const response = await api.post("/FirmarPDFDF/validarFirmaP12", formDataValidacion, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (response.data && response.data.success) {
        const { valido_desde: validoDesde, valido_hasta: validoHasta } = response.data.data

        const fechaEmiStr = validoDesde.split(" ")[0]
        const fechaVenStr = validoHasta.split(" ")[0]

        setDocfecemi(dayjs(fechaEmiStr))
        setDocfecven(dayjs(fechaVenStr))
        setIsValidated(true)

        Swal.fire("Éxito", "Certificado validado correctamente", "success")
      } else {
        setIsValidated(false)
        Swal.fire("Error", "No se pudo validar el certificado. Verifique la contraseña.", "error")
      }
    } catch (error) {
      setIsValidated(false)
      Swal.fire("Error", "No se pudo validar el certificado. Verifique la contraseña.", "error")
    }
  }

  const handleGuardarP12 = async () => {
    if (!p12File) return showWarning("Debe seleccionar un archivo .p12")
    if (!passwordP12) return showWarning("Debe ingresar la contraseña del certificado")
    if (!isValidated || !docfecemi || !docfecven) {
      return showWarning("Debe validar exitosamente el certificado antes de guardarlo.")
    }

    const data = new FormData()
    data.append("docqgenero", "PERFIL")
    data.append("docprocqgenero", "FIRMA_ELEC")
    data.append("docsecuen", "1")
    data.append("docnombre", p12File.name)
    data.append("docindex1", "CERTIFICADO P12")
    data.append("password_p12", passwordP12)
    data.append("docfecemi", docfecemi.format("YYYY-MM-DD"))
    data.append("docfecven", docfecven.format("YYYY-MM-DD"))
    data.append("file", p12File)

    try {
      await uploadFirma(data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue)
  }

  const grabarAction = selectedMenuInfo?.data?.barraAcciones?.find(
    (a) =>
      a?.acccaption === "GRABAR" ||
      a?.acccaption === "ACTUALIZAR" ||
      a?.acccaption === "EDITAR" ||
      a?.acccaption === "EJECUTAR",
  )
  const toolbarActions = grabarAction
    ? [
        {
          label: grabarAction.acccaption,
          key: grabarAction.acccaption,
          icon: getIconComponent(grabarAction.accnameicono, grabarAction.acctipoico),
        },
      ]
    : [{ label: "Grabar", key: "GRABAR", icon: <Save /> }]

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
                disabled={isSaving || isFetching || currentTab === 3}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, backgroundColor: "white" }}
              >
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 30px 20px 30px",
            fontSize: "25px",
          }}
        >
          <b>Perfil de Empresa y Configuración Global</b>
        </div>

        <CustomBackdrop isLoading={isSaving || isFetching || isUploadingFirma || isSettingActive || isDeletingFirma} />

        <Box sx={StyledRoot} component="form" onSubmit={handleSubmit}>
          {/* =========================================
              SISTEMA DE PESTAÑAS (TABS)
          ========================================= */}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: "white",
              borderRadius: "8px 8px 0 0",
              px: 2,
              pt: 1,
            }}
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="1. Logos e Imágenes" sx={{ fontWeight: "bold" }} />
              <Tab label="2. Ajustes Visuales" sx={{ fontWeight: "bold" }} />
              <Tab label="3. Parámetros de Correo" sx={{ fontWeight: "bold" }} />
              <Tab label="4. Firma Electrónica (.p12)" sx={{ fontWeight: "bold" }} />
            </Tabs>
          </Box>

          {/* =========================================
              PANEL 1: LOGOS E IMÁGENES
          ========================================= */}
          <TabPanel value={currentTab} index={0}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: "0 0 8px 8px", background: "white" }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Configuración de Logos
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6} textAlign="center">
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Logo Principal
                  </Typography>
                  <div
                    style={{
                      height: "150px",
                      border: "1px dashed #ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "15px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    {formData.cialogo_preview ? (
                      <img
                        src={formData.cialogo_preview}
                        alt="Logo"
                        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <Typography color="textSecondary">Sin Imagen</Typography>
                    )}
                  </div>
                  <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                    Actualizar Logo
                    <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, "logo")} />
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6} textAlign="center">
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Marca de Agua (Fondo del Home)
                  </Typography>
                  <div
                    style={{
                      height: "150px",
                      border: "1px dashed #ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "15px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    {formData.ciaselloagua_preview ? (
                      <img
                        src={formData.ciaselloagua_preview}
                        alt="Marca de Agua"
                        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <Typography color="textSecondary">Sin Imagen</Typography>
                    )}
                  </div>
                  <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                    Actualizar Marca de Agua
                    <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, "sello")} />
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* =========================================
              PANEL 2: AJUSTES VISUALES
          ========================================= */}
          <TabPanel value={currentTab} index={1}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: "0 0 8px 8px", background: "white" }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Ajustes Visuales del Portal
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label="Estilo del Menú"
                    value={formData.ciatipomenu}
                    onChange={(e) => handleInputChange("ciatipomenu", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value={0}>0 - Menú Estándar (Carpetas)</MenuItem>
                    <MenuItem value={1}>1 - Menú Tipo Árbol Desplegable</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="color"
                    label="Color Principal (Theme)"
                    value={formData.ciacolor}
                    onChange={(e) => handleInputChange("ciacolor", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& input": { cursor: "pointer", height: "56px", padding: "0 14px" } }}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de Letra Global"
                    value={formData.ciatipoletra}
                    onChange={(e) => handleInputChange("ciatipoletra", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="Arial">Arial</MenuItem>
                    <MenuItem value="Roboto">Roboto</MenuItem>
                    <MenuItem value="Tahoma">Tahoma</MenuItem>
                    <MenuItem value="Verdana">Verdana</MenuItem>
                    <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                    <MenuItem value="Inter">Inter</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label="Tamaño de Letra Base"
                    value={formData.ciatamanioletra}
                    onChange={(e) => handleInputChange("ciatamanioletra", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="10">10 px</MenuItem>
                    <MenuItem value="11">11 px</MenuItem>
                    <MenuItem value="12">12 px (Estándar)</MenuItem>
                    <MenuItem value="13">13 px</MenuItem>
                    <MenuItem value="14">14 px</MenuItem>
                    <MenuItem value="16">16 px</MenuItem>
                    <MenuItem value="18">18 px</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* =========================================
              PANEL 3: PARÁMETROS DE CORREO
          ========================================= */}
          <TabPanel value={currentTab} index={2}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: "0 0 8px 8px", background: "white" }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Parámetros de Envío de Correo del Sistema
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Servidor SMTP"
                    value={formData.emailsmtp}
                    onChange={(e) => handleInputChange("emailsmtp", e.target.value)}
                    placeholder="ej. smtp.gmail.com"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Puerto de Salida (Máscara)"
                    value={formData.emailmascara}
                    onChange={(e) => handleInputChange("emailmascara", e.target.value)}
                    placeholder="ej. 587 o 465"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Correo Remitente (Salida)"
                    value={formData.emailsalida}
                    onChange={(e) => handleInputChange("emailsalida", e.target.value)}
                    placeholder="ej. info@miempresa.com"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Clave de Correo (Tema)"
                    value={formData.emailtema}
                    onChange={(e) => handleInputChange("emailtema", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Asunto Predeterminado"
                    value={formData.emailsubject}
                    onChange={(e) => handleInputChange("emailsubject", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Cuerpo del Mensaje Predeterminado"
                    value={formData.emailmensaje}
                    onChange={(e) => handleInputChange("emailmensaje", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* =========================================
              PANEL 4: FIRMA ELECTRÓNICA
          ========================================= */}
          <TabPanel value={currentTab} index={3}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: "0 0 8px 8px", background: "white" }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Configuración y Repositorio de Firma Electrónica (.p12)
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* Formulario Inline de Carga P12 con Validación */}
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{ height: "56px", borderStyle: "dashed" }}
                  >
                    Seleccionar Archivo .p12
                    <input type="file" accept=".p12,.pfx" hidden onChange={handleP12Change} />
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      label="Contraseña del Certificado"
                      type={showPassword ? "text" : "password"}
                      value={passwordP12}
                      onChange={(e) => {
                        setPasswordP12(e.target.value)
                        setIsValidated(false) // Si edita la clave, se pierde la validación
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleValidarCertificado}
                      disabled={!p12File || !passwordP12 || isUploadingFirma}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      Validar Clave
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ height: "56px" }}
                    onClick={handleGuardarP12}
                    disabled={!isValidated || isUploadingFirma} // Solo habilitado si fue validado
                  >
                    Guardar
                  </Button>
                </Grid>

                {/* Feedback de validación y archivo seleccionado */}
                <Grid item xs={12}>
                  <Box display="flex" gap={2} mt={1}>
                    {p12File && (
                      <Chip
                        label={p12File.name}
                        onDelete={() => {
                          setP12File(null)
                          setIsValidated(false)
                        }}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {isValidated && docfecemi && docfecven && (
                      <>
                        <Chip label={`Emisión: ${docfecemi.format("DD/MM/YYYY")}`} color="success" variant="outlined" />
                        <Chip label={`Caduca: ${docfecven.format("DD/MM/YYYY")}`} color="warning" variant="outlined" />
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Grilla Inline de Documentos Asociados */}
              <Box mt={5}>
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: "bold", mb: 2 }}>
                  Certificados Registrados
                </Typography>

                {listaFirmas.length === 0 && !isFetchingFirmas ? (
                  <Typography variant="body2" color="textSecondary" align="center">
                    No existen certificados asociados a este perfil.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: "#f8f9fa" }}>
                        <TableRow>
                          <TableCell>
                            <b>Nombre Archivo</b>
                          </TableCell>
                          <TableCell>
                            <b>Ext.</b>
                          </TableCell>
                          <TableCell>
                            <b>Emisión</b>
                          </TableCell>
                          <TableCell>
                            <b>Caducidad</b>
                          </TableCell>
                          <TableCell>
                            <b>Fecha Registro</b>
                          </TableCell>
                          <TableCell align="center">
                            <b>Acciones</b>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {listaFirmas.map((doc) => {
                          // Lógica para determinar si esta fila corresponde al certificado activo
                          const isActiveSignature = doc.documentouuid === formData.locpathxml

                          return (
                            <TableRow key={doc.documentouuid} hover>
                              <TableCell>{doc.docnombre}</TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{ textTransform: "uppercase", fontWeight: "bold", fontSize: "0.8rem" }}
                                >
                                  {doc.docextension}
                                </Typography>
                              </TableCell>
                              <TableCell>{doc.docfecemi || "—"}</TableCell>
                              <TableCell>{doc.docfecven || "—"}</TableCell>
                              <TableCell>{doc.docfechorisys}</TableCell>
                              <TableCell align="center">
                                {/* LÓGICA DE ICONOS CONDICIONALES BASADA EN LA FIRMA ACTIVA */}
                                {isActiveSignature ? (
                                  <Tooltip title="Firma Activa por Defecto">
                                    <IconButton size="small" color="success" disableRipple sx={{ cursor: "default" }}>
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Usar para Firmar PDF (Activar)">
                                    <IconButton
                                      size="small"
                                      sx={{ color: "#ed6c02" }} // Naranja distintivo
                                      onClick={() => {
                                        Swal.fire({
                                          title: "¿Establecer como firma activa?",
                                          text: "Este certificado se utilizará por defecto para firmar sus documentos PDF.",
                                          icon: "question",
                                          showCancelButton: true,
                                          confirmButtonColor: "#196C87",
                                          confirmButtonText: "Sí, activar",
                                        }).then(async (r) => {
                                          if (r.isConfirmed) {
                                            setActiveFirma(doc.documentouuid)
                                          }
                                        })
                                      }}
                                    >
                                      <AssignmentTurnedInIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {/* Botón Eliminar (Deshabilitado si es el certificado activo por precaución) */}
                                <Tooltip
                                  title={isActiveSignature ? "No se puede eliminar la firma activa" : "Eliminar"}
                                >
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={isActiveSignature}
                                      onClick={() => {
                                        Swal.fire({
                                          title: "¿Eliminar certificado?",
                                          text: "Esta acción no se puede deshacer.",
                                          icon: "warning",
                                          showCancelButton: true,
                                          confirmButtonColor: "#d33",
                                          confirmButtonText: "Sí, eliminar",
                                        }).then((r) => {
                                          if (r.isConfirmed) deleteFirma(doc.documentouuid)
                                        })
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Paper>
          </TabPanel>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default PerfilUsuarioDF
