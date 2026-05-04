import { useState, useContext, useEffect } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import { Box, Alert, Tooltip, IconButton } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import esLocale from "date-fns/locale/es"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning, showError } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import LocalidadTabsForm, { LOCALIDAD_DEFAULT_VALUES } from "../components/LocalidadTabsForm"
import { validateFormData, REQUIRED_FIELDS } from "../utils/validationSchema"
import { localidadToRawValues } from "../utils/localidadLabelMappings"

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

const CrearLocalidad = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const actionList = selectedMenuInfo?.data?.barraAcciones || []
  const [errors, setErrors] = useState({})
  const [isLoadingCode, setIsLoadingCode] = useState(true)
  const ejecutarAction = actionList.find(
    (action) => action?.acccaption === ACCIONES.EJECUTAR || action?.acccodigo === ACCIONES.EJECUTAR,
  )

  const { mutateAsync: SaveCreacionLocalidad, isPending: isSavingCreacionLocalidad } = useMutation({
    queryKey: ["isCreatingLocalidad"],
    fn: async (data) => {
      const response = await api.post("/Localidad/crearLocalidad", data)
      return response.data
    },
    showError: false,
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const { mutateAsync: GetSiguienteCodigoLocalidad } = useMutation({
    queryKey: ["getSiguienteCodigoLocalidad"],
    fn: async () => {
      const response = await api.post("/Localidad/getSiguienteCodigoLocalidad", {})
      return response
    },
    showError: "modal",
    showSuccess: false,
  })

  const [formData, setFormData] = useState(LOCALIDAD_DEFAULT_VALUES)

  useEffect(() => {
    const loadCode = async () => {
      try {
        const result = await GetSiguienteCodigoLocalidad()
        setFormData((prev) => ({
          ...prev,
          ciacodigo: result.data?.ciacodigo || "",
          loccodigo: result.data?.loccodigo || "",
        }))
      } catch (error) {
        console.error("Error cargando códigos:", error)
      } finally {
        setIsLoadingCode(false)
      }
    }

    loadCode()
  }, [GetSiguienteCodigoLocalidad])

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

    const requiredErrors = {}

    REQUIRED_FIELDS.forEach((field) => {
      const value = formData[field]
      if (value === null || value === undefined || String(value).trim() === "") {
        requiredErrors[field] = `${field} es requerido`
      }
    })

    if (Object.keys(requiredErrors).length > 0) {
      setErrors(requiredErrors)
      showWarning("Por favor completa todos los campos requeridos")
      return
    }

    const { isValid, errors: typeErrors, normalized } = validateFormData(formData)

    if (!isValid) {
      setErrors(typeErrors)
      showWarning(`Error de validación en ${Object.keys(typeErrors).length} campo(s)`)
      return
    }

    try {
      await SaveCreacionLocalidad(localidadToRawValues(normalized))
    } catch (error) {
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

      showError(error)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <ThemeProvider theme={theme}>
        <Header />
        <div className="main main-app p-3 p-lg-4">
          <BackIcon />

          <Box>
            {ejecutarAction && (
              <Tooltip title={ejecutarAction.acccaption}>
                <IconButton
                  onClick={handleSubmit}
                  disabled={isSavingCreacionLocalidad || isLoadingCode}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
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
            <b>Crear Nueva Localidad</b>
          </div>

          <CustomBackdrop isLoading={isSavingCreacionLocalidad || isLoadingCode} />

          <Box sx={StyledRoot} component="form" onSubmit={handleSubmit}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Los campos marcados con (*) son requeridos
            </Alert>

            <LocalidadTabsForm
              data={formData}
              onChange={handleInputChange}
              errors={errors}
              readOnly={false}
              actions={actionList}
              isCreating={true}
            />
          </Box>
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default CrearLocalidad
