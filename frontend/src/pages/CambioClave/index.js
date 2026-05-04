import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  Modal,
  Backdrop,
  Typography,
  Stack,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material"

import BackIcon from "../../components/BackIcon"
import { useState } from "react"
import { Visibility, VisibilityOff } from "@mui/icons-material"
import { useMutation } from "@tanstack/react-query"
import fetchwrapper from "../../services/interceptors/fetchwrapper"
import useCleanSession from "../../hooks/cleanSession"
import { useNavigate } from "react-router-dom"

const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(8),
  flexGrow: 1,
  padding: "0 16px",
  height: "100vh",
}))

const theme = createTheme({
  palette: {
    primary: {
      main: "#196C87",
    },
    secondary: {
      main: "#196C87", // Cambia el color secundario a verde azulado
    },
  },
})

// ----------------------------------------------------------------------------------
//                       CustomPasswordInput
// ----------------------------------------------------------------------------------
const CustomPasswordInput = ({ label, value, onChange, disabled, ...props }) => {
  const [showPassword, setShowPassword] = useState(false)

  const toggleVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <TextField
      fullWidth
      label={label}
      type={showPassword ? "text" : "password"}
      value={value}
      onChange={onChange}
      disabled={disabled}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={toggleVisibility} edge="end" aria-label="toggle password visibility">
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...props} // Pasa cualquier otra prop adicional
    />
  )
}

const CambioClave = () => {
  const user = {
    username: localStorage.getItem("cliciausu"),
  }
  const cleanSession = useCleanSession()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const {
    mutateAsync: saveCambioClave,
    isPending: isSavingCambioClave,
    error: errorSavingCambioClave,
    isError: isErrorSavingCambioClave,
  } = useSaveCambioClave()

  function useSaveCambioClave() {
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
          const response = await fetchwrapper(`/login/cambioDeClave`, options)
          return response
        } catch (errorResponse) {
          throw errorResponse?.details?.msg || "Error al cambiar la contraseña"
        }
      },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validación básica
    if (newPassword !== confirmPassword) {
      return alert("Las nuevas contraseñas no coinciden")
    }

    try {
      await saveCambioClave({
        usrcodigo: user.username,
        usrclave: currentPassword,
        nuevaClave: newPassword,
        confirmacionClave: confirmPassword,
      })

      // Hacer que el usuario vuelva abrir la web para ingresar con las credenciales nuevas
      cleanSession()
      alert("Credenciales actualizadas con éxito. Vuelva a ingresar con las credenciales nuevas")
      navigate(0)
    } catch (err) {
      alert(err)
    }
  }
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
          <b>Cambio de Clave</b>
        </div>

        <Box className={StyledRoot}>
          <Modal
            open={true}
            disableEscapeKeyDown
            components={{ Backdrop }}
            componentsProps={{
              backdrop: {
                sx: {
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  backdropFilter: "blur(5px)",
                  zIndex: 1300,
                },
              },
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1310,
            }}
          >
            <Box
              sx={{
                backgroundColor: "background.paper",
                borderRadius: 2,
                p: 4,
                width: "100%",
                maxWidth: 400,
                position: "relative",
                zIndex: 1320,
                outline: "none",
              }}
            >
              <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                🔒 Cambio de Clave
              </Typography>

              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Usuario: <strong>{user?.username}</strong>
              </Typography>

              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <CustomPasswordInput
                    label="Contraseña Actual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isSavingCambioClave}
                    required
                  />

                  <CustomPasswordInput
                    label="Nueva Contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSavingCambioClave}
                    required
                  />

                  <CustomPasswordInput
                    label="Confirmar Nueva Contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSavingCambioClave}
                    required
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSavingCambioClave}
                    fullWidth
                    sx={{
                      mt: 2,
                      backgroundColor: "#075e54",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "#075e54", // Mantiene el mismo color en hover
                        boxShadow: "none", // Opcional: elimina sombra en hover
                      },
                      "&:active": {
                        backgroundColor: "#075e54", // Mantiene color al hacer clic
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "#075e54", // Color cuando está deshabilitado
                        color: "white",
                        opacity: 0.7,
                      },
                    }}
                    disableElevation // Elimina la sombra por defecto
                  >
                    {isSavingCambioClave ? <CircularProgress size={24} color="inherit" /> : "Cambiar Contraseña"}
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={isSavingCambioClave}
                    fullWidth
                    onClick={() => {
                      navigate(-1)
                    }}
                    sx={{
                      mt: 2,
                      backgroundColor: "#EB231C",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "#EB231C", // Mantiene el mismo color en hover
                        boxShadow: "none", // Opcional: elimina sombra en hover
                      },
                      "&:active": {
                        backgroundColor: "#EB231C", // Mantiene color al hacer clic
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "#EB231C", // Color cuando está deshabilitado
                        color: "white",
                        opacity: 0.7,
                      },
                    }}
                    disableElevation // Elimina la sombra por defecto
                  >
                    {isSavingCambioClave ? <CircularProgress size={24} color="inherit" /> : "Cancelar"}
                  </Button>
                </Stack>
              </form>
            </Box>
          </Modal>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CambioClave
