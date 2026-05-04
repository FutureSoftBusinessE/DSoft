import Header from "../../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  InputLabel,
  Tooltip,
} from "@mui/material"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import BackIcon from "../../../components/BackIcon"
import DeleteIcon from "@mui/icons-material/Delete"
import { TimePicker } from "@mui/x-date-pickers/TimePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"

import CustomAutocomplete from "../../../components/CustomAutocomplete"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../../../components/CustomBackdrop"

import CrearIcon from "../../../assets/iconos/Crear.ico"

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

// Opciones para días de la semana
const diasSemana = [
  { value: 1, label: "Domingo" },
  { value: 2, label: "Lunes" },
  { value: 3, label: "Martes" },
  { value: 4, label: "Miércoles" },
  { value: 5, label: "Jueves" },
  { value: 6, label: "Viernes" },
  { value: 7, label: "Sábado" },
]

// Hook para obtener usuarios
function useGetUsuarios() {
  return useQuery({
    queryKey: ["CrearAsignacionHorariosAUsuariosUsuarios"],
    queryFn: async () => {
      const response = await fetchwrapper(`/AsignacionHorariosAUsuarios/getAllUsuarios`)
      const result = await response.json()
      return result.data
    },
  })
}

// Hook para obtener localidades
function useGetLocalidades() {
  return useQuery({
    queryKey: ["CrearAsignacionHorariosAUsuariosLocalidades"],
    queryFn: async () => {
      const response = await fetchwrapper(`/AsignacionHorariosAUsuarios/getAllLocalidades`)
      const result = await response.json()
      return result.data
    },
  })
}

