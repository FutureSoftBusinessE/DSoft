import { useEffect, useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, MenuItem, Typography, Divider } from "@mui/material"
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

const EditarVendedorDF = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Clave primaria original para la localización en el backend
  const vencodigoViejo = state?.vencodigo ?? ""

  // Estado del formulario limitado a los 5 campos requeridos
  const [formData, setFormData] = useState({
    vencodigo: "",
    vennombre: "",
    vendireccion: "",
    ventelefono: "",
    venstatus: "A",
  })

  useEffect(() => {
    // Carga de datos iniciales desde la grilla
    if (state) {
      setFormData({
        vencodigo: state.vencodigo || "",
        vennombre: state.vennombre || "",
        vendireccion: state.vendireccion || "",
        ventelefono: state.ventelefono || "",
        venstatus: state.venstatus || "A",
      })
    }
  }, [state])

  // Mutación para actualizar el vendedor capturando errores para el modal de SIAC
  const { mutateAsync: SaveEdicion, isPending: isSaving } = useMutation({
    queryKey: ["isEditingVendedorDF"],
    fn: async (data) => (await api.post("/VendedoresDF/updateVendedoresDF", data)).data,
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    // Conversión a mayúsculas para mantener el estándar visual
    const val = typeof value === "string" && field !== "venstatus" ? value.toUpperCase() : value
    setFormData((prev) => ({ ...prev, [field]: val }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    if (!formData.vennombre.trim()) {
      return showWarning("El Nombre del Vendedor es un campo obligatorio")
    }

    try {
      // Se envía el código original y el nuevo (aunque sea el mismo por estar disabled)
      await SaveEdicion({
        vencodigoOld: vencodigoViejo,
        vencodigoNew: formData.vencodigo,
        ...formData,
      })
    } catch (error) {
      // Captura controlada para evitar el overlay rojo de desarrollo
      console.log("Error en actualización de vendedor capturado")
    }
  }

  // Búsqueda del botón GRABAR según configuración de permisos
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
          <b>Editar Vendedor: {vencodigoViejo}</b>
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
                  disabled // Bloqueado por ser Clave Primaria
                  fullWidth
                  label="Código (No editable) *"
                  value={formData.vencodigo}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Nombre del Vendedor *"
                  value={formData.vennombre}
                  onChange={(e) => handleInputChange("vennombre", e.target.value)}
                  inputProps={{ maxLength: 30 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.vendireccion}
                  onChange={(e) => handleInputChange("vendireccion", e.target.value)}
                  inputProps={{ maxLength: 40 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={formData.ventelefono}
                  onChange={(e) => handleInputChange("ventelefono", e.target.value)}
                  inputProps={{ maxLength: 15 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.venstatus}
                  onChange={(e) => handleInputChange("venstatus", e.target.value)}
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

export default EditarVendedorDF
