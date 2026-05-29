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
  width: "100%",
  maxWidth: "800px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const CrearMarcasINV = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    marcodigo: "",
    mardescri: "",
    marstatus: "A",
  })

  // Mutación para guardar la nueva marca de inventario
  const {
    mutateAsync: SaveCreacionMarca,
    isPending: isSaving,
    isError,
  } = useMutation({
    queryKey: ["isCreatingMarcaINV"],
    fn: async (data) => {
      // Endpoint definido en el backend para Marcas
      const response = await api.post("/MarcasINV/createMarcasINV", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    let processedValue = value
    // Convertimos a mayúsculas automáticamente como en los otros maestros
    if (typeof value === "string") {
      processedValue = value.toUpperCase()
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    // Validaciones de campos obligatorios para Marcas
    if (!formData.marcodigo.trim()) return showWarning("El Código de la Marca es obligatorio")
    if (!formData.mardescri.trim()) return showWarning("La Descripción de la Marca es obligatoria")

    await SaveCreacionMarca(formData)
  }

  // Búsqueda del botón GRABAR en la barra de acciones
  const ejecutarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")
  const toolbarActions = ejecutarAction
    ? [
        {
          label: ejecutarAction.acccaption,
          key: ejecutarAction.acccaption,
          icon: getIconComponent(ejecutarAction.accnameicono, ejecutarAction.acctipoico),
        },
      ]
    : []

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        {/* Barra de Acciones Superior */}
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

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 30px 30px 30px",
            fontSize: "25px",
          }}
        >
          <b>Crear Marca de Inventario</b>
        </div>

        <CustomBackdrop isLoading={isSaving} />

        <Box sx={StyledRoot}>
          <Paper
            elevation={3}
            sx={{ p: 4, borderRadius: 3, background: "white" }}
            component="form"
            onSubmit={handleSubmit}
          >
            <Typography variant="h6" color="primary" gutterBottom sx={{ mb: 3 }}>
              Datos de la Marca
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Código *"
                  value={formData.marcodigo}
                  onChange={(e) => handleInputChange("marcodigo", e.target.value)}
                  error={isError && !formData.marcodigo}
                  inputProps={{ maxLength: 5 }}
                  InputLabelProps={{ shrink: true }}
                  placeholder="Ej: 001"
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Descripción *"
                  value={formData.mardescri}
                  onChange={(e) => handleInputChange("mardescri", e.target.value)}
                  error={isError && !formData.mardescri}
                  inputProps={{ maxLength: 30 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Estado *"
                  value={formData.marstatus}
                  onChange={(e) => handleInputChange("marstatus", e.target.value)}
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

export default CrearMarcasINV
