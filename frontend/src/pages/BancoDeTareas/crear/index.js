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
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  TextField,
  Button,
} from "@mui/material"

import BackIcon from "../../../components/BackIcon"
import CrearIcon from "../../../assets/iconos/Crear.ico"
import OpcionesMultiples from "../components/OpcionesMultiples"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../../../components/CustomBackdrop"
import TextoLibre from "../components/TextoLibre"
import ListaOpciones from "../components/ListaOpciones"
import CustomAutocomplete from "../../../components/CustomAutocomplete"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import useGetProceso from "../../utils/useGetProceso"
import CustomHelperDetail from "../../../components/CustomHelperDetail"

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

const CrearBancoDeTareas = () => {
  // Valores por defectos para los comboboxes y el check
  const Estados = [
    { value: "A", description: "Activo" },
    { value: "I", description: "Inactivo" },
  ]
  const TiposPregunta = [
    { value: "U", description: "Texto Libre" },
    { value: "L", description: "Lista de Opciones" },
    { value: "M", description: "Opciones Múltiples" },
  ]

  const PreguntaObligatoria = [
    { value: -1, description: " Es obligatoria", checked: true },
    { value: 0, description: "No es obligatoría", checked: false },
  ]

  const OpcionesRecurrencia = [
    { value: "diaria", description: "Diaria" },
    { value: "semanal", description: "Semanal" },
    { value: "mensual", description: "Mensual" },
    { value: "anual", description: "Anual" },
  ]

  const OpcionesModalidad = [
    { value: -1, description: "Presencial" },
    { value: 0, description: "En línea" },
  ]

  // Estados para manejaar el formulario de opciones
  const navigate = useNavigate()
  const [descripcion, setDescripcion] = useState("")
  const [estado, setEstado] = useState(Estados[0])
  const [tipoPregunta, setTipoPregunta] = useState(TiposPregunta[0])
  const [preguntaObligatoria, setPreguntaObligatoria] = useState(PreguntaObligatoria[0])
  const [duracionTarea, setDuracionTarea] = useState(0)
  const [recurrenciaTarea, setRecurrenciaTarea] = useState("")
  const [modalidadTarea, setModalidadTarea] = useState(OpcionesModalidad[0].value)
  const [institucionTarea, setInstitucionTarea] = useState({ value: null, label: "" })

  // Estado para manejar el tipo de pregunta seleccionado
  const [allPreguntas, setallPreguntas] = useState([])

  // Manejar el loading al momento de crear el banco de preguntas en el db
  const [isLoadingCrearBancoDePregunta, setIsLoadingCrearBancoDePregunta] = useState(false)

  // Carga inicial para saber que proceso es
  const { data: agendamientoSchiavoProceso, isLoading: isLoadingAgendamientoSchiavoProceso } =
    useGetProceso("AgendamientoSchiavo")

  console.log(
    Boolean(
      !isLoadingAgendamientoSchiavoProceso &&
        (!agendamientoSchiavoProceso?.data?.proceso || agendamientoSchiavoProceso?.data?.estado !== "A"),
    ),
    agendamientoSchiavoProceso,
    isLoadingAgendamientoSchiavoProceso,
    "!!!!!!!!",
  )
  // Solo cargar si el proceso NO existe (después de que terminó de cargar)
  const shouldLoadInstituciones =
    !isLoadingAgendamientoSchiavoProceso && // Esperar que termine de cargar
    !agendamientoSchiavoProceso?.data?.proceso // Si NO existe el proceso

  const {
    data: OpcionesInstituiciones = [],
    isLoading: isLoadingInstituciones,
    isFetching: isFetchingInstituciones,
  } = useQuery({
    queryKey: ["institucionesCrearBancoDeTareas"],
    queryFn: async () => {
      const response = await fetchwrapper(`/BancoDeTareas/getInstituciones`)
      const result = await response.json()
      return result.data
    },
    keepPreviousData: false,
    onError: () => {
      alert("Error: No se pudieron cargar las instituciones")
      navigate(-1)
      console.log("Error fetching data")
    },
    enabled: shouldLoadInstituciones, // ← Esto ahora funciona
  })

  // // Cada vez que se cambie el tipo de pregunta se borraran todos los datos
  useEffect(() => {
    clearAll(tipoPregunta)
  }, [tipoPregunta.value])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (tipoPregunta.value !== "U") {
      if (!(descripcion && estado && tipoPregunta && preguntaObligatoria) || allPreguntas.length === 0) {
        alert("Complete los campos")
        return
      }
    }

    try {
      const options = {
        method: "POST",
        body: JSON.stringify({
          cabecera: {
            descripcion,
            estado: estado.value,
            tipoPregunta: tipoPregunta.value,
            preguntaObligatoria: preguntaObligatoria.value,
            duracionTarea,
            recurrenciaTarea,
            insticodigo: institucionTarea.value,
            pregespresencial: modalidadTarea,
          },
          detalle: allPreguntas,
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      setIsLoadingCrearBancoDePregunta(true)

      let response = await fetchwrapper("/BancoDeTareas/createBancoDeTarea", options)
      response = await response.json()
      clearAll()
      alert(`Banco de tarea creado con código ${response.pregcodigoGenerated}`)
    } catch (error) {
      alert("No se pudo crear el banco de tarea o la secuencia de tarea no existe")
    } finally {
      setIsLoadingCrearBancoDePregunta(false)
    }
  }

  const clearAll = (tipoPregunta = TiposPregunta[0]) => {
    setDescripcion("")
    setEstado(Estados[0])
    setTipoPregunta(tipoPregunta)
    setPreguntaObligatoria(PreguntaObligatoria[0])
    setallPreguntas([])
    setDuracionTarea(0)
    setRecurrenciaTarea("")
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
          <b>Banco de Tareas</b>
        </div>
        <CustomBackdrop
          isLoading={
            isLoadingCrearBancoDePregunta ||
            isLoadingInstituciones ||
            isFetchingInstituciones ||
            isLoadingAgendamientoSchiavoProceso
          }
        />

        <Box className={StyledRoot}>
          <form onSubmit={handleSubmit}>
            <div>
              <InputLabel id="tiposPreguntasCB" sx={{ paddingBlock: "15px", paddingLeft: "5px" }}>
                Tipo de tarea
              </InputLabel>
              <Select
                fullWidth
                labelId="tiposPreguntasCB"
                value={tipoPregunta.value}
                onChange={(e) => {
                  const selectedValue = e.target.value
                  setTipoPregunta(TiposPregunta.find((tipoPregunta) => tipoPregunta.value === selectedValue))
                }}
              >
                {TiposPregunta.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.description}
                  </MenuItem>
                ))}
              </Select>
            </div>

            {!shouldLoadInstituciones && (
              <CustomHelperDetail
                label="Servicio"
                valueSearched={descripcion}
                endpoint="/ProcesosDeTarea/getServiciosHelper"
                valueInputMain="artcodigo"
                valueInputSecondary="artdescri"
                idSearchField="artcodigo"
                errorMsgIdSearch="Error fetching data:"
                errorMsgFilterSearch="Error en cargar datos"
                queryKeyModal="serviciosCustomHelperDetailgetServiciosHelper"
                perPage={10}
                placeholder=""
                onHandleSelectedData={(v) => setDescripcion(v?.artcodigo)}
                sxInputMain={{
                  minWidth: "170px",
                  maxWidth: "170px",
                  marginRight: "10px",
                }}
                sxInputSecondary={{
                  width: "100%",
                }}
                columnsTable={[
                  {
                    accessorKey: "artcodigo",
                    header: "Código",
                    size: 150,
                    Cell: ({ cell }) => {
                      const value = cell.getValue()
                      return <span>{value}</span>
                    },
                  },
                  {
                    accessorKey: "artdescri",
                    header: "Descripción",
                    size: 300,
                    Cell: ({ cell }) => {
                      const value = cell.getValue()
                      return <span>{value}</span>
                    },
                  },
                ]}
              />
            )}

            {shouldLoadInstituciones && (
              <TextField
                label="Descripción"
                margin="normal"
                fullWidth
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
              />
            )}

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

            {/* NUEVO: Duración en minutos */}
            <div>
              <InputLabel id="duracionTarea" sx={{ paddingTop: "15px", paddingLeft: "5px" }}>
                Duración (minutos)
              </InputLabel>
              <TextField
                labelId="duracionTarea"
                type="text"
                margin="normal"
                fullWidth
                value={duracionTarea}
                onChange={(e) => {
                  const value = e.target.value

                  // Solo permitir números
                  if (/^\d*$/.test(value)) {
                    // Si el valor no está vacío, convertir a número para eliminar ceros a la izquierda
                    if (value !== "") {
                      const numericValue = parseInt(value, 10)
                      setDuracionTarea(numericValue.toString())
                    } else {
                      setDuracionTarea("")
                    }
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") {
                    setDuracionTarea("0")
                  }
                }}
                inputProps={{
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                required
              />
            </div>

            {/* NUEVO: Recurrencia */}
            <div>
              <InputLabel id="recurrenciaCB" sx={{ paddingBlock: "10px", paddingLeft: "5px" }}>
                Recurrencia
              </InputLabel>
              <Select
                fullWidth
                labelId="recurrenciaCB"
                value={recurrenciaTarea}
                onChange={(e) => setRecurrenciaTarea(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">No recurrente</MenuItem>
                {OpcionesRecurrencia.map((opcion) => (
                  <MenuItem key={opcion.value} value={opcion.value}>
                    {opcion.description}
                  </MenuItem>
                ))}
              </Select>
            </div>

            <div>
              <InputLabel id="modalidadCB" sx={{ paddingBlock: "10px", paddingLeft: "5px" }}>
                Modalidad
              </InputLabel>
              <Select
                fullWidth
                labelId="modalidadCB"
                value={modalidadTarea}
                onChange={(e) => setModalidadTarea(e.target.value)}
                displayEmpty
              >
                {OpcionesModalidad.map((opcion) => (
                  <MenuItem key={opcion.value} value={opcion.value}>
                    {opcion.description}
                  </MenuItem>
                ))}
              </Select>
            </div>

            {/* Campo de Institución - Solo se muestra si el proceso NO existe o está inactivo */}
            {shouldLoadInstituciones && (
              <div>
                <InputLabel id="insitutcionCB" sx={{ paddingBlock: "10px", paddingLeft: "5px" }}>
                  Institución (Opcional)
                </InputLabel>
                <CustomAutocomplete
                  label=""
                  selectedOption={institucionTarea}
                  setSelectedOption={(v) => {
                    setInstitucionTarea((prev) => ({
                      ...prev,
                      value: v?.value ?? null,
                      label: v?.label ?? "",
                    }))
                  }}
                  options={OpcionesInstituiciones}
                />
              </div>
            )}

            <FormGroup sx={{ paddingBlock: "15px", paddingLeft: "5px" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={preguntaObligatoria.checked}
                    onChange={(e) => {
                      const selectedValue = e.target.checked
                      setPreguntaObligatoria(
                        PreguntaObligatoria.find(
                          (preguntaObligatoria) => preguntaObligatoria.checked === selectedValue,
                        ),
                      )
                    }}
                  />
                }
                label="Tarea Obligatoria"
              />
            </FormGroup>

            <Button type="submit" variant="outlined" color="primary">
              <img src={CrearIcon} alt="Crear" style={{ width: "40px" }} />
              Crear
            </Button>
          </form>

          {/* {tipoPregunta.value === "U" && (
            <div
              style={{
                boxSizing: "borderBox",
                marginTop: "20px",
                border: "5px solid #5a9996",
                padding: "10px",
                paddingTop: "15px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "18px",
                    color: "black",
                    marginLeft: "5px",
                  }}
                >
                  Opciones
                </p>

                <TextoLibre
                  allPreguntas={allPreguntas}
                  setallPreguntas={setallPreguntas}
                />
              </div>
            </div>
          )} */}

          {tipoPregunta.value === "L" && (
            <div
              style={{
                boxSizing: "borderBox",
                marginTop: "20px",
                border: "5px solid #5a9996",
                padding: "10px",
                paddingTop: "15px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "18px",
                    color: "black",
                    marginLeft: "5px",
                  }}
                >
                  Opciones
                </p>

                <ListaOpciones allPreguntas={allPreguntas} setallPreguntas={setallPreguntas} />
              </div>
            </div>
          )}

          {tipoPregunta.value === "M" && (
            <div
              style={{
                boxSizing: "borderBox",
                marginTop: "20px",
                border: "5px solid #5a9996",
                padding: "10px",
                paddingTop: "15px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "18px",
                    color: "black",
                    marginLeft: "5px",
                  }}
                >
                  Opciones
                </p>

                <OpcionesMultiples allPreguntas={allPreguntas} setallPreguntas={setallPreguntas} />
              </div>
            </div>
          )}
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearBancoDeTareas
