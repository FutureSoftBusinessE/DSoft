import { useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, Typography, Autocomplete } from "@mui/material"
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

// Generamos una lista de años (del actual hacia atrás y 1 adelante) para el selector
const currentYear = new Date().getFullYear()
const listaAnios = Array.from({ length: 10 }, (_, i) => ({
  id: currentYear + 1 - i,
  label: (currentYear + 1 - i).toString()
}))

const CrearSectorialesIess = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    seccodigo: "",
    secanio: currentYear,
    seccargo: "",
    secestruc: "",
    secdetalle: "",
    secsalario: ""
  })

  // Mutación para guardar el nuevo registro sectorial
  const { mutateAsync: SaveCreacionSectorial, isPending: isSaving, isError } = useMutation({
    queryKey: ["isCreatingSectorialIess"],
    fn: async (data) => {
      // Llamada al endpoint que definimos en el backend
      const response = await api.post("/SectorialesIess/createSectorialesIess", data)
      return response.data
    },
    showError: "modal", showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value, isNumber = false) => {
    let processedValue = value
    if (typeof value === "string" && !isNumber) {
      processedValue = value.toUpperCase()
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    // Validaciones de campos obligatorios según la estructura de la tabla
    if (!formData.seccodigo.trim()) return showWarning("El Código IESS es obligatorio")
    if (!formData.secanio) return showWarning("El Año es obligatorio")
    if (!formData.seccargo.trim()) return showWarning("La descripción del Cargo o Actividad es obligatoria")
    if (!formData.secsalario || isNaN(formData.secsalario)) return showWarning("Debe ingresar un valor de salario válido")
    
    await SaveCreacionSectorial(formData)
  }

  const ejecutarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")
  const toolbarActions = ejecutarAction ? [{ 
    label: ejecutarAction.acccaption, 
    key: ejecutarAction.acccaption, 
    icon: getIconComponent(ejecutarAction.accnameicono, ejecutarAction.acctipoico) 
  }] : []

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
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
              >
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
        
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Crear Registro Sectorial IESS</b>
        </div>

        <CustomBackdrop isLoading={isSaving} />

        <Box sx={StyledRoot}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, background: "white" }} component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mb: 3 }}>
              Información del Salario Sectorial
            </Typography>
            
            <Grid container spacing={3}>
              {/* Código IESS y Año (Clave Primaria Compuesta) */}
              <Grid item xs={12} sm={4}>
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

              <Grid item xs={12} sm={4}>
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

              <Grid item xs={12} sm={4}>
                <TextField 
                  fullWidth 
                  label="Salario Mínimo Sectorial *" 
                  type="number"
                  value={formData.secsalario} 
                  onChange={(e) => handleInputChange("secsalario", e.target.value, true)} 
                  error={isError && !formData.secsalario}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Detalles de la Actividad */}
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
                  label="Comentarios / Detalles del Cargo" 
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

export default CrearSectorialesIess