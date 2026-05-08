import { useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, Typography, MenuItem } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const StyledRoot = {
  width: "100%", maxWidth: "800px", margin: "0 auto", padding: "20px",
  backgroundColor: "#f5f7fa", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const CrearPresentacionesINV = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado inicial según estructura inbpre
  const [formData, setFormData] = useState({
    precodigo: "",
    predescri: "",
    prestatus: "A"
  })

  // Mutación para enviar datos al backend
  const { mutateAsync: SaveCreacionPresentacion, isPending: isSaving, isError } = useMutation({
    queryKey: ["isCreatingPresentacionINV"],
    fn: async (data) => {
      const response = await api.post("/PresentacionesINV/createPresentacionesINV", data)
      return response.data
    },
    showError: "modal", 
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    let processedValue = value
    // Conversión a mayúsculas automática
    if (typeof value === "string") {
      processedValue = value.toUpperCase()
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    // Validaciones de integridad
    if (!formData.precodigo.trim()) return showWarning("El Código de la Presentación es obligatorio")
    if (!formData.predescri.trim()) return showWarning("La Descripción es obligatoria")
    
    await SaveCreacionPresentacion(formData)
  }

  // Lógica del botón GRABAR de la barra de acciones superior
  const ejecutarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")
  const toolbarActions = ejecutarAction ? [{ 
    label: ejecutarAction.acccaption, 
    key: ejecutarAction.acccaption, 
    icon: getIconComponent(ejecutarAction.accnameicono, ejecutarAction.acctipoico) 
  }] : []

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        
        {/* Barra de Herramientas Superior */}
        <Box sx={{ mb: 2 }}>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton 
                onClick={handleSubmit} 
                disabled={isSaving} 
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
              >
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
        
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Crear Presentación de Inventario</b>
        </div>

        <CustomBackdrop isLoading={isSaving} />

        <Box sx={StyledRoot}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, background: "white" }} component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mb: 3 }}>
              Información Técnica
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField 
                  fullWidth 
                  label="Código *" 
                  value={formData.precodigo} 
                  onChange={(e) => handleInputChange("precodigo", e.target.value)} 
                  error={isError && !formData.precodigo}
                  inputProps={{ maxLength: 2 }} // varchar(2)
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField 
                  fullWidth 
                  label="Descripción *" 
                  value={formData.predescri} 
                  onChange={(e) => handleInputChange("predescri", e.target.value)} 
                  error={isError && !formData.predescri}
                  inputProps={{ maxLength: 30 }} // varchar(30)
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.prestatus}
                  onChange={(e) => handleInputChange("prestatus", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="A">ACTIVO</MenuItem>
                  <MenuItem value="I">INACTIVO</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearPresentacionesINV