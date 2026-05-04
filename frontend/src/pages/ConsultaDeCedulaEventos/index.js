import { useState } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box, Button, Stack } from "@mui/material"
import fetchwrapper from "../../services/interceptors/fetchwrapper"
import BackIcon from "../../components/BackIcon"
import dayjs from "dayjs"
import CustomBackdrop from "../../components/CustomBackdrop"
import CustomAutocomplete from "../../components/CustomAutocomplete"
import CustomDatePicker from "../../components/CustomDatePicker"
import CustomFieldset from "../../components/CustomFieldset"
import CustomFieldsetAccordion from "../../components/CustomFieldsetAccordion"
import CustomAggregationSegregationComponent from "../../components/CustomAggregationSegregationComponent"
import { useQuery } from "@tanstack/react-query"

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

const ContainerFiltrosGenerales = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto auto auto auto",
  gridTemplateAreas: `
          "ILocalidad ILocalidad ILocalidad ILocalidad ILocalidad ILocalidad ILocalidad ILocalidad ILocalidad ILocalidad ILocalidad ILocalidad"
          "IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario"
          "IRangoFecha IRangoFecha IRangoFecha IRangoFecha IRangoFecha IRangoFecha IRangoFecha IRangoFecha IRangoFecha IRangoFecha IRangoFecha IRangoFecha"
          "IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar"
        `,
  gap: "8px",
  rowGap: "12px",
  alignItems: "center",
}))

const ILocalidad = styled(Box)({
  gridArea: "ILocalidad",
})

const IUsuario = styled(Box)({
  gridArea: "IUsuario",
})

const IRangoFecha = styled(Box)({
  gridArea: "IRangoFecha",
})

const IBtnFiltrar = styled(Box)({
  gridArea: "IBtnFiltrar",
})

const ContainerRangoFechaInner = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto",
  gridTemplateAreas: `
            "IFechaInicial IFechaInicial IFechaInicial IFechaInicial IFechaInicial IFechaInicial IFechaFinal IFechaFinal IFechaFinal IFechaFinal IFechaFinal IFechaFinal"
          `,
  gap: "8px",
  alignItems: "center",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
    gridTemplateRows: "auto auto",
    gridTemplateAreas: `
      "IFechaInicial"
      "IFechaFinal"
    `,
    gap: "12px",
  },
}))

const RangoFechaIFechaInicial = styled(Box)({
  gridArea: "IFechaInicial",
})

const RangoFechaIFechaFinal = styled(Box)({
  gridArea: "IFechaFinal",
})

// Hook para obtener localidades
function useGetAllLocalidades() {
  return useQuery({
    queryKey: ["PlanVsEjeLocalidades"],
    queryFn: async () => {
      const response = await fetchwrapper(`/ConsultaDeCedulaEventos/getLocalidades`)
      const result = await response.json()
      return result.data || []
    },
    onError: () => {
      console.log("Error fetching data localidades")
    },
  })
}

// Hook para obtener usuarios
function useGetAllUsuarios() {
  return useQuery({
    queryKey: ["PlanVsEjeUsuarios"],
    queryFn: async () => {
      const response = await fetchwrapper(`/ConsultaDeCedulaEventos/getUsuarios`)
      const result = await response.json()
      return result.data || []
    },
    onError: () => {
      console.log("Error fetching data usuarios")
    },
  })
}

// Hook para obtener datos principales
function useGetPlanVsEjeData(filtros) {
  return useQuery({
    queryKey: ["PlanVsEjeData", filtros],
    queryFn: async () => {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          externalFilters: {
            rangoFecha: [filtros.fechaInicio, filtros.fechaFin],
            loccodigo: filtros.loccodigo,
            usrcodigo: filtros.usrcodigo,
            eventocodigo: filtros.eventocodigo,
          },
        }),
      }
      const response = await fetchwrapper(`/ConsultaDeCedulaEventos/getEventos`, options)
      const result = await response.json()
      return result.data || []
    },
    enabled: false, // Se ejecutará manualmente al hacer clic en Filtrar
  })
}

// Función para determinar colores basados en el estado
const determinarColoresPorEstado = (estado) => {
  const estadoUpper = estado?.toUpperCase() || ""

  const colores = {
    PENDIENTE: { bg: "#ffeb3b", text: "#000000" }, // Amarillo, texto negro
    EN_PROCESO: { bg: "#2196f3", text: "#ffffff" }, // Azul, texto blanco
    COMPLETADA: { bg: "#4caf50", text: "#ffffff" }, // Verde, texto blanco
    COMPLETADO: { bg: "#4caf50", text: "#ffffff" }, // Verde, texto blanco (alternativo)
    REPROGRAMADA: { bg: "#ff9800", text: "#000000" }, // Naranja, texto negro
    CANCELADA: { bg: "#f44336", text: "#ffffff" }, // Rojo, texto blanco
    "NO INICIADO": { bg: "#9e9e9e", text: "#ffffff" }, // Gris, texto blanco (para NO INICIADO)
  }

  // Buscar coincidencia exacta primero
  if (colores[estadoUpper]) {
    return colores[estadoUpper]
  }

  // Buscar por coincidencia parcial
  for (const [key, value] of Object.entries(colores)) {
    if (estadoUpper.includes(key) || key.includes(estadoUpper)) {
      return value
    }
  }

  // Color por defecto si no hay coincidencia
  return { bg: "#e0e0e0", text: "#000000" } // Gris claro, texto negro
}

