import { useState, useContext, useEffect } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Box,
  Paper,
  TextField,
  Tooltip,
  IconButton,
  Grid,
  Typography,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const StyledRoot = {
  width: "100%",
  maxWidth: "900px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const EditarAutorizacionesSri = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    sripreauto: "",
    sriautnumeroold: "",
    sritramite: 6,
    sriautnumero: "",
    sriautfecemi: "",
    sriautfecven: "",
  })

  // Carga de datos desde la grilla
  useEffect(() => {
    if (state) {
      setFormData({
        sripreauto: state.sripreauto || "E",
        sriautnumeroold: state.sriautnumeroold || "",
        sritramite: Number(state.sritramite) || 6,
        sriautnumero: state.sriautnumero || "",
        sriautfecemi: state.sriautfecemi || "", // Ya viene en YYYY-MM-DD desde el backend
        sriautfecven: state.sriautfecven || "",
      })
    }
  }, [state])

  const { mutateAsync: SaveEdicion, isPending: isSaving } = useMutation({
    queryKey: ["isEditingAutorizacionSri"],
    fn: async (dataPayload) => await api.post("/AutorizacionesSri/updateAutorizacionesSri", dataPayload),
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    if (!formData.sriautfecven) {
      return showWarning("La fecha de caducidad ('Caduca en') es obligatoria.")
    }

    if (formData.sripreauto !== "E" && !formData.sriautfecemi) {
      return showWarning("La fecha de inicio ('Válido desde') es obligatoria.")
    }

    // Se envía el payload asegurando los tipos numéricos para el backend
    await SaveEdicion({
      sripreauto: formData.sripreauto,
      sriautnumero: Number(formData.sriautnumero),
      sriautfecemi: formData.sriautfecemi,
      sriautfecven: formData.sriautfecven,
    })
  }

  const action = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "GRABAR")

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <Box sx={{ mb: 2 }}>
          {action && (
            <Tooltip title={action.acccaption}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSaving}
                sx={{ border: "1px solid #ddd", bgcolor: "white" }}
              >
                {getIconComponent(action.accnameicono, action.acctipoico)}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px" }}>
          <b>Visualización y Edición de Autorización SRI</b>
        </div>

        <CustomBackdrop isLoading={isSaving} />

        <Box sx={StyledRoot} component="form" onSubmit={handleSubmit}>
          {/* Alerta Informativa de Reglas de Negocio */}
          <Alert severity="info" sx={{ mb: 3 }}>
            {formData.sripreauto === "E"
              ? "Modo de Edición: Por ser una Autorización Electrónica, solo puede modificar la Fecha de Caducidad."
              : "Modo de Edición: Puede modificar la Fecha de Inicio y la Fecha de Caducidad."}
          </Alert>

          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, border: "1px solid #ccc" }}>
            <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
              Datos Generales (Solo Lectura)
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* SECCIÓN 1: TIPO DE AUTORIZACIÓN (BLOQUEADO) */}
            <Box sx={{ border: "1px solid #ddd", borderRadius: 1, p: 2, mb: 3, bgcolor: "#f9f9f9" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <FormControl component="fieldset" disabled>
                    <FormLabel component="legend" sx={{ fontWeight: "bold", color: "text.secondary", mb: 1 }}>
                      Tipo de Autorización
                    </FormLabel>
                    <RadioGroup row name="sripreauto" value={formData.sripreauto}>
                      <FormControlLabel value="A" control={<Radio />} label="AutoImpresores" />
                      <FormControlLabel value="P" control={<Radio />} label="PreImpresa" />
                      <FormControlLabel value="E" control={<Radio />} label="Electrónica" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    disabled
                    type="number"
                    fullWidth
                    label="Número de Autorización Activa"
                    InputLabelProps={{ shrink: true }}
                    value={formData.sriautnumeroold}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* SECCIÓN 2: TIPO DE TRÁMITE (BLOQUEADO) */}
            <Box sx={{ border: "1px solid #ddd", borderRadius: 1, p: 2, mb: 3, bgcolor: "#f9f9f9" }}>
              <FormControl component="fieldset" fullWidth disabled>
                <FormLabel component="legend" sx={{ fontWeight: "bold", color: "text.secondary", mb: 1 }}>
                  Tipo de Trámite
                </FormLabel>
                <RadioGroup name="sritramite" value={formData.sritramite} sx={{ ml: 4 }}>
                  <FormControlLabel value={6} control={<Radio />} label="6 Solicitud de autorización" />
                  <FormControlLabel
                    value={7}
                    control={<Radio />}
                    label="7 Solicitud de autorización por cambio de Software"
                  />
                  <FormControlLabel value={8} control={<Radio />} label="8 Renovación de la autorización" />
                  <FormControlLabel value={9} control={<Radio />} label="9 Baja de la autorización" />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* SECCIÓN 3: DATOS DE LA AUTORIZACIÓN (EDICIÓN CONDICIONAL) */}
            <Box sx={{ border: "1px solid #ddd", borderRadius: 1, p: 3 }}>
              <FormLabel component="legend" sx={{ fontWeight: "bold", color: "primary.main", mb: 2 }}>
                Datos de la Autorización
              </FormLabel>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    disabled
                    type="number"
                    fullWidth
                    label="Número de Autorización"
                    InputLabelProps={{ shrink: true }}
                    value={formData.sriautnumero}
                    sx={{ bgcolor: "#f0f0f0" }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    disabled={formData.sripreauto === "E"}
                    type="date"
                    fullWidth
                    label="Válido desde *"
                    InputLabelProps={{ shrink: true }}
                    value={formData.sriautfecemi}
                    onChange={(e) => handleInputChange("sriautfecemi", e.target.value)}
                    sx={{ bgcolor: formData.sripreauto === "E" ? "#f0f0f0" : "transparent" }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="date"
                    fullWidth
                    label="Caduca en *"
                    InputLabelProps={{ shrink: true }}
                    value={formData.sriautfecven}
                    onChange={(e) => handleInputChange("sriautfecven", e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default EditarAutorizacionesSri
