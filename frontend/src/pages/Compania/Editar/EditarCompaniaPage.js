import { useState, useEffect, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, Button, Alert, Tooltip, IconButton } from "@mui/material"
import { ArrowBack } from "@mui/icons-material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { useQuery } from "@tanstack/react-query"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import esLocale from "date-fns/locale/es"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning, showError } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import CompaniaTabsForm, { COMPANIA_DEFAULT_VALUES } from "../components/CompaniaTabsForm"
import { companiaToRawValues } from "../utils/companiaLabelMappings"
import { validateFormData } from "../utils/validationSchema"

const theme = createTheme({
  palette: {
    primary: {
      main: "#196C87",
    },
    secondary: {
      main: "#2E7D32",
    },
    info: {
      main: "#0288D1",
    },
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

// Validation happens in frontend now - no need for manual date formatting
// The validateFormData function handles all type conversions

const EditarCompania = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = location
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [errors, setErrors] = useState({})
  const actionList = selectedMenuInfo?.data?.barraAcciones || []
  const ejecutarAction = actionList.find(
    (action) => action?.acccaption === ACCIONES.EJECUTAR || action?.acccodigo === ACCIONES.EJECUTAR,
  )

  const rowData = state || {}
  const ciacodigo = rowData?.ciacodigo || ""

  const {
    data: companiaFromApi,
    isLoading: isLoadingCompania,
    isError: isErrorCompania,
  } = useQuery({
    queryKey: ["getCompaniaByCodigoForEdit", ciacodigo],
    queryFn: async () => {
      const response = await api.post("/Compania/getCompaniaByCodigo", { ciacodigo })
      return response.data?.data?.data || response.data?.data
    },
    enabled: !!ciacodigo,
    refetchOnWindowFocus: false,
  })

  const { mutateAsync: SaveEdicionCompania, isPending: isSavingEdicionCompania } = useMutation({
    queryKey: ["isEditingCompania"],
    fn: async (data) => {
      const response = await api.post("/Compania/editarCompania", data)
      return response.data
    },
    showError: false,
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const [formData, setFormData] = useState(COMPANIA_DEFAULT_VALUES)

  useEffect(() => {
    if (companiaFromApi) {
      // Normalize image fields if the API payload provides arrays or data URLs
      const normalized = companiaToRawValues({ ...companiaFromApi })

      const pickImageBase64 = (val) => {
        if (!val) return null
        // If it's an array (e.g., images), take the first element
        if (Array.isArray(val) && val.length > 0) val = val[0]
        // If it's a data URL, extract the base64 part
        if (typeof val === "string" && val.startsWith("data:")) {
          const parts = val.split(",")
          return parts[1] || null
        }
        return val
      }

      normalized.cialogo = pickImageBase64(companiaFromApi.cialogo)
      normalized.ciaselloagua = pickImageBase64(companiaFromApi.ciaselloagua)

      setFormData({
        ...COMPANIA_DEFAULT_VALUES,
        ...normalized,
      })
    }
  }, [companiaFromApi])

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

    // Validación 1: Campos requeridos
    const requiredErrors = {}
    if (!formData.ciadescri.trim()) {
      requiredErrors.ciadescri = "Descripción requerida"
    }
    if (!formData.ciadirec.trim()) {
      requiredErrors.ciadirec = "Dirección requerida"
    }
    if (!formData.ciasrirazon.trim()) {
      requiredErrors.ciasrirazon = "Razón Social requerida"
    }

    if (Object.keys(requiredErrors).length > 0) {
      setErrors(requiredErrors)
      showWarning("Por favor completa todos los campos requeridos")
      return
    }

    // Validación 2: Tipos de datos en FRONTEND
    // Esto evita llamadas innecesarias a la API
    const { isValid, errors: typeErrors, normalized } = validateFormData(formData)

    if (!isValid) {
      console.log("Frontend validation failed:", typeErrors)
      setErrors(typeErrors)
      const errorCount = Object.keys(typeErrors).length
      showWarning(`Error de validación en ${errorCount} campo(s)`)
      return
    }

    // Si pasó todas las validaciones, enviar al backend
    try {
      console.log("All validations passed, sending to API")
      console.log("Payload:", normalized)

      await SaveEdicionCompania(normalized)
    } catch (error) {
      console.log("=== API ERROR ===")
      console.log("Error type:", error?.constructor?.name)
      console.log("Error message:", error?.message)

      // Si el backend también retorna errores de validación, mostrarlos
      let fieldErrorsList = []

      if (error?.details?.field_errors && Array.isArray(error.details.field_errors)) {
        fieldErrorsList = error.details.field_errors
      } else if (
        error?.originalError?.details?.field_errors &&
        Array.isArray(error.originalError.details.field_errors)
      ) {
        fieldErrorsList = error.originalError.details.field_errors
      } else if (
        error?.response?.data?.error?.details?.field_errors &&
        Array.isArray(error.response.data.error.details.field_errors)
      ) {
        fieldErrorsList = error.response.data.error.details.field_errors
      }

      if (Array.isArray(fieldErrorsList) && fieldErrorsList.length > 0) {
        const apiErrors = {}
        fieldErrorsList.forEach(({ field, error: errMsg }) => {
          apiErrors[field] = errMsg
        })
        setErrors(apiErrors)
        showWarning(`Error del servidor en ${fieldErrorsList.length} campo(s)`)
        return
      }

      // Otros errores: mostrar modal
      showError(error)
    }
  }

  const toolbarActions = []

  if (ejecutarAction) {
    toolbarActions.push({
      label: ejecutarAction.acccaption,
      key: ejecutarAction.acccaption,
      icon: getIconComponent(ejecutarAction.accnameicono, ejecutarAction.acctipoico),
    })
  }

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
              justifyContent: "center",
              minHeight: "50vh",
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <ThemeProvider theme={theme}>
        <Header />
        <div className="main main-app p-3 p-lg-4">
          <BackIcon />

          <Box>
            {toolbarActions.map((action) => (
              <Tooltip title={action.label} key={action.key}>
                <IconButton
                  onClick={handleSubmit}
                  disabled={isSavingEdicionCompania || isLoadingCompania || !companiaFromApi}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  {action.icon}
                </IconButton>
              </Tooltip>
            ))}
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
            <b>Editar Compañía</b>
          </div>

          <CustomBackdrop isLoading={isSavingEdicionCompania || isLoadingCompania} />

          {isErrorCompania && (
            <Alert severity="error" sx={{ mb: 2, maxWidth: "1200px", margin: "0 auto 16px auto" }}>
              Error al cargar la información completa de la compañía para editar
            </Alert>
          )}

          <Box sx={StyledRoot} component="form" onSubmit={handleSubmit}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Los campos marcados con (*) son requeridos
            </Alert>
            <CompaniaTabsForm
              data={formData}
              onChange={handleInputChange}
              errors={errors}
              readOnly={false}
              actions={actionList}
            />
          </Box>
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default EditarCompania
