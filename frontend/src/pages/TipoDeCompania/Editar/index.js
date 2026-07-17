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
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)", // [cite: 18]
}

const EditarTipoDeCompania = () => {
  const navigate = useNavigate()
  const { state } = useLocation() // Recibimos la fila seleccionada desde la grilla[cite: 18]
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Rescatamos el código original (llave primaria) por si el usuario lo modifica[cite: 18]
  const [tpcodigoViejo, setTpcodigoViejo] = useState("")

  // Estado del formulario mapeado a siactipocompania
  const [formData, setFormData] = useState({
    tpcodigo: "",
    tpdescripcion: "",
    tpobservacion: "",
    tpstatus: "A",
    tpfecmsys: "", // Para Control de Concurrencia
    tphormsys: "", // Para Control de Concurrencia
  })

  useEffect(() => {
    // Precargar los inputs con los valores de la fila enviada desde la grilla[cite: 18]
    if (state) {
      setFormData({
        tpcodigo: state.tpcodigo || "",
        tpdescripcion: state.tpdescripcion || "",
        tpobservacion: state.tpobservacion || "",
        tpstatus: state.tpstatus || "A",
        tpfecmsys: state.tpfecmsys || "",
        tphormsys: state.tphormsys || "",
      })
      setTpcodigoViejo(state.tpcodigo || "")
    } else {
      navigate(-1) // Retorno de seguridad si entran directo a la URL[cite: 18]
    }
  }, [state, navigate])

  const {
    mutateAsync: SaveEdicionTipo,
    isPending: isSavingEdicion,
    isError,
  } = useMutation({
    queryKey: ["isEditingTipoDeCompania"],
    fn: async (data) => {
      const response = await api.post("/TipoDeCompania/updateTipoDeCompania", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1), // [cite: 18]
  })

  // Manejar cambios en los campos del formulario con limpieza y topes[cite: 18]
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

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    // Preparar payload tal cual lo espera el backend para la edición de llave primaria[cite: 18]
    const payload = {
      tpcodigoOld: tpcodigoViejo,
      tpcodigoNew: formData.tpcodigo,
      tpdescripcion: formData.tpdescripcion,
      tpobservacion: formData.tpobservacion,
      tpstatus: formData.tpstatus,
      tpfecmsys: formData.tpfecmsys,
      tphormsys: formData.tphormsys,
    }

    try {
      if (!payload.tpcodigoNew.trim()) return showWarning("El Código del Tipo de Compañía es obligatorio")
      if (!payload.tpdescripcion.trim()) return showWarning("La Descripción es obligatoria")

      await SaveEdicionTipo(payload)
    } catch (error) {
      console.error("Error al editar el Tipo de Compañía:", error)
      if (error?.code === "VALIDATION_ERROR") {
        showWarning(error.message)
      }
    }
  }

  // Acción dinámica de la barra de menú basada en permisos centrada en GRABAR[cite: 18]
  const grabarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")

  const toolbarActions = grabarAction
    ? [
        {
          label: grabarAction.acccaption,
          key: grabarAction.acccaption,
          icon: getIconComponent(grabarAction.accnameicono, grabarAction.acctipoico),
        },
      ]
    : [{ label: "Grabar", key: "GRABAR", icon: <Save /> }] // [cite: 18]

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        {/* Toolbar superior con solo el botón de Grabar */}
        <Box sx={{ mb: 2 }}>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSavingEdicion}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, mr: 1 }} // [cite: 18]
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
          <b>Editar Tipo de Compañía: {tpcodigoViejo}</b>
        </div>

        <CustomBackdrop isLoading={isSavingEdicion} />

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
              {/* CÓDIGO TIPO COMPAÑÍA (Llave primaria editable) */}
              <Grid item xs={12} sm={3}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Cód. Tipo *"
                  placeholder="Ej: C01"
                  value={formData.tpcodigo}
                  disabled // Campo bloqueado
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

              {/* ESTADO (ACTIVO/INACTIVO) */}
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

export default EditarTipoDeCompania
