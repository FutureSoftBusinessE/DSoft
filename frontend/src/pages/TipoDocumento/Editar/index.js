import { useEffect, useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Select, MenuItem, FormControl, InputLabel } from "@mui/material"
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

const EditarTipoDocumento = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const {
    mutateAsync: SaveEdicionTipoDocumento,
    isPending: isSavingEdicionTipoDocumento,
    isError: isErrorSavingEdicion,
  } = useMutation({
    queryKey: ["isEditingTipoDocumento"],
    fn: async (data) => {
      const response = await api.post("/TipoDocumento/editarTipoDocumento", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const tipdoccodigoViejo = state?.tipdoccodigo ?? ""

  const [formData, setFormData] = useState({
    tipdoccodigo: "",
    tipdocdescri: "",
    tipdocstatus: state?.tipdocstatus ?? "A",
  })

  useEffect(() => {
    setFormData({
      tipdoccodigo: state?.tipdoccodigo ?? "",
      tipdocdescri: state?.tipdocdescri ?? "",
      tipdocstatus: state?.tipdocstatus ?? "A",
    })
  }, [state])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      tipdoccodigoNew: formData.tipdoccodigo,
      tipdoccodigoOld: tipdoccodigoViejo,
      tipdocdescriNew: formData.tipdocdescri,
      tipdocstatusNew: formData.tipdocstatus,
    }

    try {
      if (!payload.tipdoccodigoNew) {
        showWarning("Ingresa un Código de Tipo de Documento")
        return
      }
      if (!payload.tipdocdescriNew) {
        showWarning("Ingresa una descripción para el Tipo de Documento")
        return
      }
      await SaveEdicionTipoDocumento(payload)
    } catch (error) {
      console.error("Error al editar el tipo de documento:", error)
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
                  disabled={isSavingEdicionTipoDocumento}
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
            <b>Editar Tipo de Documento</b>
          </div>

          <CustomBackdrop isLoading={isSavingEdicionTipoDocumento} />

          <Box sx={StyledRoot}>
            <Paper
              elevation={3}
              sx={{ p: 3, mb: 3, borderRadius: 3, background: "white" }}
              component="form"
              onSubmit={handleSubmit}
            >
              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 3 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <TextField
                    fullWidth
                    label="Código"
                    value={formData.tipdoccodigo}
                    inputProps={{ readOnly: true, maxLength: 3 }}
                    error={isErrorSavingEdicion}
                    helperText="Código no se puede modificar"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={formData.tipdocdescri}
                    onChange={(e) => handleInputChange("tipdocdescri", e.target.value)}
                    error={isErrorSavingEdicion}
                    onFocus={(e) => e.target.select()}
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth error={isErrorSavingEdicion}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      label="Estado"
                      value={formData.tipdocstatus}
                      onChange={(e) => handleInputChange("tipdocstatus", e.target.value)}
                    >
                      <MenuItem value="A">Activo</MenuItem>
                      <MenuItem value="I">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}></Box>
            </Paper>
          </Box>
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default EditarTipoDocumento
