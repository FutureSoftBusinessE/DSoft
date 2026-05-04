import React, { useState, useEffect } from "react"
import Header from "../../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  InputLabel,
  MenuItem,
  Select,
  Autocomplete,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import BackIcon from "../../../components/BackIcon"
import CrearIcon from "../../../assets/iconos/Crear.ico"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../../../components/CustomBackdrop"
import DatagridDragDrop from "../components/DatagridDragDrop"

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
      main: "#196C87",
    },
  },
})

const CrearPaquetesDeProcesoTareas = () => {
  const navigate = useNavigate()
  const Estados = [
    { value: "A", description: "Activo" },
    { value: "I", description: "Inactivo" },
  ]
  const [descripcion, setDescripcion] = useState("")
  const [estado, setEstado] = useState(Estados[0])
  const [procesoSelected, setProcesoSelected] = useState(null)
  const [isLoadingCreateFormulario, setIsLoadingCreateFormulario] = useState(false)
  const [allPreguntas, setAllPreguntas] = useState([])
  const [preguntasSelectedFormulario, setPreguntasSelectedFormulario] = useState([])

  // Estados para el modal de importar paquete
  const [openImportModal, setOpenImportModal] = useState(false)
  const [paquetesDisponibles, setPaquetesDisponibles] = useState([])
  const [paqueteSeleccionadoImportar, setPaqueteSeleccionadoImportar] = useState(null)

  const {
    data: fetchedAllPreguntas = [],
    isError: isLoadingAllPreguntasError,
    isFetching: isFetchAllPreguntas,
    isLoading: isLoadingAllPreguntas,
    refetch: refetchAllPreguntas,
  } = useGetAllPreguntas()

  function useGetAllPreguntas() {
    return useQuery({
      queryKey: ["FormulariosAllCabecerasPreguntas"],
      queryFn: async () => {
        let response = await fetchwrapper("/BancoDeTareas/getAllBancoDeTareas")
        response = await response.json()
        return response?.data || []
      },
      refetchOnWindowFocus: false,
    })
  }

  if (isLoadingAllPreguntasError) {
    alert("Error al obtener las tareas")
    navigate(-1)
  }

  useEffect(() => {
    if (fetchedAllPreguntas.length !== 0) {
      setAllPreguntas([...fetchedAllPreguntas])
    }
  }, [fetchedAllPreguntas])

  const {
    data: fetchedProcesosFormularios = [],
    isError: isLoadiProcesosFormulariosError,
    isFetching: isFetchProcesosFormularios,
    isLoading: isLoadiProcesosFormularios,
  } = useGetFormularios()

  if (isLoadiProcesosFormulariosError) {
    alert("Error al obtener todos los procesos")
    navigate(-1)
  }

  function useGetFormularios() {
    return useQuery({
      queryKey: ["procesosFormulario"],
      queryFn: async () => {
        let response = await fetchwrapper("/PaquetesDeProcesosTareas/getProcesos")
        response = await response.json()
        return response?.data || []
      },
      refetchOnWindowFocus: false,
    })
  }

  // Función para obtener paquetes disponibles (CON sus tareas)
  const fetchPaquetesParaImportar = async () => {
    try {
      // Endpoint que devuelve paquetes CON cabecera y detalle
      let response = await fetchwrapper("/PaquetesDeProcesosTareas/getAllPaquetesConDetalle")
      response = await response.json()

      // Mapear la respuesta al formato que necesita el frontend
      const paquetes = (response?.data || []).map((item) => ({
        // Extraer datos de la cabecera
        formcodigo: item.cabecera?.formcodigo,
        formdescri: item.cabecera?.formdescri,
        formstatus: item.cabecera?.formstatus,
        procesocod: item.cabecera?.procesocod,
        // El detalle son las tareas (con la MISMA estructura que el banco)
        tareas: item.detalle || [],
      }))

      console.log("Paquetes para importar:", paquetes)
      return paquetes
    } catch (error) {
      console.error("Error al obtener paquetes:", error)
      return []
    }
  }

  // Abrir modal para importar paquete
  const handleOpenImportModal = async () => {
    setIsLoadingCreateFormulario(true)
    try {
      const paquetes = await fetchPaquetesParaImportar()
      setPaquetesDisponibles(paquetes)
      setOpenImportModal(true)
    } catch (error) {
      alert("Error al cargar paquetes disponibles")
    } finally {
      setIsLoadingCreateFormulario(false)
    }
  }

  // Importar tareas de un paquete seleccionado - CON LAS REGLAS CORRECTAS
  // Importar tareas de un paquete seleccionado
  const handleImportarPaquete = () => {
    if (!paqueteSeleccionadoImportar || !paqueteSeleccionadoImportar.tareas) {
      alert("Seleccione un paquete con tareas para importar")
      return
    }

    const tareasDelPaquete = paqueteSeleccionadoImportar.tareas

    // IDs de tareas ya en derecho
    const idsEnDerecha = new Set(preguntasSelectedFormulario.map((t) => t.pregcodigo))
    // IDs de tareas en izquierda
    const idsEnIzquierda = new Set(allPreguntas.map((t) => t.pregcodigo))

    let tareasAgregadas = 0
    let tareasIgnoradas = 0

    // Para cada tarea del paquete
    tareasDelPaquete.forEach((tarea) => {
      const tareaId = tarea.pregcodigo

      // REGLA 1: ¿Ya está en DERECHA?
      if (idsEnDerecha.has(tareaId)) {
        tareasIgnoradas++ // Ya está donde debe
        return
      }

      // REGLA 2: ¿Está en IZQUIERDA?
      if (idsEnIzquierda.has(tareaId)) {
        // Mover de izquierda a derecha
        setAllPreguntas((prev) => prev.filter((t) => t.pregcodigo !== tareaId))
        setPreguntasSelectedFormulario((prev) => [...prev, tarea])
        tareasAgregadas++
        return
      }

      // REGLA 3: No está en ningún lado → agregar a derecha
      setPreguntasSelectedFormulario((prev) => [...prev, tarea])
      tareasAgregadas++
    })

    // Feedback
    let mensaje = `Importación completada:`
    if (tareasAgregadas > 0) {
      mensaje += `\n✅ ${tareasAgregadas} tarea(s) agregada(s)`
    }
    if (tareasIgnoradas > 0) {
      mensaje += `\n⚠️ ${tareasIgnoradas} tarea(s) ya estaban en el paquete`
    }
    alert(mensaje)

    setOpenImportModal(false)
    setPaqueteSeleccionadoImportar(null)
  }
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!descripcion || !estado || !procesoSelected || preguntasSelectedFormulario.length === 0) {
      alert("Complete todos los campos")
      return
    }

    try {
      const options = {
        method: "POST",
        body: JSON.stringify({
          cabecera: {
            descripcion,
            estado: estado.value,
            procesocod: procesoSelected.procesocod,
          },
          detalle: preguntasSelectedFormulario,
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      setIsLoadingCreateFormulario(true)

      let response = await fetchwrapper("/PaquetesDeProcesosTareas/createPaquete", options)
      response = await response.json()
      clearAll()
      alert(`Paquete creado con código ${response.formcodigoGenerated}`)
      await refetchAllPreguntas()
    } catch (error) {
      alert("No se puedo crear el paquete")
    } finally {
      setIsLoadingCreateFormulario(false)
    }
  }

  const clearAll = () => {
    setDescripcion("")
    setEstado(Estados[0])
    setProcesoSelected(null)
    if (fetchedAllPreguntas.length > 0) {
      setAllPreguntas([...fetchedAllPreguntas])
    }
    setPreguntasSelectedFormulario([])
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
          <b>Paquete de Procesos y Tareas</b>
        </div>
        <CustomBackdrop
          isLoading={
            isLoadiProcesosFormularios ||
            isFetchProcesosFormularios ||
            isLoadingAllPreguntas ||
            isFetchAllPreguntas ||
            isLoadingCreateFormulario
          }
        />

        <Box className={StyledRoot}>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Descripción"
              margin="normal"
              fullWidth
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
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

            <Autocomplete
              sx={{ marginTop: "30px" }}
              options={fetchedProcesosFormularios}
              getOptionLabel={(option) => option?.procesocod}
              id="procesos"
              value={procesoSelected}
              onChange={(event, newValue) => {
                setProcesoSelected(newValue)
              }}
              renderInput={(params) => <TextField {...params} label="Procesos" variant="outlined" required />}
              required
            />

            <Box sx={{ display: "flex", gap: 2, marginTop: "20px" }}>
              <Button type="submit" variant="outlined" color="primary">
                <img src={CrearIcon} alt="Crear" style={{ width: "40px", marginRight: "8px" }} />
                Crear
              </Button>

              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenImportModal}
                disabled={isLoadingCreateFormulario}
              >
                📦 Importar de Paquete Existente
              </Button>
            </Box>
          </form>

          {/* Modal para importar paquete */}
          <Dialog open={openImportModal} onClose={() => setOpenImportModal(false)} maxWidth="md" fullWidth>
            <DialogTitle>Importar de Paquete Existente</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Seleccione un paquete para importar sus tareas al paquete actual
              </Typography>

              <Autocomplete
                options={paquetesDisponibles}
                getOptionLabel={(option) => `${option.formdescri} (${option.formcodigo})`}
                value={paqueteSeleccionadoImportar}
                onChange={(event, newValue) => {
                  setPaqueteSeleccionadoImportar(newValue)
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Seleccionar Paquete" variant="outlined" margin="normal" fullWidth />
                )}
              />

              {paqueteSeleccionadoImportar && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "background.default", borderRadius: 1 }}>
                  <Typography variant="subtitle1">
                    <strong>Paquete:</strong> {paqueteSeleccionadoImportar.formdescri}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Código:</strong> {paqueteSeleccionadoImportar.formcodigo}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Proceso:</strong> {paqueteSeleccionadoImportar.procesocod}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Tareas en este paquete:</strong> {paqueteSeleccionadoImportar.tareas?.length || 0}
                  </Typography>

                  {paqueteSeleccionadoImportar.tareas?.length > 0 && (
                    <Box sx={{ mt: 1, maxHeight: "150px", overflow: "auto" }}>
                      <Typography variant="caption" color="textSecondary">
                        <strong>Lista de tareas:</strong>
                      </Typography>
                      <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                        {paqueteSeleccionadoImportar.tareas.slice(0, 5).map((tarea, idx) => (
                          <li key={idx}>
                            <Typography variant="caption">
                              {tarea.pregcodigo} - {tarea.pregdescri}
                            </Typography>
                          </li>
                        ))}
                        {paqueteSeleccionadoImportar.tareas.length > 5 && (
                          <li>
                            <Typography variant="caption" color="textSecondary">
                              ... y {paqueteSeleccionadoImportar.tareas.length - 5} más
                            </Typography>
                          </li>
                        )}
                      </ul>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenImportModal(false)}>Cancelar</Button>
              <Button
                onClick={handleImportarPaquete}
                variant="contained"
                color="primary"
                disabled={!paqueteSeleccionadoImportar}
              >
                Importar Tareas
              </Button>
            </DialogActions>
          </Dialog>

          <div>
            <DatagridDragDrop
              data1={allPreguntas}
              setData1={setAllPreguntas}
              data2={preguntasSelectedFormulario}
              setData2={setPreguntasSelectedFormulario}
            />
          </div>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearPaquetesDeProcesoTareas
