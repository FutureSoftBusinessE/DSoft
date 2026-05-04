import { useState } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box, Button, Stack, Chip } from "@mui/material"
import fetchwrapper from "../../services/interceptors/fetchwrapper"
import BackIcon from "../../components/BackIcon"
import CustomBackdrop from "../../components/CustomBackdrop"
import CustomAutocomplete from "../../components/CustomAutocomplete"
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
  gridTemplateRows: "auto auto",
  gridTemplateAreas: `
          "IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario IUsuario"
          "IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar IBtnFiltrar"
        `,
  gap: "8px",
  rowGap: "12px",
  alignItems: "center",
}))

const IUsuario = styled(Box)({
  gridArea: "IUsuario",
})

const IBtnFiltrar = styled(Box)({
  gridArea: "IBtnFiltrar",
})

// Hook para obtener usuarios
function useGetAllUsuarios() {
  return useQuery({
    queryKey: ["CargaDeTrabajoUsuarios"],
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
function useGetCargaDeTrabajoData(filtros) {
  return useQuery({
    queryKey: ["CargaDeTrabajoData", filtros],
    queryFn: async () => {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          externalFilters: {
            usrcodigo: filtros.usrcodigo,
          },
        }),
      }
      const response = await fetchwrapper(`/CargaDeTrabajo/getAllInfo`, options)
      const result = await response.json()
      return result.data || []
    },
    enabled: false, // Se ejecutará manualmente al hacer clic en Filtrar
  })
}

// Función para determinar colores del estatus de carga
const determinarColorEstatusCarga = (estatus) => {
  const estatusUpper = estatus?.toUpperCase() || ""

  if (estatusUpper.includes("RIESGO ALTO")) {
    return { bg: "#f44336", text: "#ffffff", label: "RIESGO ALTO" } // Rojo
  } else if (estatusUpper.includes("ALERTA")) {
    return { bg: "#ff9800", text: "#000000", label: "ALERTA" } // Naranja
  } else if (estatusUpper.includes("NORMAL")) {
    return { bg: "#4caf50", text: "#ffffff", label: "NORMAL" } // Verde
  }

  return { bg: "#e0e0e0", text: "#000000", label: estatus } // Default
}

