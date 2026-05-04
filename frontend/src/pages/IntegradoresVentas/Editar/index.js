import { useEffect, useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import CustomHelperDetail from "../../../components/CustomHelperDetail"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Box,
  TextField,
  Tooltip,
  IconButton,
  MenuItem,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Grid,
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import esLocale from "date-fns/locale/es"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"

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

const IDENTIFICATION_VALUE_MAP = {
  RUC: "R",
  CEDULA: "C",
  "PASAPORTE/IDENTIFICACION TRIBU": "P",
  "CONSUMIDOR FINAL": "F",
  "NO APLICA PARA DECLARAR AL SRI": "N",
}

const MAX_LENGTHS = {
  integracodigo: 3,
  integradescri: 60,
  integradirecc: 100,
  integrafono: 30,
  integraruc: 13,
  sectorcodigo: 3,
}

const toFriendlyValidationMessage = (message) => {
  if (typeof message !== "string") return message

  const fieldLabels = {
    integracodigo: "Código",
    integradescri: "Nombre",
    integradirecc: "Dirección",
    integrafono: "Teléfono",
    integrastatus: "Status",
    integraruc: "N° de Identificación",
    integraidentifica: "Tipo de Identificación",
    integratipo: "Tipo",
    sectorcodigo: "Sector",
  }

  const field = Object.keys(fieldLabels).find((key) => message.includes(key))
  if (!field) return message

  if (message.includes("excede")) {
    const match = message.match(/excede\s+(\d+)\s+caracteres/i)
    if (match?.[1]) {
      return `${fieldLabels[field]} excede ${match[1]} caracteres`
    }
  }

  return message.replace(field, fieldLabels[field])
}

const normalizeIdentificationValue = (value) => {
  const cleanValue = String(value ?? "")
    .trim()
    .toUpperCase()
  if (!cleanValue) return ""
  if (["R", "C", "P", "F", "N"].includes(cleanValue)) return cleanValue
  return IDENTIFICATION_VALUE_MAP[cleanValue] ?? "N"
}

const EditarIntegradoresVentas = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const {
    mutateAsync: SaveEdicionIntegradoresVentas,
    isPending: isSavingEdicionIntegradoresVentas,
    isError: isErrorSavingEdicion,
  } = useMutation({
    queryKey: ["isEditingIntegradoresVentas"],
    fn: async (data) => {
      const response = await api.post("/Integradora/editarIntegradora", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const integracodigoViejo = state?.integracodigo ?? ""

  const [formData, setFormData] = useState({
    integracodigo: state?.integracodigo ?? "",
    integradescri: state?.integradescri ?? "",
    integradirecc: state?.integradirecc ?? "",
    integrafono: state?.integrafono ?? "",
    integrastatus: state?.integrastatus ?? "A",
    integraruc: state?.integraruc ?? "",
    integraidentifica: { codigo: normalizeIdentificationValue(state?.integraidentifica), descripcion: "" },
    integratipo: state?.integratipo ?? "I",
    sectorcodigo: { codigo: state?.sectorcodigo ?? "", descripcion: "" },
  })

  useEffect(() => {
    const loadDescriptions = async () => {
      const codigo = normalizeIdentificationValue(state?.integraidentifica)
      const sector = state?.sectorcodigo ?? ""
      let tipoDesc = ""
      let sectorDesc = ""

      if (codigo) {
        try {
          const tipoRes = await api.post("/Integradora/getTipoIdentificacion", {
            typeSearch: "id",
            codigo,
          })
          tipoDesc = tipoRes.data?.data?.data?.descripcion || ""
        } catch (err) {
          console.error("Error fetching tipo identificacion:", err)
        }
      }

      if (sector) {
        try {
          const sectorRes = await api.post("/Integradora/getZonas", {
            typeSearch: "id",
            zoncodigo: sector,
          })
          sectorDesc = sectorRes.data?.data?.data?.zondescri || ""
        } catch (err) {
          console.error("Error fetching sector:", err)
        }
      }

      setFormData((prev) => ({
        ...prev,
        integraidentifica: { codigo, descripcion: tipoDesc },
        sectorcodigo: { codigo: sector, descripcion: sectorDesc },
      }))
    }

    if (state) {
      loadDescriptions()
    }
  }, [state])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.integracodigo) {
      showWarning("Ingresa un Código de Integradores Ventas")
      return
    }
    if (!formData.integradescri) {
      showWarning("Ingresa la descripción de la Integradora")
      return
    }
    if (!formData.integradirecc) {
      showWarning("Ingresa la dirección de la Integradora")
      return
    }
    if (!formData.integraruc) {
      showWarning("Ingresa el N° de Identificación")
      return
    }
    if (!formData.integraidentifica?.codigo) {
      showWarning("Selecciona el Tipo de Identificación")
      return
    }

    const payload = {
      integracodigoOld: integracodigoViejo,
      integracodigoNew: formData.integracodigo,
      integradescri: formData.integradescri,
      integradirecc: formData.integradirecc,
      integrafono: formData.integrafono,
      integrastatus: formData.integrastatus,
      integraruc: formData.integraruc,
      integraidentifica: formData.integraidentifica,
      integratipo: formData.integratipo,
      sectorcodigo: formData.sectorcodigo,
    }

    try {
      await SaveEdicionIntegradoresVentas(payload)
    } catch (error) {
      if (typeof error?.message === "string" && error.message.includes("integraidentifica")) {
        showWarning("El campo Tipo de Identificación es inválido. Selecciona una opción de la lista.")
        return
      }
      if (error?.code === "VALIDATION_ERROR") {
        showWarning(toFriendlyValidationMessage(error.message))
      }
    }
  }

  const ejecutarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "EJECUTAR")
  const toolbarActions = []

  if (ejecutarAction) {
    toolbarActions.push({
      label: ejecutarAction.acccaption,
      key: ejecutarAction.acccaption,
      icon: getIconComponent(ejecutarAction.accnameicono, ejecutarAction.acctipoico),
    })
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
                  disabled={isSavingEdicionIntegradoresVentas}
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
            <b>Editar Integradores Ventas</b>
          </div>

          <CustomBackdrop isLoading={isSavingEdicionIntegradoresVentas} />

          <Box sx={StyledRoot}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Código *"
                    value={formData.integracodigo}
                    error={isErrorSavingEdicion}
                    inputProps={{ maxLength: MAX_LENGTHS.integracodigo, readOnly: true }}
                    helperText="Código no puede modificarse"
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={8}>
                  <TextField
                    fullWidth
                    label="Nombre *"
                    value={formData.integradescri}
                    onChange={(e) => handleInputChange("integradescri", e.target.value)}
                    error={isErrorSavingEdicion}
                    onFocus={(e) => e.target.select()}
                    inputProps={{ maxLength: MAX_LENGTHS.integradescri }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Dirección *"
                    value={formData.integradirecc}
                    onChange={(e) => handleInputChange("integradirecc", e.target.value)}
                    error={isErrorSavingEdicion}
                    onFocus={(e) => e.target.select()}
                    inputProps={{ maxLength: MAX_LENGTHS.integradirecc }}
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <CustomHelperDetail
                    label="Tipo de Identificación *"
                    valueSearched={formData.integraidentifica?.codigo}
                    endpoint="/Integradora/getTipoIdentificacion"
                    valueInputMain="codigo"
                    valueInputSecondary="descripcion"
                    idSearchField="codigo"
                    errorMsgIdSearch="Error obteniendo tipo de identificación"
                    errorMsgFilterSearch="Error al cargar tipos de identificación"
                    queryKeyModal="TipoIdentificacionIntegradoresVentas"
                    placeholderInputMain="Código"
                    placeholderInputSecondary="Descripción"
                    columnsTable={[
                      { accessorKey: "codigo", header: "Código", size: 120 },
                      { accessorKey: "descripcion", header: "Descripción", size: 320 },
                      { accessorKey: "orden", header: "Orden", size: 100 },
                    ]}
                    onHandleSelectedData={(obj) => {
                      handleInputChange("integraidentifica", obj)
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <CustomHelperDetail
                    label="Sector/Zona"
                    valueSearched={formData.sectorcodigo?.codigo}
                    endpoint="/Integradora/getZonas"
                    valueInputMain="zoncodigo"
                    valueInputSecondary="zondescri"
                    idSearchField="zoncodigo"
                    errorMsgIdSearch="Error obteniendo zonas"
                    errorMsgFilterSearch="Error al cargar zonas"
                    queryKeyModal="ZonasIntegradoresVentas"
                    placeholderInputMain="Código"
                    placeholderInputSecondary="Descripción"
                    columnsTable={[
                      { accessorKey: "zoncodigo", header: "Código", size: 120 },
                      { accessorKey: "zondescri", header: "Descripción", size: 320 },
                      { accessorKey: "zonstatus", header: "Estado", size: 120 },
                    ]}
                    onHandleSelectedData={(obj) => {
                      handleInputChange("sectorcodigo", obj)
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="N° de Identificación *"
                    value={formData.integraruc}
                    onChange={(e) => handleInputChange("integraruc", e.target.value)}
                    error={isErrorSavingEdicion}
                    onFocus={(e) => e.target.select()}
                    inputProps={{ maxLength: MAX_LENGTHS.integraruc }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={formData.integrafono}
                    onChange={(e) => handleInputChange("integrafono", e.target.value)}
                    error={isErrorSavingEdicion}
                    onFocus={(e) => e.target.select()}
                    inputProps={{ maxLength: MAX_LENGTHS.integrafono }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Tipo de Integradora *
                  </Typography>
                  <FormControl fullWidth error={isErrorSavingEdicion}>
                    <RadioGroup
                      value={formData.integratipo}
                      onChange={(e) => handleInputChange("integratipo", e.target.value)}
                    >
                      <FormControlLabel value="I" control={<Radio size="small" />} label="INTEGRADOR" />
                      <FormControlLabel value="U" control={<Radio size="small" />} label="USUARIO FINAL" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estado"
                    select
                    value={formData.integrastatus}
                    onChange={(e) => handleInputChange("integrastatus", e.target.value)}
                  >
                    <MenuItem value="A">Activo</MenuItem>
                    <MenuItem value="I">Inactivo</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </form>
          </Box>
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default EditarIntegradoresVentas
