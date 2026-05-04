import Header from "../../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box } from "@mui/material"

import BackIcon from "../../../components/BackIcon"
import PermisosUsuario from "./PermisosUsuario"

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

const BuscarAccesoAOpcionesPorModulos = () => {
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
          <b>Acceso a Opciones por Modulos</b>
        </div>

        <Box className={StyledRoot}>
          <PermisosUsuario />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default BuscarAccesoAOpcionesPorModulos
