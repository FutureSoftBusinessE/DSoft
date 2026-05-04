import React, { useState, useEffect } from "react"
import Header from "../../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Button,
} from "@mui/material"

import BackIcon from "../../../components/BackIcon"
import CrearIcon from "../../../assets/iconos/Crear.ico"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../../../components/CustomBackdrop"

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

const CrearProcesosTarea = () => {
  const Estados = [
    { value: "A", description: "Activo" },
    { value: "I", description: "Inactivo" },
  ]
  const [proceso, setProceso] = useState("")
  const [isLoadingCrearProceso, setIsLoadingCrearProceso] = useState(false)
  const [estado, setEstado] = useState(Estados[0])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const options = {
        method: "POST",
        body: JSON.stringify({
          proceso,
          estado: estado.value,
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      setIsLoadingCrearProceso(true)

      const response = await fetchwrapper("/ProcesosDeTarea/createProceso", options)
      alert(`Proceso creado`)
    } catch (error) {
      alert("No se puedo crear el proceso")
    } finally {
      setIsLoadingCrearProceso(false)
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
          <b>Proceso</b>
        </div>
        <CustomBackdrop isLoading={isLoadingCrearProceso} />

        <Box className={StyledRoot}>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Proceso"
              margin="normal"
              fullWidth
              value={proceso}
              onChange={(e) => setProceso(e.target.value)}
              required
            />

            <div>
              <InputLabel id="estadosCB" sx={{ paddingBlock: "10px", paddingLeft: "5px" }}>
                Estado
              </InputLabel>
              <Select
                fullWidth
                labelId="estadosCB"
                value={estado.value}
                onChange={(e) => {
                  const selectedValue = e.target.value
                  setEstado(Estados.find((estado) => estado.value === selectedValue))
                }}
              >
                {Estados.map((estado) => (
                  <MenuItem key={estado.value} value={estado.value}>
                    {estado.description}
                  </MenuItem>
                ))}
              </Select>
            </div>

            <Button type="submit" variant="outlined" color="primary" sx={{ marginTop: "20px" }}>
              <img src={CrearIcon} alt="Crear" style={{ width: "40px" }} />
              Crear
            </Button>
          </form>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearProcesosTarea
