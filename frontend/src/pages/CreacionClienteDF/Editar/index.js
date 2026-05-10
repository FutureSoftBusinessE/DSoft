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
  width: "100%", maxWidth: "1000px", margin: "0 auto", padding: "20px",
  backgroundColor: "#f5f7fa", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const EditarClienteDF = () => {
  const navigate = useNavigate()
  const { state } = useLocation() 
  const { selectedMenuInfo } = useContext(GlobalContext)
  const clicodigoOriginal = state?.clicodigo ?? ""

  const [formData, setFormData] = useState({
    clicodigo: "", cliidentifica: "C", cliruc: "", clinombre: "",
    clidirec: "", cliemail: "", clitelef1: "", cliintersec: "", clistatus: "A"
  })

  useEffect(() => {
    if (state) {
      setFormData({
        clicodigo: state.clicodigo || "",
        cliidentifica: String(state.cliidentifica || "C").trim().toUpperCase(),
        cliruc: state.cliruc || "",
        clinombre: state.clinombre || "",
        clidirec: state.clidirec || "",
        cliemail: state.cliemail || "",
        clitelef1: state.clitelef1 || "",
        cliintersec: state.cliintersec || "",
        clistatus: state.clistatus || "A",
      })
    }
  }, [state])

  const validarIdentificacion = (tipo, numero) => {
    if (tipo === "P") return { ok: true };
    if (tipo === "O") {
      if (numero !== "9999999999999") return { ok: false, msg: "Solo se permite 9999999999999 para 'OTROS'" };
      return { ok: true };
    }
    if (tipo === "R") {
        if (numero.length !== 13) return { ok: false, msg: "RUC debe tener 13 dígitos" };
        if (!numero.endsWith("001")) return { ok: false, msg: "RUC debe terminar en 001" };
    }
    if (tipo === "C" && numero.length !== 10) return { ok: false, msg: "Cédula debe tener 10 dígitos" };
    
    const digitos = numero.split('').map(Number);
    if (digitos[2] < 6) {
      let suma = 0; const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
      for (let i = 0; i < 9; i++) { let v = digitos[i] * coef[i]; suma += v > 9 ? v - 9 : v; }
      if (((suma % 10 === 0) ? 0 : 10 - (suma % 10)) !== digitos[9]) return { ok: false, msg: "Identificación inválida" };
    }
    return { ok: true };
  }

  const { mutateAsync: SaveEdicion, isPending: isSaving } = useMutation({
    queryKey: ["isEditingClienteDF"],
    fn: async (data) => (await api.post("/CreacionClienteDF/updateCreacionClienteDF", data)).data,
    showError: "modal", // Captura el error de duplicado del backend
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    let val = field !== "cliemail" && typeof value === "string" ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [field]: val }));
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.cliruc.trim() || !formData.clinombre.trim()) return showWarning("Campos obligatorios vacíos");

    const checkID = validarIdentificacion(formData.cliidentifica, formData.cliruc);
    if (!checkID.ok) return showWarning(checkID.msg);

    try {
      // Enviamos el payload correcto al backend para el UPDATE con validación de RUC
      await SaveEdicion({ clicodigoOld: clicodigoOriginal, clicodigoNew: formData.clicodigo, ...formData });
    } catch (error) {
      console.log("Error controlado en edición");
    }
  }

  const ejecutarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")
  const toolbarActions = ejecutarAction ? [{ label: ejecutarAction.acccaption, key: ejecutarAction.acccaption, icon: getIconComponent(ejecutarAction.accnameicono, ejecutarAction.acctipoico) }] : []

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <Box sx={{ mb: 2 }}>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton onClick={handleSubmit} disabled={isSaving} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, mr: 1 }}>
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px" }}><b>Editar Información del Cliente</b></div>
        <CustomBackdrop isLoading={isSaving} />
        <Box sx={StyledRoot}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }} component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField select fullWidth label="Tipo Identificación *" value={formData.cliidentifica} onChange={(e) => handleInputChange("cliidentifica", e.target.value)}>
                  <MenuItem value="C">CÉDULA</MenuItem>
                  <MenuItem value="R">RUC</MenuItem>
                  <MenuItem value="P">PASAPORTE</MenuItem>
                  <MenuItem value="O">OTROS</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={8}><TextField fullWidth label="Cédula o RUC *" value={formData.cliruc} onChange={(e) => handleInputChange("cliruc", e.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Nombre *" value={formData.clinombre} onChange={(e) => handleInputChange("clinombre", e.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Dirección *" value={formData.clidirec} onChange={(e) => handleInputChange("clidirec", e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={formData.cliemail} onChange={(e) => handleInputChange("cliemail", e.target.value)} /></Grid>
              <Grid item xs={12} sm={3}><TextField fullWidth label="Teléfono" value={formData.clitelef1} onChange={(e) => handleInputChange("clitelef1", e.target.value)} /></Grid>
              <Grid item xs={12} sm={3}><TextField fullWidth label="Celular" value={formData.cliintersec} onChange={(e) => handleInputChange("cliintersec", e.target.value)} /></Grid>
              <Grid item xs={12} sm={4}>
                <TextField select fullWidth label="Estado" value={formData.clistatus} onChange={(e) => handleInputChange("clistatus", e.target.value)}>
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
export default EditarClienteDF;