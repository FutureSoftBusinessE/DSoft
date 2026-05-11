import { useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, Typography, MenuItem, Divider } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"

const theme = createTheme({ palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } } })
const StyledRoot = { width: "100%", maxWidth: "1100px", margin: "0 auto", padding: "20px", backgroundColor: "#f5f7fa", borderRadius: "12px" }

const CrearProveedorDF = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [formData, setFormData] = useState({ procalif: "R", proruc: "", pronombre: "", pronommat: "", prodirec: "", proemail: "", protelef1: "", procelu: "", prostatus: "A" })

  const { mutateAsync: SaveCreacion, isPending: isSaving } = useMutation({
    queryKey: ["isCreatingProveedorDF"],
    fn: async (data) => (await api.post("/ProveedoresDF/createProveedoresDF", data)).data,
    showError: "modal", showSuccess: "toast", onSuccess: () => navigate(-1),
  })

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    // Validación de Identificación
    if (formData.procalif === "R" && formData.proruc.length !== 13) return showWarning("El R.U.C. debe tener 13 dígitos")
    if (formData.procalif === "C" && formData.proruc.length !== 10) return showWarning("La Cédula debe tener 10 dígitos")
    if (!formData.pronombre.trim() || !formData.prodirec.trim()) return showWarning("Nombre y Dirección son obligatorios")

    try { await SaveCreacion(formData) } catch (error) {}
  }

  const action = selectedMenuInfo?.data?.barraAcciones?.find(a => a.acccaption === "GRABAR")

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <Box sx={{ mb: 2 }}>
          {action && <Tooltip title={action.acccaption}><IconButton onClick={handleSubmit} disabled={isSaving} sx={{ border: "1px solid #ddd" }}>{getIconComponent(action.accnameicono, action.acctipoico)}</IconButton></Tooltip>}
        </Box>
        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px" }}><b>Nuevo Proveedor (Código Automático)</b></div>
        <CustomBackdrop isLoading={isSaving} />
        <Box sx={StyledRoot}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" color="primary">Identificación</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField select fullWidth label="Tipo" value={formData.procalif} onChange={(e) => setFormData({...formData, procalif: e.target.value, proruc: ""})}>
                  <MenuItem value="R">R.U.C.</MenuItem><MenuItem value="C">CÉDULA</MenuItem><MenuItem value="P">PASAPORTE</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label="Cédula / R.U.C. *" value={formData.proruc} onChange={(e) => setFormData({...formData, proruc: e.target.value.replace(/\D/g, "")})} inputProps={{ maxLength: formData.procalif === "R" ? 13 : 10 }} />
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Nombre Comercial *" value={formData.pronombre} onChange={(e) => setFormData({...formData, pronombre: e.target.value.toUpperCase()})} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Razón Social" value={formData.pronommat} onChange={(e) => setFormData({...formData, pronommat: e.target.value.toUpperCase()})} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Dirección *" value={formData.prodirec} onChange={(e) => setFormData({...formData, prodirec: e.target.value.toUpperCase()})} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Email" value={formData.proemail} onChange={(e) => setFormData({...formData, proemail: e.target.value.toLowerCase()})} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Celular" value={formData.procelu} onChange={(e) => setFormData({...formData, procelu: e.target.value})} /></Grid>
              <Grid item xs={12} sm={4}><TextField select fullWidth label="Estado" value={formData.prostatus} onChange={(e) => setFormData({...formData, prostatus: e.target.value})}><MenuItem value="A">ACTIVO</MenuItem><MenuItem value="I">INACTIVO</MenuItem></TextField></Grid>
            </Grid>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}
export default CrearProveedorDF;