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
import LocalidadTabsForm, { LOCALIDAD_DEFAULT_VALUES } from "../components/LocalidadTabsForm"
import { localidadToDisplayLabels } from "../utils/localidadLabelMappings"
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

const BuscarLocalidad = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const actionList = selectedMenuInfo?.data?.barraAcciones || []
  const rowData = location.state || {}
  const ciacodigo = rowData?.ciacodigo || ""
  const loccodigo = rowData?.loccodigo || ""

  const {
    data: localidad,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["getLocalidadByCodigo", ciacodigo, loccodigo],
    queryFn: async () => {
      const response = await api.post("/Localidad/getLocalidadByCodigo", { ciacodigo, loccodigo })
      return response.data?.data?.data || response.data?.data
    },
    enabled: !!ciacodigo && !!loccodigo,
    refetchOnWindowFocus: false,
  })

  if (!ciacodigo || !loccodigo) {
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
              No se encontraron datos de la localidad
            </Alert>
            <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
              Volver
            </Button>
          </Box>
        </div>
      </ThemeProvider>
    )
  }

  const c = { ...LOCALIDAD_DEFAULT_VALUES, ...localidadToDisplayLabels(localidad || {}) }

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
          <b>Información de Localidad</b>
        </div>

        <CustomBackdrop isLoading={isLoading} />

        {isError && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: "1200px", margin: "0 auto 16px auto" }}>
            Error al cargar los datos de la localidad
          </Alert>
        )}

        {!isLoading && !isError && !localidad && (
          <Alert severity="warning" sx={{ mb: 2, maxWidth: "1200px", margin: "0 auto 16px auto" }}>
            No se encontró información para la localidad consultada
          </Alert>
        )}

        <Box sx={StyledRoot}>
          <LocalidadTabsForm data={c} onChange={() => {}} readOnly actions={actionList} />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default BuscarLocalidad
