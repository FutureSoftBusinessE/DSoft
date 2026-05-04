import React, { useState, useEffect } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box, Grid, Card, CardContent, Typography } from "@mui/material"

import BackIcon from "../../components/BackIcon"

import DatagridBancoDePreguntas from "./components/DatagridBancoDePreguntas"

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
const BancoDeTareas = () => {
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
          <b>Banco de Tareas</b>
        </div>

        <Box className={StyledRoot}>
          <DatagridBancoDePreguntas />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default BancoDeTareas
