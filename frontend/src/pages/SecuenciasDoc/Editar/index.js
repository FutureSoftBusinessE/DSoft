import React, { useState, useEffect, useContext } from "react"
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

const EditarSecuenciasDoc = () => {
  const navigate = useNavigate()
  const location = useLocation() // Recibe los datos enviados desde la tabla
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    dptoanio: "",
    loccodigo: "",
    modcodigo: "",
    doccodigo: "",
    dptodescri: "",
    dptonumsec: "",
    locservidor: "A",
  })

  // Cargar los datos al abrir la pantalla
  useEffect(() => {
    if (location.state) {
      setFormData({
        dptoanio: location.state.dptoanio || "",
        loccodigo: location.state.loccodigo || "",
        // Mapeamos el dptocodigo de la tabla al modcodigo que espera el backend
        modcodigo: location.state.dptocodigo || location.state.modcodigo || "",
        doccodigo: location.state.doccodigo || "",
        dptodescri: location.state.dptodescri || "",
        dptonumsec: location.state.dptonumsec || "",
        locservidor: location.state.locservidor || "A",
      })
    } else {
      // Si el usuario entra por URL directa sin seleccionar en la tabla, lo regresamos
      navigate("/home/dashboard/SecuenciasDoc")
    }
  }, [location, navigate])

  // Hook de mutación para enviar los datos al backend
  const { mutateAsync: SaveEdicionSecuencia, isPending: isSavingEdicion } = useMutation({
    queryKey: ["isUpdatingSecuencia"],
    fn: async (data) => {
      const response = await api.post("/SecuenciasDoc/updateSecuenciasDoc", data)
      return response.data
    },
    showError: "modal", // Captura el ValidationError del backend
    showSuccess: "toast",
    onSuccess: () => navigate(-1), // Retorna a la grilla al guardar
  })

  const handleInputChange = (field, value) => {
    // Para esta pantalla solo permitimos editar dptonumsec
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    try {
      if (formData.dptonumsec === "" || formData.dptonumsec === null) {
        showWarning("El número de secuencia es obligatorio.")
        return
      }

      await SaveEdicionSecuencia(formData)
    } catch (error) {
      console.error("Error al actualizar la Secuencia de Documento:", error)
    }
  }

  // Lógica dinámica de botones según permisos
  const actualizarAction = selectedMenuInfo?.data?.barraAcciones?.find(
    (action) =>
      action?.acccaption === "GRABAR" ||
      action?.acccaption === "GUARDAR" ||
      action?.acccaption === "ACTUALIZAR" ||
      action?.acccaption === "EDITAR",
  )

  const toolbarActions = []
  if (actualizarAction) {
    toolbarActions.push({
      label: actualizarAction.acccaption,
      key: actualizarAction.acccaption,
      icon: getIconComponent(actualizarAction.accnameicono, actualizarAction.acctipoico),
    })
  } else {
    // Fallback: Si no hay configuración en la BD, dibujamos el botón por defecto
    toolbarActions.push({ label: "Grabar Secuencia", key: "GRABAR", icon: <Save /> })
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        <Box>
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
          <b>Editar Secuencia de Documento</b>
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
                  label="Año *"
                  value={formData.dptoanio}
                  disabled // BLOQUEADO: Llave Primaria
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Localidad *"
                  value={formData.loccodigo}
                  disabled // BLOQUEADO: Llave Primaria
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Módulo *"
                  value={formData.modcodigo}
                  disabled // BLOQUEADO: Llave Primaria
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Documento *"
                  value={formData.doccodigo}
                  disabled // BLOQUEADO: Llave Primaria
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Descripción de la Secuencia"
                  value={formData.dptodescri}
                  disabled // BLOQUEADO: No es actualizable por regla de negocio
                />
              </Grid>

              {/* ÚNICO CAMPO EDITABLE */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Secuencia Actual *"
                  value={formData.dptonumsec}
                  onChange={(e) => handleInputChange("dptonumsec", e.target.value)}
                  placeholder="Ingrese la nueva secuencia"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Servidor Lógico"
                  value={formData.locservidor}
                  disabled // BLOQUEADO: Llave Primaria
                >
                  <MenuItem value="A">ACTIVO (A)</MenuItem>
                  <MenuItem value="I">INACTIVO (I)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default EditarSecuenciasDoc
