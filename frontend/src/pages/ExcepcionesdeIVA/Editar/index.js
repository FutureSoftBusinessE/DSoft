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

// Helper para parsear la fecha web a datetime-local neutralizando la zona horaria
const formatDateTimeForInput = (dateString) => {
  if (!dateString) return ""
  const cleanString = String(dateString).replace(" GMT", "")
  const d = new Date(cleanString)
  if (isNaN(d.getTime())) return ""

  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mins = String(d.getMinutes()).padStart(2, "0")

  return `${yyyy}-${mm}-${dd}T${hh}:${mins}`
}

const EditarExcepcionesdeIVA = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [ivetipocompaniaViejo, setIvetipocompaniaViejo] = useState("")
  const [ivefecinicioVieja, setIvefecinicioVieja] = useState("")

  const [formData, setFormData] = useState({
    ivetipocompania: "",
    ivefecinicio: "",
    ivefectermino: "",
    iveporcentajeactual: 0,
    iveporcentajeresolucion: 0,
    ivenumresolucion: "",
    ivemotivo: "",
    ivestatus: "A",
    ivefecmsys: "",
    ivehormsys: "",
  })

  useEffect(() => {
    if (state) {
      setFormData({
        ivetipocompania: state.ivetipocompania || "",
        ivefecinicio: formatDateTimeForInput(state.ivefecinicio),
        ivefectermino: formatDateTimeForInput(state.ivefectermino),
        iveporcentajeactual: state.iveporcentajeactual ?? 0,
        iveporcentajeresolucion: state.iveporcentajeresolucion ?? 0,
        ivenumresolucion: state.ivenumresolucion || "",
        ivemotivo: state.ivemotivo || "",
        ivestatus: state.ivestatus || "A",
        ivefecmsys: state.ivefecmsys || "",
        ivehormsys: state.ivehormsys || "",
      })
      setIvetipocompaniaViejo(state.ivetipocompania || "")

      const fechaOrigenLista = formatDateTimeForInput(state.ivefecinicio)
      setIvefecinicioVieja(fechaOrigenLista ? fechaOrigenLista.replace("T", " ") + ":00" : "")
    } else {
      navigate(-1)
    }
  }, [state, navigate])

  const {
    mutateAsync: SaveEdicionExcepcion,
    isPending: isSavingEdicion,
    isError,
  } = useMutation({
    queryKey: ["isEditingExcepcionIVA"],
    fn: async (data) => {
      const response = await api.post("/ExcepcionesdeIVA/updateExcepcionesdeIVA", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    let finalValue = value

    if (["ivetipocompania", "ivenumresolucion", "ivemotivo"].includes(field)) {
      finalValue = String(value).toUpperCase()
    }

    if (field === "ivetipocompania") finalValue = finalValue.slice(0, 3)
    else if (field === "ivenumresolucion") finalValue = finalValue.slice(0, 30)
    else if (field === "ivemotivo") finalValue = finalValue.slice(0, 255)

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    const payload = {
      ivetipocompaniaOld: ivetipocompaniaViejo,
      ivetipocompaniaNew: formData.ivetipocompania,
      ivefecinicioOld: ivefecinicioVieja,
      ivefecinicioNew: formData.ivefecinicio ? formData.ivefecinicio.replace("T", " ") + ":00" : "",
      ivefectermino: formData.ivefectermino ? formData.ivefectermino.replace("T", " ") + ":00" : "",
      iveporcentajeactual: formData.iveporcentajeactual,
      iveporcentajeresolucion: formData.iveporcentajeresolucion,
      ivenumresolucion: formData.ivenumresolucion,
      ivemotivo: formData.ivemotivo,
      ivestatus: formData.ivestatus,
      ivefecmsys: formData.ivefecmsys,
      ivehormsys: formData.ivehormsys,
    }

    try {
      if (!payload.ivetipocompaniaNew.trim()) return showWarning("El Tipo de Compañía es obligatorio")
      if (!payload.ivefecinicioNew) return showWarning("La Fecha de Inicio es obligatoria")
      if (!payload.ivefectermino) return showWarning("La Fecha de Término es obligatoria")

      if (new Date(payload.ivefecinicioNew) > new Date(payload.ivefectermino)) {
        return showWarning("La Fecha de Término no puede ser menor a la Fecha de Inicio")
      }

      await SaveEdicionExcepcion(payload)
    } catch (error) {
      console.error("Error al editar la Excepción:", error)
      if (error?.code === "VALIDATION_ERROR") {
        showWarning(error.message)
      }
    }
  }

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
          <b>Editar Excepción de IVA: {ivetipocompaniaViejo}</b>
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
              Datos de la Excepción
            </Typography>
            <Grid container spacing={3}>
              {/* TIPO COMPAÑÍA - BLOQUEADO POR SER LLAVE PRIMARIA */}
              <Grid item xs={12} sm={4}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Tipo de Compañía *"
                  value={formData.ivetipocompania}
                  disabled // Campo bloqueado
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  type="datetime-local"
                  label="Fecha de Inicio *"
                  value={formData.ivefecinicio}
                  onChange={(e) => handleInputChange("ivefecinicio", e.target.value)}
                  error={isError && !formData.ivefecinicio}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  type="datetime-local"
                  label="Fecha de Término *"
                  value={formData.ivefectermino}
                  onChange={(e) => handleInputChange("ivefectermino", e.target.value)}
                  error={isError && !formData.ivefectermino}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  type="number"
                  label="% Actual"
                  value={formData.iveporcentajeactual}
                  onChange={(e) => handleInputChange("iveporcentajeactual", e.target.value)}
                  inputProps={{ step: "0.01", min: 0, max: 100 }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  type="number"
                  label="% Resolución"
                  value={formData.iveporcentajeresolucion}
                  onChange={(e) => handleInputChange("iveporcentajeresolucion", e.target.value)}
                  inputProps={{ step: "0.01", min: 0, max: 100 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Nro. Resolución"
                  value={formData.ivenumresolucion}
                  onChange={(e) => handleInputChange("ivenumresolucion", e.target.value)}
                  inputProps={{ maxLength: 30 }}
                />
              </Grid>

              <Grid item xs={12} sm={9}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Motivo / Descripción"
                  value={formData.ivemotivo}
                  onChange={(e) => handleInputChange("ivemotivo", e.target.value)}
                  inputProps={{ maxLength: 255 }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="Estado"
                  value={formData.ivestatus}
                  onChange={(e) => handleInputChange("ivestatus", e.target.value)}
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

export default EditarExcepcionesdeIVA
