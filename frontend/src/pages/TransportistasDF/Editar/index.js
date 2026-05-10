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

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const StyledRoot = {
  width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "20px",
  backgroundColor: "#f5f7fa", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const EditarTransportistaDF = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)
  
  // Rescatamos el valor original de la Clave Primaria para el WHERE del Backend
  const transcodigoViejo = state?.transcodigo ?? ""

  // Estado completo del formulario mapeado a inbtranspor
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

  useEffect(() => {
    // Precargar todos los datos desde el estado de la grilla
    if (state) {
      setFormData({
        transcodigo: state.transcodigo || "",
        transdescri: state.transdescri || "",
        transdirec: state.transdirec || "",
        transruc: state.transruc || "",
        transtelef1: state.transtelef1 || "",
        transstatus: state.transstatus || "A",
        transtipo: state.transtipo || "L",
        transcuenta: state.transcuenta || "",
        transcontactonombre: state.transcontactonombre || "",
        transcontactodirec: state.transcontactodirec || "",
        transcontactoemail: state.transcontactoemail || "",
        transcontactotelef: state.transcontactotelef || "",
        transplaca: state.transplaca || "",
      })
    }
  }, [state])

  // Función de Validación de Identificación para Transportistas
  const validarIdentificacionTransportista = (tipoTrans, numero) => {
    if (tipoTrans === "I") return { ok: true }; // Internacional no valida algoritmo
    const num = String(numero || "").trim();
    if (!/^\d+$/.test(num)) return { ok: false, msg: "La identificación debe contener solo números" };
    if (num.length !== 10 && num.length !== 13) return { ok: false, msg: "Debe tener 10 (Cédula) o 13 (RUC) dígitos" };
    if (num.length === 13 && !num.endsWith("001")) return { ok: false, msg: "Un RUC válido debe terminar en 001" };

    const digitos = num.split('').map(Number);
    if (digitos[2] < 6) { // Persona Natural
      let suma = 0; const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
      for (let i = 0; i < 9; i++) { let v = digitos[i] * coef[i]; suma += v > 9 ? v - 9 : v; }
      if (((suma % 10 === 0) ? 0 : 10 - (suma % 10)) !== digitos[9]) return { ok: false, msg: "Dígito verificador de Cédula/RUC incorrecto" };
    }
    return { ok: true };
  }

  const { mutateAsync: SaveEdicion, isPending: isSaving } = useMutation({
    queryKey: ["isEditingTransportistaDF"],
    fn: async (data) => (await api.post("/TransportistasDF/updateTransportistasDF", data)).data,
    showError: "modal", 
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value, isEmail = false) => {
    let val = typeof value === "string" && !isEmail && field !== "transstatus" ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [field]: val }));
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.transcodigo.trim() || !formData.transdescri.trim() || !formData.transruc.trim()) {
      return showWarning("Campos obligatorios vacíos (Código, Nombre, Cédula)");
    }

    const checkID = validarIdentificacionTransportista(formData.transtipo, formData.transruc);
    if (!checkID.ok) return showWarning(checkID.msg);

    try {
      await SaveEdicion({ transcodigoOld: transcodigoViejo, transcodigoNew: formData.transcodigo, ...formData });
    } catch (error) {
      console.log("Error controlado en edición");
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
        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px" }}>
          <b>Editar Transportista: {transcodigoViejo}</b>
        </div>
        <CustomBackdrop isLoading={isSaving} />
        <Box sx={StyledRoot}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }} component="form" onSubmit={handleSubmit}>
            
            {/* SECCIÓN 1: DATOS GENERALES */}
            <Typography variant="h6" color="primary">Datos Generales</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Código *" value={formData.transcodigo} onChange={(e) => handleInputChange("transcodigo", e.target.value)} inputProps={{ maxLength: 3 }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Tipo de Transportista *" value={formData.transtipo} onChange={(e) => handleInputChange("transtipo", e.target.value)} InputLabelProps={{ shrink: true }}>
                  <MenuItem value="L">LOCAL</MenuItem>
                  <MenuItem value="I">INTERNACIONAL</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth label="Estado" value={formData.transstatus} onChange={(e) => handleInputChange("transstatus", e.target.value)} InputLabelProps={{ shrink: true }}>
                  <MenuItem value="A">ACTIVO</MenuItem>
                  <MenuItem value="I">INACTIVO</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Nombre *" value={formData.transdescri} onChange={(e) => handleInputChange("transdescri", e.target.value)} inputProps={{ maxLength: 100 }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Dirección *" value={formData.transdirec} onChange={(e) => handleInputChange("transdirec", e.target.value)} inputProps={{ maxLength: 100 }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Teléfono" value={formData.transtelef1} onChange={(e) => handleInputChange("transtelef1", e.target.value)} inputProps={{ maxLength: 15 }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Cédula/R.U.C. *" value={formData.transruc} onChange={(e) => handleInputChange("transruc", e.target.value)} inputProps={{ maxLength: 20 }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Número de Cuenta" value={formData.transcuenta} onChange={(e) => handleInputChange("transcuenta", e.target.value)} inputProps={{ maxLength: 20 }} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>

            {/* SECCIÓN 2: CONTACTO */}
            <Typography variant="h6" color="primary" sx={{ mt: 4 }}>Contacto</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Nombre del Contacto" value={formData.transcontactonombre} onChange={(e) => handleInputChange("transcontactonombre", e.target.value)} inputProps={{ maxLength: 100 }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Dirección del Contacto" value={formData.transcontactodirec} onChange={(e) => handleInputChange("transcontactodirec", e.target.value)} inputProps={{ maxLength: 100 }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" value={formData.transcontactoemail} onChange={(e) => handleInputChange("transcontactoemail", e.target.value, true)} placeholder="ejemplo: juanperez@email.com" inputProps={{ maxLength: 100 }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Teléfono del Contacto" value={formData.transcontactotelef} onChange={(e) => handleInputChange("transcontactotelef", e.target.value)} inputProps={{ maxLength: 20 }} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>

            {/* SECCIÓN 3: GUÍA DE REMISIÓN */}
            <Divider sx={{ my: 4 }} />
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Placa Sugerida para la Guía de Remisión Electrónica" value={formData.transplaca} onChange={(e) => handleInputChange("transplaca", e.target.value)} inputProps={{ maxLength: 10 }} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default EditarTransportistaDF;