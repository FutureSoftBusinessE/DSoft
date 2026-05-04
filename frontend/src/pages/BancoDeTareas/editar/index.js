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

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"

import BackIcon from "../../../components/BackIcon"
import GrabarIcon from "../../../assets/iconos/Grabar.ico"
import OpcionesMultiples from "../components/OpcionesMultiples"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useNavigate, useParams } from "react-router-dom"
import TextoLibre from "../components/TextoLibre"
import ListaOpciones from "../components/ListaOpciones"
import CustomAutocomplete from "../../../components/CustomAutocomplete"
import { set } from "rsuite/esm/utils/dateUtils"

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

const EditarBancoDeTareas = () => {
  const { id } = useParams()
  const navigate = useNavigate()

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
  const [codigo, setCodigo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [estado, setEstado] = useState(Estados[0])
  const [tipoPregunta, setTipoPregunta] = useState(TiposPregunta[0])
  const [preguntaObligatoria, setPreguntaObligatoria] = useState(PreguntaObligatoria[0])
  const [duracionTarea, setDuracionTarea] = useState(0)
  const [recurrenciaTarea, setRecurrenciaTarea] = useState("")
  const [modalidadTarea, setModalidadTarea] = useState(OpcionesModalidad[0].value)
  const [institucionTarea, setInstitucionTarea] = useState({ value: null, label: "" })

  const {
    data: fetchedBancoDePreguntas = {},
    isError: isLoadingBancoDePreguntasError,
    isFetching: isFetchingBancoDePreguntas,
    isLoading: isLoadingBancoDePreguntas,
  } = useGetSpecificBancoDePreguntas()

  if (isLoadingBancoDePreguntasError) {
    alert("Error en cargar las preguntas")
    navigate(-1)
  }

  // Carga inicial de insitituciones
  const {
    data: OpcionesInstituiciones = [],
    isLoading: isLoadingInstituciones,
    // isError: isErrorAccesos,
    // refetch: refetchAccesos,
    isFetching: isFetchingInstituciones,
  } = useGetInstituciones()
  function useGetInstituciones() {
    return useQuery({
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
    })
  }

  // call UPDATE hook
  const { mutateAsync: updateSpecificBancoDePregunta, isPending: isUpdatingBancoDePregunta } =
    useUpdateSpecificBancoDePregunta()

  // Estado para manejar el tipo de pregunta seleccionado
  const [allPreguntas, setallPreguntas] = useState([])

  // Manejar el loading al momento de crear el banco de preguntas en el db
  const [isLoadingEditarBancoDePregunta, setIsLoadingEditarBancoDePregunta] = useState(false)

  // When the data is fethced, set state respectively
  useEffect(() => {
    if (Object.keys(fetchedBancoDePreguntas).length === 0) return

    const { cabecera, detalle } = fetchedBancoDePreguntas

    setDescripcion(cabecera.descripcion)
    setCodigo(cabecera.codigo)

    const estado = Estados.find((estado) => estado.value === cabecera.estado)
    const tipoPregunta = TiposPregunta.find((tipoPregunta) => tipoPregunta.value === cabecera.tipoPregunta)
    const preguntaObligatoria = PreguntaObligatoria.find(
      (preguntaObligatoria) => preguntaObligatoria.value === cabecera.preguntaObligatoria,
    )

    setEstado(estado)
    setTipoPregunta(tipoPregunta)
    setPreguntaObligatoria(preguntaObligatoria)
    setallPreguntas(detalle)
    setDuracionTarea(cabecera.pregdurmin)
    setRecurrenciaTarea(cabecera.pregrecuren)

    setModalidadTarea(cabecera.pregespresencial)

    setInstitucionTarea((prev) => ({
      ...prev,
      value: cabecera.insticodigo,
      label: OpcionesInstituiciones.find((inst) => inst.value === cabecera.insticodigo)?.label || "",
    }))
  }, [fetchedBancoDePreguntas || OpcionesInstituiciones])

  // READ hook (get specific bancoDePreguntas from api)
  function useGetSpecificBancoDePreguntas() {
    return useQuery({
      queryKey: ["BancoDePreguntas", id],
      queryFn: async () => {
        // send api request here
        let response = await fetchwrapper(`/BancoDeTareas/getSpecificBancoDeTareas/${id}`)
        response = await response.json()
        response = response?.data
        return response
      },
      refetchOnWindowFocus: false,
    })
  }
  // UPDATE hook (put specific bancoDePregunta in api)
  function useUpdateSpecificBancoDePregunta() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (bancoDePregunta) => {
        // send api update request here
        // send api update request here
        const options = {
          method: "PUT",
          body: JSON.stringify(bancoDePregunta),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }

        let response = await fetchwrapper(`/BancoDeTareas/editarSpecificBancoDeTarea/${id}`, options)

        response = response.json()
        return response
      },
      // client side optimistic update
      onMutate: (newBancoDePregunta) => {
        console.log(newBancoDePregunta, "onmutate")
        queryClient.setQueryData(["BancoDePreguntas", id], (prevBancoDePreguntas) => ({
          ...newBancoDePregunta,
        }))
      },
      // onSettled: () => queryClient.invalidateQueries({ queryKey: ['bancoDePreguntas'] }), //refetch bancoDePreguntas after mutation, disabled for demo
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (tipoPregunta.value !== "U") {
      if (!(descripcion && estado && tipoPregunta && preguntaObligatoria) || allPreguntas.length === 0) {
        alert("Complete los campos")
        return
      }
    }

    try {
      setIsLoadingEditarBancoDePregunta(true)

      const bancoDePregunta = {
        cabecera: {
          codigo,
          descripcion,
          estado: estado.value,
          tipoPregunta: tipoPregunta.value,
          preguntaObligatoria: preguntaObligatoria.value,
          pregdurmin: duracionTarea,
          pregrecuren: recurrenciaTarea,
          insticodigo: institucionTarea.value,
          pregespresencial: modalidadTarea,
        },
        detalle: allPreguntas,
      }
      await updateSpecificBancoDePregunta(bancoDePregunta)

      alert(`Banco de tarea actualizado`)
    } catch (error) {
      alert("No se puedo actualizar el banco de tareas")
    } finally {
      setIsLoadingEditarBancoDePregunta(false)
    }
  }

  const clearAll = (tipoPregunta = TiposPregunta[0]) => {
    setDescripcion("")
    setEstado(Estados[0])
    setTipoPregunta(tipoPregunta)
    setPreguntaObligatoria(PreguntaObligatoria[0])
    setallPreguntas([])
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
            isLoadingBancoDePreguntas ||
            isLoadingEditarBancoDePregunta ||
            isUpdatingBancoDePregunta ||
            isFetchingBancoDePreguntas ||
            isLoadingInstituciones ||
            isFetchingInstituciones
          }
        />

        <Box className={StyledRoot}>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Código"
              margin="normal"
              fullWidth
              value={codigo}
              disabled
              required
              sx={{
                backgroundColor: "#e2dbd8",
              }}
            />

            <div>
              <InputLabel id="tiposPreguntasCB" sx={{ paddingBlock: "15px", paddingLeft: "5px" }}>
                Tipo de Pregunta
              </InputLabel>
              <Select
                fullWidth
                labelId="tiposPreguntasCB"
                value={tipoPregunta.value}
                onChange={(e) => {
                  const selectedValue = e.target.value
                  const tipoPregunta = TiposPregunta.find((tipoPregunta) => tipoPregunta.value === selectedValue)
                  setTipoPregunta(tipoPregunta)
                  clearAll(tipoPregunta)
                }}
              >
                {TiposPregunta.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.description}
                  </MenuItem>
                ))}
              </Select>
            </div>

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
              <img src={GrabarIcon} alt="Grabar" style={{ width: "40px" }} />
              Editar
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

export default EditarBancoDeTareas
