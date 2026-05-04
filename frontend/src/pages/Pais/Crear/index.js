import { useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
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

const CrearPais = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const {
    mutateAsync: SaveCreacionPais,
    isPending: isSavingCreacionPais,
    isError: isErrorSavingCreacion,
  } = useMutation({
    queryKey: ["isCreatingPais"],
    fn: async (data) => {
      const response = await api.post("/Pais/crearPais", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const [formData, setFormData] = useState({
    paiscodigo: "",
    paisdescri: "",
    paisstatus: "A",
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const paisDataToSave = {
      ...formData,
    }

    try {
      if (!paisDataToSave.paiscodigo) {
        showWarning("Ingresa un País primero")
        return
      }
      if (!paisDataToSave.paisdescri) {
        showWarning("Ingresa la descripción del País")
        return
      }

      await SaveCreacionPais(paisDataToSave)
    } catch (error) {
      if (error?.code === "VALIDATION_ERROR") {
        showWarning(error.message)
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
                  disabled={isSavingCreacionPais}
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
            <b>Crear Nuevo País</b>
          </div>

          <CustomBackdrop isLoading={isSavingCreacionPais} />

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
                    value={formData.paiscodigo}
                    onChange={(e) => handleInputChange("paiscodigo", e.target.value)}
                    error={isErrorSavingCreacion}
                    onFocus={(e) => e.target.select()}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={formData.paisdescri}
                    onChange={(e) => handleInputChange("paisdescri", e.target.value)}
                    error={isErrorSavingCreacion}
                    onFocus={(e) => e.target.select()}
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth error={isErrorSavingCreacion}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      label="Estado"
                      value={formData.paisstatus}
                      onChange={(e) => handleInputChange("paisstatus", e.target.value)}
                      disabled
                    >
                      <MenuItem value="A">Activo</MenuItem>
                      <MenuItem value="I">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Paper>
          </Box>
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default CrearPais
