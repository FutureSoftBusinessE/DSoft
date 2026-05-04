import { useContext, useEffect, useState } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useLocation, useNavigate } from "react-router-dom"
import { Box, Alert, Tooltip, IconButton, Button } from "@mui/material"
import { ArrowBack } from "@mui/icons-material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning, showError } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import TiposClienteTabsForm, { TIPOS_CLIENTE_DEFAULT_VALUES } from "../components/TiposClienteTabsForm"
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

const EditarTiposCliente = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const actionList = selectedMenuInfo?.data?.barraAcciones || []
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

  const rowData = getRowDataFromContext(location.state)
  const ciacodigo = rowData?.ciacodigo || ""
  const clicodigo = rowData?.clicodigo || ""

  const {
    data: tipoCliente,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["getTiposClienteByCodigoForEdit", ciacodigo, clicodigo],
    queryFn: async () => {
      const response = await api.post("/TiposCliente/getTiposClienteByCodigo", { ciacodigo, clicodigo })
      return response.data?.data?.data || response.data?.data
    },
    enabled: !!ciacodigo && !!clicodigo,
    refetchOnWindowFocus: false,
  })

  const { data: selectOptions = {} } = useQuery({
    queryKey: ["getSelectOptions"],
    queryFn: async () => {
      const response = await api.post("/TiposCliente/getSelectOptions")
      return response.data?.data?.data || response.data?.data || {}
    },
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (tipoCliente) {
      const normalized = { ...tipoCliente }
      // Ensure credit fields have default values if missing/null
      const withDefaults = {
        ...TIPOS_CLIENTE_DEFAULT_VALUES,
        ...normalized,
        clidiascrs: normalized.clidiascrs ?? TIPOS_CLIENTE_DEFAULT_VALUES.clidiascrs,
        climontocrs: normalized.climontocrs ?? TIPOS_CLIENTE_DEFAULT_VALUES.climontocrs,
        clibloqueo: normalized.clibloqueo ?? TIPOS_CLIENTE_DEFAULT_VALUES.clibloqueo,
        cliapliiva: normalized.cliapliiva ?? TIPOS_CLIENTE_DEFAULT_VALUES.cliapliiva,
        cliprefac: normalized.cliprefac ?? TIPOS_CLIENTE_DEFAULT_VALUES.cliprefac,
        usrcodigo: normalized.usrcodigo ?? TIPOS_CLIENTE_DEFAULT_VALUES.usrcodigo,
      }
      setFormData(withDefaults)
    }
  }, [tipoCliente])

  const { mutateAsync: SaveEdicionTiposCliente, isPending: isSavingEdicion } = useMutation({
    queryKey: ["isEditingTiposCliente"],
    fn: async (data) => {
      const response = await api.post("/TiposCliente/editarTiposCliente", data)
      if (response?.data?.data?.success === false) {
        const backendPayload = response.data.data
        const error = new Error(backendPayload.message || "Error al editar")
        error.details = backendPayload.details || backendPayload.error || null
        throw error
      }
      return response
    },
    showError: false,
    showSuccess: "toast",
    onSuccess: async () => {
      // Invalidate the TiposCliente list query so it refreshes on return
      await queryClient.invalidateQueries({ queryKey: ["TiposCliente"] })
      navigate(-1)
    },
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { isValid, errors: validationErrors, normalized } = validateFormData(formData, selectOptions)
    if (!isValid) {
      setErrors(validationErrors)
      showWarning(`Verifica los ${Object.keys(validationErrors).length} error(es) en los campos`)
      return
    }

    // CRITICAL: Ensure credit fields are ALWAYS sent to backend, even if unchanged
    // This matches VB behavior which always updates these fields
    const creditFieldsToAlwaysInclude = {
      clidiascrs: formData.clidiascrs ?? 0,
      climontocrs: formData.climontocrs ?? 0,
      cliprefac: formData.cliprefac ?? 1,
      cliapliiva: formData.cliapliiva ?? 0,
      clibloqueo: formData.clibloqueo ?? 0,
      usrcodigo: formData.usrcodigo ?? "",
    }

    const dataToSend = { ...normalized, ...creditFieldsToAlwaysInclude }

    try {
      const result = await SaveEdicionTiposCliente(dataToSend)

      // El backend puede retornar success: false dentro de data
      // Debido a cómo el decorator envuelve las respuestas
      if (result?.data?.success === false) {
        showWarning(result.data.message || "Error al guardar")
      }

      // Si llegó aquí, fue exitoso - el mutation ya mostró el toast y navegará
    } catch (error) {
      console.error("Error al editar tipo de cliente:", error)
      showError(error)
    }
  }

  const ejecutarAction = actionList.find(
    (action) => action?.acccaption === "EJECUTAR" || action?.acccodigo === "EJECUTAR",
  )

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

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Header />
        <div className="main main-app p-3 p-lg-4">
          <BackIcon />

          <Box>
            {ejecutarAction && (
              <Tooltip title={ejecutarAction.acccaption}>
                <IconButton
                  onClick={handleSubmit}
                  disabled={isSavingEdicion || isLoading || !tipoCliente}
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
            <b>Editar Tipo de Cliente</b>
          </div>

          <CustomBackdrop isLoading={isSavingEdicion || isLoading} />

          {isError && (
            <Alert severity="error" sx={{ mb: 2, maxWidth: "1200px", margin: "0 auto 16px auto" }}>
              Error al cargar la información completa del tipo de cliente para editar
            </Alert>
          )}

          <Box sx={StyledRoot} component="form" onSubmit={handleSubmit}>
            <TiposClienteTabsForm
              data={formData}
              onChange={handleInputChange}
              errors={errors}
              readOnly={false}
              actions={actionList}
              selectOptions={selectOptions}
              currentUser={currentUser}
              currentStation={currentStation}
            />
          </Box>
        </div>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

export default EditarTiposCliente
