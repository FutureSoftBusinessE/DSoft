import { useEffect, useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, MenuItem, Typography, Autocomplete } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const StyledRoot = {
  width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "20px",
  backgroundColor: "#f5f7fa", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

// Lista de años para el selector
const currentYear = new Date().getFullYear()
const listaAnios = Array.from({ length: 10 }, (_, i) => ({
  id: currentYear + 1 - i,
  label: (currentYear + 1 - i).toString()
}))

const EditarSectorialesIess = () => {
  const navigate = useNavigate()
  const { state } = useLocation() // Recibimos la fila seleccionada desde la grilla
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Rescatamos los valores originales de la Clave Primaria
  const seccodigoViejo = state?.seccodigo ?? ""
  const secanioViejo = state?.secanio ?? ""

  // Estado del formulario
  const [formData, setFormData] = useState({
    seccodigo: "",
    secanio: "",
    seccargo: "",
    secestruc: "",
    secdetalle: "",
    secsalario: "",
    secstatus: "A",
  })

  useEffect(() => {
    // Precargar los datos desde el estado de la grilla
    if (state) {
      setFormData({
        seccodigo: state.seccodigo || "",
        secanio: state.secanio || "",
        seccargo: state.seccargo || "",
        secestruc: state.secestruc || "",
        secdetalle: state.secdetalle || "",
        secsalario: state.secsalario || "",
        secstatus: state.secstatus || "A",
      })
    }
  }, [state])

  // Mutación para actualizar el registro
  const { mutateAsync: SaveEdicionSectorial, isPending: isSaving, isError } = useMutation({
    queryKey: ["isEditingSectorialIess"],
    fn: async (data) => {
      const response = await api.post("/SectorialesIess/updateSectorialesIess", data)
      return response.data
    },
    showError: "modal", 
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value, isNumber = false) => {
    let processedValue = value
    if (typeof value === "string" && !isNumber && field !== "secstatus") {
      processedValue = value.toUpperCase()
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    // Payload estructurado para la Clave Primaria Compuesta en el Backend
    const payload = {
      seccodigoOld: seccodigoViejo,
      seccodigoNew: formData.seccodigo,
      secanioOld: secanioViejo,
      secanioNew: formData.secanio,
      seccargo: formData.seccargo,
      secestruc: formData.secestruc,
      secdetalle: formData.secdetalle,
      secsalario: formData.secsalario,
      secstatus: formData.secstatus,
    }

    try {
      if (!payload.seccodigoNew.trim()) return showWarning("El Código IESS es obligatorio")
      if (!payload.secanioNew) return showWarning("El Año es obligatorio")
      if (!payload.seccargo.trim()) return showWarning("La descripción del Cargo o Actividad es obligatoria")
      if (!payload.secsalario) return showWarning("Debe ingresar un salario válido")

      await SaveEdicionSectorial(payload)
    } catch (error) {
      console.error("Error al editar el Sectorial:", error)
    }
  }

  const ejecutarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "EJECUTAR")
  const toolbarActions = ejecutarAction ? [{ label: ejecutarAction.acccaption, key: ejecutarAction.acccaption, icon: getIconComponent(ejecutarAction.accnameicono, ejecutarAction.acctipoico) }] : []

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
                disabled={isSaving} 
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, mr: 1 }}
              >
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Editar Registro Sectorial IESS</b>
        </div>

        <CustomBackdrop isLoading={isSaving} />

        <Box sx={StyledRoot}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, background: "white" }} component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mb: 3 }}>Datos del Salario Sectorial</Typography>
            <Grid container spacing={3}>
              
              <Grid item xs={12} sm={3}>
                <TextField 
                  fullWidth 
                  label="Código IESS *" 
                  value={formData.seccodigo} 
                  onChange={(e) => handleInputChange("seccodigo", e.target.value)} 
                  error={isError && !formData.seccodigo}
                  inputProps={{ maxLength: 15 }} 
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Autocomplete
                  options={listaAnios}
                  getOptionLabel={(option) => option.label || ""}
                  value={listaAnios.find((a) => a.id === formData.secanio) || null}
                  onChange={(event, newValue) => handleInputChange("secanio", newValue ? newValue.id : "")}
                  renderInput={(params) => (
                    <TextField {...params} label="Año *" error={isError && !formData.secanio} InputLabelProps={{ shrink: true }} />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField 
                  fullWidth 
                  label="Salario Sectorial *" 
                  type="number"
                  value={formData.secsalario} 
                  onChange={(e) => handleInputChange("secsalario", e.target.value, true)} 
                  error={isError && !formData.secsalario}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField 
                  select 
                  fullWidth 
                  label="Estado" 
                  value={formData.secstatus} 
                  onChange={(e) => handleInputChange("secstatus", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="A">ACTIVO</MenuItem>
                  <MenuItem value="I">INACTIVO</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField 
                  fullWidth 
                  label="Cargo o Actividad *" 
                  value={formData.seccargo} 
                  onChange={(e) => handleInputChange("seccargo", e.target.value)} 
                  error={isError && !formData.seccargo}
                  inputProps={{ maxLength: 200 }} 
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField 
                  fullWidth 
                  label="Estructura Ocupacional" 
                  value={formData.secestruc} 
                  onChange={(e) => handleInputChange("secestruc", e.target.value)} 
                  inputProps={{ maxLength: 10 }} 
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  multiline 
                  rows={3} 
                  label="Comentarios / Detalles" 
                  value={formData.secdetalle} 
                  onChange={(e) => handleInputChange("secdetalle", e.target.value)} 
                  inputProps={{ maxLength: 500 }} 
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

            </Grid>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default EditarSectorialesIess