import React, { useState, useEffect } from "react"
import Header from "../../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Autocomplete,
} from "@mui/material"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"

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

const EditarPaquetesDeProcesoTareas = () => {
  const navigate = useNavigate()
  const { formularioID } = useParams()

  const Estados = [
    { value: "A", description: "Activo" },
    { value: "I", description: "Inactivo" },
  ]
  const [codigo, setCodigo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [estado, setEstado] = useState(Estados[0])
  const [proceso, setProceso] = useState("")

  // Estados PRINCIPALES
  const [allPreguntas, setAllPreguntas] = useState([]) // Izquierda: tareas DISPONIBLES (data1)
  const [preguntasSelectedFormulario, setPreguntasSelectedFormulario] = useState([]) // Derecha: tareas del PAQUETE (data2)

  // Estados para el modal de importar
  const [openImportModal, setOpenImportModal] = useState(false)
  const [paquetesDisponibles, setPaquetesDisponibles] = useState([])
  const [paqueteSeleccionadoImportar, setPaqueteSeleccionadoImportar] = useState(null)

  // Obtener el paquete a editar
  const {
    data: fetchedFormulario = null,
    isError: isLoadingFormularioError,
    isFetching: isFetchFormulario,
    isLoading: isLoadingFormulario,
  } = useGetFormulario()

  // READ hook (get formulario from api)
  function useGetFormulario() {
    return useQuery({
      queryKey: ["FormularioProceso", formularioID],
      queryFn: async () => {
        let response = await fetchwrapper(`/PaquetesDeProcesosTareas/getPaquete/${formularioID}`)
        response = await response.json()
        return response
      },
      refetchOnWindowFocus: false,
    })
  }

  if (isLoadingFormularioError) {
    alert("Error al obtener el paquete")
    navigate(-1)
  }

  // When all formulario load set in state - VERSIÓN CORRECTA
  useEffect(() => {
    if (fetchedFormulario?.cabecera) {
      const cabecera = fetchedFormulario?.cabecera

      // Asegurar que data1 y data2 sean arrays
      const data1 = Array.isArray(fetchedFormulario?.detalle?.data1) ? fetchedFormulario.detalle.data1 : []

      const data2 = Array.isArray(fetchedFormulario?.detalle?.data2) ? fetchedFormulario.detalle.data2 : []

      // Asignacion de datos de cabecera
      setCodigo(cabecera?.formcodigo || "")
      setProceso(cabecera?.procesocod || "")
      setDescripcion(cabecera?.formdescri || "")

      const estadoEncontrado = Estados.find((estado) => estado.value === cabecera?.formstatus)
      setEstado(estadoEncontrado || Estados[0])

      // Asignacion de datos del detalle
      console.log("Tareas disponibles (data1 - izquierda):", data1.length)
      console.log("Tareas del paquete (data2 - derecha):", data2.length)

      setAllPreguntas(data1) // ← Izquierda: tareas DISPONIBLES
      setPreguntasSelectedFormulario(data2) // ← Derecha: tareas del PAQUETE
    }
  }, [fetchedFormulario])

  // Función para obtener paquetes disponibles (excluyendo el actual)
  const fetchPaquetesParaImportar = async () => {
    try {
      let response = await fetchwrapper("/PaquetesDeProcesosTareas/getAllPaquetesConDetalle")
      response = await response.json()

      const paquetes = (response?.data || [])
        .filter((item) => item.cabecera?.formcodigo !== formularioID)
        .map((item) => ({
          formcodigo: item.cabecera?.formcodigo,
          formdescri: item.cabecera?.formdescri,
          formstatus: item.cabecera?.formstatus,
          procesocod: item.cabecera?.procesocod,
          tareas: item.detalle || [],
        }))

      return paquetes
    } catch (error) {
      console.error("Error al obtener paquetes:", error)
      return []
    }
  }

  const handleOpenImportModal = async () => {
    try {
      const paquetes = await fetchPaquetesParaImportar()
      setPaquetesDisponibles(paquetes)
      setOpenImportModal(true)
    } catch (error) {
      alert("Error al cargar paquetes disponibles")
    }
  }

  // Importar tareas (MISMAS REGLAS que creación)
  const handleImportarPaquete = () => {
    if (!paqueteSeleccionadoImportar || !paqueteSeleccionadoImportar.tareas) {
      alert("Seleccione un paquete con tareas para importar")
      return
    }

    const tareasDelPaquete = paqueteSeleccionadoImportar.tareas

    // IDs de tareas ya en el paquete (derecha - data2)
    const idsEnPaquete = new Set(preguntasSelectedFormulario.map((t) => t.pregcodigo).filter(Boolean))
    // IDs de tareas disponibles (izquierda - data1)
    const idsDisponibles = new Set(allPreguntas.map((t) => t.pregcodigo).filter(Boolean))

    let tareasAgregadas = 0
    let tareasIgnoradas = 0

    tareasDelPaquete.forEach((tarea) => {
      const tareaId = tarea.pregcodigo

      // REGLA 1: ¿Ya está en el paquete? (data2)
      if (idsEnPaquete.has(tareaId)) {
        tareasIgnoradas++
        return
      }

      // REGLA 2: ¿Está en disponibles? (data1)
      if (idsDisponibles.has(tareaId)) {
        // Mover de disponibles (data1) a paquete (data2)
        setAllPreguntas((prev) => prev.filter((t) => t.pregcodigo !== tareaId))
        setPreguntasSelectedFormulario((prev) => [...prev, tarea])
        tareasAgregadas++
        return
      }

      // REGLA 3: No está en ningún lado → agregar al paquete (data2)
      setPreguntasSelectedFormulario((prev) => [...prev, tarea])
      tareasAgregadas++
    })

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

  const queryClient = useQueryClient()

  const { mutateAsync: updateFormulario, isPending: isUpdatingFormulario } = useMutation({
    mutationFn: async (formulario) => {
      const options = {
        method: "PUT",
        body: JSON.stringify(formulario),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      let response = await fetchwrapper(`/PaquetesDeProcesosTareas/editPaquete/${formularioID}`, options)
      response = await response.json()
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["FormularioProceso", formularioID] })
      alert("Paquete actualizado con éxito")
    },
    onError: () => {
      alert("Error al actualizar el paquete")
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!descripcion || !estado || !proceso || preguntasSelectedFormulario.length === 0) {
      alert("Complete todos los campos")
      return
    }

    const updateFormularioData = {
      cabecera: {
        descripcion,
        estado: estado.value,
        procesocod: proceso,
      },
      detalle: preguntasSelectedFormulario,
    }

    try {
      await updateFormulario(updateFormularioData)
    } catch (error) {
      console.error("Error al actualizar:", error)
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
          <b>Editar Paquete</b>
        </div>

        <CustomBackdrop isLoading={isLoadingFormulario || isFetchFormulario || isUpdatingFormulario} />

        <Box className={StyledRoot}>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Código"
              margin="normal"
              fullWidth
              value={codigo}
              required
              disabled
              sx={{ backgroundColor: "#e2dbd8" }}
            />

            <TextField
              label="Proceso"
              margin="normal"
              fullWidth
              value={proceso}
              required
              disabled
              sx={{ backgroundColor: "#e2dbd8" }}
            />

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
                  setEstado(Estados.find((estado) => estado.value === selectedValue) || Estados[0])
                }}
              >
                {Estados.map((estado) => (
                  <MenuItem key={estado.value} value={estado.value}>
                    {estado.description}
                  </MenuItem>
                ))}
              </Select>
            </div>

            <Box sx={{ display: "flex", gap: 2, marginTop: "20px" }}>
              <Button type="submit" variant="outlined" color="primary" disabled={isUpdatingFormulario}>
                <img src={CrearIcon} alt="Editar" style={{ width: "40px", marginRight: "8px" }} />
                {isUpdatingFormulario ? "Guardando..." : "Guardar Cambios"}
              </Button>

              <Button variant="contained" color="primary" onClick={handleOpenImportModal}>
                📦 Importar de Otro Paquete
              </Button>
            </Box>
          </form>

          {/* Modal para importar */}
          <Dialog open={openImportModal} onClose={() => setOpenImportModal(false)} maxWidth="md" fullWidth>
            <DialogTitle>Importar de Otro Paquete</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Seleccione un paquete para importar sus tareas
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
                    <strong>Tareas:</strong> {paqueteSeleccionadoImportar.tareas?.length || 0}
                  </Typography>
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

export default EditarPaquetesDeProcesoTareas
