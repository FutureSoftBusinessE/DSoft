import { useState } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box, Button, Stack } from "@mui/material"
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
    queryKey: ["ResumenProductividadUsuarios"],
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
function useGetResumenProductividadData(filtros) {
  return useQuery({
    queryKey: ["ResumenProductividadData", filtros],
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
      const response = await fetchwrapper(`/ResumenProductividad/getAllInfo`, options)
      const result = await response.json()
      return result.data || []
    },
    enabled: false, // Se ejecutará manualmente al hacer clic en Filtrar
  })
}

// Función para determinar colores basados en el balance
const determinarColorBalance = (balance) => {
  if (balance >= 0) {
    return "#4caf50" // Verde para eficiencia positiva
  } else {
    return "#f44336" // Rojo para ineficiencia
  }
}

const mesesNombres = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const ResumenProductividad = () => {
  const [expanded, setExpanded] = useState(true)
  const [filtros, setFiltros] = useState({
    usuarioCB: null,
    usrcodigo: "",
    usrnombre: "",
  })

  const { data: dataUsuarios = [], isLoading: isLoadingUsuarios, isFetching: isFetchingUsuarios } = useGetAllUsuarios()

  const {
    data: dataResumen = [],
    isLoading: isLoadingData,
    isFetching: isFetchingData,
    refetch: refetchData,
  } = useGetResumenProductividadData(filtros)

  const handleToggle = () => {
    setExpanded(!expanded)
  }

  const handleClickFiltrarBtn = async () => {
    await refetchData()
  }

  // Función para formatear minutos
  const formatMinutos = (minutos) => {
    if (minutos === null || minutos === undefined) return "0"
    return Math.round(Number(minutos))
  }

  // Función para formatear el balance con signo
  const formatBalance = (balance) => {
    if (balance === null || balance === undefined) return "0"
    const valor = Math.round(Number(balance))
    return balance >= 0 ? `+${valor}` : valor
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
          <b>Resumen de Productividad</b>
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

          {dataResumen.length > 0 && (
            <CustomAggregationSegregationComponent
              data={dataResumen}
              columnsConfig={({
                totalSumTareasCompletadas,
                totalSumPlanificadoEfectivo,
                totalSumEjecutadoEfectivo,
                totalSumBalanceEficiencia,
                totalSumTareasInterrumpidas,
                totalSumMinutosPerdidos,
                totalSumTareasActivas,
              }) => [
                {
                  accessorKey: "AnioEvento",
                  header: "Año",
                  size: 150,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "MesEvento",
                  header: "Mes",
                  size: 150,
                  Cell: ({ cell }) => <span>{mesesNombres[cell.getValue() - 1]}</span>,
                },
                {
                  accessorKey: "NombreUsuario",
                  header: "Usuario",
                  size: 200,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "Cliente",
                  header: "Cliente",
                  size: 250,
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                },
                {
                  accessorKey: "TareasCompletadas",
                  header: "Tareas Completadas",
                  size: 250,
                  accessorFn: (row) => Number(row.TareasCompletadas) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "success.main", fontWeight: "bold" }}>{cell.getValue()}</Box>
                    </>
                  ),
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                  Footer: () => (
                    <Stack>
                      Total Tareas:
                      <Box color="success.main" fontWeight="bold">
                        {totalSumTareasCompletadas}
                      </Box>
                    </Stack>
                  ),
                },
                {
                  accessorKey: "Planificado_Efectivo",
                  header: "Min. Planificados",
                  size: 250,
                  accessorFn: (row) => Number(row.Planificado_Efectivo) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "primary.main", fontWeight: "bold" }}>{formatMinutos(cell.getValue())} min</Box>
                    </>
                  ),
                  Cell: ({ cell }) => <span>{formatMinutos(cell.getValue())} min</span>,
                  Footer: () => (
                    <Stack>
                      Total Planificado:
                      <Box color="primary.main" fontWeight="bold">
                        {formatMinutos(totalSumPlanificadoEfectivo)} min
                      </Box>
                    </Stack>
                  ),
                },
                {
                  accessorKey: "Ejecutado_Efectivo",
                  header: "Min. Ejecutados",
                  size: 250,
                  accessorFn: (row) => Number(row.Ejecutado_Efectivo) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "info.main", fontWeight: "bold" }}>{formatMinutos(cell.getValue())} min</Box>
                    </>
                  ),
                  Cell: ({ cell }) => <span>{formatMinutos(cell.getValue())} min</span>,
                  Footer: () => (
                    <Stack>
                      Total Ejecutado:
                      <Box color="info.main" fontWeight="bold">
                        {formatMinutos(totalSumEjecutadoEfectivo)} min
                      </Box>
                    </Stack>
                  ),
                },
                {
                  accessorKey: "BalanceEficiencia",
                  header: "Balance Eficiencia",
                  size: 250,
                  accessorFn: (row) => Number(row.BalanceEficiencia) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => {
                    const valor = cell.getValue()
                    return (
                      <>
                        Balance por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                        <Box
                          sx={{
                            color: valor >= 0 ? "success.main" : "error.main",
                            fontWeight: "bold",
                          }}
                        >
                          {valor >= 0 ? "+" : ""}
                          {formatMinutos(valor)} min
                        </Box>
                      </>
                    )
                  },
                  Cell: ({ cell }) => {
                    const balance = cell.getValue()
                    return (
                      <span
                        style={{
                          color: determinarColorBalance(balance),
                          fontWeight: "bold",
                        }}
                      >
                        {formatBalance(balance)} min
                      </span>
                    )
                  },
                  Footer: () => {
                    const balanceTotal = totalSumBalanceEficiencia || 0
                    return (
                      <Stack>
                        Balance Total:
                        <Box color={balanceTotal >= 0 ? "success.main" : "error.main"} fontWeight="bold">
                          {balanceTotal >= 0 ? "+" : ""}
                          {formatMinutos(balanceTotal)} min
                        </Box>
                      </Stack>
                    )
                  },
                },
                {
                  accessorKey: "TareasInterrumpidas",
                  header: "Tareas Interrumpidas",
                  size: 250,
                  accessorFn: (row) => Number(row.TareasInterrumpidas) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "warning.main", fontWeight: "bold" }}>{cell.getValue()}</Box>
                    </>
                  ),
                  Cell: ({ cell }) => <span>{cell.getValue()}</span>,
                  Footer: () => (
                    <Stack>
                      Total Interrumpidas:
                      <Box color="warning.main" fontWeight="bold">
                        {totalSumTareasInterrumpidas}
                      </Box>
                    </Stack>
                  ),
                },
                {
                  accessorKey: "MinutosPerdidos",
                  header: "Minutos Perdidos",
                  size: 250,
                  accessorFn: (row) => Number(row.MinutosPerdidos) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "error.main", fontWeight: "bold" }}>{formatMinutos(cell.getValue())} min</Box>
                    </>
                  ),
                  Cell: ({ cell }) => (
                    <span style={{ color: "#f44336", fontWeight: "bold" }}>{formatMinutos(cell.getValue())} min</span>
                  ),
                  Footer: () => (
                    <Stack>
                      Total Perdido:
                      <Box color="error.main" fontWeight="bold">
                        {formatMinutos(totalSumMinutosPerdidos)} min
                      </Box>
                    </Stack>
                  ),
                },
                {
                  accessorKey: "TareasActivas",
                  header: "Tareas Activas",
                  size: 250,
                  accessorFn: (row) => Number(row.TareasActivas) || 0,
                  aggregationFn: "sum",
                  AggregatedCell: ({ cell, table }) => (
                    <>
                      Suma por {table.getColumn(cell.row.groupingColumnId ?? "").columnDef.header}:{" "}
                      <Box sx={{ color: "info.main", fontWeight: "bold" }}>{cell.getValue()}</Box>
                    </>
                  ),
                  Cell: ({ cell }) => <span style={{ color: "#2196f3", fontWeight: "bold" }}>{cell.getValue()}</span>,
                  Footer: () => (
                    <Stack>
                      Total Activas:
                      <Box color="info.main" fontWeight="bold">
                        {totalSumTareasActivas}
                      </Box>
                    </Stack>
                  ),
                },
              ]}
              aggregations={{
                totalSumTareasCompletadas: (data) =>
                  data.reduce((acc, curr) => acc + Number(curr.TareasCompletadas || 0), 0),
                totalSumPlanificadoEfectivo: (data) =>
                  data.reduce((acc, curr) => acc + Number(curr.Planificado_Efectivo || 0), 0),
                totalSumEjecutadoEfectivo: (data) =>
                  data.reduce((acc, curr) => acc + Number(curr.Ejecutado_Efectivo || 0), 0),
                totalSumBalanceEficiencia: (data) =>
                  data.reduce((acc, curr) => acc + Number(curr.BalanceEficiencia || 0), 0),
                totalSumTareasInterrumpidas: (data) =>
                  data.reduce((acc, curr) => acc + Number(curr.TareasInterrumpidas || 0), 0),
                totalSumMinutosPerdidos: (data) =>
                  data.reduce((acc, curr) => acc + Number(curr.MinutosPerdidos || 0), 0),
                totalSumTareasActivas: (data) => data.reduce((acc, curr) => acc + Number(curr.TareasActivas || 0), 0),
              }}
              tableOptions={{
                initialState: {
                  sorting: [{ id: "AnioEvento", desc: true }],
                },
              }}
            />
          )}

          {dataResumen.length === 0 && !isLoadingData && !isFetchingData && (
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

export default ResumenProductividad
