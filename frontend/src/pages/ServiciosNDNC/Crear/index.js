/* eslint-disable camelcase */
import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Paper,
  TextField,
  Tooltip,
  IconButton,
  Grid,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
} from "@mui/material"
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
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const CrearServicioNDNC = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado inicial del formulario (Alineado a las expectativas del backend)
  const [formData, setFormData] = useState({
    serncnd: "D", // Por defecto: Nota de Débito
    sercodigo: "",
    serdescri: "",
    serstatus: "A",
    aplica_iva: true,
    formulario_autorizado: true,
  })

  // Hook de mutación estandarizado SIACDEV1.0
  const { mutateAsync: SaveNuevoServicio, isPending: isSavingServicio } = useMutation({
    queryKey: ["isCreatingServicioNDNC"],
    fn: async (data) => {
      const response = await api.post("/ServiciosNDNC/createServiciosNDNC", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1), // Regresa a la grilla tras guardar con éxito
  })

  // Manejador de inputs de texto y select con restricciones de la base de datos
  const handleInputChange = (field, value) => {
    let finalValue = value

    if (field === "sercodigo") {
      finalValue = value.toUpperCase().slice(0, 3) // Límite varchar(3)
    } else if (field === "serdescri") {
      finalValue = value.toUpperCase().slice(0, 40) // Límite varchar(40)
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  // Manejador para checkboxes
  const handleCheckboxChange = (field, checked) => {
    setFormData((prev) => ({ ...prev, [field]: checked }))
  }

  // Validación previa al envío
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    try {
      if (!formData.sercodigo.trim()) {
        showWarning("El código de servicio es obligatorio")
        return
      }
      if (!formData.serdescri.trim()) {
        showWarning("La descripción del servicio es obligatoria")
        return
      }

      await SaveNuevoServicio(formData)
    } catch (error) {
      console.error("Error al crear el Servicio ND/NC:", error)
    }
  }

  // BARRA DE ACCIONES SUPERIOR
  const crearAction = selectedMenuInfo?.data?.barraAcciones?.find(
    (action) => action?.acccaption === "CREAR" || action?.acccaption === "EJECUTAR" || action?.acccaption === "GUARDAR",
  )

  const toolbarActions = []

  if (crearAction) {
    toolbarActions.push({
      label: crearAction.acccaption,
      key: crearAction.acccaption,
      icon: getIconComponent(crearAction.accnameicono, crearAction.acctipoico),
    })
  } else {
    // Fallback: Si no hay configuración en la BD, dibujamos el botón de grabar
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
        <Box>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSavingServicio}
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
          <b>Crear Servicio para ND / NC</b>
        </div>

        <CustomBackdrop isLoading={isSavingServicio} />

        <Box sx={StyledRoot}>
          <Paper
            elevation={3}
            sx={{ p: 4, mb: 3, borderRadius: 3, background: "white" }}
            component="form"
            onSubmit={handleSubmit}
          >
            <Grid container spacing={4}>
              {/* Radio Group: Tipo de Servicio */}
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontWeight: "bold", color: "text.primary" }}>
                    Tipo de Servicio
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.serncnd}
                    onChange={(e) => handleInputChange("serncnd", e.target.value)}
                  >
                    <FormControlLabel value="D" control={<Radio color="primary" />} label="NOTA DE DÉBITO" />
                    <FormControlLabel value="C" control={<Radio color="primary" />} label="NOTA DE CRÉDITO POR MONTO" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* TextFields: Código y Descripción */}
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Código *"
                  value={formData.sercodigo}
                  onChange={(e) => handleInputChange("sercodigo", e.target.value)}
                  placeholder="Ej: CGR"
                />
              </Grid>

              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  label="Descripción *"
                  value={formData.serdescri}
                  onChange={(e) => handleInputChange("serdescri", e.target.value)}
                  placeholder="Ej: CANCELACION GRAVAMEN"
                />
              </Grid>

              {/* Select: Estado */}
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.serstatus}
                  onChange={(e) => handleInputChange("serstatus", e.target.value)}
                >
                  <MenuItem value="A">ACTIVO</MenuItem>
                  <MenuItem value="I">INACTIVO</MenuItem>
                </TextField>
              </Grid>

              {/* Checkboxes: IVA y Formulario Autorizado */}
              <Grid item xs={12} sm={8}>
                <FormGroup sx={{ display: "flex", flexDirection: "column", ml: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.aplica_iva}
                        onChange={(e) => handleCheckboxChange("aplica_iva", e.target.checked)}
                        color="primary"
                      />
                    }
                    label="¿Aplica I.V.A.?"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.formulario_autorizado}
                        onChange={(e) => handleCheckboxChange("formulario_autorizado", e.target.checked)}
                        color="primary"
                      />
                    }
                    label="¿Formulario Autorizado?"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearServicioNDNC
