import { useState, useEffect, useContext } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid } from "@mui/material"
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

const EditarSecuenciasInternas = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado inicial adaptado a siacsec
  const [formData, setFormData] = useState({
    locservidor: "",
    seccodigo: "",
    secnumero: "",
    secdescri: "",
  })

  // Cargar los datos al abrir la pantalla
  useEffect(() => {
    if (location.state) {
      setFormData(location.state)
    } else {
      navigate("/home/dashboard/SecuenciasInternas")
    }
  }, [location, navigate])

  const { mutateAsync: SaveEdicionSecuencia, isPending: isSavingEdicion } = useMutation({
    queryKey: ["isUpdatingSecuencia"],
    fn: async (data) => {
      const response = await api.post("/SecuenciasInternas/updateSecuenciasInternas", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    let finalValue = value

    if (field === "secdescri") {
      finalValue = value.toUpperCase().slice(0, 200) // varchar(200)
    } else if (field === "secnumero") {
      finalValue = value.replace(/[^0-9]/g, "") // Solo números
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    try {
      if (!formData.secnumero.trim()) {
        showWarning("El número de secuencia es obligatorio")
        return
      }
      if (!formData.secdescri.trim()) {
        showWarning("La descripción es obligatoria")
        return
      }
      await SaveEdicionSecuencia(formData)
    } catch (error) {
      console.error("Error al actualizar la Secuencia Interna:", error)
    }
  }

  // Lógica de botones según permisos
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
          <b>Editar Secuencia: {formData.seccodigo}</b>
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
                  label="Local/Servidor"
                  value={formData.locservidor}
                  disabled // PK
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Código"
                  value={formData.seccodigo}
                  disabled // PK
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número Secuencia *"
                  value={formData.secnumero}
                  onChange={(e) => handleInputChange("secnumero", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={12}>
                <TextField
                  fullWidth
                  label="Descripción *"
                  value={formData.secdescri}
                  onChange={(e) => handleInputChange("secdescri", e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default EditarSecuenciasInternas