const CargaDeTrabajo = () => {
  const [expanded, setExpanded] = useState(true)
  const [filtros, setFiltros] = useState({
    usuarioCB: null,
    usrcodigo: "",
    usrnombre: "",
  })

  const { data: dataUsuarios = [], isLoading: isLoadingUsuarios, isFetching: isFetchingUsuarios } = useGetAllUsuarios()

  const {
    data: dataCargaTrabajo = [],
    isLoading: isLoadingData,
    isFetching: isFetchingData,
    refetch: refetchData,
  } = useGetCargaDeTrabajoData(filtros)

  const handleToggle = () => {
    setExpanded(!expanded)
  }

  const handleClickFiltrarBtn = async () => {
    await refetchData()
  }

  // Función para formatear horas
  const formatHoras = (horas) => {
    if (horas === null || horas === undefined) return "0.00"
    return Number(horas).toFixed(2)
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
          <b>Carga de Trabajo - Backlog</b>
        </div>
        <CustomBackdrop isLoading={isLoadingUsuarios || isFetchingUsuarios || isLoadingData || isFetchingData} />
        <Box className={StyledRoot}>
          <CustomFieldsetAccordion title="Filtros Generales" expanded={expanded} onToggle={handleToggle}>
            <ContainerFiltrosGenerales>
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

              <IBtnFiltrar>
                <Button variant="contained" onClick={handleClickFiltrarBtn}>
                  Filtrar
                </Button>
              </IBtnFiltrar>
            </ContainerFiltrosGenerales>
          </CustomFieldsetAccordion>

          {dataCargaTrabajo.length > 0 && (
            <CustomAggregationSegregationComponent
              data={dataCargaTrabajo}
              columnsConfig={({
                totalSumTareasEnCola,
                totalSumHorasTotales,
                totalSumHorasVencidas,
                totalSumHorasVigentes,
              }) => [
                {
                  accessorKey: "Codigo Usuario",
                  header: "Código Usuario",
                  size: 250,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "Nombre Usuario",
                  header: "Usuario",
                  size: 250,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "Tareas En Cola",
                  header: "Tareas en Cola",
                  size: 250,
                  accessorFn: (row) => Number(row["Tareas En Cola"]) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "primary.main", fontWeight: "bold" }}>{cell.getValue()}</Box>
                    </>
                  ),
                  Cell: ({ cell }) => <span style={{ fontWeight: "bold" }}>{cell.getValue()}</span>,
                  Footer: () => (
                    <Stack>
                      Total Tareas:
                      <Box color="primary.main" fontWeight="bold">
                        {totalSumTareasEnCola}
                      </Box>
                    </Stack>
                  ),
                },
                {
                  accessorKey: "Horas Totales Pendientes",
                  header: "Horas Totales Pendientes",
                  size: 300,
                  accessorFn: (row) => Number(row["Horas Totales Pendientes"]) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "info.main", fontWeight: "bold" }}>{formatHoras(cell.getValue())} hrs</Box>
                    </>
                  ),
                  Cell: ({ cell }) => {
                    const horas = cell.getValue()
                    let color = "#000000"
                    if (horas > 40) color = "#f44336"
                    else if (horas > 30) color = "#ff9800"

                    return <span style={{ color, fontWeight: "bold" }}>{formatHoras(horas)} hrs</span>
                  },
                  Footer: () => (
                    <Stack>
                      Total Horas:
                      <Box color="info.main" fontWeight="bold">
                        {formatHoras(totalSumHorasTotales)} hrs
                      </Box>
                    </Stack>
                  ),
                },
                {
                  accessorKey: "Horas Vencidas",
                  header: "Horas Vencidas",
                  size: 250,
                  accessorFn: (row) => Number(row["Horas Vencidas"]) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "error.main", fontWeight: "bold" }}>{formatHoras(cell.getValue())} hrs</Box>
                    </>
                  ),
                  Cell: ({ cell }) => {
                    const horas = cell.getValue()
                    return (
                      <span
                        style={{
                          color: horas > 0 ? "#f44336" : "#666",
                          fontWeight: horas > 0 ? "bold" : "normal",
                        }}
                      >
                        {formatHoras(horas)} hrs
                      </span>
                    )
                  },
                  Footer: () => (
                    <Stack>
                      Total Vencidas:
                      <Box color="error.main" fontWeight="bold">
                        {formatHoras(totalSumHorasVencidas)} hrs
                      </Box>
                    </Stack>
                  ),
                },
                {
                  accessorKey: "Horas Vigentes",
                  header: "Horas Vigentes",
                  size: 250,
                  accessorFn: (row) => Number(row["Horas Vigentes"]) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "success.main", fontWeight: "bold" }}>{formatHoras(cell.getValue())} hrs</Box>
                    </>
                  ),
                  Cell: ({ cell }) => (
                    <span style={{ color: "#4caf50", fontWeight: "bold" }}>{formatHoras(cell.getValue())} hrs</span>
                  ),
                  Footer: () => (
                    <Stack>
                      Total Vigentes:
                      <Box color="success.main" fontWeight="bold">
                        {formatHoras(totalSumHorasVigentes)} hrs
                      </Box>
                    </Stack>
                  ),
                },
                {
                  accessorKey: "Estatus Carga",
                  header: "Estatus de Carga",
                  size: 400,
                  Cell: ({ cell }) => {
                    const estatus = cell.getValue()
                    const colores = determinarColorEstatusCarga(estatus)

                    return (
                      <Chip
                        label={estatus}
                        sx={{
                          backgroundColor: colores.bg,
                          color: colores.text,
                          fontWeight: "bold",
                          fontSize: "12px",
                          height: "28px",
                        }}
                      />
                    )
                  },
                },
              ]}
              aggregations={{
                totalSumTareasEnCola: (data) =>
                  data.reduce((acc, curr) => acc + Number(curr["Tareas En Cola"] || 0), 0),
                totalSumHorasTotales: (data) =>
                  data.reduce((acc, curr) => acc + Number(curr["Horas Totales Pendientes"] || 0), 0),
                totalSumHorasVencidas: (data) =>
                  data.reduce((acc, curr) => acc + Number(curr["Horas Vencidas"] || 0), 0),
                totalSumHorasVigentes: (data) =>
                  data.reduce((acc, curr) => acc + Number(curr["Horas Vigentes"] || 0), 0),
              }}
              tableOptions={{
                initialState: {
                  sorting: [{ id: "Horas Totales Pendientes", desc: true }],
                },
              }}
            />
          )}

          {dataCargaTrabajo.length === 0 && !isLoadingData && !isFetchingData && (
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
                No hay datos para mostrar. Selecciona un usuario y haz clic en "Filtrar".
              </span>
            </Box>
          )}
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CargaDeTrabajo
