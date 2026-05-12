import React, { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"
import { useQuery, useMutation } from "@tanstack/react-query"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import PermIdentityIcon from "@mui/icons-material/PermIdentity"
import dayjs from "dayjs"
import futuresoftIconNoBackground from "../assets/img/logo-sm-no-background.png"
import {
  Modal, Box, Backdrop, Typography, Stack, TextField, Button,
  CircularProgress, InputAdornment, IconButton,
} from "@mui/material"
import { Password, Visibility, VisibilityOff } from "@mui/icons-material"
import useCleanSession from "../hooks/cleanSession"

// ----------------------------------------------------------------------------------
// Función Maestra: Inyecta estilos globales según la Base de Datos
// ----------------------------------------------------------------------------------
const aplicarPerfilVisual = (color, font, size) => {
  let styleTag = document.getElementById("siac-dynamic-profile");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "siac-dynamic-profile";
    document.head.appendChild(styleTag);
  }

  let css = "";
  // 1. Color Corporativo
  if (color) {
    css += `
      :root { --bs-primary: ${color}; }
      .text-primary, .nav-sub-link.active i, .nav-sub-link.active span, .nav-label.active { color: ${color} !important; }
      .bg-primary, .btn-primary { background-color: ${color} !important; border-color: ${color} !important; }
      .btn-primary:hover { opacity: 0.9 !important; background-color: ${color} !important; border-color: ${color} !important; }
      .sidebar-logo { color: ${color} !important; }
    `;
  }
  // 2. Tipo de Letra
  if (font) {
    css += ` * { font-family: '${font}', sans-serif !important; } `;
  }
  // 3. Tamaño de Letra
  if (size) {
    const baseSize = parseInt(size);
    css += `
      body, p, span, a, div, .nav-label, .nav-sub-link, button, input { font-size: ${baseSize}px !important; }
      h1 { font-size: ${baseSize + 12}px !important; }
      h2 { font-size: ${baseSize + 8}px !important; }
      h3 { font-size: ${baseSize + 4}px !important; }
      .sidebar-logo { font-size: ${baseSize + 6}px !important; }
    `;
  }
  styleTag.innerHTML = css;
};

// ----------------------------------------------------------------------------------
// CustomPasswordInput y CambioClaveComponent (Sin Cambios)
// ----------------------------------------------------------------------------------
const CustomPasswordInput = ({ label, value, onChange, disabled, ...props }) => {
  const [showPassword, setShowPassword] = useState(false)
  const toggleVisibility = () => setShowPassword(!showPassword)

  return (
    <TextField
      fullWidth label={label} type={showPassword ? "text" : "password"}
      value={value} onChange={onChange} disabled={disabled}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={toggleVisibility} edge="end" aria-label="toggle password visibility">
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...props} 
    />
  )
}

