import React, { useState, useEffect } from "react"
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
  CameraAlt as CameraAltIcon,
} from "@mui/icons-material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { useQuery } from "@tanstack/react-query"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { formatDate, formatTime } from "../../utils/date/formatDate.js"
import CustomImageAvatar from "../components/CustomImageAvatar .js"

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

// Datos de ejemplo para los perfiles (deberías reemplazarlos con los datos reales de tu API) TODO
// const allPerfiles = [
//   { codigo: "admin", nombre: "Administrador", descripcion: "Acceso completo al sistema" },
//   { codigo: "cajero", nombre: "Cajero", descripcion: "Manejo de transacciones y ventas" },
//   { codigo: "vendedor", nombre: "Vendedor", descripcion: "Gestión de clientes y ventas" },
//   { codigo: "oficred", nombre: "Oficial de Crédito", descripcion: "Aprobación de líneas de crédito" },
//   { codigo: "gerente", nombre: "Gerente", descripcion: "Supervisión y reportes" },
//   { codigo: "auditor", nombre: "Auditor", descripcion: "Revisión de transacciones" },
// ]

const BuscarCreacionUsuarios = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const userData = location.state || {}
  const [perfilesDialogOpen, setPerfilesDialogOpen] = useState(false)

  function useGetallPerfiles() {
    return useQuery({
      queryKey: ["allPerfilesBuscarUsuario"],
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
    data: allPerfiles = [],
    isError: isAllPerfilesError,
    isFetching: isAllPerfilesFetching,
    isLoading: isAllPerfilesLoading,
  } = useGetallPerfiles()

  // Extraer todas las variables con valores por defecto
  const {
    usrcodigo = "",
    usrnombre = "",
    usrfeccad = "",
    usrcodper = "",
    usremail = "",
    usrflagoficre = 0,
    usrflagperfil = 0,
    usrstatus = "A",
    usrimagen = null,
    usrdiascaduclave = 0,
    usrfecisys = "",
    usrhorisys = "",
    usrfecmsys = "",
    usrhormsys = "",
    usrcodigoreporta = "",
  } = userData

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
            <b>Información del Usuario</b>
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

  // Obtener el estado del usuario
  const getUserStatus = (status) => {
    return status === "A" ? "Activo" : "Inactivo"
  }

  // Obtener el color del estado
  const getStatusColor = (status) => {
    return status === "A" ? "success" : "error"
  }

  // Obtener icono de estado
  const getStatusIcon = (status) => {
    return status === "A" ? <LockOpen /> : <Lock />
  }
  // Obtener información del perfil
  const getProfileInfo = (profileCode) => {
    const profile = allPerfiles.find((p) => p.value === profileCode)
    return profile ? { name: profile.label, color: "primary" } : { name: profileCode || "Sin perfil", color: "default" }
  }

  // Obtener información de flags (checkbox)
  const getFlagInfo = (flagValue, type) => {
    const isActive = Boolean(flagValue) // Convertir a booleano (0 = false, cualquier otro valor = true)

    if (type === "oficre") {
      return {
        text: isActive ? "Sí es Oficial de Crédito" : "No es Oficial de Crédito",
        color: isActive ? "success" : "default",
        icon: isActive ? <CheckCircle /> : <Cancel />,
        value: isActive,
      }
    } else {
      return {
        text: isActive ? "Sí es Perfil" : "No es Perfil",
        color: isActive ? "secondary" : "default",
        icon: isActive ? <CheckCircle /> : <Cancel />,
        value: isActive,
      }
    }
  }

  const profileInfo = getProfileInfo(usrcodper)
  const oficreInfo = getFlagInfo(usrflagoficre, "oficre")
  const perfilInfo = getFlagInfo(usrflagperfil, "perfil")

  // Componente para mostrar todos los perfiles disponibles
  const PerfilesDialog = () => (
    <Dialog open={perfilesDialogOpen} onClose={() => setPerfilesDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Groups /> Perfiles Disponibles en el Sistema
      </DialogTitle>
      <DialogContent>
        <List>
          {allPerfiles.map((perfil) => (
            <ListItem key={perfil.value} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {perfil.label}
                    </Typography>
                    {perfil.value === usrcodper && <Chip label="Asignado" color="primary" size="small" />}
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
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPerfilesDialogOpen(false)}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )

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
          <b>Información del Usuario</b>
        </div>
        <CustomBackdrop isLoading={isAllPerfilesFetching || isAllPerfilesLoading} />

        <Box sx={StyledRoot}>
          {/* Header con información principal */}
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3, background: "white" }}>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <CustomImageAvatar usrimagen={usrimagen} alt="Foto de perfil" />

              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" gutterBottom>
                  {usrnombre}
                </Typography>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  {usrcodigo}
                </Typography>
              </Box>

              <Chip
                icon={getStatusIcon(usrstatus)}
                label={getUserStatus(usrstatus)}
                color={getStatusColor(usrstatus)}
                sx={{ fontWeight: "bold", fontSize: "1rem", p: 2 }}
              />
            </Box>
          </Paper>

          <Grid container spacing={3}>
            {/* Información de Cuenta */}
            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ height: "100%", borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}
                  >
                    <Key /> Información de Cuenta
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Badge /> Código de Usuario
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 2, mt: 0.5, fontWeight: "medium" }}>
                        {usrcodigo}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Person /> Nombre Completo
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 2, mt: 0.5, fontWeight: "medium" }}>
                        {usrnombre}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Email /> Correo Electrónico
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 2, mt: 0.5, fontWeight: "medium" }}>
                        {usremail || "No especificado"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Lock /> Días para Caducidad de Clave
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 2, mt: 0.5, fontWeight: "medium" }}>
                        {usrdiascaduclave || 0} días
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            {/* Información de Perfil */}
            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ height: "100%", borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
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
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography
                          variant="subtitle2"
                          color="textSecondary"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                        >
                          <Category /> Perfil Asignado
                        </Typography>
                        <Tooltip title="Ver todos los perfiles">
                          <IconButton
                            size="small"
                            onClick={() => setPerfilesDialogOpen(true)}
                            sx={{ color: "primary.main" }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Chip label={profileInfo.name} color={profileInfo.color} sx={{ ml: 2, mt: 0.5 }} />
                      {/* Solo se muestra label, no hay descripcion en allPerfiles */}
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <CreditCard /> Es Perfil
                      </Typography>
                      <Box sx={{ ml: 2, mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
                        {perfilInfo.icon}
                        <Typography variant="body1" fontWeight="medium">
                          {perfilInfo.text}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Info /> Oficial de Crédito
                      </Typography>
                      <Box sx={{ ml: 2, mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
                        {oficreInfo.icon}
                        <Typography variant="body1" fontWeight="medium">
                          {oficreInfo.text}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            {/* Fechas importantes */}
            <Grid item xs={12}>
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}
                  >
                    <Event /> Fechas Importantes
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          color="textSecondary"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                        >
                          <CalendarToday /> Fecha de Caducidad
                        </Typography>
                        <Typography variant="body1" sx={{ ml: 2, mt: 0.5, fontWeight: "medium" }}>
                          {formatDate(usrfeccad)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          color="textSecondary"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                        >
                          <Today /> Fecha de Última Modificación
                        </Typography>
                        <Typography variant="body1" sx={{ ml: 2, mt: 0.5, fontWeight: "medium" }}>
                          {formatDate(usrfecmsys)} - {formatTime(usrhormsys)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          color="textSecondary"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                        >
                          <Today /> Fecha de Creación
                        </Typography>
                        <Typography variant="body1" sx={{ ml: 2, mt: 0.5, fontWeight: "medium" }}>
                          {formatDate(usrfecisys)} - {formatTime(usrhorisys)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: "primary.main" }}>
                    Reportes
                  </Typography>

                  <Typography variant="body1" sx={{ ml: 2, mt: 0.5, fontWeight: "medium" }}>
                    {usrcodigoreporta ? `Reporta a ${usrcodigoreporta}` : "No reporta a nadie"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </div>

      {/* Diálogo para mostrar todos los perfiles */}
      <PerfilesDialog />
    </ThemeProvider>
  )
}

export default BuscarCreacionUsuarios