const CrearAsignacionHorariosAUsuarios = () => {
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [localidadSeleccionada, setLocalidadSeleccionada] = useState(null)
  const [cupo, setCupo] = useState("")
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [horaDesde, setHoraDesde] = useState(null)
  const [horaHasta, setHoraHasta] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [secuencia, setSecuencia] = useState(1) // Contador para hrsecuen

  // Obtener datos de usuarios y localidades
  const {
    data: dataUsers = [],
    isLoading: isLoadingUsuarios,
    isError: isErrorUsuarios,
    isRefetching: isRefetchingUsuarios,
    refetch: refetchDataUsers,
  } = useGetUsuarios()

  const {
    data: dataLocalidades = [],
    isLoading: isLoadingLocalidades,
    isError: isErrorLocalidades,
    isRefetching: isRefetchingLocalidades,
  } = useGetLocalidades()

  // Mapear usuarios al formato esperado
  const usuariosMapeados =
    dataUsers?.map((usuario) => ({
      value: usuario.usrcodigo || usuario.id || usuario.value,
      label: `${usuario.usrnombre || usuario.nombre} [${usuario.usrcodigo || usuario.id}]`,
      usrcodigo: usuario.usrcodigo || usuario.id,
      usrnombre: usuario.usrnombre || usuario.nombre,
      usrstatus: usuario.usrstatus || usuario.status || "A",
    })) || []

  // Mapear localidades al formato esperado
  const localidadesMapeadas =
    dataLocalidades?.map((localidad) => ({
      value: localidad.loccodigo || localidad.id || localidad.value,
      label: `${localidad.locdescri || localidad.nombre} [${localidad.loccodigo || localidad.id}]`,
      loccodigo: localidad.loccodigo || localidad.id,
      locdescri: localidad.locdescri || localidad.nombre,
    })) || []

  const handleAgregarHorario = async () => {
    if (!localidadSeleccionada || !cupo || !diaSeleccionado || !horaDesde || !horaHasta) {
      alert("Por favor, complete todos los campos")
      return
    }

    // Validación corregida usando métodos dayjs
    if (horaDesde.isAfter(horaHasta) || horaDesde.isSame(horaHasta)) {
      alert("La hora 'Desde' debe ser menor que la hora 'Hasta'")
      return
    }

    const diaSeleccionadoObj = diasSemana.find((dia) => dia.value === diaSeleccionado.value)

    // SOLO VALIDAR SUPERPOSICIÓN de dias en una misma localidad
    // Filtrar horarios del mismo día y misma localidad
    const horariosMismoDiaLocalidad = horarios.filter(
      (horario) =>
        horario.localidadCodigo === localidadSeleccionada.loccodigo && horario.diaValor === diaSeleccionado.value,
    )

    // Convertir nuevas horas a minutos para comparación
    const nuevoDesdeMinutos = horaDesde.hour() * 60 + horaDesde.minute()
    const nuevoHastaMinutos = horaHasta.hour() * 60 + horaHasta.minute()

    // Verificar superposición con cada horario existente del mismo día y localidad
    const tieneSuperposicion = horariosMismoDiaLocalidad.some((horarioExistente) => {
      // Convertir horas existentes a minutos
      const [existenteHoraDesde, existenteMinutoDesde] = horarioExistente.desde.split(":").map(Number)
      const [existenteHoraHasta, existenteMinutoHasta] = horarioExistente.hasta.split(":").map(Number)

      const existenteDesdeMinutos = existenteHoraDesde * 60 + existenteMinutoDesde
      const existenteHastaMinutos = existenteHoraHasta * 60 + existenteMinutoHasta

      // Verificar si los intervalos se superponen
      const seSuperpone =
        (nuevoDesdeMinutos >= existenteDesdeMinutos && nuevoDesdeMinutos < existenteHastaMinutos) || // Inicio dentro
        (nuevoHastaMinutos > existenteDesdeMinutos && nuevoHastaMinutos <= existenteHastaMinutos) || // Fin dentro
        (nuevoDesdeMinutos <= existenteDesdeMinutos && nuevoHastaMinutos >= existenteHastaMinutos) // Contiene completo

      return seSuperpone
    })

    if (tieneSuperposicion) {
      // Encontrar el horario que causa la superposición para mostrar mensaje detallado
      const horarioConflictivo = horariosMismoDiaLocalidad.find((horarioExistente) => {
        const [existenteHoraDesde, existenteMinutoDesde] = horarioExistente.desde.split(":").map(Number)
        const [existenteHoraHasta, existenteMinutoHasta] = horarioExistente.hasta.split(":").map(Number)

        const existenteDesdeMinutos = existenteHoraDesde * 60 + existenteMinutoDesde
        const existenteHastaMinutos = existenteHoraHasta * 60 + existenteMinutoHasta

        return (
          (nuevoDesdeMinutos >= existenteDesdeMinutos && nuevoDesdeMinutos < existenteHastaMinutos) ||
          (nuevoHastaMinutos > existenteDesdeMinutos && nuevoHastaMinutos <= existenteHastaMinutos) ||
          (nuevoDesdeMinutos <= existenteDesdeMinutos && nuevoHastaMinutos >= existenteHastaMinutos)
        )
      })

      alert(
        `El horario se superpone con otro horario existente:\n\n` +
          `Día: ${diaSeleccionadoObj.label}\n` +
          `Localidad: ${localidadSeleccionada.locdescri}\n` +
          `Horario existente: ${horarioConflictivo.desde} - ${horarioConflictivo.hasta}\n` +
          `Nuevo horario: ${horaDesde.format("HH:mm")} - ${horaHasta.format("HH:mm")}\n\n` +
          `Por favor, ajuste el horario para evitar la superposición.`,
      )
      return
    }

    const nuevoHorario = {
      id: Date.now(), // ID único para React
      hrsecuen: secuencia, // Secuencia 1, 2, 3, ...
      localidad: localidadSeleccionada.locdescri,
      localidadCodigo: localidadSeleccionada.loccodigo,
      dia: diaSeleccionadoObj.label,
      diaValor: diaSeleccionadoObj.value,
      desde: horaDesde.format("HH:mm"),
      hasta: horaHasta.format("HH:mm"),
      cupo: parseInt(cupo),
    }

    setHorarios([...horarios, nuevoHorario])
    setSecuencia(secuencia + 1) // Incrementar la secuencia para el próximo horario

    // Limpiar campos del formulario
    setLocalidadSeleccionada(null)
    setCupo("")
    setDiaSeleccionado(null)
    setHoraDesde(null)
    setHoraHasta(null)
  }

  const handleEliminarHorario = (id) => {
    const horarioAEliminar = horarios.find((horario) => horario.id === id)
    const nuevosHorarios = horarios.filter((horario) => horario.id !== id)

    setHorarios(nuevosHorarios)

    // Si eliminamos un horario, reordenamos las secuencias
    if (nuevosHorarios.length > 0) {
      const horariosReordenados = nuevosHorarios.map((horario, index) => ({
        ...horario,
        hrsecuen: index + 1,
      }))
      setHorarios(horariosReordenados)
      setSecuencia(horariosReordenados.length + 1)
    } else {
      // Si no quedan horarios, reiniciamos la secuencia
      setSecuencia(1)
    }
  }

  const handleSaveHorarios = async () => {
    if (!usuarioSeleccionado) {
      alert("Por favor, seleccione un usuario")
      return
    }

    if (horarios.length === 0) {
      alert("No hay horarios para guardar")
      return
    }

    try {
      setIsSaving(true)

      // Preparar los datos para enviar
      const datosParaEnviar = {
        sAccion: "CREATE",
        usrcodigo: usuarioSeleccionado.usrcodigo,
        usrcodigoNombre: usuarioSeleccionado.usrnombre,
        usrstatus: usuarioSeleccionado.usrstatus,
        horarios: horarios.map((horario) => ({
          hrsecuen: horario.hrsecuen,
          loccodigo: horario.localidadCodigo,
          locdescri: horario.localidad,
          dia: horario.diaValor,
          desde: horario.desde,
          hasta: horario.hasta,
          cupo: horario.cupo,
        })),
      }

      // Hacer console log de los datos a enviar
      console.log("Datos a enviar a la API:", datosParaEnviar)
      console.log("Horarios completos:", horarios)

      const response = await fetchwrapper(`/AsignacionHorariosAUsuarios/saveHorariosUsuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosParaEnviar),
      })

      const result = await response.json()
      // Limpiar el formulario después de guardar
      setHorarios([])
      setUsuarioSeleccionado(null)
      setSecuencia(1) // Reiniciar secuencia
      alert("Horarios guardados exitosamente")
      await refetchDataUsers()

      // if (result.success) {
      // } else {
      //   alert("Error al guardar los horarios: " + (result.message || "Error desconocido"))
      // }
    } catch (error) {
      console.error("Error al guardar horarios:", error)
      alert("Error al guardar los horarios. Por favor, intente nuevamente.")
    } finally {
      setIsSaving(false)
    }
  }

  // Reiniciar secuencia cuando se cambia de usuario
  useEffect(() => {
    if (!usuarioSeleccionado) {
      setHorarios([])
      setSecuencia(1)
    }
  }, [usuarioSeleccionado])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <CustomBackdrop
        isLoading={
          isLoadingUsuarios || isRefetchingUsuarios || isLoadingLocalidades || isRefetchingLocalidades || isSaving
        }
      />
      <ThemeProvider theme={theme}>
        <Header />
        <div className="main main-app p-3 p-lg-4">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <BackIcon />
          </div>
          <Tooltip title="Guardar horarios">
            <Button
              color="primary"
              onClick={handleSaveHorarios}
              disabled={isSaving || horarios.length === 0 || !usuarioSeleccionado}
              sx={{
                marginBlock: "15px",
              }}
            >
              <img src={CrearIcon} alt="Crear" style={{ width: "30px", height: "30px" }} />
            </Button>
          </Tooltip>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 30px 30px 30px",
              fontSize: "25px",
            }}
          >
            <b>Asignación de horarios</b>
          </div>

          <Box className={StyledRoot}>
            {/* Selección de Usuario */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <CustomAutocomplete
                  label="Usuario"
                  selectedOption={usuarioSeleccionado}
                  setSelectedOption={setUsuarioSeleccionado}
                  options={usuariosMapeados}
                  loading={isLoadingUsuarios}
                  error={isErrorUsuarios}
                />
              </Grid>
            </Grid>

            {/* Contenido principal - Formulario y Tabla */}
            {usuarioSeleccionado && (
              <Grid container spacing={3}>
                {/* Información del usuario y formulario - Lado izquierdo */}
                <Grid item xs={12} lg={4}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: "#196C87" }}>
                        Información del Usuario
                      </Typography>
                      <Typography>
                        <strong>Código:</strong> {usuarioSeleccionado.usrcodigo}
                      </Typography>
                      <Typography>
                        <strong>Usuario:</strong> {usuarioSeleccionado.usrnombre}
                      </Typography>
                      <Typography>
                        <strong>Estado:</strong> {usuarioSeleccionado.usrstatus === "A" ? "Activo" : "Inactivo"}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: "#196C87", mb: 3 }}>
                        Agregar Horario
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <CustomAutocomplete
                            label="Localidades"
                            selectedOption={localidadSeleccionada}
                            setSelectedOption={setLocalidadSeleccionada}
                            options={localidadesMapeadas}
                            loading={isLoadingLocalidades}
                            error={isErrorLocalidades}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Cupo"
                            type="number"
                            value={cupo}
                            onChange={(e) => setCupo(e.target.value)}
                            inputProps={{ min: 1 }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <CustomAutocomplete
                            label="Día"
                            selectedOption={diaSeleccionado}
                            setSelectedOption={setDiaSeleccionado}
                            options={diasSemana}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <InputLabel>Desde</InputLabel>
                          <TimePicker
                            value={horaDesde}
                            onChange={(newValue) => setHoraDesde(newValue)}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                              },
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <InputLabel>Hasta</InputLabel>
                          <TimePicker
                            value={horaHasta}
                            onChange={(newValue) => setHoraHasta(newValue)}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                              },
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={handleAgregarHorario}
                            sx={{
                              mt: 2,
                              py: 1.5,
                              backgroundColor: "#196C87",
                              "&:hover": {
                                backgroundColor: "#145369",
                              },
                            }}
                          >
                            Agregar Horario
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Tabla de horarios - Lado derecho */}
                <Grid item xs={12} lg={8}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <Typography variant="h6" sx={{ color: "#196C87" }}>
                          Horarios Asignados
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#196C87", fontWeight: "bold" }}>
                          Total: {horarios.length} horario(s)
                        </Typography>
                      </div>

                      {horarios.length > 0 ? (
                        <TableContainer
                          component={Paper}
                          sx={{
                            maxHeight: "600px",
                            "& .MuiTableRow-root:hover": {
                              backgroundColor: "#f5f5f5",
                            },
                          }}
                        >
                          <Table stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>#</TableCell>
                                <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>Localidad</TableCell>
                                <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>Día</TableCell>
                                <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>Desde</TableCell>
                                <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>Hasta</TableCell>
                                <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>Cupo</TableCell>
                                <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>Acciones</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {horarios.map((horario) => (
                                <TableRow key={horario.id}>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                      {horario.hrsecuen}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div>
                                        <strong>{horario.localidad}</strong>
                                      </div>
                                      <div style={{ fontSize: "0.8rem", color: "#666" }}>
                                        Código: {horario.localidadCodigo}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div>{horario.dia}</div>
                                      <div style={{ fontSize: "0.8rem", color: "#666" }}>
                                        (Valor: {horario.diaValor})
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{horario.desde}</TableCell>
                                  <TableCell>{horario.hasta}</TableCell>
                                  <TableCell>{horario.cupo}</TableCell>
                                  <TableCell>
                                    <Button
                                      color="error"
                                      size="small"
                                      startIcon={<DeleteIcon />}
                                      onClick={() => handleEliminarHorario(horario.id)}
                                      sx={{ minWidth: "auto" }}
                                    >
                                      Eliminar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box
                          sx={{
                            textAlign: "center",
                            py: 8,
                            border: "2px dashed #e0e0e0",
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="body1" color="textSecondary">
                            No hay horarios asignados. Agregue el primer horario usando el formulario.
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Mensaje cuando no hay usuario seleccionado */}
            {!usuarioSeleccionado && !isLoadingUsuarios && (
              <Card>
                <CardContent sx={{ textAlign: "center", py: 8 }}>
                  <Typography variant="h6" color="textSecondary">
                    Seleccione un usuario para comenzar a asignar horarios
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default CrearAsignacionHorariosAUsuarios
