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
import CompaniaTabsForm, { COMPANIA_DEFAULT_VALUES } from "../components/CompaniaTabsForm"
import { companiaToDisplayLabels } from "../utils/companiaLabelMappings"
import { GlobalContext } from "../../../contexts/GlobalContext"
import HistorialRegimenTributario from "../components/HistorialRegimenTributario"

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

const BuscarCompania = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const actionList = selectedMenuInfo?.data?.barraAcciones || []
  const rowData = location.state || {}
  const ciacodigo = rowData?.ciacodigo || ""

  const {
    data: compania,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["getCompaniaByCodigo", ciacodigo],
    queryFn: async () => {
      const response = await api.post("/Compania/getCompaniaByCodigo", { ciacodigo })
      // api client normalizes responses into { success, data, metadata }
      // backend already returns { data: {...} } so unwrap safely to get the inner company object
      return response.data?.data?.data || response.data?.data
    },
    enabled: !!ciacodigo,
    refetchOnWindowFocus: false,
  })

  if (!ciacodigo) {
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
              No se encontraron datos de la compañía
            </Alert>
            <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
              Volver
            </Button>
          </Box>
        </div>
      </ThemeProvider>
    )
  }

  const c = { ...COMPANIA_DEFAULT_VALUES, ...companiaToDisplayLabels(compania || {}) }

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
          <b>Información de Compañía</b>
        </div>

        <CustomBackdrop isLoading={isLoading} />

        {isError && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: "1200px", margin: "0 auto 16px auto" }}>
            Error al cargar los datos de la compañía
          </Alert>
        )}

        {!isLoading && !isError && !compania && (
          <Alert severity="warning" sx={{ mb: 2, maxWidth: "1200px", margin: "0 auto 16px auto" }}>
            No se encontró información para la compañía consultada
          </Alert>
        )}

        <Box sx={StyledRoot}>
          <CompaniaTabsForm data={c} onChange={() => {}} readOnly actions={actionList} />
        </Box>

        {/* Historial de Régimen Tributario en modo solo lectura */}
        {ciacodigo && compania && (
          <Box
            sx={{
              maxWidth: "1200px",
              margin: "20px auto",
              padding: "20px",
              backgroundColor: "#f5f7fa",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <HistorialRegimenTributario ciacodigo={ciacodigo} companiaData={c} readOnly={true} />
          </Box>
        )}
      </div>
    </ThemeProvider>
  )
}

export default BuscarCompania
