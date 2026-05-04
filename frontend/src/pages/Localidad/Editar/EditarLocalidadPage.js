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
import LocalidadTabsForm, { LOCALIDAD_DEFAULT_VALUES } from "../components/LocalidadTabsForm"
import { localidadToRawValues } from "../utils/localidadLabelMappings"
import { validateFormData, REQUIRED_FIELDS } from "../utils/validationSchema"

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

const REQUIRED_FIELDS_FOR_EDIT = Array.from(REQUIRED_FIELDS).filter(
  (field) => field !== "ciacodigo" && field !== "loccodigo",
)

const EditarLocalidad = () => {
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
  const loccodigo = rowData?.loccodigo || ""

  const {
    data: localidadFromApi,
    isLoading: isLoadingLocalidad,
    isError: isErrorLocalidad,
  } = useQuery({
    queryKey: ["getLocalidadByCodigoForEdit", ciacodigo, loccodigo],
    queryFn: async () => {
      const response = await api.post("/Localidad/getLocalidadByCodigo", { ciacodigo, loccodigo })
      return response.data?.data?.data || response.data?.data
    },
    enabled: !!ciacodigo && !!loccodigo,
    refetchOnWindowFocus: false,
  })

  const { mutateAsync: SaveEdicionLocalidad, isPending: isSavingEdicionLocalidad } = useMutation({
    queryKey: ["isEditingLocalidad"],
    fn: async (data) => {
      const response = await api.post("/Localidad/editarLocalidad", data)
      return response.data
    },
    showError: false,
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const [formData, setFormData] = useState(LOCALIDAD_DEFAULT_VALUES)

  useEffect(() => {
    if (localidadFromApi) {
      const normalized = localidadToRawValues({ ...localidadFromApi })
      setFormData({
        ...LOCALIDAD_DEFAULT_VALUES,
        ...normalized,
      })
    }
  }, [localidadFromApi])

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
    REQUIRED_FIELDS_FOR_EDIT.forEach((field) => {
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
      await SaveEdicionLocalidad(localidadToRawValues(normalized))
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
              justifyContent: "center",
              minHeight: "50vh",
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
                  disabled={isSavingEdicionLocalidad || isLoadingLocalidad || !localidadFromApi}
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
            <b>Editar Localidad</b>
          </div>

          <CustomBackdrop isLoading={isSavingEdicionLocalidad || isLoadingLocalidad} />

          {isErrorLocalidad && (
            <Alert severity="error" sx={{ mb: 2, maxWidth: "1200px", margin: "0 auto 16px auto" }}>
              Error al cargar la información completa de la localidad para editar
            </Alert>
          )}

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
              allowKeyEdit={false}
            />
          </Box>
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default EditarLocalidad
