import { useState, useContext, useEffect } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
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

const CrearAutorizacionesSri = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Obtener fecha actual en formato YYYY-MM-DD para inicializar
  const today = new Date().toISOString().split("T")[0]

  const [formData, setFormData] = useState({
    sripreauto: "E", // E = Electrónica por defecto
    sriautnumeroold: "",
    sritramite: 6, // 6 = Solicitud por defecto
    sriautnumero: "9999999999",
    sriautfecemi: today,
    sriautfecven: "2100-12-31",
  })

  // Efecto para manejar el cambio dinámico entre Electrónica y las demás
  useEffect(() => {
    if (formData.sripreauto === "E") {
      setFormData((prev) => ({
        ...prev,
        sriautnumero: "9999999999",
        sriautfecven: "2100-12-31",
      }))
    } else {
      // Si cambia a A o P, y tenía los valores por defecto de E, los limpiamos
      if (formData.sriautnumero === "9999999999") {
        setFormData((prev) => ({
          ...prev,
          sriautnumero: "",
          sriautfecven: "",
        }))
      }
    }
  }, [formData.sripreauto])

  const { mutateAsync: SaveCreacion, isPending: isSaving } = useMutation({
    queryKey: ["isCreatingAutorizacionSri"],
    fn: async (dataPayload) => await api.post("/AutorizacionesSri/createAutorizacionesSri", dataPayload),
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    if (!formData.sriautnumero || Number(formData.sriautnumero) <= 0) {
      return showWarning("El Número de Autorización es obligatorio y debe ser mayor a cero.")
    }
    if (!formData.sriautfecemi || !formData.sriautfecven) {
      return showWarning("Las fechas de validez y caducidad son obligatorias.")
    }

    // Convertir campos a los tipos esperados antes de enviar
    const payload = {
      ...formData,
      sritramite: Number(formData.sritramite),
      sriautnumeroold: Number(formData.sriautnumeroold) || 0,
      sriautnumero: Number(formData.sriautnumero),
    }

    await SaveCreacion(payload)
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
          <b>Ingreso de Números de Autorizaciones del SRI</b>
        </div>

        <CustomBackdrop isLoading={isSaving} />

        <Box sx={StyledRoot} component="form" onSubmit={handleSubmit}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, border: "1px solid #ccc" }}>
            <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
              Datos Generales
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* SECCIÓN 1: TIPO DE AUTORIZACIÓN */}
            <Box sx={{ border: "1px solid #ddd", borderRadius: 1, p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}>
                      Tipo de Autorización
                    </FormLabel>
                    <RadioGroup
                      row
                      name="sripreauto"
                      value={formData.sripreauto}
                      onChange={(e) => handleInputChange("sripreauto", e.target.value)}
                    >
                      <FormControlLabel value="A" control={<Radio color="primary" />} label="AutoImpresores" />
                      <FormControlLabel value="P" control={<Radio color="primary" />} label="PreImpresa" />
                      <FormControlLabel value="E" control={<Radio color="primary" />} label={<b>Electrónica</b>} />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="number"
                    fullWidth
                    label="Número de Autorización Activa"
                    InputLabelProps={{ shrink: true }}
                    value={formData.sriautnumeroold}
                    onChange={(e) => handleInputChange("sriautnumeroold", e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* SECCIÓN 2: TIPO DE TRÁMITE */}
            <Box sx={{ border: "1px solid #ddd", borderRadius: 1, p: 2, mb: 3 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}>
                  Tipo de Trámite
                </FormLabel>
                <RadioGroup
                  name="sritramite"
                  value={formData.sritramite}
                  onChange={(e) => handleInputChange("sritramite", Number(e.target.value))}
                  sx={{ ml: 4 }}
                >
                  <FormControlLabel value={6} control={<Radio color="primary" />} label="6 Solicitud de autorización" />
                  <FormControlLabel
                    value={7}
                    control={<Radio color="primary" />}
                    label="7 Solicitud de autorización por cambio de Software"
                  />
                  <FormControlLabel
                    value={8}
                    control={<Radio color="primary" />}
                    label="8 Renovación de la autorización"
                  />
                  <FormControlLabel value={9} control={<Radio color="primary" />} label="9 Baja de la autorización" />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* SECCIÓN 3: DATOS DE LA AUTORIZACIÓN */}
            <Box sx={{ border: "1px solid #ddd", borderRadius: 1, p: 3 }}>
              <FormLabel component="legend" sx={{ fontWeight: "bold", color: "primary.main", mb: 2 }}>
                Datos de la Autorización
              </FormLabel>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    disabled={formData.sripreauto === "E"}
                    type="number"
                    fullWidth
                    label="Número de Autorización *"
                    InputLabelProps={{ shrink: true }}
                    value={formData.sriautnumero}
                    onChange={(e) => handleInputChange("sriautnumero", e.target.value)}
                    sx={{ bgcolor: formData.sripreauto === "E" ? "#f0f0f0" : "transparent" }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="date"
                    fullWidth
                    label="Válido desde *"
                    InputLabelProps={{ shrink: true }}
                    value={formData.sriautfecemi}
                    onChange={(e) => handleInputChange("sriautfecemi", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    disabled={formData.sripreauto === "E"}
                    type="date"
                    fullWidth
                    label="Caduca en *"
                    InputLabelProps={{ shrink: true }}
                    value={formData.sriautfecven}
                    onChange={(e) => handleInputChange("sriautfecven", e.target.value)}
                    sx={{ bgcolor: formData.sripreauto === "E" ? "#f0f0f0" : "transparent" }}
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

export default CrearAutorizacionesSri
