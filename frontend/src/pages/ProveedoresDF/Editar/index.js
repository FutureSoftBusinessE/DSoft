import { useEffect, useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, MenuItem, Typography, Divider } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"

const theme = createTheme({ palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } } })
const StyledRoot = {
  width: "100%",
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
}

const EditarProveedorDF = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [formData, setFormData] = useState({
    procodigo: "",
    procalif: "R",
    proruc: "",
    pronombre: "",
    pronommat: "",
    prodirec: "",
    proemail: "",
    protelef1: "",
    procelu: "",
    prostatus: "A",
  })

  useEffect(() => {
    if (state) {
      setFormData({
        procodigo: state.procodigo || "",
        procalif: state.procalif || state["Tipo de Identificacion"] || "R",
        proruc: state.proruc || state["Cedula o Ruc"] || "",
        pronombre: state.pronombre || state.Nombre || "",
        pronommat: state.pronommat || state["Razon Social"] || "",
        prodirec: state.prodirec || state.Direccion || "",
        proemail: state.proemail || state.Email || "",
        procelu: state.procelu || state.Celular || "",
        prostatus: state.prostatus || state.Estado || "A",
      })
    }
  }, [state])

  const { mutateAsync: SaveEdicion, isPending: isSaving } = useMutation({
    queryKey: ["isEditingProveedorDF"],
    fn: async (data) => (await api.post("/ProveedoresDF/updateProveedoresDF", data)).data,
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (formData.procalif === "R" && formData.proruc.length !== 13) return showWarning("R.U.C. inválido (13 dígitos)")
    if (formData.procalif === "C" && formData.proruc.length !== 10) return showWarning("Cédula inválida (10 dígitos)")

    try {
      await SaveEdicion(formData)
    } catch (error) {}
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
              <IconButton onClick={handleSubmit} disabled={isSaving} sx={{ border: "1px solid #ddd" }}>
                {getIconComponent(action.accnameicono, action.acctipoico)}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px" }}>
          <b>Editar Proveedor: {formData.procodigo}</b>
        </div>
        <CustomBackdrop isLoading={isSaving} />
        <Box sx={StyledRoot}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" color="primary">
              Información
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={2}>
                <TextField
                  disabled
                  fullWidth
                  label="Código"
                  value={formData.procodigo}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Tipo"
                  value={formData.procalif}
                  onChange={(e) => setFormData({ ...formData, procalif: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="R">R.U.C.</MenuItem>
                  <MenuItem value="C">CÉDULA</MenuItem>
                  <MenuItem value="P">PASAPORTE</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cédula / R.U.C. *"
                  value={formData.proruc}
                  onChange={(e) => setFormData({ ...formData, proruc: e.target.value.replace(/\D/g, "") })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre *"
                  value={formData.pronombre}
                  onChange={(e) => setFormData({ ...formData, pronombre: e.target.value.toUpperCase() })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Razón Social"
                  value={formData.pronommat}
                  onChange={(e) => setFormData({ ...formData, pronommat: e.target.value.toUpperCase() })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección *"
                  value={formData.prodirec}
                  onChange={(e) => setFormData({ ...formData, prodirec: e.target.value.toUpperCase() })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Email"
                  value={formData.proemail}
                  onChange={(e) => setFormData({ ...formData, proemail: e.target.value.toLowerCase() })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Celular"
                  value={formData.procelu}
                  onChange={(e) => setFormData({ ...formData, procelu: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.prostatus}
                  onChange={(e) => setFormData({ ...formData, prostatus: e.target.value })}
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
export default EditarProveedorDF
