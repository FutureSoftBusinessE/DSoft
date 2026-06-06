/* eslint-disable camelcase */
import { useState, useEffect, useContext } from "react"
import { useNavigate, useLocation } from "react-router-dom"
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

const EditarServicioNDNC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado inicial del formulario adaptado para enviar al backend
  const [formData, setFormData] = useState({
    serncnd: "D",
    sercodigo: "",
    serdescri: "",
    serstatus: "A",
    aplica_iva: true,
    formulario_autorizado: true,
  })

  // Cargar y transformar los datos al abrir la pantalla
  useEffect(() => {
    if (location.state) {
      const rowData = location.state

      // Transformamos los numéricos de la BD a booleanos para los checkboxes del Frontend
      const aplica_iva_bool = rowData.seriva === 1 || rowData.seriva === 1.0
      const formulario_autorizado_bool = rowData.serautor === 1

      setFormData({
        ...rowData,
        aplica_iva: aplica_iva_bool,
        formulario_autorizado: formulario_autorizado_bool,
      })
    } else {
      // Si entra por URL directa sin datos, se le redirige a la tabla principal
      navigate("/home/dashboard/ServiciosNDNC")
    }
  }, [location, navigate])

  const { mutateAsync: SaveEdicionServicio, isPending: isSavingEdicion } = useMutation({
    queryKey: ["isUpdatingServicioNDNC"],
    fn: async (data) => {
      const response = await api.post("/ServiciosNDNC/updateServiciosNDNC", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    let finalValue = value

    // El código está bloqueado, solo validamos longitud de descripción
    if (field === "serdescri") {
      finalValue = value.toUpperCase().slice(0, 40)
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  const handleCheckboxChange = (field, checked) => {
    setFormData((prev) => ({ ...prev, [field]: checked }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    try {
      if (!formData.serdescri.trim()) {
        showWarning("La descripción del servicio es obligatoria")
        return
      }

      await SaveEdicionServicio(formData)
    } catch (error) {
      console.error("Error al actualizar el Servicio ND/NC:", error)
    }
  }

  // BARRA DE ACCIONES SUPERIOR (Botón de grabar/actualizar)
  const actualizarAction = selectedMenuInfo?.data?.barraAcciones?.find(
    (action) =>
      action?.acccaption === "ACTUALIZAR" ||
      action?.acccaption === "GUARDAR" ||
      action?.acccaption === "EDITAR" ||
      action?.acccaption === "GRABAR",
  )

  const toolbarActions = []
  if (actualizarAction) {
    toolbarActions.push({
      label: actualizarAction.acccaption,
      key: actualizarAction.acccaption,
      icon: getIconComponent(actualizarAction.accnameicono, actualizarAction.acctipoico),
    })
  } else {
    // Fallback de seguridad si no viene de base de datos
    toolbarActions.push({ label: "Grabar", key: "GRABAR", icon: <Save /> })
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
          <b>Editar Servicio ND/NC: {formData.sercodigo}</b>
        </div>

        <CustomBackdrop isLoading={isSavingEdicion} />

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

              {/* TextFields: Código (Bloqueado) y Descripción */}
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Código *"
                  value={formData.sercodigo}
                  disabled // BLOQUEADO POR SEGURIDAD (Llave primaria)
                />
              </Grid>

              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  label="Descripción *"
                  value={formData.serdescri}
                  onChange={(e) => handleInputChange("serdescri", e.target.value)}
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

export default EditarServicioNDNC
