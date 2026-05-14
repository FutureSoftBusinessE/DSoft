import { useState, useContext } from "react"
// Agregamos Tabs y Tab de Material-UI para la seccionalización
import { Box, Paper, TextField, Tooltip, IconButton, Grid, MenuItem, Typography, Button, Divider, Tabs, Tab } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import Header from "../../layouts/Header"
import BackIcon from "../../components/BackIcon"
import CustomBackdrop from "../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../api"
import { useQuery } from "@tanstack/react-query"
import { GlobalContext } from "../../contexts/GlobalContext"
import getIconComponent from "../utils/getIconComponent"
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import Save from "@mui/icons-material/Save"

// Tema estándar de SIACDEV1.0
const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const StyledRoot = {
  width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "20px",
  backgroundColor: "#f5f7fa", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
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
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}
// ----------------------------------------------------------------------

const PerfilUsuarioDF = () => {
  const { selectedMenuInfo } = useContext(GlobalContext)
  
  // Estado para controlar la Pestaña Activa (0, 1, 2)
  const [currentTab, setCurrentTab] = useState(0)

  // Archivos binarios para las imágenes
  const [logoFile, setLogoFile] = useState(null)
  const [selloFile, setSelloFile] = useState(null)

  // Estado del formulario
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
    emailmensaje: ""
  })

  // Cargar la configuración actual
  const { isLoading: isFetching } = useQuery({
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
        emailmensaje: data.emailmensaje || ""
      })
      return data
    },
    refetchOnWindowFocus: false
  })

  // Mutación de guardado
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

  // Cambio de Pestañas
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue)
  }

  const grabarAction = selectedMenuInfo?.data?.barraAcciones?.find(
    a => a?.acccaption === "GRABAR" || a?.acccaption === "ACTUALIZAR" || a?.acccaption === "EDITAR" || a?.acccaption === "EJECUTAR"
  )
  const toolbarActions = grabarAction 
    ? [{ label: grabarAction.acccaption, key: grabarAction.acccaption, icon: getIconComponent(grabarAction.accnameicono, grabarAction.acctipoico) }] 
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
                disabled={isSaving || isFetching} 
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, backgroundColor: "white" }}
              >
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "0 30px 20px 30px", fontSize: "25px" }}>
          <b>Perfil de Empresa y Configuración Global</b>
        </div>

        <CustomBackdrop isLoading={isSaving || isFetching} />

        <Box sx={StyledRoot} component="form" onSubmit={handleSubmit}>
          
          {/* =========================================
              SISTEMA DE PESTAÑAS (TABS)
          ========================================= */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white', borderRadius: '8px 8px 0 0', px: 2, pt: 1 }}>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="1. Logos e Imágenes" sx={{ fontWeight: 'bold' }} />
              <Tab label="2. Ajustes Visuales" sx={{ fontWeight: 'bold' }} />
              <Tab label="3. Parámetros de Correo" sx={{ fontWeight: 'bold' }} />
            </Tabs>
          </Box>

          {/* =========================================
              PANEL 1: LOGOS E IMÁGENES
          ========================================= */}
          <TabPanel value={currentTab} index={0}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: '0 0 8px 8px', background: "white" }}>
              <Typography variant="h6" color="primary" gutterBottom>Configuración de Logos</Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6} textAlign="center">
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Logo Principal</Typography>
                  <div style={{ height: "150px", border: "1px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "15px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#fafafa" }}>
                    {formData.cialogo_preview ? (
                      <img src={formData.cialogo_preview} alt="Logo" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                    ) : <Typography color="textSecondary">Sin Imagen</Typography>}
                  </div>
                  <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                    Actualizar Logo
                    <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, "logo")} />
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6} textAlign="center">
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Marca de Agua (Fondo del Home)</Typography>
                  <div style={{ height: "150px", border: "1px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "15px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#fafafa" }}>
                    {formData.ciaselloagua_preview ? (
                      <img src={formData.ciaselloagua_preview} alt="Marca de Agua" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                    ) : <Typography color="textSecondary">Sin Imagen</Typography>}
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
            <Paper elevation={0} sx={{ p: 4, borderRadius: '0 0 8px 8px', background: "white" }}>
              <Typography variant="h6" color="primary" gutterBottom>Ajustes Visuales del Portal</Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <TextField select fullWidth label="Estilo del Menú" value={formData.ciatipomenu} onChange={(e) => handleInputChange("ciatipomenu", e.target.value)} InputLabelProps={{ shrink: true }}>
                    <MenuItem value={0}>0 - Menú Estándar (Carpetas)</MenuItem>
                    <MenuItem value={1}>1 - Menú Tipo Árbol Desplegable</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField fullWidth type="color" label="Color Principal (Theme)" value={formData.ciacolor} onChange={(e) => handleInputChange("ciacolor", e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& input': { cursor: 'pointer', height: '56px', padding: '0 14px' } }} />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField select fullWidth label="Tipo de Letra Global" value={formData.ciatipoletra} onChange={(e) => handleInputChange("ciatipoletra", e.target.value)} InputLabelProps={{ shrink: true }}>
                    <MenuItem value="Arial">Arial</MenuItem>
                    <MenuItem value="Roboto">Roboto</MenuItem>
                    <MenuItem value="Tahoma">Tahoma</MenuItem>
                    <MenuItem value="Verdana">Verdana</MenuItem>
                    <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                    <MenuItem value="Inter">Inter</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField select fullWidth label="Tamaño de Letra Base" value={formData.ciatamanioletra} onChange={(e) => handleInputChange("ciatamanioletra", e.target.value)} InputLabelProps={{ shrink: true }}>
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
            <Paper elevation={0} sx={{ p: 4, borderRadius: '0 0 8px 8px', background: "white" }}>
              <Typography variant="h6" color="primary" gutterBottom>Parámetros de Envío de Correo del Sistema</Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Servidor SMTP" value={formData.emailsmtp} onChange={(e) => handleInputChange("emailsmtp", e.target.value)} placeholder="ej. smtp.gmail.com" InputLabelProps={{ shrink: true }} />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField fullWidth label="Puerto de Salida (Máscara)" value={formData.emailmascara} onChange={(e) => handleInputChange("emailmascara", e.target.value)} placeholder="ej. 587 o 465" InputLabelProps={{ shrink: true }} />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField fullWidth label="Correo Remitente (Salida)" value={formData.emailsalida} onChange={(e) => handleInputChange("emailsalida", e.target.value)} placeholder="ej. info@miempresa.com" InputLabelProps={{ shrink: true }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="password" label="Clave de Correo (Tema)" value={formData.emailtema} onChange={(e) => handleInputChange("emailtema", e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Asunto Predeterminado" value={formData.emailsubject} onChange={(e) => handleInputChange("emailsubject", e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>

                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={4} label="Cuerpo del Mensaje Predeterminado" value={formData.emailmensaje} onChange={(e) => handleInputChange("emailmensaje", e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

        </Box>
      </div>
    </ThemeProvider>
  )
}

export default PerfilUsuarioDF