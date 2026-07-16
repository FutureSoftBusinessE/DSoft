import { useEffect, useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, MenuItem, Typography } from "@mui/material"
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
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const EditarFormasDeCobro = () => {
  const navigate = useNavigate()
  const { state } = useLocation() // Recibimos la fila seleccionada desde la grilla [cite: 136]
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Rescatamos el código original por si el usuario decide modificar el ID de la forma de cobro
  const [factippagViejo, setFactippagViejo] = useState("")

  // Estado del formulario
  const [formData, setFormData] = useState({
    factippag: "",
    fordescri: "",
    fortipo: "",
    fordias: 0,
    forcuotas: 0,
    forstatus: "A",
    forfecmsys: "", // Para Control de Concurrencia Optimista
    forhormsys: "", // Para Control de Concurrencia Optimista
  })

  useEffect(() => {
    // Precargar los inputs con los valores de la fila enviada desde la grilla [cite: 137]
    if (state) {
      setFormData({
        factippag: state.factippag || "",
        fordescri: state.fordescri || "",
        fortipo: state.fortipo || "",
        fordias: state.fordias ?? 0,
        forcuotas: state.forcuotas ?? 0,
        forstatus: state.forstatus || "A",
        forfecmsys: state.forfecmsys || "",
        forhormsys: state.forhormsys || "",
      })
      setFactippagViejo(state.factippag || "")
    } else {
      navigate(-1) // Retorno de seguridad si entran directo a la URL [cite: 141]
    }
  }, [state, navigate])

  const {
    mutateAsync: SaveEdicionFormaDeCobro,
    isPending: isSavingEdicion,
    isError,
  } = useMutation({
    queryKey: ["isEditingFormaDeCobro"],
    fn: async (data) => {
      const response = await api.post("/FormasDeCobro/updateFormasDeCobro", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  // Manejar cambios en los campos del formulario con limpieza y topes [cite: 145]
  const handleInputChange = (field, value) => {
    let finalValue = value

    // Convertir a mayúsculas los campos de texto
    if (["factippag", "fordescri", "fortipo", "forstatus"].includes(field)) {
      finalValue = String(value).toUpperCase()
    }

    // Límites de longitud según esquema SQL
    if (field === "factippag") finalValue = finalValue.slice(0, 3)
    else if (field === "fordescri") finalValue = finalValue.slice(0, 40)
    else if (field === "fortipo") finalValue = finalValue.slice(0, 2)

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    // Preparar payload tal cual lo espera el backend para la edición de llave principal
    const payload = {
      factippagOld: factippagViejo,
      factippagNew: formData.factippag,
      fordescri: formData.fordescri,
      fortipo: formData.fortipo,
      fordias: formData.fordias,
      forcuotas: formData.forcuotas,
      forstatus: formData.forstatus,
      forfecmsys: formData.forfecmsys,
      forhormsys: formData.forhormsys,
    }

    try {
      if (!payload.factippagNew.trim()) return showWarning("El Código de la Forma de Cobro es obligatorio")
      if (!payload.fordescri.trim()) return showWarning("La Descripción es obligatoria")
      if (!payload.fortipo.trim()) return showWarning("El Tipo es obligatorio")

      await SaveEdicionFormaDeCobro(payload)
    } catch (error) {
      console.error("Error al editar la Forma de Cobro:", error)
      if (error?.code === "VALIDATION_ERROR") {
        showWarning(error.message)
      }
    }
  }

  // Acción dinámica de la barra de menú basada en permisos [cite: 148, 149]
  const actualizarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")

  const toolbarActions = actualizarAction
    ? [
        {
          label: actualizarAction.acccaption,
          key: actualizarAction.acccaption,
          icon: getIconComponent(actualizarAction.accnameicono, actualizarAction.acctipoico),
        },
      ]
    : [{ label: "Grabar", key: "GRABAR", icon: <Save /> }]

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        {/* Toolbar superior con el botón de Guardar/Actualizar */}
        <Box sx={{ mb: 2 }}>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSavingEdicion}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, mr: 1 }}
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
          <b>Editar Forma de Cobro: {factippagViejo}</b>
        </div>

        <CustomBackdrop isLoading={isSavingEdicion} />

        <Box sx={StyledRoot}>
          <Paper
            elevation={3}
            sx={{ p: 4, borderRadius: 3, background: "white" }}
            component="form"
            onSubmit={handleSubmit}
          >
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
                  inputProps={{ maxLength: 3 }}
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
                  inputProps={{ maxLength: 40 }}
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

              {/* ESTADO (ACTIVO/INACTIVO) */}
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

export default EditarFormasDeCobro
