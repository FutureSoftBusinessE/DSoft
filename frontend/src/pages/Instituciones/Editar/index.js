import { useState, useEffect, useContext } from "react"
import { useNavigate, useLocation } from "react-router-dom"
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

const EditarInstituciones = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado inicial adaptado a gdocbinstituciones
  const [formData, setFormData] = useState({
    insticodigo: "",
    instidescri: "",
    instistatus: "A",
  })

  // Cargar los datos de la fila seleccionada al abrir la pantalla
  useEffect(() => {
    if (location.state) {
      setFormData(location.state)
    } else {
      navigate("/home/dashboard/Instituciones")
    }
  }, [location, navigate])

  // Hook de mutación para actualizar la Institución
  const { mutateAsync: SaveEdicionInstitucion, isPending: isSavingEdicion } = useMutation({
    queryKey: ["isUpdatingInstitucion"],
    fn: async (data) => {
      const response = await api.post("/Instituciones/updateInstituciones", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1), // Retorna a la grilla tras el éxito
  })

  const handleInputChange = (field, value) => {
    let finalValue = value
    // Lógica de truncado y formato a mayúsculas (límite de 60 caracteres)
    if (field === "instidescri") {
      finalValue = value.toUpperCase().slice(0, 60)
    }
    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    try {
      if (!formData.instidescri.trim()) {
        showWarning("La descripción de la Institución es obligatoria")
        return
      }
      await SaveEdicionInstitucion(formData)
    } catch (error) {
      console.error("Error al actualizar la Institución:", error)
    }
  }

  // Lógica dinámica de botones según permisos (Busca ACTUALIZAR, GUARDAR o GRABAR)
  const actualizarAction = selectedMenuInfo?.data?.barraAcciones?.find(
    (action) =>
      action?.acccaption === "ACTUALIZAR" || action?.acccaption === "GUARDAR" || action?.acccaption === "GRABAR",
  )

  const toolbarActions = []
  if (actualizarAction) {
    toolbarActions.push({
      label: actualizarAction.acccaption,
      key: actualizarAction.acccaption,
      icon: getIconComponent(actualizarAction.accnameicono, actualizarAction.acctipoico),
    })
  } else {
    // Fallback de seguridad por si no viene el permiso explícito en el menú
    toolbarActions.push({ label: "Grabar", key: "GRABAR", icon: <Save /> })
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        {/* Barra de Herramientas (Top Toolbar) */}
        <Box sx={{ mb: 2 }}>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSavingEdicion}
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
          <b>Editar Institución: {formData.insticodigo}</b>
        </div>

        <CustomBackdrop isLoading={isSavingEdicion} />

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
                  label="Código"
                  value={formData.insticodigo}
                  disabled // Bloqueado por ser Primary Key (No se debe modificar)
                />
              </Grid>

              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  label="Descripción *"
                  value={formData.instidescri}
                  onChange={(e) => handleInputChange("instidescri", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.instistatus}
                  onChange={(e) => handleInputChange("instistatus", e.target.value)}
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

export default EditarInstituciones
