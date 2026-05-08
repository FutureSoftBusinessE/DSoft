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

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const StyledRoot = {
  width: "100%", maxWidth: "800px", margin: "0 auto", padding: "20px",
  backgroundColor: "#f5f7fa", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const EditarMarcasINV = () => {
  const navigate = useNavigate()
  const { state } = useLocation() 
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Rescatamos el valor original de la Clave Primaria
  const marcodigoViejo = state?.marcodigo ?? ""

  const [formData, setFormData] = useState({
    marcodigo: "",
    mardescri: "",
    marstatus: "A",
  })

  useEffect(() => {
    if (state) {
      setFormData({
        marcodigo: state.marcodigo || "",
        mardescri: state.mardescri || "",
        marstatus: state.marstatus || "A",
      })
    }
  }, [state])

  const { mutateAsync: SaveEdicionMarca, isPending: isSaving, isError } = useMutation({
    queryKey: ["isEditingMarcaINV"],
    fn: async (data) => {
      const response = await api.post("/MarcasINV/updateMarcasINV", data)
      return response.data
    },
    showError: "modal", 
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    let processedValue = value
    if (typeof value === "string" && field !== "marstatus") {
      processedValue = value.toUpperCase()
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    const payload = {
      marcodigoOld: marcodigoViejo,
      marcodigoNew: formData.marcodigo,
      mardescri: formData.mardescri,
      marstatus: formData.marstatus,
    }

    if (!payload.marcodigoNew.trim()) return showWarning("El Código de la Marca es obligatorio")
    if (!payload.mardescri.trim()) return showWarning("La descripción de la Marca es obligatoria")

    await SaveEdicionMarca(payload)
  }

  // Buscamos el botón GRABAR en la configuración del menú
  const grabarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")
  const toolbarActions = grabarAction ? [{ 
    label: grabarAction.acccaption, 
    key: grabarAction.acccaption, 
    icon: getIconComponent(grabarAction.accnameicono, grabarAction.acctipoico) 
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
          <b>Editar Marca de Inventario</b>
        </div>

        <CustomBackdrop isLoading={isSaving} />

        <Box sx={StyledRoot}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, background: "white" }} component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mb: 3 }}>Datos de la Marca</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField 
                  fullWidth label="Código de Marca *" 
                  value={formData.marcodigo} 
                  onChange={(e) => handleInputChange("marcodigo", e.target.value)} 
                  error={isError && !formData.marcodigo}
                  inputProps={{ maxLength: 5 }} 
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField 
                  fullWidth label="Descripción de la Marca *" 
                  value={formData.mardescri} 
                  onChange={(e) => handleInputChange("mardescri", e.target.value)} 
                  error={isError && !formData.mardescri}
                  inputProps={{ maxLength: 30 }} 
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                  select fullWidth label="Estado" 
                  value={formData.marstatus} 
                  onChange={(e) => handleInputChange("marstatus", e.target.value)}
                  InputLabelProps={{ shrink: true }}
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

export default EditarMarcasINV