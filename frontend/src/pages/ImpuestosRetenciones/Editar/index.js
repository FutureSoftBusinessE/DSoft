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

const MAX_LENGTHS = {
  impid: 3,
  impdescri: 40,
  impctanor: 30,
  codSRI: 5,
  desSRI: 60,
}

const EditarImpuestoRetencion = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const {
    mutateAsync: SaveEdicionImpuestoRetencion,
    isPending: isSavingEdicionImpuestoRetencion,
    isError: isErrorSavingEdicion,
  } = useMutation({
    queryKey: ["isEditingImpuestoRetencion"],
    fn: async (data) => {
      const response = await api.post("/ImpuestosRetenciones/editarImpuestosRetenciones", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const impidViejo = state?.impid ?? ""

  const [formData, setFormData] = useState({
    impid: state?.impid ?? "",
    impdescri: state?.impdescri ?? "",
    impctanor: { codigo: state?.impctanor ?? "", descripcion: state?.pctanomcta ?? "" },
    impporcent: state?.impporcent ?? 0,
    impesiva: String(state?.impesiva ?? "0"),
    impaplica: state?.impaplica ?? "F",
    impstatus: state?.impstatus ?? "A",
    impretimp: state?.impretimp ?? "I",
    codSRI: state?.codSRI ?? "",
    desSRI: state?.desSRI ?? "",
    impbienser: state?.impbienser ?? "B",
  })

  useEffect(() => {
    if (!state?.impid) {
      navigate(-1)
    }
  }, [state, navigate])

  const handleInputChange = (field, value) => {
    // Validación especial para impporcent - solo números
    if (field === "impporcent") {
      // Solo permitir números y punto decimal
      if (!/^\d*\.?\d*$/.test(value) && value !== "") {
        return // No actualizar si contiene caracteres no numéricos
      }
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTipoChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      impretimp: value,
      impaplica: "F",
      impesiva: value === "R" ? "0" : prev.impesiva,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      impidOld: impidViejo,
      impidNew: formData.impid,
      impdescri: formData.impdescri,
      impctanor: formData.impctanor?.codigo || "",
      impporcent: Number(formData.impporcent || 0),
      impesiva: Number(formData.impesiva || 0),
      impaplica: formData.impaplica,
      impstatus: formData.impstatus,
      impretimp: formData.impretimp,
      codSRI: formData.codSRI,
      desSRI: formData.desSRI,
      impbienser: formData.impbienser,
    }

    try {
      if (!payload.impdescri) {
        showWarning("Ingresa la descripción del impuesto/retención")
        return
      }
      if (isNaN(payload.impporcent) || payload.impporcent < 0) {
        showWarning("Porcentaje que Aplica debe ser un número mayor o igual a 0")
        return
      }

      await SaveEdicionImpuestoRetencion(payload)
    } catch (error) {
      if (error?.code === "VALIDATION_ERROR") {
        showWarning(error.message)
      }
    }
  }

  const ejecutarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")
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
                  disabled={isSavingEdicionImpuestoRetencion}
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
            <b>Editar Impuesto/Retención</b>
          </div>

          <CustomBackdrop isLoading={isSavingEdicionImpuestoRetencion} />

          <Box sx={StyledRoot}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary">
                    Datos Generales
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Tipo
                    </Typography>
                    <RadioGroup row value={formData.impretimp} onChange={(e) => handleTipoChange(e.target.value)}>
                      <FormControlLabel value="I" control={<Radio />} label="Impuesto" />
                      <FormControlLabel value="R" control={<Radio />} label="Retención" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={8} md={6}>
                  <TextField
                    fullWidth
                    label="Código *"
                    value={formData.impid}
                    error={isErrorSavingEdicion}
                    inputProps={{ maxLength: MAX_LENGTHS.impid, readOnly: true }}
                    helperText="Código no puede modificarse"
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                  <TextField fullWidth label="Estado" value="ACTIVO" disabled inputProps={{ readOnly: true }} />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción *"
                    value={formData.impdescri}
                    onChange={(e) => handleInputChange("impdescri", e.target.value)}
                    error={isErrorSavingEdicion}
                    onFocus={(e) => e.target.select()}
                    inputProps={{ maxLength: MAX_LENGTHS.impdescri }}
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <CustomHelperDetail
                    label="Cuenta Contable"
                    valueSearched={formData.impctanor?.codigo}
                    endpoint="/ImpuestosRetenciones/getCuentasContables"
                    valueInputMain="pctacodigo"
                    valueInputSecondary="pctanomcta"
                    idSearchField="pctacodigo"
                    errorMsgIdSearch="Error obteniendo cuenta contable"
                    errorMsgFilterSearch="Error al cargar cuentas contables"
                    queryKeyModal="CuentasContablesImpuestosRetenciones"
                    placeholderInputMain="Código"
                    placeholderInputSecondary="Nombre"
                    columnsTable={[
                      { accessorKey: "pctacodigo", header: "Código", size: 160 },
                      { accessorKey: "pctanomcta", header: "Nombre", size: 380 },
                      { accessorKey: "pctastatus", header: "Estado", size: 120 },
                    ]}
                    onHandleSelectedData={(obj) => {
                      handleInputChange("impctanor", {
                        codigo: obj?.pctacodigo || "",
                        descripcion: obj?.pctanomcta || "",
                      })
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Porcentaje que Aplica"
                    type="number"
                    value={formData.impporcent}
                    onChange={(e) => handleInputChange("impporcent", e.target.value)}
                    error={isErrorSavingEdicion}
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <FormControl>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Tipo de Impuesto
                    </Typography>
                    <RadioGroup
                      row
                      value={String(formData.impesiva)}
                      onChange={(e) => handleInputChange("impesiva", e.target.value)}
                    >
                      <FormControlLabel
                        value="0"
                        control={<Radio />}
                        label="Otro"
                        disabled={formData.impretimp === "R"}
                      />
                      <FormControlLabel
                        value="1"
                        control={<Radio />}
                        label="I.V.A."
                        disabled={formData.impretimp === "R"}
                      />
                      <FormControlLabel
                        value="2"
                        control={<Radio />}
                        label="I.C.E."
                        disabled={formData.impretimp === "R"}
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Aplica a
                    </Typography>
                    <RadioGroup
                      value={formData.impbienser}
                      onChange={(e) => handleInputChange("impbienser", e.target.value)}
                    >
                      <FormControlLabel value="B" control={<Radio />} label="Bienes" />
                      <FormControlLabel value="S" control={<Radio />} label="Servicios" />
                      <FormControlLabel value="G" control={<Radio />} label="Gastos" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={8}>
                  <FormControl>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Cálculo Aplica sobre
                    </Typography>
                    <RadioGroup
                      row
                      value={formData.impaplica}
                      onChange={(e) => handleInputChange("impaplica", e.target.value)}
                    >
                      <FormControlLabel value="F" control={<Radio />} label="Fuente (Subtotal)" />
                      <FormControlLabel
                        value="I"
                        control={<Radio />}
                        label="Valor I.V.A."
                        disabled={formData.impretimp !== "R"}
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Código S.R.I. en el ATS"
                    value={formData.codSRI}
                    onChange={(e) => handleInputChange("codSRI", e.target.value)}
                    error={isErrorSavingEdicion}
                    inputProps={{ maxLength: MAX_LENGTHS.codSRI }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Concepto S.R.I."
                    value={formData.desSRI}
                    onChange={(e) => handleInputChange("desSRI", e.target.value)}
                    error={isErrorSavingEdicion}
                    inputProps={{ maxLength: MAX_LENGTHS.desSRI }}
                  />
                </Grid>
              </Grid>
            </form>
          </Box>
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default EditarImpuestoRetencion
