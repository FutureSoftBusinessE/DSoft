import { useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
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

const CrearClienteDF = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    cliidentifica: "C",
    cliruc: "",
    clinombre: "",
    clidirec: "",
    cliemail: "",
    clitelef1: "",
    cliintersec: "",
    clistatus: "A"
  })

  // Validación de Identificación Ecuatoriana
  const validarIdentificacion = (tipo, numero) => {
    if (tipo === "P") return { ok: true }; 
    if (tipo === "O") { 
      if (numero !== "9999999999999") return { ok: false, msg: "Para 'OTROS' solo se permite 9999999999999" };
      return { ok: true };
    }
    if (tipo === "R") {
      if (numero.length !== 13) return { ok: false, msg: "El RUC debe tener 13 dígitos" };
      if (!numero.endsWith("001")) return { ok: false, msg: "El RUC debe terminar en 001" };
    }
    if (tipo === "C" && numero.length !== 10) return { ok: false, msg: "La Cédula debe tener 10 dígitos" };

    const digitos = numero.split('').map(Number);
    const provincia = parseInt(numero.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return { ok: false, msg: "Provincia inválida" };

    const tercerDigito = digitos[2];
    if (tercerDigito < 6) {
      let suma = 0; const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
      for (let i = 0; i < 9; i++) { let v = digitos[i] * coef[i]; suma += v > 9 ? v - 9 : v; }
      if (((suma % 10 === 0) ? 0 : 10 - (suma % 10)) !== digitos[9]) return { ok: false, msg: "Dígito verificador incorrecto" };
    } else if (tercerDigito === 9) {
      const coef = [4, 3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0; for (let i = 0; i < 9; i++) suma += digitos[i] * coef[i];
      if (((suma % 11 === 0) ? 0 : 11 - (suma % 11)) !== digitos[9]) return { ok: false, msg: "RUC Jurídico incorrecto" };
    }
    return { ok: true };
  }

  const { mutateAsync: SaveCreacion, isPending: isSaving } = useMutation({
    queryKey: ["isCreatingClienteDF"],
    fn: async (data) => (await api.post("/CreacionClienteDF/createCreacionClienteDF", data)).data,
    showError: "modal", // El modal de SIAC manejará el mensaje
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    let val = field !== "cliemail" && typeof value === "string" ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [field]: val }));
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.cliruc.trim() || !formData.clinombre.trim() || !formData.clidirec.trim()) {
      return showWarning("Cédula, Nombre y Dirección son obligatorios");
    }

    const checkID = validarIdentificacion(formData.cliidentifica, formData.cliruc);
    if (!checkID.ok) return showWarning(checkID.msg);

    try {
      // Capturamos la promesa para evitar el overlay rojo
      await SaveCreacion(formData);
    } catch (error) {
      // El error ya fue mostrado por el modal automático
      console.log("Error de validación capturado");
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
              <IconButton onClick={handleSubmit} disabled={isSaving} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px" }}><b>Creación de Nuevo Cliente</b></div>
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
export default CrearClienteDF;