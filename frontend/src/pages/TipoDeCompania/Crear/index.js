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
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)", // [cite: 18]
}

const CrearTipoDeCompania = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext) // [cite: 18]

  // Estado inicial mapeado a la tabla siactipocompania
  const [formData, setFormData] = useState({
    tpcodigo: "",
    tpdescripcion: "",
    tpobservacion: "",
    tpstatus: "A",
  })

  // Mutación para guardar en el backend[cite: 18]
  const {
    mutateAsync: SaveCreacionTipo,
    isPending: isSavingCreacion,
    isError,
  } = useMutation({
    queryKey: ["isCreatingTipoDeCompania"],
    fn: async (data) => {
      const response = await api.post("/TipoDeCompania/createTipoDeCompania", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1), // [cite: 18]
  })

  // Manejador de cambios con limpieza y límites basados en la BD[cite: 18]
  const handleInputChange = (field, value) => {
    let finalValue = value

    // Convertir a mayúsculas los campos de texto
    if (["tpcodigo", "tpdescripcion", "tpobservacion"].includes(field)) {
      finalValue = String(value).toUpperCase()
    }

    // Límites de longitud según esquema SQL
    if (field === "tpcodigo") finalValue = finalValue.slice(0, 3)
    else if (field === "tpdescripcion") finalValue = finalValue.slice(0, 100)
    else if (field === "tpobservacion") finalValue = finalValue.slice(0, 255)

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    // Validaciones del frontend alineadas con las reglas de negocio[cite: 18]
    if (!formData.tpcodigo.trim()) return showWarning("El Código del Tipo de Compañía es obligatorio")
    if (!formData.tpdescripcion.trim()) return showWarning("La Descripción es obligatoria")

    await SaveCreacionTipo(formData)
  }

  // Búsqueda de permisos en la barra de acciones (Solo botón GRABAR/GUARDAR)[cite: 18]
  const guardarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")

  const toolbarActions = guardarAction
    ? [
        {
          label: guardarAction.acccaption,
          key: guardarAction.acccaption,
          icon: getIconComponent(guardarAction.accnameicono, guardarAction.acctipoico),
        },
      ]
    : [{ label: "Grabar", key: "GRABAR", icon: <Save /> }] // [cite: 18]

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
                disabled={isSavingCreacion}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }} // [cite: 18]
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
          <b>Crear Nuevo Tipo de Compañía</b>
        </div>

        <CustomBackdrop isLoading={isSavingCreacion} />

        <Box sx={StyledRoot}>
          <Paper
            elevation={3}
            sx={{ p: 4, borderRadius: 3, background: "white" }}
            component="form"
            onSubmit={handleSubmit} // [cite: 18]
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Datos del Tipo de Compañía
            </Typography>

            <Grid container spacing={3}>
              {/* CÓDIGO TIPO COMPAÑÍA (Llave primaria) */}
              <Grid item xs={12} sm={3}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Cód. Tipo *"
                  placeholder="Ej: C01"
                  value={formData.tpcodigo}
                  onChange={(e) => handleInputChange("tpcodigo", e.target.value)}
                  error={isError && !formData.tpcodigo}
                  inputProps={{ maxLength: 3 }}
                />
              </Grid>

              {/* DESCRIPCIÓN */}
              <Grid item xs={12} sm={9}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Descripción *"
                  value={formData.tpdescripcion}
                  onChange={(e) => handleInputChange("tpdescripcion", e.target.value)}
                  error={isError && !formData.tpdescripcion}
                  inputProps={{ maxLength: 100 }}
                />
              </Grid>

              {/* OBSERVACIÓN */}
              <Grid item xs={12} sm={9}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Observación"
                  value={formData.tpobservacion}
                  onChange={(e) => handleInputChange("tpobservacion", e.target.value)}
                  inputProps={{ maxLength: 255 }}
                />
              </Grid>

              {/* ESTADO */}
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Estado"
                  value={formData.tpstatus}
                  onChange={(e) => handleInputChange("tpstatus", e.target.value)}
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

export default CrearTipoDeCompania
