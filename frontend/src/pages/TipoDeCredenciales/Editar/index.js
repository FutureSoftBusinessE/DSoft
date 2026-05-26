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

const EditarTipoDeCredenciales = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    clacodigo: "",
    cladescri: "",
    clastatus: "A",
  })

  // Cargar los datos al abrir la pantalla
  useEffect(() => {
    if (location.state) {
      setFormData(location.state)
    } else {
      navigate("/home/dashboard/TipoDeCredenciales")
    }
  }, [location, navigate])

  const { mutateAsync: SaveEdicionCredencial, isPending: isSavingEdicion } = useMutation({
    queryKey: ["isUpdatingCredencial"],
    fn: async (data) => {
      const response = await api.post("/TipoDeCredenciales/updateTipoDeCredenciales", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    let finalValue = value
    // Lógica de truncado y formato según estructura de tabla
    if (field === "cladescri") {
      finalValue = value.toUpperCase().slice(0, 60)
    }
    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    try {
      if (!formData.cladescri.trim()) {
        showWarning("La descripción es obligatoria")
        return
      }
      await SaveEdicionCredencial(formData)
    } catch (error) {
      console.error("Error al actualizar Tipo de Credencial:", error)
    }
  }

  // Lógica dinámica de botones según permisos
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
    toolbarActions.push({ label: "Grabar", key: "GRABAR", icon: <Save /> })
  }

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
          <b>Editar Tipo de Credencial: {formData.clacodigo}</b>
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
                  value={formData.clacodigo}
                  disabled // Bloqueado por ser PK
                />
              </Grid>

              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  label="Descripción *"
                  value={formData.cladescri}
                  onChange={(e) => handleInputChange("cladescri", e.target.value)}
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

export default EditarTipoDeCredenciales
