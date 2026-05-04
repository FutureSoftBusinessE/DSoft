import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box, Grid } from "@mui/material"

import BackIcon from "../../components/BackIcon"

import { NavLink } from "react-router-dom"

import BuscarIcon from "../../assets/iconos/Buscar.ico"
import CrearIcon from "../../assets/iconos/Crear.ico"

const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(8),
  flexGrow: 1,
  padding: "0 16px",
  height: "100vh",
}))

const StyledIcons = styled(NavLink)(({ theme }) => ({
  height: 250,
  width: 250,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  // backgroundColor: theme.palette.background.default,
  // border: "1px solid #ddd",
  color: theme.palette.text.primary,
  cursor: "pointer",

  "& img": {
    width: "128px",
  },

  "&:hover": {
    textDecoration: "underline",
  },
}))

const StyledTextIcon = styled("div")(({ theme }) => ({
  fontSize: "18px",
  marginTop: "10px",
  fontWeight: "bolder",
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
const EjecucionTareas = () => {
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
          <b>Gestión y Finalización de Tareas</b>
        </div>

        <Box className={StyledRoot}>
          <Grid container spacing={2} sx={{ justifyContent: "center" }}>
            <Grid item>
              <StyledIcons to={"buscar"}>
                <img src={BuscarIcon} alt="Buscar" />
                <StyledTextIcon>Buscar</StyledTextIcon>
              </StyledIcons>
            </Grid>

            <Grid item>
              <StyledIcons to={"crear"}>
                <img src={CrearIcon} alt="Crear" />
                <StyledTextIcon>Crear</StyledTextIcon>
              </StyledIcons>
            </Grid>
          </Grid>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default EjecucionTareas
