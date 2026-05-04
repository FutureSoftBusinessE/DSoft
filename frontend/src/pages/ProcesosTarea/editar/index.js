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
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"

import BackIcon from "../../../components/BackIcon"
import GrabarIcon from "../../../assets/iconos/Grabar.ico"
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

const EditarProcesosTarea = () => {
  const navigate = useNavigate()
  const { proceso: id } = useParams()
  const Estados = [
    { value: "A", description: "Activo" },
    { value: "I", description: "Inactivo" },
  ]
  const [proceso, setProceso] = useState("")
  const [isLoadingCrearProceso, setIsLoadingCrearProceso] = useState(false)
  const [estado, setEstado] = useState(Estados[0])

  const {
    data: fetchedGestionAlmacenProceso = {},
    isError: isLoadingGestionAlmacenProcesoError,
    isFetching: isFetchingGestionAlmacenProceso,
    isLoading: isLoadingGestionAlmacenProceso,
  } = useGetSpecificGestionAlmacenProceso()

  if (isLoadingGestionAlmacenProcesoError) {
    alert("Error al cargar el proceso ")
    navigate(-1)
  }

  // Llenar los estados de los componentes respectivamente
  useEffect(() => {
    if (Object.keys(fetchedGestionAlmacenProceso).length === 0) return
    const { proceso, estado: value } = fetchedGestionAlmacenProceso
    setProceso(proceso)
    console.log(Estados)
    const estado = Estados.find((estado) => estado?.value === value)

    setEstado(estado)
  }, [fetchedGestionAlmacenProceso])

  // call UPDATE hook
  const {
    mutateAsync: updateGestionAlmacenProceso,
    isPending: isUpdatingGestionAlmacenProceso,
    isError: isLoadingUpdateGestionAlmacenProcesoError,
  } = useUpdateSpecificGestionAlmacenProceso()

  if (isLoadingUpdateGestionAlmacenProcesoError) {
    alert("Error al guardar el proceso ")
  }

  // READ hook (get specific GestionAlmacenProceso from api)
  function useGetSpecificGestionAlmacenProceso() {
    return useQuery({
      queryKey: ["GestionAlmacenProceso", id],
      queryFn: async () => {
        // send api request here
        const options = {
          method: "POST",
          body: JSON.stringify({
            procesocod: id,
          }),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
        let response = await fetchwrapper(`/ProcesosDeTarea/getProceso`, options)
        response = await response.json()
        response = response?.data
        return response
      },
      refetchOnWindowFocus: false,
    })
  }
  // UPDATE hook (put specific proceso in api)
  function useUpdateSpecificGestionAlmacenProceso() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (proceso) => {
        // send api update request here
        const options = {
          method: "PUT",
          body: JSON.stringify(proceso),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }

        let response = await fetchwrapper(`/ProcesosDeTarea/updateProceso`, options)

        response = response.json()
        return response
      },
      // client side optimistic update
      onMutate: (newProceso) => {
        console.log(newProceso, "onmutate")
        queryClient.setQueryData(["GestionAlmacenProceso", id], (prevGestionAlmacenProceso) => ({
          ...newProceso,
        }))
      },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!proceso || !estado) {
      alert("Complete los campos")
      return
    }

    const body = {
      oldProceso: id,
      proceso,
      estado: estado.value,
    }
    await updateGestionAlmacenProceso(body)
    alert(`Proceso actualizado`)
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
        <CustomBackdrop
          isLoading={isLoadingCrearProceso || isLoadingGestionAlmacenProceso || isUpdatingGestionAlmacenProceso}
        />

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
              <img src={GrabarIcon} alt="Crear" style={{ width: "40px" }} />
              Editar
            </Button>
          </form>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default EditarProcesosTarea
