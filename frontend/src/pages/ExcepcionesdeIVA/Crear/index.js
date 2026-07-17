import { useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, Typography, MenuItem, Autocomplete } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, useQuery, api, showWarning } from "../../../api"
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

const CrearExcepcionesdeIVA = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    ivetipocompania: "",
    ivefecinicio: "",
    ivefectermino: "",
    iveporcentajeactual: 0,
    iveporcentajeresolucion: 0,
    ivenumresolucion: "",
    ivemotivo: "",
    ivestatus: "A",
  })

  // --- LÓGICA PARA COMBO TIPO COMPAÑÍA ---
  const { data: rawTipos, isLoading: isLoadingTipos } = useQuery({
    queryKey: ["listaTiposCompania_Crear"],
    queryFn: async () => {
      try {
        const response = await api.get("/ExcepcionesdeIVA/getListaTipoCompania")
        return response?.data?.data || response?.data || response || []
      } catch (error) {
        console.error("Error al cargar Tipos de Compañía:", error)
        return []
      }
    },
  })

  const tiposValidados = Array.isArray(rawTipos) ? rawTipos : Array.isArray(rawTipos?.data) ? rawTipos.data : []
  const listaTipos = tiposValidados.map((item) => ({
    id: item.tpcodigo || item.id,
    label: item.label || `${item.tpcodigo} - ${item.tpdescripcion || ""}`,
  }))
  // --- FIN LÓGICA COMBO ---

  const {
    mutateAsync: SaveCreacionExcepcion,
    isPending: isSavingCreacion,
    isError,
  } = useMutation({
    queryKey: ["isCreatingExcepcionIVA"],
    fn: async (data) => {
      const response = await api.post("/ExcepcionesdeIVA/createExcepcionesdeIVA", data)
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

    if (!formData.ivetipocompania.trim()) return showWarning("Debe seleccionar un Tipo de Compañía")
    if (!formData.ivefecinicio) return showWarning("La Fecha de Inicio es obligatoria")
    if (!formData.ivefectermino) return showWarning("La Fecha de Término es obligatoria")

    if (new Date(formData.ivefecinicio) > new Date(formData.ivefectermino)) {
      return showWarning("La Fecha de Término no puede ser menor a la Fecha de Inicio")
    }

    const payload = {
      ...formData,
      ivefecinicio: formData.ivefecinicio.replace("T", " ") + ":00",
      ivefectermino: formData.ivefectermino.replace("T", " ") + ":00",
    }

    await SaveCreacionExcepcion(payload)
  }

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
        <BackIcon />

        <Box sx={{ mb: 2 }}>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSavingCreacion || isLoadingTipos}
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
          <b>Crear Nueva Excepción de IVA</b>
        </div>

        <CustomBackdrop isLoading={isSavingCreacion || isLoadingTipos} />

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
              {/* COMBO TIPO DE COMPAÑÍA */}
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={listaTipos}
                  getOptionLabel={(option) => option.label || ""}
                  value={
                    listaTipos.find((c) => c.id === formData.ivetipocompania) ||
                    (formData.ivetipocompania
                      ? { id: formData.ivetipocompania, label: `${formData.ivetipocompania}` }
                      : null)
                  }
                  onChange={(event, newValue) => handleInputChange("ivetipocompania", newValue ? newValue.id : "")}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tipo de Compañía *"
                      placeholder="Buscar tipo..."
                      InputLabelProps={{ shrink: true }}
                      error={isError && !formData.ivetipocompania}
                    />
                  )}
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

export default CrearExcepcionesdeIVA
