import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, MenuItem } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import Save from "@mui/icons-material/Save"

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

const CrearTipoDeCredenciales = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    clacodigo: "",
    cladescri: "",
    clastatus: "A",
  })

  // Hook de mutación para crear la credencial
  const { mutateAsync: SaveNuevaCredencial, isPending: isSaving } = useMutation({
    queryKey: ["isCreatingCredencial"],
    fn: async (data) => {
      const response = await api.post("/TipoDeCredenciales/createTipoDeCredenciales", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  // Manejador de cambios con validación de longitud y mayúsculas
  const handleInputChange = (field, value) => {
    let finalValue = value

    if (field === "clacodigo") {
      finalValue = value.toUpperCase().slice(0, 3) // Límite varchar(3)
    } else if (field === "cladescri") {
      finalValue = value.toUpperCase().slice(0, 60) // Límite varchar(60)
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  // Validación previa al envío
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    try {
      if (!formData.clacodigo.trim()) {
        showWarning("El código de credencial es obligatorio")
        return
      }
      if (!formData.cladescri.trim()) {
        showWarning("La descripción es obligatoria")
        return
      }

      await SaveNuevaCredencial(formData)
    } catch (error) {
      console.error("Error al crear el Tipo de Credencial:", error)
    }
  }

  // Lógica de Barra de Herramientas (Busca GRABAR o CREAR)
  const crearAction = selectedMenuInfo?.data?.barraAcciones?.find(
    (action) => action?.acccaption === "CREAR" || action?.acccaption === "EJECUTAR" || action?.acccaption === "GRABAR",
  )

  const toolbarActions = []
  if (crearAction) {
    toolbarActions.push({
      label: crearAction.acccaption,
      key: crearAction.acccaption,
      icon: getIconComponent(crearAction.accnameicono, crearAction.acctipoico),
    })
  } else {
    toolbarActions.push({
      label: "Grabar",
      key: "GRABAR",
      icon: <Save />,
    })
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        {/* Barra de Herramientas */}
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
          <b>Crear Tipo de Credencial</b>
        </div>

        <CustomBackdrop isLoading={isSaving} />

        <Box sx={StyledRoot}>
          <Paper
            elevation={3}
            sx={{ p: 3, mb: 3, borderRadius: 3, background: "white" }}
            component="form"
            onSubmit={handleSubmit}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Código *"
                  value={formData.clacodigo}
                  onChange={(e) => handleInputChange("clacodigo", e.target.value)}
                  placeholder="Ej: 01"
                />
              </Grid>

              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  label="Descripción *"
                  value={formData.cladescri}
                  onChange={(e) => handleInputChange("cladescri", e.target.value)}
                  placeholder="Ej: TOKEN FIRMA DIGITAL"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.clastatus}
                  onChange={(e) => handleInputChange("clastatus", e.target.value)}
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

export default CrearTipoDeCredenciales
