import React, { useState, useEffect, useRef } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
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
  Edit,
} from "@mui/icons-material"
import Swal from "sweetalert2"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import esLocale from "date-fns/locale/es"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import { useQuery, useMutation } from "@tanstack/react-query"
import CustomPhotoCam from "../../../components/CustomPhotoCam"
import CustomBackdrop from "../../../components/CustomBackdrop"
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

const EditarCreacionUsuarios = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const userData = location.state || {}
  const [perfilesDialogOpen, setPerfilesDialogOpen] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [errors, setErrors] = useState({})

  // Usar useRef para guardar el perfil original que no cambia entre renders
  const originalPerfilRef = useRef(userData.usrcodper || "")
  function useGetallPerfiles() {
    return useQuery({
      queryKey: ["allPerfilesEdicionUsuario"],
      queryFn: async () => {
        const options = {
          method: "POST",
          body: JSON.stringify({
            usrcodigo: userData.usrcodigo,
          }),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
        let response = await fetchwrapper(`/CreacionUsuarios/getAllPerfiles`, options)
        response = await response.json()
        response = response?.data
        return response
      },
      refetchOnWindowFocus: false,
    })
  }
  const {
    mutateAsync: editCreacionUsuario,
    isPending: isEditinCreacionUsuario,
    error: errorEditinCreacionUsuario,
    isError: isErrorEditingCreacionUsuario,
  } = useEditCreacionUsuario()
  function useEditCreacionUsuario() {
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
          throw errorResponse?.details?.msg || "Error al editar el usuario"
        }
      },
    })
  }

  // Estado para los campos editables
  const [formData, setFormData] = useState({
    usrcodigo: "",
    usrnombre: "",
    usrfeccad: null,
    usrcodper: "",
    usremail: "",
    usrflagoficre: false,
    usrflagperfil: false,
    usrstatus: "A",
    usrdiascaduclave: 0,
    usrimagen: null,
    usrimagenInitial: null,
  })

  // Cargar datos iniciales
  useEffect(() => {
    if (location.state) {
      // Guardar el perfil original en el ref
      originalPerfilRef.current = userData.usrcodper || ""

      setFormData({
        usrcodigo: userData.usrcodigo || "",
        usrnombre: userData.usrnombre || "",
        usrfeccad: userData.usrfeccad ? new Date(userData.usrfeccad) : null,
        usrcodper: userData.usrcodper || "",
        usremail: userData.usremail || "",
        usrflagoficre: Boolean(userData.usrflagoficre),
        usrflagperfil: Boolean(userData.usrflagperfil),
        usrstatus: userData.usrstatus || "A",
        usrdiascaduclave: userData.usrdiascaduclave || 0,
        usrimagen: userData.usrimagen || null,
        usrimagenInitial: userData.usrimagen || null,
        usuarioReporta: userData.usrcodigoreporta || null,
      })
    }
  }, [location.state])

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

  useEffect(() => {
    if (allUsuariosSinPerfiles.length !== 0 && location.state.usrcodigoreporta) {
      handleInputChange("usuarioReporta", {
        value: location.state.usrcodigoreporta,
        label: allUsuariosSinPerfiles.find((v) => v.value === location.state.usrcodigoreporta)?.label,
      })
    }
  }, [location.state.usrcodigoreporta, allUsuariosSinPerfiles])

  const {
    data: allPerfiles = [],
    isError: isAllPerfilesError,
    isFetching: isAllPerfilesFetching,
    isLoading: isAllPerfilesLoading,
  } = useGetallPerfiles()

  // Validar formulario
  const validateForm = () => {
    const newErrors = {}

    if (!formData.usrnombre.trim()) {
      newErrors.usrnombre = "El nombre es requerido"
    }

    if (!formData.usremail.trim()) {
      newErrors.usremail = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.usremail)) {
      newErrors.usremail = "El formato del email es inválido"
    }

    // El perfil NO es obligatorio - es opcional cuando no está marcado como "Es Perfil"
    // No hay validación para usrcodper ya que es opcional

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
  }

  // Manejar cambio del checkbox "Es Perfil"
  const handleEsPerfilChange = (checked) => {
    if (checked) {
      // Si marca "Es Perfil", limpiar el perfil seleccionado
      setFormData((prev) => ({
        ...prev,
        usrflagperfil: true,
        usrcodper: "", // Limpiar el perfil seleccionado
      }))
    } else {
      // Si desmarca "Es Perfil", restaurar el perfil original
      setFormData((prev) => ({
        ...prev,
        usrflagperfil: false,
        usrcodper: originalPerfilRef.current, // Restaurar el perfil original
      }))
    }

    // Limpiar error del campo de perfil
    if (errors.usrcodper) {
      setErrors((prev) => ({
        ...prev,
        usrcodper: "",
      }))
    }
  }

  // Manejar cambio en el combobox de perfiles
  const handlePerfilChange = (perfilValue) => {
    // Permite seleccionar o deseleccionar (cuando el valor es vacío)
    handleInputChange("usrcodper", perfilValue)
  }

  // Obtener el label del perfil seleccionado para mostrar
  const getSelectedPerfilLabel = () => {
    if (!formData.usrcodper) return ""
    const selectedPerfil = allPerfiles.find((p) => p.value === formData.usrcodper)
    return selectedPerfil ? selectedPerfil.label : formData.usrcodper
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setSnackbarMessage("Por favor, complete todos los campos requeridos correctamente")
      setSnackbarOpen(true)
      return
    }

    // Validación: no puede ser "Es Perfil" y tener un perfil asignado al mismo tiempo
    if (formData.usrflagperfil && formData.usrcodper) {
      setSnackbarMessage("Error: No puede ser 'Es Perfil' y tener un perfil asignado al mismo tiempo")
      setSnackbarOpen(true)
      return
    }

    // Aquí iría la lógica para guardar los cambios
    const userDataToEdit = {
      ...formData,
      sOpcion: "Edit",
      usrflagupdateperfilacces: false,
      usuarioReporta: formData.usuarioReporta?.value ?? "",
    }

    console.log(formData, "borrarrrr")

    try {
      console.log("Datos del usuario para editar:", userDataToEdit)
      await editCreacionUsuario(userDataToEdit)
      setSnackbarMessage("Usuario actualizado correctamente")
      setSnackbarOpen(true)
      Swal.fire({
        icon: "success",
        title: "¡Editado con éxito!",
        text: "La operación fue realizada con éxito.",
        confirmButtonText: "OK",
      }).then(() => {
        // Navega hacia la página anterior después de que el usuario haga clic en "OK"
        navigate(-1)
      })
    } catch (error) {
      setSnackbarMessage(error.message || "Error al editar el usuario")
      setSnackbarOpen(true)
    }
  }

  // Si no hay datos, mostrar mensaje
  if (!location.state) {
    return (
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
            <b>Editar Información de Usuario</b>
          </div>

          <Box sx={StyledRoot}>
            <Box
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "50vh",
              }}
            >
              <Alert severity="error" sx={{ mb: 2, width: "100%", maxWidth: 500 }}>
                No se encontraron datos del usuario
              </Alert>
              <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
                Volver
              </Button>
            </Box>
          </Box>
        </div>
      </ThemeProvider>
    )
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
              <ListItem
                divider
                button
                onClick={() => {
                  // Opción para deseleccionar (valor vacío)
                  handlePerfilChange("")
                  setPerfilesDialogOpen(false)
                }}
                sx={{
                  backgroundColor: !formData.usrcodper ? "action.selected" : "transparent",
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="medium" fontStyle="italic">
                        Ningún perfil
                      </Typography>
                      {!formData.usrcodper && <Chip label="Seleccionado" color="primary" size="small" />}
                    </Box>
                  }
                  secondary="No asignar ningún perfil al usuario"
                />
              </ListItem>

              {allPerfiles.map((perfil) => (
                <ListItem
                  key={perfil.value}
                  divider
                  button
                  onClick={() => {
                    handlePerfilChange(perfil.value)
                    setPerfilesDialogOpen(false)
                  }}
                  sx={{
                    opacity: formData.usrflagperfil ? 0.5 : 1,
                    pointerEvents: formData.usrflagperfil ? "none" : "auto",
                    backgroundColor: perfil.value === formData.usrcodper ? "action.selected" : "transparent",
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {perfil.label}
                        </Typography>
                        {perfil.value === formData.usrcodper && (
                          <Chip label="Seleccionado" color="primary" size="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Código: {perfil.value}
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

  const handleImageCapture = (img) => {
    handleInputChange("usrimagen", img ? img.base64Hex : null)
  }

  const handleResetImage = () => {
    setFormData((prev) => ({
      ...prev,
      usrimagen: formData.usrimagenInitial,
    }))
  }

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
            <b>Editar Información de Usuario</b>
          </div>

          <CustomBackdrop
            open={
              isEditinCreacionUsuario ||
              isAllPerfilesLoading ||
              isAllPerfilesFetching ||
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
                  onImage={handleImageCapture}
                  initialImage={formData.usrimagen ? `data:image/jpeg;base64,${formData.usrimagen}` : null}
                  onResetImage={handleResetImage}
                  cropAspect={1}
                  compressOptions={{
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 300,
                    useWebWorker: true,
                  }}
                  resetToInitialImageButton={true}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 3 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <TextField
                    fullWidth
                    label="Código de Usuario"
                    value={formData.usrcodigo}
                    onChange={(e) => handleInputChange("usrcodigo", e.target.value)}
                    required
                    disabled
                    onFocus={(e) => e.target.select()}
                  />
                  <TextField
                    fullWidth
                    label="Nombre Completo *"
                    value={formData.usrnombre}
                    onChange={(e) => handleInputChange("usrnombre", e.target.value)}
                    error={!!errors.usrnombre}
                    helperText={errors.usrnombre}
                    required
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
                  >
                    <MenuItem value="A">Activo</MenuItem>
                    <MenuItem value="I">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Box>

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
                          required
                          onFocus={(e) => e.target.select()}
                        />

                        <TextField
                          label="Días para Caducidad de Clave"
                          type="number"
                          fullWidth
                          value={formData.usrdiascaduclave}
                          onChange={(e) => handleInputChange("usrdiascaduclave", parseInt(e.target.value) || 0)}
                          inputProps={{ min: 0 }}
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
                        <Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="subtitle2">Perfil Asignado</Typography>
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
                                value={formData.usrcodper}
                                onChange={(e) => handlePerfilChange(e.target.value)}
                                label="Seleccionar Perfil"
                                error={!!errors.usrcodper}
                                disabled={formData.usrflagperfil}
                              >
                                <MenuItem value="">
                                  <em>Ningún perfil</em>
                                </MenuItem>
                                {allPerfiles.map((perfil) => (
                                  <MenuItem key={perfil.value} value={perfil.value}>
                                    {perfil.label}
                                  </MenuItem>
                                ))}
                              </TextField>
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
                              checked={formData.usrflagperfil}
                              onChange={(e) => handleEsPerfilChange(e.target.checked)}
                              icon={<Cancel />}
                              checkedIcon={<CheckCircle />}
                            />
                          }
                          label="Es Perfil (Este usuario es un perfil)"
                        />

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

                {/* Configuración de Reportes */}
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
                <Button type="submit" variant="contained" startIcon={<Save />}>
                  Guardar Cambios
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

export default EditarCreacionUsuarios
