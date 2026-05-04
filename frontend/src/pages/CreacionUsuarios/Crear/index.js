import React, { useState, useEffect } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  CircularProgress,
  Chip,
} from "@mui/material"
import {
  ArrowBack,
  Person,
  Email,
  CalendarToday,
  CheckCircle,
  Cancel,
  Key,
  Badge,
  Category,
  Event,
  Lock,
  LockOpen,
  CreditCard,
  AccountCircle,
  Today,
  Info,
  Visibility,
  Groups,
  Save,
  PersonAdd,
} from "@mui/icons-material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import esLocale from "date-fns/locale/es"
import { addYears } from "date-fns"
import { useQuery, useMutation } from "@tanstack/react-query"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../../../components/CustomBackdrop"
import Swal from "sweetalert2"
import CustomPhotoCam from "../../../components/CustomPhotoCam"
import CustomAutocomplete from "../../../components/CustomAutocomplete"

// Crear el tema
const theme = createTheme({
  palette: {
    primary: {
      main: "#196C87",
    },
    secondary: {
      main: "#2E7D32",
    },
    info: {
      main: "#0288D1",
    },
  },
})

// Estilos para el contenedor principal
const StyledRoot = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

// Hook personalizado para guardar el nuevo usuario
function useSaveCreacionUsuario() {
  return useMutation({
    mutationFn: async (data) => {
      const options = {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      try {
        const response = await fetchwrapper(`/CreacionUsuarios/upsertUsuario`, options)
        return response
      } catch (errorResponse) {
        throw errorResponse?.details?.msg || "Error al crear el usuario"
      }
    },
  })
}

const CrearCreacionUsuarios = () => {
  const navigate = useNavigate()
  const [perfilesDialogOpen, setPerfilesDialogOpen] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [errors, setErrors] = useState({})
  // Hook personalizado para obtener todos los perfiles
  const useGetallPerfiles = () => {
    return useQuery({
      queryKey: ["allPerfilesCreacionUsuario"],
      queryFn: async () => {
        const options = {
          method: "POST",
          body: JSON.stringify({
            usrcodigo: null,
          }),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
        let response = await fetchwrapper(`/CreacionUsuarios/getAllPerfiles`, options)
        response = await response.json()
        return response?.data || []
      },
      refetchOnWindowFocus: false,
    })
  }

  // Obtener perfiles desde la API
  const {
    data: allPerfiles = [],
    isError: isAllPerfilesError,
    isFetching: isAllPerfilesFetching,
    isLoading: isAllPerfilesLoading,
  } = useGetallPerfiles()

  // Hook personalizado para obtener todos los usuarios (sin incluir perfiles)
  const useGetAllUsuarios = () => {
    return useQuery({
      queryKey: ["allUsuariosSinPerfilesCreacion"],
      queryFn: async () => {
        let response = await fetchwrapper(`/CreacionUsuarios/getAllUsuariosSinPerfiles`)

        response = await response.json()
        return response?.data || []
      },
      refetchOnWindowFocus: false,
    })
  }

  // Usar el hook en el componente
  const {
    data: allUsuariosSinPerfiles = [],
    isLoading: isLoadingUsuarios,
    isFetching: isFetchingAllUsuarios,
    isError: isErrorUsuarios,
  } = useGetAllUsuarios()

  const {
    mutateAsync: saveCreacionUsuario,
    isPending: isSavingCreacionUsuario,
    error: errorSavingCreacionUsuario,
    isError: isErrorSavingCreacionUsuario,
  } = useSaveCreacionUsuario()

  // Calcular fecha de hoy + 1 año
  const today = new Date()
  const oneYearFromNow = addYears(today, 1)

  // Estado inicial para el nuevo usuario
  const [formData, setFormData] = useState({
    usrcodigo: "",
    usrnombre: "",
    usrfeccad: oneYearFromNow, // Fecha por defecto: hoy + 1 año
    usrcodper: "",
    usremail: "",
    usrflagoficre: false,
    usrflagperfil: false,
    usrstatus: "A",
    usrdiascaduclave: 0, // Valor por defecto: 0 días
    usrimagen: null, // Imagen de perfil
    usuarioReporta: null, // Array de códigos de usuarios que este nuevo usuario va a reportar
  })

  // Validar formulario
  const validateForm = () => {
    const newErrors = {}

    if (!formData.usrcodigo.trim()) {
      newErrors.usrcodigo = "El código de usuario es requerido"
    }

    if (formData.usrcodigo.trim().length > 10) {
      newErrors.usrcodigo = "El código de usuario no debe exceder los 10 caracteres"
    }

    if (!formData.usrnombre.trim()) {
      newErrors.usrnombre = "El nombre es requerido"
    }

    if (!formData.usremail.trim()) {
      newErrors.usremail = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.usremail)) {
      newErrors.usremail = "El formato del email es inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar cambios en los campos del formulario
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }

    // Si se marca "Es Perfil", limpiar el perfil asignado
    if (field === "usrflagperfil" && value === true) {
      setFormData((prev) => ({
        ...prev,
        usrcodper: "",
      }))
    }
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setSnackbarMessage("Por favor, complete todos los campos requeridos correctamente")
      setSnackbarOpen(true)
      return
    }

    // Encontrar el value correspondiente al label seleccionado
    const selectedPerfil = allPerfiles.find((p) => p.label === formData.usrcodper)

    let valueToSave = null

    if (formData.usrflagperfil) {
      valueToSave = formData.usrcodigo
    } else {
      valueToSave = selectedPerfil ? selectedPerfil.value : ""
    }

    // Preparar datos para enviar al backend
    const userDataToSave = {
      ...formData,
      usrcodper: formData.usrflagperfil ? "" : valueToSave, // Enviar el value al backend
      sOpcion: "NEW",
      usrflagupdateperfilacces: false,
      usuarioReporta: formData.usuarioReporta?.value ?? "",
    }
    // Verificar si el usuario originalmente era perfil (usrflagperfil = true)
    // Y si estamos modificando el perfil asignado (usrcodper)

    if (!userDataToSave.usrflagperfil && userDataToSave.usrcodper && formData.usrstatus === "A") {
      // Mostrar confirmación al usuario
      const result = await Swal.fire({
        title: "Confirmar actualización",
        text: "¿Desea actualizar ACCESOS desde el PERFIL asignado a este usuario?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí",
        cancelButtonText: "No",
        confirmButtonColor: "#196C87",
        allowOutsideClick: false,
        allowEscapeKey: false,
      })

      // Asignar el valor según la respuesta del usuario
      userDataToSave.usrflagupdateperfilacces = result.isConfirmed
    }

    try {
      console.log("Datos del nuevo usuario para guardar:", userDataToSave)
      await saveCreacionUsuario(userDataToSave)
      setSnackbarMessage("Usuario creado correctamente. La contraseña por defecto es el mismo nombre de usuario.")
      setSnackbarOpen(true)
      Swal.fire({
        icon: "success",
        title: "¡Creado con éxito!",
        text: "La operación fue realizada con éxito.",
        confirmButtonText: "OK",
      }).then(() => {
        // Navega hacia la página anterior después de que el usuario haga clic en "OK"
        navigate(-1)
      })
    } catch (error) {
      console.error("Error al crear el usuario:", error)
      setSnackbarMessage(error || "Error al crear el usuario")
      setSnackbarOpen(true)
    }
  }

  // Obtener información del perfil para mostrar
  const getSelectedPerfilLabel = () => {
    return formData.usrcodper || ""
  }

  // Componente para mostrar todos los perfiles disponibles
  const PerfilesDialog = () => (
    <Dialog open={perfilesDialogOpen} onClose={() => setPerfilesDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Groups /> Perfiles Disponibles en el Sistema
      </DialogTitle>
      <DialogContent>
        {isAllPerfilesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : isAllPerfilesError ? (
          <Alert severity="error">Error al cargar los perfiles</Alert>
        ) : (
          <>
            <List>
              {allPerfiles.map((perfil) => (
                <ListItem
                  key={perfil.value}
                  divider
                  button
                  onClick={() => {
                    // Solo permite seleccionar si NO está marcado como "Es Perfil"
                    if (!formData.usrflagperfil) {
                      handleInputChange("usrcodper", perfil.label)
                      setPerfilesDialogOpen(false)
                    }
                  }}
                  sx={{
                    opacity: formData.usrflagperfil ? 0.5 : 1,
                    pointerEvents: formData.usrflagperfil ? "none" : "auto",
                    backgroundColor: perfil.label === formData.usrcodper ? "action.selected" : "transparent",
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {perfil.label}
                        </Typography>
                        {perfil.label === formData.usrcodper && (
                          <Chip label="Seleccionado" color="primary" size="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Valor interno: {perfil.value}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
            {formData.usrflagperfil && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No puede asignar un perfil porque el usuario está marcado como "Es Perfil"
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPerfilesDialogOpen(false)}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <ThemeProvider theme={theme}>
        <Header />
        <div className="main main-app p-3 p-lg-4">
          <BackIcon />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 30px 30px 30px",
              fontSize: "25px",
            }}
          >
            <b>Crear Nuevo Usuario</b>
          </div>

          <CustomBackdrop
            isLoading={
              isAllPerfilesLoading ||
              isAllPerfilesFetching ||
              isSavingCreacionUsuario ||
              isLoadingUsuarios ||
              isFetchingAllUsuarios
            }
          />

          <Box sx={StyledRoot}>
            <Paper
              elevation={3}
              sx={{ p: 3, mb: 3, borderRadius: 3, background: "white" }}
              component="form"
              onSubmit={handleSubmit}
            >
              <Box>
                <CustomPhotoCam
                  label="Foto de perfil"
                  onImage={(img) => {
                    handleInputChange("usrimagen", img ? img.base64Hex : null)
                  }}
                  initialImage={formData.usrimagen ? `data:image/jpeg;base64,${formData.usrimagen}` : null}
                  cropAspect={1} // Formato circular
                  compressOptions={{
                    maxSizeMB: 0.5, // Más compresión para avatares
                    maxWidthOrHeight: 300,
                    useWebWorker: true,
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 3 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <TextField
                    fullWidth
                    label="Código de Usuario (Máximo 10 caracteres)*"
                    value={formData.usrcodigo}
                    onChange={(e) => handleInputChange("usrcodigo", e.target.value)}
                    error={!!errors.usrcodigo}
                    helperText={errors.usrcodigo}
                    onFocus={(e) => e.target.select()}
                  />
                  <TextField
                    fullWidth
                    label="Nombre Completo *"
                    value={formData.usrnombre}
                    onChange={(e) => handleInputChange("usrnombre", e.target.value)}
                    error={!!errors.usrnombre}
                    helperText={errors.usrnombre}
                    sx={{ mb: 1 }}
                    onFocus={(e) => e.target.select()}
                  />
                </Box>

                <FormControl>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.usrstatus}
                    onChange={(e) => handleInputChange("usrstatus", e.target.value)}
                    label="Estado"
                    sx={{ minWidth: 120 }}
                    disabled
                  >
                    <MenuItem value="A">Activo</MenuItem>
                    <MenuItem value="I">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                La contraseña por defecto será el mismo código de usuario. Se recomienda cambiar la contraseña en el
                primer inicio de sesión.
              </Alert>

              <Grid container spacing={3}>
                {/* Información de Cuenta */}
                <Grid item xs={12} md={6}>
                  <Card elevation={2} sx={{ height: "100%", borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}
                      >
                        <Key /> Información de Cuenta
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <Stack spacing={2}>
                        <TextField
                          label="Correo Electrónico *"
                          type="email"
                          fullWidth
                          value={formData.usremail}
                          onChange={(e) => handleInputChange("usremail", e.target.value)}
                          error={!!errors.usremail}
                          helperText={errors.usremail}
                          onFocus={(e) => e.target.select()}
                        />

                        <TextField
                          label="Días para Caducidad de Clave"
                          type="number"
                          fullWidth
                          value={formData.usrdiascaduclave}
                          onChange={(e) => handleInputChange("usrdiascaduclave", parseInt(e.target.value) || 0)}
                          inputProps={{ min: 0 }}
                          helperText="0 días significa que no caduca"
                          onFocus={(e) => e.target.select()}
                        />

                        <DatePicker
                          label="Fecha de Caducidad"
                          value={formData.usrfeccad}
                          onChange={(newValue) => handleInputChange("usrfeccad", newValue)}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Información de Perfil y Roles */}
                <Grid item xs={12} md={6}>
                  <Card elevation={2} sx={{ height: "100%", borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}
                      >
                        <AccountCircle /> Perfil
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <Stack spacing={2}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.usrflagperfil}
                              onChange={(e) => handleInputChange("usrflagperfil", e.target.checked)}
                              icon={<Cancel />}
                              checkedIcon={<CheckCircle />}
                            />
                          }
                          label="Es Perfil (Este usuario es un perfil)"
                        />

                        <Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="subtitle2">
                              Perfil Asignado {!formData.usrflagperfil && "*"}
                            </Typography>
                            <Tooltip title="Ver todos los perfiles">
                              <IconButton
                                size="small"
                                onClick={() => setPerfilesDialogOpen(true)}
                                sx={{ color: "primary.main" }}
                                disabled={formData.usrflagperfil || isAllPerfilesLoading}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </Box>

                          {isAllPerfilesLoading ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <CircularProgress size={20} />
                              <Typography>Cargando perfiles...</Typography>
                            </Box>
                          ) : isAllPerfilesError ? (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              Error al cargar perfiles
                            </Alert>
                          ) : (
                            <>
                              <TextField
                                select
                                fullWidth
                                value={getSelectedPerfilLabel()}
                                onChange={(e) => handleInputChange("usrcodper", e.target.value)}
                                label="Seleccionar Perfil"
                                error={!!errors.usrcodper}
                                helperText={
                                  errors.usrcodper ||
                                  (formData.usrflagperfil
                                    ? "El usuario es un perfil, no requiere perfil asignado"
                                    : "Seleccione un perfil para el usuario")
                                }
                                disabled={formData.usrflagperfil}
                              >
                                <MenuItem value="">
                                  <em>Seleccione un perfil</em>
                                </MenuItem>
                                {allPerfiles.map((perfil) => (
                                  <MenuItem key={perfil.value} value={perfil.label}>
                                    {perfil.label}
                                  </MenuItem>
                                ))}
                              </TextField>

                              {formData.usrcodper && !formData.usrflagperfil && (
                                <Typography
                                  variant="body2"
                                  sx={{ mt: 0.5, color: "text.secondary", fontStyle: "italic" }}
                                >
                                  Perfil seleccionado: {formData.usrcodper}
                                </Typography>
                              )}
                            </>
                          )}

                          {formData.usrflagperfil && (
                            <Alert severity="info" sx={{ mt: 1 }}>
                              Este usuario es un perfil, por lo que no necesita tener un perfil asignado.
                            </Alert>
                          )}
                        </Box>

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.usrflagoficre}
                              onChange={(e) => handleInputChange("usrflagoficre", e.target.checked)}
                              icon={<Cancel />}
                              checkedIcon={<CheckCircle />}
                            />
                          }
                          label="Oficial de Crédito"
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Nueva sección: Configuración de Reportes */}
                <Grid item xs={12}>
                  <Card elevation={2} sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: "primary.main" }}>
                        Reportes
                      </Typography>

                      <CustomAutocomplete
                        label="Usuario a quién tiene que reportarle"
                        selectedOption={formData.usuarioReporta}
                        setSelectedOption={(usuarioReporta) => {
                          handleInputChange("usuarioReporta", usuarioReporta)
                        }}
                        options={allUsuariosSinPerfiles}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" startIcon={<Save />} disabled={isAllPerfilesLoading}>
                  Crear Usuario
                </Button>
              </Box>
            </Paper>
          </Box>
        </div>

        {/* Diálogo para mostrar todos los perfiles */}
        <PerfilesDialog />

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default CrearCreacionUsuarios