const CambioClaveComponent = ({ user }) => {
  const cleanSession = useCleanSession()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const { mutateAsync: saveCambioClave, isPending: isSavingCambioClave } = useSaveCambioClave()

  function useSaveCambioClave() {
    return useMutation({
      mutationFn: async (data) => {
        const options = {
          method: "POST", body: JSON.stringify(data),
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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
    if (newPassword !== confirmPassword) return alert("Las nuevas contraseñas no coinciden")
    try {
      await saveCambioClave({
        usrcodigo: user.username, usrclave: currentPassword,
        nuevaClave: newPassword, confirmacionClave: confirmPassword,
      })
      cleanSession()
      alert("Credenciales actualizadas con éxito. Vuelva a ingresar con las credenciales nuevas")
    } catch (err) { alert(err) }
  }
  return (
    <Modal open={true} disableEscapeKeyDown components={{ Backdrop }}
      componentsProps={{ backdrop: { sx: { backgroundColor: "rgba(0, 0, 0, 0.9)", backdropFilter: "blur(5px)", zIndex: 1300 } } }}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1310 }}
    >
      <Box sx={{ backgroundColor: "background.paper", borderRadius: 2, p: 4, width: "100%", maxWidth: 400, position: "relative", zIndex: 1320, outline: "none" }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>🔒 Cambio de Clave Obligatorio</Typography>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Usuario: <strong>{user?.username} - {user?.usrnombre}</strong>
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <CustomPasswordInput label="Contraseña Actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={isSavingCambioClave} required />
            <CustomPasswordInput label="Nueva Contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isSavingCambioClave} required />
            <CustomPasswordInput label="Confirmar Nueva Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isSavingCambioClave} required />
            <Button type="submit" variant="contained" size="large" disabled={isSavingCambioClave} fullWidth
              sx={{ mt: 2, backgroundColor: "var(--bs-primary, #075e54)", color: "white" }} disableElevation >
              {isSavingCambioClave ? <CircularProgress size={24} color="inherit" /> : "Cambiar Contraseña"}
            </Button>
          </Stack>
        </form>
      </Box>
    </Modal>
  )
}

// ----------------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------------
export default function Main() {
  const location = useLocation()
  
  React.useEffect(() => {
    document.body.classList.add("sidebar-show")
  }, [])

  const offsets = ["/apps/file-manager", "/apps/email", "/apps/calendar"]
  const { pathname, state } = useLocation()
  const loginInfoFrontend = state?.loginInfoFrontend
  const bc = document.body.classList

  offsets.includes(pathname) ? bc.add("sidebar-offset") : bc.remove("sidebar-offset")
  bc.remove("sidebar-show")
  window.scrollTo(0, 0)

  const { data: dataHomeInfo = {} } = useGetHomeInfo()

  function useGetHomeInfo() {
    return useQuery({
      queryKey: ["initialHomeInfo"],
      queryFn: async () => {
        const options = {
          method: "POST",
          body: JSON.stringify({ password: loginInfoFrontend?.password }),
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }

        const response = await fetchwrapper(`/Home/getInfoHome`, options)
        let result = await response.json()
        result = result.data

        // Guardar valores en localstorage para acceso global (ej. el Sidebar)
        localStorage.setItem("ciaalias", result.ciaalias)
        localStorage.setItem("ciatipomenu", result.ciatipomenu || 0)
        
        // Ejecutar los estilos dinámicos inmediatamente al recibir los datos
        aplicarPerfilVisual(result.ciacolor, result.ciatipoletra, result.ciatamanioletra);

        return result
      },
      enabled: location.pathname === "/home",
    })
  }

  return (
    <React.Fragment>
      <Sidebar />
      <Header />
      <Outlet />

      {location.pathname === "/home" && (
        <>
          <div className="main main-app p-3 p-lg-4">
            <div className="main-app-container position-relative overflow-hidden" style={{ height: "100vh" }}>
              <div
                className="background-watermark"
                style={{
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                  backgroundImage: `url(data:image/jpeg;base64,${dataHomeInfo.ciaselloagua})`,
                  backgroundPosition: "center", backgroundSize: "contain",
                  backgroundRepeat: "no-repeat", opacity: 0.08, filter: "grayscale(20%)", zIndex: 0,
                }}
              />

              <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "100%", position: "relative", zIndex: 1 }}>
                <div className="text-center mb-4">
                  <img src={futuresoftIconNoBackground} style={{ width: "auto", maxWidth: "60%", maxHeight: "180px", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }} />
                </div>

                <h1 className="fw-bold mb-2 text-primary">FUTURESOFT BUSINESS SERVICES</h1>
                <hr />

                <div className="login-status-panel p-4 bg-white shadow rounded-lg" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)", minWidth: "350px" }}>
                  <div className="d-flex align-items-center mb-3">
                    <div className="user-avatar bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "45px", height: "45px" }}>
                      <i className="bi bi-person text-primary fs-5"><PermIdentityIcon className="text-primary" /></i>
                    </div>
                    <div>
                      <p className="mb-0 text-secondary small">Bienvenido(a)</p>
                      <h5 className="mb-0 fw-bold text-dark">{localStorage.getItem("cliciausu")}</h5>
                    </div>
                  </div>

                  <div className="company-info p-3 rounded bg-light mt-2">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-building me-2 text-primary"></i>
                        <div>
                          <p className="mb-0 small text-muted">Empresa</p>
                          <p className="mb-0 fw-semibold">{localStorage.getItem("cliciagrupo")}</p>
                        </div>
                      </div>
                      <div className="circular-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "45px", height: "45px" }}>
                        <div className="d-flex align-items-center justify-content-center" style={{ width: "100%", height: "100%" }}>
                          <img src={`data:image/jpeg;base64,${dataHomeInfo?.cialogo}`} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-top border-light">
                    <div className="d-flex justify-content-center align-items-center mb-2">
                      <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">Sesión activa</span>
                    </div>
                    {dataHomeInfo.lastLoginFecisys ? (
                      <div className="text-center">
                        <small className="text-muted">
                          Último login:{" "}
                          <span className="fw-semibold">
                            {(() => {
                              const fecha = dayjs.utc(dataHomeInfo.lastLoginFecisys)
                              return fecha.isValid() ? fecha.format("DD/MM/YYYY hh:mm A") : "No hay información"
                            })()}
                          </span>
                        </small>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {dataHomeInfo?.passwordChangeNeeded && (
            <CambioClaveComponent user={{ usrnombre: dataHomeInfo?.usrnombre, username: localStorage.getItem("cliciausu") }} />
          )}
        </>
      )}
    </React.Fragment>
  )
}