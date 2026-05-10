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

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const StyledRoot = {
  width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "20px",
  backgroundColor: "#f5f7fa", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const CrearTransportistaDF = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    transcodigo: "",
    transdescri: "",
    transdirec: "",
    transruc: "",
    transtelef1: "",
    transstatus: "A",
    transtipo: "L", 
    transcuenta: "",
    transcontactonombre: "",
    transcontactodirec: "",
    transcontactoemail: "",
    transcontactotelef: "",
    transplaca: ""
  })

  // Función de Validación de Identificación para Transportistas
  const validarIdentificacionTransportista = (tipoTrans, numero) => {
    // Si es internacional, no se valida algoritmo matemático (similar a Pasaporte)
    if (tipoTrans === "I") return { ok: true };

    const num = String(numero || "").trim();
    if (!/^\d+$/.test(num)) return { ok: false, msg: "La identificación debe contener solo números" };

    // Determinamos si es Cédula o RUC por la longitud
    if (num.length !== 10 && num.length !== 13) {
      return { ok: false, msg: "La identificación local debe tener 10 (Cédula) o 13 (RUC) dígitos" };
    }

    if (num.length === 13 && !num.endsWith("001")) {
      return { ok: false, msg: "Un RUC válido debe terminar en 001" };
    }

    const digitos = num.split('').map(Number);
    const provincia = parseInt(num.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return { ok: false, msg: "Código de provincia inválido" };

    const tercerDigito = digitos[2];
    
    // PERSONA NATURAL - Módulo 10
    if (tercerDigito < 6) {
      let suma = 0;
      const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
      for (let i = 0; i < 9; i++) {
        let v = digitos[i] * coeficientes[i];
        suma += v > 9 ? v - 9 : v;
      }
      const verificador = (suma % 10 === 0) ? 0 : 10 - (suma % 10);
      if (verificador !== digitos[9]) return { ok: false, msg: "Número de identificación incorrecto (Dígito verificador fallido)" };
      return { ok: true };
    }

    // SOCIEDADES PRIVADAS - Módulo 11
    if (tercerDigito === 9) {
      const coef = [4, 3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;
      for (let i = 0; i < 9; i++) suma += digitos[i] * coef[i];
      const verificador = (suma % 11 === 0) ? 0 : 11 - (suma % 11);
      if (verificador !== digitos[9]) return { ok: false, msg: "RUC Jurídico incorrecto" };
      return { ok: true };
    }

    return { ok: true };
  }

  const { mutateAsync: SaveCreacion, isPending: isSaving } = useMutation({
    queryKey: ["isCreatingTransportistaDF"],
    fn: async (data) => (await api.post("/TransportistasDF/createTransportistasDF", data)).data,
    showError: "modal", showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value, isEmail = false) => {
    let val = typeof value === "string" && !isEmail ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [field]: val }));
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.transcodigo.trim() || !formData.transdescri.trim() || !formData.transruc.trim()) {
      return showWarning("Código, Nombre y Cédula/RUC son obligatorios");
    }

    // Validación de Identificación
    const checkID = validarIdentificacionTransportista(formData.transtipo, formData.transruc);
    if (!checkID.ok) return showWarning(checkID.msg);

    try {
      await SaveCreacion(formData);
    } catch (error) {
      console.log("Error controlado en creación");
    }
  }

  const action = selectedMenuInfo?.data?.barraAcciones?.find(a => a.acccaption === "GRABAR")

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
        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px" }}><b>Crear Transportista</b></div>
        <CustomBackdrop isLoading={isSaving} />
        <Box sx={StyledRoot}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" color="primary">Datos Generales</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}><TextField fullWidth label="Código *" value={formData.transcodigo} onChange={(e) => handleInputChange("transcodigo", e.target.value)} inputProps={{ maxLength: 3 }} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Tipo de Transportista *" value={formData.transtipo} onChange={(e) => handleInputChange("transtipo", e.target.value)}>
                  <MenuItem value="L">LOCAL</MenuItem>
                  <MenuItem value="I">INTERNACIONAL</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth label="Estado" value={formData.transstatus} onChange={(e) => handleInputChange("transstatus", e.target.value)}>
                  <MenuItem value="A">ACTIVO</MenuItem>
                  <MenuItem value="I">INACTIVO</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}><TextField fullWidth label="Nombre *" value={formData.transdescri} onChange={(e) => handleInputChange("transdescri", e.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Dirección *" value={formData.transdirec} onChange={(e) => handleInputChange("transdirec", e.target.value)} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Teléfono" value={formData.transtelef1} onChange={(e) => handleInputChange("transtelef1", e.target.value)} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Cédula/R.U.C. *" value={formData.transruc} onChange={(e) => handleInputChange("transruc", e.target.value)} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Número de Cuenta" value={formData.transcuenta} onChange={(e) => handleInputChange("transcuenta", e.target.value)} /></Grid>
            </Grid>
            <Typography variant="h6" color="primary" sx={{ mt: 4 }}>Contacto</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Nombre Contacto" value={formData.transcontactonombre} onChange={(e) => handleInputChange("transcontactonombre", e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Dirección Contacto" value={formData.transcontactodirec} onChange={(e) => handleInputChange("transcontactodirec", e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={formData.transcontactoemail} onChange={(e) => handleInputChange("transcontactoemail", e.target.value, true)} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Teléfono Contacto" value={formData.transcontactotelef} onChange={(e) => handleInputChange("transcontactotelef", e.target.value)} /></Grid>
            </Grid>
            <Divider sx={{ my: 4 }} />
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={6}><TextField fullWidth label="Placa Sugerida (Guía Remisión)" value={formData.transplaca} onChange={(e) => handleInputChange("transplaca", e.target.value)} /></Grid>
            </Grid>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}
export default CrearTransportistaDF;