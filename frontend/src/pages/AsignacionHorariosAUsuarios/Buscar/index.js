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
import { useLocation, useNavigate } from "react-router-dom"
import BackIcon from "../../../components/BackIcon"
import DeleteIcon from "@mui/icons-material/Delete"
import { TimePicker } from "@mui/x-date-pickers/TimePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"

import CustomAutocomplete from "../../../components/CustomAutocomplete"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../../../components/CustomBackdrop"

import CrearIcon from "../../../assets/iconos/Grabar.ico"

import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"

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

// Hook para obtener horarios existentes
function useGetHorariosUsuario(usrcodigo, loccodigo) {
  return useQuery({
    queryKey: ["horariosUsuario", usrcodigo, loccodigo],
    queryFn: async () => {
      const response = await fetchwrapper(`/AsignacionHorariosAUsuarios/getHorariosUsuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usrcodigo,
          loccodigo,
        }),
      })
      const result = await response.json()
      return result.data || []
    },
    enabled: !!usrcodigo && !!loccodigo,
  })
}

const BuscarAsignacionHorariosAUsuarios = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location
  const [expanded, setExpanded] = useState(true)
  const handleToggle = () => setExpanded((prev) => !prev)

  // Datos recibidos del navigate
  const [usuarioData, setUsuarioData] = useState(null)

  // Estado del formulario (igual que en crear)
  const [localidadSeleccionada, setLocalidadSeleccionada] = useState(null)
  const [cupo, setCupo] = useState("")
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [horaDesde, setHoraDesde] = useState(null)
  const [horaHasta, setHoraHasta] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [secuencia, setSecuencia] = useState(1)

  // Obtener datos del estado de navegación
  useEffect(() => {
    if (state) {
      setUsuarioData({
        usrcodigo: state.usrcodigo,
        usrnombre: state.usrnombre,
        usrstatus: state.usrstatus,
        loccodigo: state.loccodigo,
        locdescri: state.locdescri,
        hrfecmsys: state.hrfecmsys,
        hrhormsys: state.hrhormsys,
      })

      // Inicializar localidad seleccionada con los datos recibidos
      setLocalidadSeleccionada({
        loccodigo: state.loccodigo,
        locdescri: state.locdescri,
        value: state.loccodigo,
        label: `${state.locdescri} [${state.loccodigo}]`,
      })
    } else {
      navigate(-1)
    }
  }, [state, navigate])

  // Obtener horarios existentes del usuario
  const {
    data: horariosExistentes = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useGetHorariosUsuario(usuarioData?.usrcodigo, usuarioData?.loccodigo)

  // Cargar horarios existentes al estado local
  useEffect(() => {
    if (horariosExistentes && horariosExistentes.length > 0) {
      const horariosFormateados = horariosExistentes.map((horario, index) => ({
        id: Date.now() + index, // ID único
        hrsecuen: index + 1,
        localidad: horario.locdescri,
        localidadCodigo: horario.loccodigo,
        dia: diasSemana.find((d) => d.value === horario.hrdia)?.label || `Día ${horario.hrdia}`,
        diaValor: horario.hrdia,
        desde: horario.hrhorini,
        hasta: horario.hrhorfin,
        cupo: horario.hrcupo,
      }))
      setHorarios(horariosFormateados)
      setSecuencia(horariosFormateados.length + 1)
    } else {
      setHorarios([])
      setSecuencia(1)
    }
  }, [horariosExistentes])

  // Validación de superposición (misma que en crear)
  const validarSuperposicion = (nuevoDesde, nuevoHasta, nuevoDiaValor) => {
    const horariosMismoDiaLocalidad = horarios.filter(
      (horario) => horario.localidadCodigo === localidadSeleccionada?.loccodigo && horario.diaValor === nuevoDiaValor,
    )

    const nuevoDesdeMinutos = nuevoDesde.hour() * 60 + nuevoDesde.minute()
    const nuevoHastaMinutos = nuevoHasta.hour() * 60 + nuevoHasta.minute()

    const tieneSuperposicion = horariosMismoDiaLocalidad.some((horarioExistente) => {
      const [existenteHoraDesde, existenteMinutoDesde] = horarioExistente.desde.split(":").map(Number)
      const [existenteHoraHasta, existenteMinutoHasta] = horarioExistente.hasta.split(":").map(Number)

      const existenteDesdeMinutos = existenteHoraDesde * 60 + existenteMinutoDesde
      const existenteHastaMinutos = existenteHoraHasta * 60 + existenteMinutoHasta

      const seSuperpone =
        (nuevoDesdeMinutos >= existenteDesdeMinutos && nuevoDesdeMinutos < existenteHastaMinutos) ||
        (nuevoHastaMinutos > existenteDesdeMinutos && nuevoHastaMinutos <= existenteHastaMinutos) ||
        (nuevoDesdeMinutos <= existenteDesdeMinutos && nuevoHastaMinutos >= existenteHastaMinutos)

      return seSuperpone
    })

    return tieneSuperposicion
  }

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

    // Limpiar campos del formulario (excepto localidad porque es fija en editar)
    setCupo("")
    setDiaSeleccionado(null)
    setHoraDesde(null)
    setHoraHasta(null)
  }

  const handleEliminarHorario = (id) => {
    const nuevosHorarios = horarios.filter((horario) => horario.id !== id)

    setHorarios(nuevosHorarios)

    // Reordenar secuencias
    if (nuevosHorarios.length > 0) {
      const horariosReordenados = nuevosHorarios.map((horario, index) => ({
        ...horario,
        hrsecuen: index + 1,
      }))
      setHorarios(horariosReordenados)
      setSecuencia(horariosReordenados.length + 1)
    } else {
      setSecuencia(1)
    }
  }

  const handleGuardarCambios = async () => {
    if (!usuarioData) {
      alert("Error: No hay datos de usuario")
      return
    }

    if (horarios.length === 0) {
      if (window.confirm("No hay horarios asignados. ¿Desea eliminar todos los horarios existentes?")) {
        // Proceder con eliminación de todos los horarios
      } else {
        return
      }
    }

    try {
      setIsSaving(true)

      // Preparar datos para enviar - REEMPLAZAR TODO
      const datosParaEnviar = {
        sAccion: "EDIT",
        usrcodigo: usuarioData.usrcodigo,
        usrcodigoNombre: usuarioData.usrnombre,
        loccodigo: usuarioData.loccodigo,
        // usrstatus: usuarioData.usrstatus,
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

      console.log("Datos a enviar para REEMPLAZAR:", datosParaEnviar)

      const response = await fetchwrapper(`/AsignacionHorariosAUsuarios/saveHorariosUsuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosParaEnviar),
      })

      const result = await response.json()
      alert("Horarios actualizados exitosamente")
      refetch() // Recargar datos
    } catch (error) {
      console.error("Error al guardar cambios:", error)
      alert("Error al guardar los cambios. Por favor, intente nuevamente.")
    } finally {
      setIsSaving(false)
    }
  }

  // Formatear fecha para mostrar
  const formatFecha = (fecha) => {
    if (!fecha) return "N/A"
    return dayjs(fecha).format("DD/MM/YYYY")
  }

  // Formatear hora para mostrar
  const formatHora = (hora) => {
    if (!hora) return "N/A"
    return dayjs(hora, "HH:mm:ss").format("HH:mm")
  }

  if (!usuarioData) {
    return <div>Cargando...</div>
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <CustomBackdrop isLoading={isLoading || isRefetching || isSaving} />
      <ThemeProvider theme={theme}>
        <Header />
        <div className="main main-app p-3 p-lg-4">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <BackIcon />
          </div>

          {/* Botón para guardar cambios */}
          <Tooltip title="Guardar cambios">
            <Button
              color="primary"
              onClick={handleGuardarCambios}
              disabled={isSaving}
              sx={{
                marginBlock: "15px",
              }}
            >
              <img src={CrearIcon} alt="Guardar" style={{ width: "30px", height: "30px" }} />
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
            <b>Editar Horarios Asignados</b>
          </div>

          <Box className={StyledRoot}>
            {/* Información General (Vertical) */}
            <CustomFieldsetAccordion title="Información del usuario" expanded={expanded} onToggle={handleToggle}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="textSecondary" sx={{ mb: 0.5 }}>
                    Usuario:
                  </Typography>
                  <Typography variant="body1">{usuarioData.usrcodigo}</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="bold" color="textSecondary" sx={{ mb: 0.5 }}>
                    Usuario Nombre:
                  </Typography>
                  <Typography variant="body1">{usuarioData.usrnombre}</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="bold" color="textSecondary" sx={{ mb: 0.5 }}>
                    Localidad:
                  </Typography>
                  <Typography variant="body1">
                    [{usuarioData.loccodigo}] {usuarioData.locdescri}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="bold" color="textSecondary" sx={{ mb: 0.5 }}>
                    Horarios Actuales:
                  </Typography>
                  <Typography variant="body1">{horarios.length} horario(s)</Typography>
                </Box>
              </Box>
            </CustomFieldsetAccordion>

            {/* Contenido principal - MISMA INTERFAZ QUE CREAR */}
            <Grid container spacing={3}>
              {/* Lado izquierdo - Formulario para agregar */}
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: "#196C87", mb: 3 }}>
                      Agregar Nuevo Horario
                    </Typography>

                    <Grid container spacing={2}>
                      {/* Localidad (fija, no editable) */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Localidad"
                          value={`${usuarioData.locdescri} [${usuarioData.loccodigo}]`}
                          InputProps={{
                            readOnly: true,
                          }}
                          sx={{
                            "& .MuiInputBase-input": {
                              backgroundColor: "#f5f5f5",
                            },
                          }}
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

              {/* Lado derecho - Tabla de horarios */}
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
                        Horarios Asignados (Editables)
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
                                    <div style={{ fontSize: "0.8rem", color: "#666" }}>(Valor: {horario.diaValor})</div>
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
                          No hay horarios asignados. Agregue horarios usando el formulario.
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default BuscarAsignacionHorariosAUsuarios
