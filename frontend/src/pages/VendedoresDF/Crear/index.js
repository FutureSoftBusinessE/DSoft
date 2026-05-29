import { useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, Typography, MenuItem, Divider } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const StyledRoot = {
  width: "100%",
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const CrearVendedorDF = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado limitado a las columnas solicitadas
  const [formData, setFormData] = useState({
    vencodigo: "",
    vennombre: "",
    vendireccion: "",
    ventelefono: "",
    venstatus: "A",
  })

  // Mutación para guardar el vendedor
  const { mutateAsync: SaveCreacion, isPending: isSaving } = useMutation({
    queryKey: ["isCreatingVendedorDF"],
    fn: async (data) => (await api.post("/VendedoresDF/createVendedoresDF", data)).data,
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    // Conversión a mayúsculas automática para mantener el estándar SIAC
    const val = typeof value === "string" ? value.toUpperCase() : value
    setFormData((prev) => ({ ...prev, [field]: val }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    // Validación de presencia para campos obligatorios
    if (!formData.vencodigo.trim() || !formData.vennombre.trim()) {
      return showWarning("El Código y el Nombre del Vendedor son obligatorios")
    }

    try {
      // Capturamos la promesa para evitar el overlay rojo de React
      await SaveCreacion(formData)
    } catch (error) {
      console.log("Error controlado en creación de vendedor")
    }
  }

  // Búsqueda del botón GRABAR configurado en la barra de acciones
  const action = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "GRABAR")

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <Box sx={{ mb: 2 }}>
          {action && (
            <Tooltip title={action.acccaption}>
              <IconButton onClick={handleSubmit} disabled={isSaving} sx={{ border: "1px solid #ddd" }}>
                {getIconComponent(action.accnameicono, action.acctipoico)}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px" }}>
          <b>Creación de Nuevo Vendedor</b>
        </div>

        <CustomBackdrop isLoading={isSaving} />

        <Box sx={StyledRoot}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }} component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" color="primary">
              Información del Vendedor
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Código *"
                  value={formData.vencodigo}
                  onChange={(e) => handleInputChange("vencodigo", e.target.value)}
                  inputProps={{ maxLength: 3 }}
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Nombre del Vendedor *"
                  value={formData.vennombre}
                  onChange={(e) => handleInputChange("vennombre", e.target.value)}
                  inputProps={{ maxLength: 30 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.vendireccion}
                  onChange={(e) => handleInputChange("vendireccion", e.target.value)}
                  inputProps={{ maxLength: 40 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={formData.ventelefono}
                  onChange={(e) => handleInputChange("ventelefono", e.target.value)}
                  inputProps={{ maxLength: 15 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.venstatus}
                  onChange={(e) => handleInputChange("venstatus", e.target.value)}
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

export default CrearVendedorDF