const PlanVsEje = () => {
  const [expanded, setExpanded] = useState(true)
  const [filtros, setFiltros] = useState({
    localidadCB: null,
    loccodigo: "",
    locdescri: "",
    usuarioCB: null,
    usrcodigo: "",
    usrnombre: "",
    eventocodigo: "",
    fechaInicio: dayjs().subtract(30, "day"), // Últimos 30 días por defecto
    fechaFin: dayjs(),
  })

  const handleSetFiltros = (k, v) => setFiltros((prev) => ({ ...prev, [k]: v }))

  const {
    data: dataLocalidades = [],
    isLoading: isLoadingLocalidades,
    isFetching: isFetchingLocalidades,
  } = useGetAllLocalidades()

  const { data: dataUsuarios = [], isLoading: isLoadingUsuarios, isFetching: isFetchingUsuarios } = useGetAllUsuarios()

  const {
    data: dataPlanVsEje = [],
    isLoading: isLoadingData,
    isFetching: isFetchingData,
    refetch: refetchData,
  } = useGetPlanVsEjeData(filtros)

  const handleToggle = () => {
    setExpanded(!expanded)
  }

  const handleClickFiltrarBtn = async () => {
    await refetchData()
  }

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return ""
    return dayjs(dateString).format("DD/MM/YYYY HH:mm")
  }

  // Función para formatear minutos laborados
  const formatMinutos = (minutos) => {
    if (minutos === null || minutos === undefined) return "0.00"
    return Number(minutos).toFixed(2)
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
          <b>Planificación vs Ejecución</b>
        </div>
        <CustomBackdrop
          isLoading={
            isLoadingLocalidades ||
            isFetchingLocalidades ||
            isLoadingUsuarios ||
            isFetchingUsuarios ||
            isLoadingData ||
            isFetchingData
          }
        />
        <Box className={StyledRoot}>
          <CustomFieldsetAccordion title="Filtros Generales" expanded={expanded} onToggle={handleToggle}>
            <ContainerFiltrosGenerales>
              <ILocalidad>
                <CustomAutocomplete
                  label="Localidad"
                  selectedOption={filtros.localidadCB}
                  setSelectedOption={(v) => {
                    setFiltros((prev) => ({
                      ...prev,
                      localidadCB: v,
                      loccodigo: v?.loccodigo ?? "",
                      locdescri: v?.locdescri ?? "",
                    }))
                  }}
                  options={dataLocalidades}
                  getOptionLabel={(option) => `${option.loccodigo} - ${option.locdescri}`}
                />
              </ILocalidad>

              <IUsuario>
                <CustomAutocomplete
                  label="Usuario"
                  selectedOption={filtros.usuarioCB}
                  setSelectedOption={(v) => {
                    setFiltros((prev) => ({
                      ...prev,
                      usuarioCB: v,
                      usrcodigo: v?.usrcodigo ?? "",
                      usrnombre: v?.usrnombre ?? "",
                    }))
                  }}
                  options={dataUsuarios}
                  getOptionLabel={(option) => `${option.usrcodigo} - ${option.usrnombre}`}
                />
              </IUsuario>

              <IRangoFecha>
                <CustomFieldset title={"Rango de Fechas"} sx={{ marginTop: "15px" }}>
                  <ContainerRangoFechaInner>
                    <RangoFechaIFechaInicial>
                      <CustomDatePicker
                        label="Fecha Inicial"
                        value={filtros.fechaInicio}
                        setValue={(v) => handleSetFiltros("fechaInicio", v)}
                        isOptional={true}
                      />
                    </RangoFechaIFechaInicial>
                    <RangoFechaIFechaFinal>
                      <CustomDatePicker
                        label="Fecha Final"
                        value={filtros.fechaFin}
                        setValue={(v) => handleSetFiltros("fechaFin", v)}
                        isOptional={true}
                      />
                    </RangoFechaIFechaFinal>
                  </ContainerRangoFechaInner>
                </CustomFieldset>
              </IRangoFecha>

              <IBtnFiltrar>
                <Button variant="contained" onClick={handleClickFiltrarBtn}>
                  Filtrar
                </Button>
              </IBtnFiltrar>
            </ContainerFiltrosGenerales>
          </CustomFieldsetAccordion>

          {dataPlanVsEje.length > 0 && (
            <CustomAggregationSegregationComponent
              data={dataPlanVsEje}
              columnsConfig={({ totalSumMmPlanificada, totalSumMinutoslab, totalSumPorcentajeavance }) => [
                {
                  accessorKey: "locdescri",
                  header: "Localidad",
                  size: 150,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "eventocodigo",
                  header: "Evento",
                  size: 200,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "usrnombre",
                  header: "Usuario",
                  size: 200,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "procesocod",
                  header: "Proceso",
                  size: 250,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "formsecuen",
                  header: "Secuencia",
                  size: 100,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "pregdescri",
                  header: "Descripción Actividad",
                  size: 300,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "clinombre",
                  header: "Cliente",
                  size: 300,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "eventofecha",
                  header: "Fecha Planificada",
                  size: 200,
                  Cell: ({ cell }) => <span>{formatDate(cell.getValue())}</span>,
                },
                {
                  accessorKey: "eventosecuen",
                  header: "Sec. Ejecución",
                  size: 120,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "comentario",
                  header: "Comentario",
                  size: 250,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "statusnuevo",
                  header: "Estado",
                  size: 120,
                  Cell: ({ cell }) => {
                    const estado = cell.getValue()
                    const colores = determinarColoresPorEstado(estado)

                    return (
                      <span
                        style={{
                          backgroundColor: colores.bg,
                          color: colores.text,
                          fontWeight: "bold",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          display: "inline-block",
                          fontSize: "12px",
                          textAlign: "center",
                          minWidth: "100px",
                        }}
                      >
                        {estado}
                      </span>
                    )
                  },
                },
                {
                  accessorKey: "fechaEjecucionReal",
                  header: "Fecha Ejecución Real",
                  size: 200,
                  Cell: ({ cell }) => <span>{formatDate(cell.getValue())}</span>,
                },
                {
                  accessorKey: "ejechoraAnt",
                  header: "Hora Anterior Ejecución",
                  size: 200,
                  Cell: ({ cell }) => <span>{formatDate(cell.getValue())}</span>,
                },
                {
                  accessorKey: "mmPlanificada",
                  header: "Minutos Planificados",
                  size: 250,
                  accessorFn: (row) => Number(row.mmPlanificada) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "primary.main", fontWeight: "bold" }}>{cell.getValue()?.toFixed(2)} min</Box>
                    </>
                  ),
                  Cell: ({ cell }) => <span>{formatMinutos(cell.getValue())} min</span>,
                  Footer: () => (
                    <Stack>
                      Total Minutos Planificados:
                      <Box color="primary.main" fontWeight="bold">
                        {totalSumMmPlanificada?.toFixed(2)} min
                      </Box>
                    </Stack>
                  ),
                },
                {
                  accessorKey: "minutoslab",
                  header: "Minutos Laborados",
                  size: 250,
                  accessorFn: (row) => Number(row.minutoslab) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "success.main", fontWeight: "bold" }}>{cell.getValue()?.toFixed(2)} min</Box>
                    </>
                  ),
                  Cell: ({ cell }) => <span>{formatMinutos(cell.getValue())} min</span>,
                  Footer: () => (
                    <Stack>
                      Total Minutos Laborados:
                      <Box color="warning.main" fontWeight="bold">
                        {totalSumMinutoslab?.toFixed(2)} min
                      </Box>
                    </Stack>
                  ),
                },
                {
                  accessorKey: "porcentajeavance",
                  header: "% Avance",
                  size: 250,
                  accessorFn: (row) => Number(row.porcentajeavance) || 0,
                  aggregationFn: "avg",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Promedio por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "info.main", fontWeight: "bold" }}>{cell.getValue()?.toFixed(2)}%</Box>
                    </>
                  ),
                  Cell: ({ cell }) => {
                    const porcentaje = cell.getValue()
                    let color = "#f44336" // Rojo por defecto

                    if (porcentaje >= 100) {
                      color = "#4caf50" // Verde
                    } else if (porcentaje >= 50) {
                      color = "#ff9800" // Naranja
                    }

                    return (
                      <span
                        style={{
                          color,
                          fontWeight: "bold",
                        }}
                      >
                        {porcentaje?.toFixed(2)}%
                      </span>
                    )
                  },
                  Footer: () => (
                    <Stack>
                      Promedio % Avance:
                      <Box color="info.main" fontWeight="bold">
                        {totalSumPorcentajeavance?.toFixed(2)}%
                      </Box>
                    </Stack>
                  ),
                },
              ]}
              aggregations={{
                totalSumMinutoslab: (data) => data.reduce((acc, curr) => acc + Number(curr.minutoslab || 0), 0),
                totalSumMmPlanificada: (data) => data.reduce((acc, curr) => acc + Number(curr.mmPlanificada || 0), 0),
                totalSumPorcentajeavance: (data) => {
                  const sum = data.reduce((acc, curr) => acc + Number(curr.porcentajeavance || 0), 0)
                  return data.length > 0 ? sum / data.length : 0
                },
              }}
              tableOptions={{
                initialState: {
                  // grouping: ["locdescri", "procesocod"],
                  sorting: [{ id: "fechaEjecucionReal", desc: true }],
                },
              }}
            />
          )}

          {dataPlanVsEje.length === 0 && !isLoadingData && !isFetchingData && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
                border: "1px dashed #ccc",
                borderRadius: "8px",
                marginTop: "20px",
              }}
            >
              <span style={{ color: "#666", fontSize: "16px" }}>
                No hay datos para mostrar. Aplica filtros y haz clic en "Filtrar".
              </span>
            </Box>
          )}
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default PlanVsEje
