import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useLocation, useNavigate } from "react-router-dom"
import { useContext } from "react"
import { Box, Button, Alert } from "@mui/material"
import { ArrowBack } from "@mui/icons-material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { useQuery } from "@tanstack/react-query"
import { api } from "../../../api"
import CustomBackdrop from "../../../components/CustomBackdrop"
import TiposClienteTabsForm, { TIPOS_CLIENTE_DEFAULT_VALUES } from "../components/TiposClienteTabsForm"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import esLocale from "date-fns/locale/es"
import { tiposClienteToDisplayLabels } from "../utils/tiposClienteLabelMappings"
import { GlobalContext } from "../../../contexts/GlobalContext"

const theme = createTheme({
  palette: {
    primary: { main: "#196C87" },
    secondary: { main: "#2E7D32" },
    info: { main: "#0288D1" },
  },
})

const StyledRoot = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const getRowDataFromContext = (locationState) => {
  const fromState = locationState?.original || locationState || {}

  let fromStorage = {}
  try {
    fromStorage = JSON.parse(sessionStorage.getItem("tiposCliente.selectedRow") || "{}")
  } catch {
    fromStorage = {}
  }

  let fallbackCiaCodigo = ""
  try {
    const jwt = JSON.parse(localStorage.getItem("jwt") || "{}")
    fallbackCiaCodigo = jwt?.compania?.ciacodigo || jwt?.seleccion?.compania?.ciacodigo || ""
  } catch {
    fallbackCiaCodigo = ""
  }

  return {
    ...fromStorage,
    ...fromState,
    ciacodigo: fromState?.ciacodigo || fromStorage?.ciacodigo || fallbackCiaCodigo || "",
  }
}

const BuscarTiposCliente = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const actionList = selectedMenuInfo?.data?.barraAcciones || []

  const rowData = getRowDataFromContext(location.state)
  const ciacodigo = rowData?.ciacodigo || ""
  const clicodigo = rowData?.clicodigo || ""

  const {
    data: tipoCliente,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["getTiposClienteByCodigo", ciacodigo, clicodigo],
    queryFn: async () => {
      const response = await api.post("/TiposCliente/getTiposClienteByCodigo", { ciacodigo, clicodigo })
      return response.data?.data?.data || response.data?.data
    },
    enabled: !!ciacodigo && !!clicodigo,
    refetchOnWindowFocus: false,
  })

  if (!ciacodigo || !clicodigo) {
    return (
      <ThemeProvider theme={theme}>
        <Header />
        <div className="main main-app p-3 p-lg-4">
          <BackIcon />
          <Box
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minHeight: "50vh",
              justifyContent: "center",
            }}
          >
            <Alert severity="error" sx={{ mb: 2, width: "100%", maxWidth: 500 }}>
              No se encontraron datos del tipo de cliente
            </Alert>
            <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
              Volver
            </Button>
          </Box>
        </div>
      </ThemeProvider>
    )
  }

  const c = {
    ...TIPOS_CLIENTE_DEFAULT_VALUES,
    ...tiposClienteToDisplayLabels(tipoCliente || {}),
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
          <b>Información de Tipo de Cliente</b>
        </div>

        <CustomBackdrop isLoading={isLoading} />

        {isError && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: "1200px", margin: "0 auto 16px auto" }}>
            Error al cargar los datos del tipo de cliente
          </Alert>
        )}

        {!isLoading && !isError && !tipoCliente && (
          <Alert severity="warning" sx={{ mb: 2, maxWidth: "1200px", margin: "0 auto 16px auto" }}>
            No se encontró información para el tipo de cliente consultado
          </Alert>
        )}

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
          <Box sx={StyledRoot}>
            <TiposClienteTabsForm data={c} onChange={() => {}} readOnly actions={actionList} />
          </Box>
        </LocalizationProvider>
      </div>
    </ThemeProvider>
  )
}

export default BuscarTiposCliente
