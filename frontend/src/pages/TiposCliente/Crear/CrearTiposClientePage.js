import { useContext, useEffect, useState } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import { Box, Alert, Tooltip, IconButton } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { useMutation, api, showWarning, useQuery } from "../../../api"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import TiposClienteTabsForm, { TIPOS_CLIENTE_DEFAULT_VALUES } from "../components/TiposClienteTabsForm"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import esLocale from "date-fns/locale/es"
import { validateFormData } from "../utils/validationSchema"

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

const ACCIONES = {
  EJECUTAR: "EJECUTAR",
}

const CrearTiposCliente = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState(TIPOS_CLIENTE_DEFAULT_VALUES)

  // Extract current user and station from JWT
  let currentUser = ""
  let currentStation = ""
  try {
    const jwt = JSON.parse(localStorage.getItem("jwt") || "{}")
    currentUser = jwt?.user || jwt?.username || ""
    currentStation = jwt?.estacion || jwt?.station || ""
  } catch {
    // Falls back to empty strings
  }

  const { data: selectOptions = {} } = useQuery({
    queryKey: ["getSelectOptions"],
    queryFn: async () => {
      const response = await api.post("/TiposCliente/getSelectOptions")
      return response.data?.data?.data
    },
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    try {
      const jwt = JSON.parse(localStorage.getItem("jwt") || "{}")
      const ciacodigo = jwt?.compania?.ciacodigo || jwt?.seleccion?.compania?.ciacodigo || ""
      if (ciacodigo) {
        setFormData((prev) => ({ ...prev, ciacodigo }))
      }
    } catch {
      // noop
    }
  }, [])

  // Fetch next clicodigo from backend so fields are visible when opening create
  useEffect(() => {
    let mounted = true
    const fetchNext = async () => {
      try {
        const resp = await api.post("/TiposCliente/getNextCodigo")
        if (!mounted) return
        const responseData = resp?.data || {}
        if (responseData.success === true && responseData.data) {
          const { ciacodigo, clicodigo } = responseData.data
          setFormData((prev) => ({
            ...prev,
            ciacodigo: ciacodigo || prev.ciacodigo,
            clicodigo: clicodigo || prev.clicodigo,
          }))
        }
      } catch (e) {
        console.error("getNextCodigo failed:", e)
      }
    }
    fetchNext()
    return () => {
      mounted = false
    }
  }, [])

  const actionList = selectedMenuInfo?.data?.barraAcciones || []
  const ejecutarAction = actionList.find(
    (action) => action?.acccaption === ACCIONES.EJECUTAR || action?.acccodigo === ACCIONES.EJECUTAR,
  )

  const { mutateAsync: SaveCreacionTiposCliente, isPending: isSavingCreacion } = useMutation({
    queryKey: ["isCreatingTiposCliente"],
    fn: async (data) => {
      // Return the full axios response so the useMutation wrapper can
      // correctly extract the `{ success, data }` shape we send from backend.
      return await api.post("/TiposCliente/crearTiposCliente", data)
    },
    showError: "toast",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { isValid, errors: validationErrors, normalized } = validateFormData(formData, selectOptions)
    if (!isValid) {
      setErrors(validationErrors)
      showWarning("Verifica los campos requeridos")
      return
    }

    await SaveCreacionTiposCliente(normalized)
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        <Box>
          {ejecutarAction && (
            <Tooltip title={ejecutarAction.acccaption}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSavingCreacion}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
              >
                {getIconComponent(ejecutarAction.accnameicono, ejecutarAction.acctipoico)}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 30px 30px 30px",
            fontSize: "25px",
          }}
        >
          <b>Crear Tipo de Cliente</b>
        </div>

        <CustomBackdrop isLoading={isSavingCreacion} />

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
          <Box sx={StyledRoot} component="form" onSubmit={handleSubmit}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Los campos marcados en Generales son requeridos
            </Alert>

            <TiposClienteTabsForm
              data={formData}
              onChange={handleInputChange}
              errors={errors}
              readOnly={false}
              actions={selectedMenuInfo?.data?.barraAcciones || []}
              selectOptions={selectOptions}
              currentUser={currentUser}
              currentStation={currentStation}
            />
          </Box>
        </LocalizationProvider>
      </div>
    </ThemeProvider>
  )
}

export default CrearTiposCliente
