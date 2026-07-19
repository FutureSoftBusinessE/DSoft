import Header from "../../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  InputLabel,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  Alert,
  Snackbar,
} from "@mui/material"
import { useState } from "react"
import BackIcon from "../../../components/BackIcon"
import CustomBackdrop from "../../../components/CustomBackdrop"
import CrearIcon from "../../../assets/iconos/Crear.ico"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"

const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(8),
  flexGrow: 1,
  padding: "0 16px",
  minHeight: "100vh",
}))

const theme = createTheme({
  palette: {
    primary: {
      main: "#196C87",
    },
    secondary: {
      main: "#196C87",
    },
  },
})

// Opciones para tipo de identificación
const opcionesIdentificacion = [
  { value: "", label: "No seleccionar" },
  { value: "C", label: "Cédula" },
  { value: "R", label: "RUC" },
  { value: "P", label: "Pasaporte" },
  { value: "O", label: "Consumidor Final" },
]

// Opciones para sexo
const opcionesSexo = [
  { value: "", label: "No seleccionar" },
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
]

// Opciones para estado civil
const opcionesEstadoCivil = [
  { value: "", label: "No seleccionar" },
  { value: "SOLTERO", label: "Soltero" },
  { value: "CASADO", label: "Casado" },
  { value: "DIVORCIADO", label: "Divorciado" },
  { value: "VIUDO", label: "Viudo" },
  { value: "UNION LIBRE", label: "Unión Libre" },
]

// Opciones para tipo de persona (tipcodigo según BD)
const opcionesTipoPersona = [
  { value: "", label: "No seleccionar" },
  { value: "001", label: "Persona Natural" },
  { value: "002", label: "Persona Jurídica" },
]

// Estado inicial con los campos que SÍ van al frontend
const initialFormState = {
  tipcodigo: "",
  cliidentifica: "",
  cliruc: "",
  clinombre: "",
  clidirec: "",
  cliemail: "",
  clisexo: "",
  cliestciv: "",
  clifecnac: "",
  clipersona: "",
  cliintersec: "",
  clitelef1: "",
  clitelef2: "",
  clifax: "",
  cliprofesion: "",
}

// Validación de Identificación Ecuatoriana
const validarIdentificacion = (tipo, numeroStr) => {
  if (!numeroStr) return { ok: false, msg: "El número de identificación está vacío." }
  const numero = numeroStr.trim()

  if (tipo === "P") return { ok: true }
  if (tipo === "O") {
    if (numero !== "9999999999999") return { ok: false, msg: "Para 'Consumidor Final' solo se permite 9999999999999" }
    return { ok: true }
  }
  if (tipo === "R") {
    if (numero.length !== 13) return { ok: false, msg: "El RUC debe tener 13 dígitos" }
    if (!numero.endsWith("001")) return { ok: false, msg: "El RUC debe terminar en 001" }
  }
  if (tipo === "C" && numero.length !== 10) return { ok: false, msg: "La Cédula debe tener 10 dígitos" }

  const digitos = numero.split("").map(Number)
  const provincia = parseInt(numero.substring(0, 2), 10)
  if (provincia < 1 || provincia > 24) return { ok: false, msg: "Provincia inválida" }

  const tercerDigito = digitos[2]
  if (tercerDigito < 6) {
    let suma = 0
    const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    for (let i = 0; i < 9; i++) {
      const v = digitos[i] * coef[i]
      suma += v > 9 ? v - 9 : v
    }
    if ((suma % 10 === 0 ? 0 : 10 - (suma % 10)) !== digitos[9])
      return { ok: false, msg: "Dígito verificador incorrecto" }
  } else if (tercerDigito === 9) {
    const coef = [4, 3, 2, 7, 6, 5, 4, 3, 2]
    let suma = 0
    for (let i = 0; i < 9; i++) suma += digitos[i] * coef[i]
    if ((suma % 11 === 0 ? 0 : 11 - (suma % 11)) !== digitos[9]) return { ok: false, msg: "RUC Jurídico incorrecto" }
  }
  return { ok: true }
}

