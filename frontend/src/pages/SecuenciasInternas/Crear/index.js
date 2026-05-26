import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
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

const CrearSecuenciasInternas = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado inicial del formulario adaptado a siacsec
  const [formData, setFormData] = useState({
    locservidor: "",
    seccodigo: "",
    secnumero: "",
    secdescri: "",
  })

  // Hook de mutación para crear la secuencia
  const { mutateAsync: SaveNuevaSecuencia, isPending: isSaving } = useMutation({
    queryKey: ["isCreatingSecuencia"],
    fn: async (data) => {
      const response = await api.post("/SecuenciasInternas/createSecuenciasInternas", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  // Manejador de cambios con validación de longitud y mayúsculas
  const handleInputChange = (field, value) => {
    let finalValue = value

    if (field === "locservidor") {
      finalValue = value.toUpperCase().slice(0, 1) // varchar(1)
    } else if (field === "seccodigo") {
      finalValue = value.toUpperCase().slice(0, 3) // varchar(3)
    } else if (field === "secdescri") {
      finalValue = value.toUpperCase().slice(0, 200) // varchar(200)
    } else if (field === "secnumero") {
      // Solo permite números positivos
      finalValue = value.replace(/[^0-9]/g, "")
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  // Validación previa al envío
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    try {
      if (!formData.locservidor.trim()) {
        showWarning("El Local/Servidor es obligatorio")
        return
      }
      if (!formData.seccodigo.trim()) {
        showWarning("El código de secuencia es obligatorio")
        return
      }
      if (!formData.secnumero.trim()) {
        showWarning("El número de secuencia es obligatorio")
        return
      }
      if (!formData.secdescri.trim()) {
        showWarning("La descripción es obligatoria")
        return
      }

      await SaveNuevaSecuencia(formData)
    } catch (error) {
      console.error("Error al crear la Secuencia Interna:", error)
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
          <b>Crear Secuencia Interna</b>
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
                  label="Local/Servidor *"
                  value={formData.locservidor}
                  onChange={(e) => handleInputChange("locservidor", e.target.value)}
                  placeholder="Ej: A"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Código *"
                  value={formData.seccodigo}
                  onChange={(e) => handleInputChange("seccodigo", e.target.value)}
                  placeholder="Ej: 001"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Número Secuencia *"
                  value={formData.secnumero}
                  onChange={(e) => handleInputChange("secnumero", e.target.value)}
                  placeholder="Ej: 100"
                />
              </Grid>

              <Grid item xs={12} sm={12}>
                <TextField
                  fullWidth
                  label="Descripción *"
                  value={formData.secdescri}
                  onChange={(e) => handleInputChange("secdescri", e.target.value)}
                  placeholder="Ej: FACTURAS CLIENTES LOCAL A"
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearSecuenciasInternas
