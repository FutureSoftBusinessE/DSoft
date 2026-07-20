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
  Chip,
  Paper,
} from "@mui/material"
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import BackIcon from "../../../components/BackIcon"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../../../components/CustomBackdrop"
import CrearIcon from "../../../assets/iconos/Crear.ico"
import DocumentosAsociadosTabla from "../../components/Global/DocumentosAsociadosModal/DocumentosAsociadosTabla"
import { useQueryClient } from "@tanstack/react-query"
import DocumentosAsociadosModal from "../../components/Global/DocumentosAsociadosModal"
import AttachFileIcon from "@mui/icons-material/AttachFile"

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

const opcionesIdentificacion = [
  { value: "", label: "No seleccionar" },
  { value: "C", label: "Cédula" },
  { value: "R", label: "RUC" },
  { value: "P", label: "Pasaporte" },
  { value: "O", label: "Consumidor Final" },
]

const opcionesSexo = [
  { value: "", label: "No seleccionar" },
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
]

const opcionesEstadoCivil = [
  { value: "", label: "No seleccionar" },
  { value: "SOLTERO", label: "Soltero" },
  { value: "CASADO", label: "Casado" },
  { value: "DIVORCIADO", label: "Divorciado" },
  { value: "VIUDO", label: "Viudo" },
  { value: "UNION LIBRE", label: "Unión Libre" },
]

const opcionesTipoPersona = [
  { value: "", label: "No seleccionar" },
  { value: "001", label: "Persona Natural" },
  { value: "002", label: "Persona Jurídica" },
]

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
  clirepres: "",
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

const BuscarCreacionClientes = () => {
  const [nextSecuencia, setNextSecuencia] = useState(1)
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const { clicodigo } = location.state

  const [formData, setFormData] = useState(initialFormState)
  const [cliestado, setCliestado] = useState("A")
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (clicodigo) {
      cargarCliente(clicodigo)
    }
  }, [clicodigo])

  const cargarCliente = async (clicodigo) => {
    if (!clicodigo) return
    setIsLoading(true)
    try {
      const response = await fetchwrapper(`/CreacionCliente/getSpecificCliente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clicodigo }),
      })
      const result = await response.json()

      if (result.data) {
        const cliente = result.data
        setFormData({
          tipcodigo: cliente.tipcodigo || "",
          cliidentifica: cliente.cliidentifica || "",
          cliruc: cliente.cliruc || "",
          clinombre: cliente.clinombre || "",
          clidirec: cliente.clidirec || "",
          cliemail: cliente.cliemail || "",
          clisexo: cliente.clisexo || "",
          cliestciv: cliente.cliestciv || "",
          clifecnac: cliente.clifecnac || "",
          clipersona: cliente.clipersona || "",
          cliintersec: cliente.cliintersec || "",
          clitelef1: cliente.clitelef1 || "",
          clitelef2: cliente.clitelef2 || "",
          clifax: cliente.clifax || "",
          cliprofesion: cliente.cliprofesion || "",
          clirepres: cliente.clirepres || "",
        })
        setCliestado(cliente.clistatus || "A")
      } else {
        mostrarSnackbar("Cliente no encontrado", "error")
        navigate(-1)
      }
    } catch (error) {
      console.error("Error al cargar cliente:", error)
      mostrarSnackbar("Error al cargar los datos del cliente", "error")
      navigate(-1)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTipoPersonaChange = (value) => {
    let clipersona = ""
    if (value === "001") clipersona = "N"
    else if (value === "002") clipersona = "J"

    setFormData((prev) => ({ ...prev, tipcodigo: value, clipersona }))
  }

  const handleInputChange = (field, value) => {
    // Evitamos aplicar uppercase al email
    const val = field !== "cliemail" && typeof value === "string" ? value.toUpperCase() : value
    setFormData((prev) => ({ ...prev, [field]: val }))
  }

  const mostrarSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity })
  }

  const cerrarSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleActualizarCliente = async () => {
    // 1. Validaciones de campos obligatorios
    if (!formData.cliruc?.trim() || !formData.clinombre?.trim() || !formData.clidirec?.trim()) {
      return mostrarSnackbar("Identificación, Nombre y Dirección son obligatorios.", "warning")
    }

    // 2. Validación matemática y lógica del RUC/Cédula Ecuatoriana
    const checkID = validarIdentificacion(formData.cliidentifica, formData.cliruc)
    if (!checkID.ok) {
      return mostrarSnackbar(checkID.msg, "error")
    }

    try {
      setIsUpdating(true)

      // 4. Proceder con la actualización
      const datosCliente = {
        clicodigo,
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
        clirepres: formData.clirepres,
        clidiasrecibefac1: "0",
        cliconespecial: "0",
        clistatus: cliestado,
      }

      const response = await fetchwrapper(`/CreacionCliente/editSpecificCliente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosCliente),
      })

      const result = await response.json()

      if (result.tipmsg === "Success") {
        mostrarSnackbar("Cliente actualizado exitosamente", "success")
        await cargarCliente(clicodigo)
      } else {
        mostrarSnackbar(result.msg || "Error al actualizar cliente", "error")
      }
    } catch (error) {
      console.error("Error al actualizar cliente:", error)
      mostrarSnackbar("Error al actualizar el cliente", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleVolver = () => {
    navigate(-1)
  }

  return (
    <ThemeProvider theme={theme}>
      <CustomBackdrop isLoading={isLoading || isUpdating} />
      <Header />
      <div className="main main-app p-3 p-lg-4">
        {/* BARRA DE ACCIONES */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <BackIcon onClick={handleVolver} />

          <Tooltip title="Actualizar cliente">
            <Button color="primary" onClick={handleActualizarCliente} disabled={isUpdating || isLoading}>
              <img src={CrearIcon} alt="Actualizar" style={{ width: "30px", height: "30px" }} />
            </Button>
          </Tooltip>

          {/* Botón que despliega nuestro Modal Universal */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AttachFileIcon />}
            onClick={() => setModalOpen(true)}
            disabled={isLoading || !clicodigo}
          >
            Asociar Documento / Credencial
          </Button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 30px 30px 30px",
            fontSize: "25px",
          }}
        >
          <b>Editar Cliente</b>
        </div>

        <Box className={StyledRoot}>
          {/* Encabezado con código y estado */}
          <Grid container justifyContent="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={10} lg={8}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ color: "#196C87", fontWeight: "bold" }}>
                    Código: {clicodigo}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Chip
                    label={cliestado === "A" ? "ACTIVO" : "INACTIVO"}
                    color={cliestado === "A" ? "success" : "error"}
                    sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
                  />

                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={cliestado}
                      onChange={(e) => setCliestado(e.target.value)}
                      label="Estado"
                      size="small"
                      disabled={isLoading}
                    >
                      <MenuItem value="A">Activo</MenuItem>
                      <MenuItem value="I">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Formulario de cliente */}
          <Grid container justifyContent="center">
            <Grid item xs={12} md={10} lg={8}>
              <Card>
                <CardContent>
                  <Grid container spacing={3}>
                    {/* Tipo de Persona */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth disabled={isLoading}>
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
                      <FormControl fullWidth disabled={isLoading}>
                        <InputLabel>Tipo de Identificación</InputLabel>
                        <Select
                          value={formData.cliidentifica}
                          onChange={(e) => handleInputChange("cliidentifica", e.target.value)}
                          label="Tipo de Identificación"
                        >
                          {opcionesIdentificacion.map((opcion) => (
                            <MenuItem key={opcion.value} value={opcion.value}>
                              {opcion.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Número de Identificación */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Identificación *"
                        value={formData.cliruc}
                        onChange={(e) => handleInputChange("cliruc", e.target.value)}
                        disabled={isLoading}
                      />
                    </Grid>

                    {/* Sexo */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth disabled={isLoading}>
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
                      <FormControl fullWidth disabled={isLoading}>
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
                        InputLabelProps={{ shrink: true }}
                        disabled={isLoading}
                      />
                    </Grid>

                    {/* Nombres y Apellidos */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nombres y Apellidos *"
                        value={formData.clinombre}
                        onChange={(e) => handleInputChange("clinombre", e.target.value)}
                        disabled={false}
                      />
                    </Grid>

                    {/* Profesión */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Profesión"
                        value={formData.cliprofesion}
                        onChange={(e) => handleInputChange("cliprofesion", e.target.value)}
                        disabled={isLoading}
                      />
                    </Grid>

                    {/* Representante Legal */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Representante Legal"
                        value={formData.clirepres}
                        onChange={(e) => handleInputChange("clirepres", e.target.value)}
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
                      />
                    </Grid>

                    {/* Teléfono 1 */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Teléfono 1"
                        value={formData.clitelef1}
                        onChange={(e) => handleInputChange("clitelef1", e.target.value)}
                        disabled={isLoading}
                      />
                    </Grid>

                    {/* Teléfono 2 */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Teléfono 2"
                        value={formData.clitelef2}
                        onChange={(e) => handleInputChange("clitelef2", e.target.value)}
                        disabled={isLoading}
                      />
                    </Grid>

                    {/* Fax */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Fax"
                        value={formData.clifax}
                        onChange={(e) => handleInputChange("clifax", e.target.value)}
                        disabled={isLoading}
                      />
                    </Grid>

                    {/* Teléfono Celular (Intersección) */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Teléfono Celular"
                        value={formData.cliintersec}
                        onChange={(e) => handleInputChange("cliintersec", e.target.value)}
                        disabled={isLoading}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* GRILLA DE VISUALIZACIÓN DE DOCUMENTOS (Pasa la info requerida) */}
              <DocumentosAsociadosTabla
                qgenero={clicodigo}
                procqgenero="CXCMCLI"
                onDataLoaded={(proximaSecuencia) => setNextSecuencia(proximaSecuencia)}
              />
            </Grid>
          </Grid>
        </Box>

        {/* ÚNICO MODAL UNIVERSAL PARA ADJUNTOS */}
        <DocumentosAsociadosModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          contexto={{
            docqgenero: clicodigo,
            docprocqgenero: "CXCMCLI",
            docsecuen: nextSecuencia, // Envía el valor secuencial calculado
          }}
          onSuccess={() => {
            mostrarSnackbar("Documento y/o credencial asociados correctamente", "success")
            // Invalida la query para forzar el refresco de DocumentosAsociadosTabla
            queryClient.invalidateQueries(["documentosAsociados", clicodigo, "CXCMCLI"])
          }}
        />

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

export default BuscarCreacionClientes