const CrearCreacionClientes = () => {
  const [formData, setFormData] = useState(initialFormState)
  const [isSaving, setIsSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })

  const handleTipoPersonaChange = (value) => {
    let clipersona = ""
    if (value === "001") {
      clipersona = "N"
    } else if (value === "002") {
      clipersona = "J"
    }
    setFormData((prev) => ({
      ...prev,
      tipcodigo: value,
      clipersona,
    }))
  }

  const handleInputChange = (field, value) => {
    // Convierte el texto a mayúsculas a excepción del correo electrónico
    const val = field !== "cliemail" && typeof value === "string" ? value.toUpperCase() : value
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }))
  }

  const limpiarFormulario = () => {
    setFormData(initialFormState)
  }

  const mostrarSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    })
  }

  const cerrarSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleCrearCliente = async () => {
    // 1. Validaciones de campos obligatorios
    if (
      !formData.cliidentifica?.trim() ||
      !formData.cliruc?.trim() ||
      !formData.clinombre?.trim() ||
      !formData.clidirec?.trim()
    ) {
      return mostrarSnackbar(
        "Tipo de identificación, Número de Identificación, Nombre y Dirección son obligatorios.",
        "warning",
      )
    }

    // 2. Validación matemática y lógica del RUC/Cédula Ecuatoriana
    const checkID = validarIdentificacion(formData.cliidentifica, formData.cliruc)
    if (!checkID.ok) {
      return mostrarSnackbar(checkID.msg, "error")
    }

    try {
      setIsSaving(true)

      // 4. Preparar datos para inserción
      const datosCliente = {
        tipcodigo: formData.tipcodigo,
        cliidentifica: formData.cliidentifica,
        cliruc: formData.cliruc,
        clinombre: formData.clinombre,
        clidirec: formData.clidirec,
        cliemail: formData.cliemail,
        clisexo: formData.clisexo,
        cliestciv: formData.cliestciv,
        clifecnac: formData.clifecnac,
        clipersona: formData.clipersona,
        cliintersec: formData.cliintersec,
        clitelef1: formData.clitelef1,
        clitelef2: formData.clitelef2,
        clifax: formData.clifax,
        cliprofesion: formData.cliprofesion,

        // Campos con valores por defecto
        clirepres: "",
        clidiasrecibefac1: "0",
        cliconespecial: "0",
        cliapliiva: -1,
        cliivaped: -1,
        clibloqueo: 0,
        cliidencon: "O",
        tarenviosta: "D",
        clicuotaven: 0,
        clidiapago: 0,
        clidiaentregafac: 0,
        cliorigening: "I",
        clidemanda: 0,
        clicastigada: 0,
        cliparterel: 0,
        invcodigo: "01",
        clistatus: "A",
        zoncodigo: "",
        regcodigo: "",
        procodigo: "",
        ciucodigo: "",
        activicodigo: "",
        sectorcodigo: "",
        clirucmatriz: "",
        clinommatriz: "",
      }

      // 5. Enviar datos a la API
      const response = await fetchwrapper(`/CreacionCliente/saveCliente`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosCliente),
      })

      const result = await response.json()

      if (result.tipmsg === "Success") {
        mostrarSnackbar(result.msg, "success")
        limpiarFormulario()
      } else {
        mostrarSnackbar(result.msg || "Error al crear el cliente", "error")
      }
    } catch (error) {
      console.error("Error al crear cliente:", error)
      mostrarSnackbar("Error al crear el cliente. Por favor, intente nuevamente.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CustomBackdrop isLoading={isSaving} />
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <BackIcon />
        </div>
        <Tooltip title="Crear cliente">
          <Button
            color="primary"
            onClick={handleCrearCliente}
            disabled={isSaving}
            sx={{
              marginBlock: "15px",
            }}
          >
            <img src={CrearIcon} alt="Crear" style={{ width: "30px", height: "30px" }} />
          </Button>
        </Tooltip>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 30px 30px 30px",
            fontSize: "25px",
          }}
        >
          <b>Creación de Clientes</b>
        </div>

        <Box className={StyledRoot}>
          <Grid container justifyContent="center">
            <Grid item xs={12} md={12} lg={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3 }}>
                    Información del Cliente
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Tipo de Persona */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Tipo de Persona</InputLabel>
                        <Select
                          value={formData.tipcodigo}
                          onChange={(e) => handleTipoPersonaChange(e.target.value)}
                          label="Tipo de Persona"
                        >
                          {opcionesTipoPersona.map((opcion) => (
                            <MenuItem key={opcion.value} value={opcion.value}>
                              {opcion.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Tipo de Identificación */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Tipo de Identificación *</InputLabel>
                        <Select
                          value={formData.cliidentifica}
                          onChange={(e) => handleInputChange("cliidentifica", e.target.value)}
                          label="Tipo de Identificación *"
                        >
                          {opcionesIdentificacion.map((opcion) => (
                            <MenuItem key={opcion.value} value={opcion.value}>
                              {opcion.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Número de Identificación (RUC/Cédula) */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Identificación *"
                        value={formData.cliruc}
                        onChange={(e) => handleInputChange("cliruc", e.target.value)}
                      />
                    </Grid>

                    {/* Sexo */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Sexo</InputLabel>
                        <Select
                          value={formData.clisexo}
                          onChange={(e) => handleInputChange("clisexo", e.target.value)}
                          label="Sexo"
                        >
                          {opcionesSexo.map((opcion) => (
                            <MenuItem key={opcion.value} value={opcion.value}>
                              {opcion.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Estado Civil */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Estado Civil</InputLabel>
                        <Select
                          value={formData.cliestciv}
                          onChange={(e) => handleInputChange("cliestciv", e.target.value)}
                          label="Estado Civil"
                        >
                          {opcionesEstadoCivil.map((opcion) => (
                            <MenuItem key={opcion.value} value={opcion.value}>
                              {opcion.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Fecha de Nacimiento */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Fecha de Nacimiento"
                        type="date"
                        value={formData.clifecnac}
                        onChange={(e) => handleInputChange("clifecnac", e.target.value)}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>

                    {/* Nombres y Apellidos */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nombres y Apellidos *"
                        value={formData.clinombre}
                        onChange={(e) => handleInputChange("clinombre", e.target.value)}
                      />
                    </Grid>

                    {/* Profesión */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Profesión"
                        value={formData.cliprofesion}
                        onChange={(e) => handleInputChange("cliprofesion", e.target.value)}
                      />
                    </Grid>

                    {/* Dirección */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Dirección *"
                        value={formData.clidirec}
                        onChange={(e) => handleInputChange("clidirec", e.target.value)}
                        multiline
                        rows={2}
                      />
                    </Grid>

                    {/* Email */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.cliemail}
                        onChange={(e) => handleInputChange("cliemail", e.target.value)}
                      />
                    </Grid>

                    {/* Teléfono 1 */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Teléfono 1"
                        value={formData.clitelef1}
                        onChange={(e) => handleInputChange("clitelef1", e.target.value)}
                      />
                    </Grid>

                    {/* Teléfono 2 */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Teléfono 2"
                        value={formData.clitelef2}
                        onChange={(e) => handleInputChange("clitelef2", e.target.value)}
                      />
                    </Grid>

                    {/* Fax */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Fax"
                        value={formData.clifax}
                        onChange={(e) => handleInputChange("clifax", e.target.value)}
                      />
                    </Grid>

                    {/* Teléfono Celular (Intersección) */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Teléfono Celular"
                        value={formData.cliintersec}
                        onChange={(e) => handleInputChange("cliintersec", e.target.value)}
                      />
                    </Grid>

                    {/* Botones de acción */}
                    <Grid item xs={12} container spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={limpiarFormulario}
                          disabled={isSaving}
                          sx={{
                            py: 1.5,
                            borderColor: "#196C87",
                            color: "#196C87",
                            "&:hover": {
                              borderColor: "#145369",
                              backgroundColor: "rgba(25, 108, 135, 0.04)",
                            },
                          }}
                        >
                          Limpiar Formulario
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={cerrarSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={cerrarSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  )
}

export default CrearCreacionClientes
