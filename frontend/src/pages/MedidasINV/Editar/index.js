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

const EditarMedidasINV = () => {
  const navigate = useNavigate()
  const { state } = useLocation() 
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Rescatamos el valor original de la Clave Primaria
  const medcodigoViejo = state?.medcodigo ?? ""

  const [formData, setFormData] = useState({
    medcodigo: "",
    meddescri: "",
    medstatus: "A",
  })

  useEffect(() => {
    if (state) {
      setFormData({
        medcodigo: state.medcodigo || "",
        meddescri: state.meddescri || "",
        medstatus: state.medstatus || "A",
      })
    }
  }, [state])

  const { mutateAsync: SaveEdicionMedida, isPending: isSaving, isError } = useMutation({
    queryKey: ["isEditingMedidaINV"],
    fn: async (data) => {
      const response = await api.post("/MedidasINV/updateMedidasINV", data)
      return response.data
    },
    showError: "modal", 
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    let processedValue = value
    if (typeof value === "string" && field !== "medstatus") {
      processedValue = value.toUpperCase()
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    const payload = {
      medcodigoOld: medcodigoViejo,
      medcodigoNew: formData.medcodigo,
      meddescri: formData.meddescri,
      medstatus: formData.medstatus,
    }

    if (!payload.medcodigoNew.trim()) return showWarning("El Código de la Medida es obligatorio")
    if (!payload.meddescri.trim()) return showWarning("La descripción de la Medida es obligatoria")

    await SaveEdicionMedida(payload)
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
          <b>Editar Unidad de Medida</b>
        </div>

        <CustomBackdrop isLoading={isSaving} />

        <Box sx={StyledRoot}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, background: "white" }} component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mb: 3 }}>Datos Generales</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField 
                  fullWidth label="Código de Medida *" 
                  value={formData.medcodigo} 
                  onChange={(e) => handleInputChange("medcodigo", e.target.value)} 
                  error={isError && !formData.medcodigo}
                  inputProps={{ maxLength: 3 }} 
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField 
                  fullWidth label="Descripción de la Medida *" 
                  value={formData.meddescri} 
                  onChange={(e) => handleInputChange("meddescri", e.target.value)} 
                  error={isError && !formData.meddescri}
                  inputProps={{ maxLength: 30 }} 
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                  select fullWidth label="Estado" 
                  value={formData.medstatus} 
                  onChange={(e) => handleInputChange("medstatus", e.target.value)}
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

export default EditarMedidasINV