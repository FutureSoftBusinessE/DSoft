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
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)", // [cite: 108, 109]
}

const CrearFormasDeCobro = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado inicial mapeado a cxcbformapag
  const [formData, setFormData] = useState({
    factippag: "",
    fordescri: "",
    fortipo: "",
    fordias: 0,
    forcuotas: 0,
    forstatus: "A",
  })

  // Mutación para guardar en el backend
  const {
    mutateAsync: SaveCreacionFormaDeCobro,
    isPending: isSavingCreacion,
    isError,
  } = useMutation({
    queryKey: ["isCreatingFormaDeCobro"],
    fn: async (data) => {
      const response = await api.post("/FormasDeCobro/createFormasDeCobro", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast", // [cite: 113, 114]
    onSuccess: () => navigate(-1),
  })

  // Manejador de cambios con limpieza y límites basados en la BD
  const handleInputChange = (field, value) => {
    let finalValue = value

    // Convertir a mayúsculas solo los campos de texto
    if (["factippag", "fordescri", "fortipo", "forstatus"].includes(field)) {
      finalValue = String(value).toUpperCase()
    }

    // Límites de longitud según esquema SQL
    if (field === "factippag") finalValue = finalValue.slice(0, 3)
    else if (field === "fordescri") finalValue = finalValue.slice(0, 40)
    else if (field === "fortipo") finalValue = finalValue.slice(0, 2)

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    // Validaciones del frontend alineadas con el backend
    if (!formData.factippag.trim()) return showWarning("El Código de la Forma de Cobro es obligatorio")
    if (!formData.fordescri.trim()) return showWarning("La Descripción es obligatoria")
    if (!formData.fortipo.trim()) return showWarning("El Tipo es obligatorio")

    await SaveCreacionFormaDeCobro(formData)
  }

  // Búsqueda de permisos en la barra de acciones
  const guardarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")

  const toolbarActions = guardarAction
    ? [
        {
          label: guardarAction.acccaption,
          key: guardarAction.acccaption,
          icon: getIconComponent(guardarAction.accnameicono, guardarAction.acctipoico),
        },
      ]
    : [{ label: "Grabar", key: "GRABAR", icon: <Save /> }]

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon /> {/* [cite: 117, 118] */}
        <Box sx={{ mb: 2 }}>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton onClick={handleSubmit} disabled={isSavingCreacion}>
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
          <b>Crear Nueva Forma de Cobro</b> {/* [cite: 120, 121] */}
        </div>
        <CustomBackdrop isLoading={isSavingCreacion} />
        <Box sx={StyledRoot}>
          <Paper elevation={3} component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" color="primary" gutterBottom>
              Datos de la Forma de Cobro
            </Typography>

            <Grid container spacing={3}>
              {/* CÓDIGO (factippag) */}
              <Grid item xs={12} sm={3}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Cód. Cobro *"
                  value={formData.factippag}
                  onChange={(e) => handleInputChange("factippag", e.target.value)}
                  error={isError && !formData.factippag}
                  inputProps={{ maxLength: 3 }} // [cite: 130, 131]
                />
              </Grid>

              {/* TIPO (fortipo) */}
              <Grid item xs={12} sm={3}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Tipo *"
                  value={formData.fortipo}
                  onChange={(e) => handleInputChange("fortipo", e.target.value)}
                  error={isError && !formData.fortipo}
                  inputProps={{ maxLength: 2 }}
                />
              </Grid>

              {/* DESCRIPCIÓN (fordescri) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Descripción *"
                  value={formData.fordescri}
                  onChange={(e) => handleInputChange("fordescri", e.target.value)}
                  error={isError && !formData.fordescri}
                  inputProps={{ maxLength: 40 }} // [cite: 132, 133]
                />
              </Grid>

              {/* DÍAS PLAZO (fordias) */}
              <Grid item xs={12} sm={4}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  type="number"
                  label="Días Plazo"
                  value={formData.fordias}
                  onChange={(e) => handleInputChange("fordias", e.target.value)}
                />
              </Grid>

              {/* NÚMERO DE CUOTAS (forcuotas) */}
              <Grid item xs={12} sm={4}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  type="number"
                  label="Nro. Cuotas"
                  value={formData.forcuotas}
                  onChange={(e) => handleInputChange("forcuotas", e.target.value)}
                />
              </Grid>

              {/* ESTADO (forstatus) */}
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Estado"
                  value={formData.forstatus}
                  onChange={(e) => handleInputChange("forstatus", e.target.value)}
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

export default CrearFormasDeCobro
