import { useEffect, useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import esLocale from "date-fns/locale/es"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"

// Crear el tema
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

// Estilos para el contenedor principal
const StyledRoot = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const EditarBeneficiarioGravamen = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const {
    mutateAsync: SaveEdicionBeneficiarioGravamen,
    isPending: isSavingEdicionBeneficiarioGravamen,
    isError: isErrorSavingEdicion,
  } = useMutation({
    queryKey: ["isEditingBeneficiarioGravamen"],
    fn: async (data) => {
      const response = await api.post("/BeneficiariosGravamen/editarBeneficiarioGravamen", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  // benegravamen_old
  const benegravamenViejo = state?.benegravamen ?? ""

  // benegravamen_new
  const [formData, setFormData] = useState({
    benegravamen: "",
  })

  useEffect(() => {
    // precargar el input con el valor viejo
    setFormData({ benegravamen: benegravamenViejo })
  }, [benegravamenViejo])

  // Manejar cambios en los campos del formulario
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Preparar datos para enviar al backend
    const beneficiarioDataToSave = {
      ...formData,
      benegravamen: formData.benegravamen, // Enviar el value al backend
    }

    const payload = {
      benegravamenNew: formData.benegravamen,
      benegravamenOld: benegravamenViejo,
    }

    try {
      console.log("Datos del beneficiario de gravamen para actualizar:", beneficiarioDataToSave)
      if (!beneficiarioDataToSave.benegravamen) {
        showWarning("Ingresa un Beneficiario de Gravamen primero")
        return
      }
      await SaveEdicionBeneficiarioGravamen(payload)
    } catch (error) {
      console.error("Error al editar el Beneficiario de Gravamen:", error)
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
                  disabled={isSavingEdicionBeneficiarioGravamen}
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
            <b>Editar Beneficiario de Gravamen</b>
          </div>

          <CustomBackdrop isLoading={isSavingEdicionBeneficiarioGravamen} />

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
                    label="Beneficiario de Gravamen"
                    value={formData.benegravamen}
                    onChange={(e) => handleInputChange("benegravamen", e.target.value)}
                    error={isErrorSavingEdicion}
                    onFocus={(e) => e.target.select()}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                {/* <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" startIcon={<Save />} disabled={isSavingEdicionBeneficiarioGravamen}>
                  Editar Beneficiario de Gravamen
                </Button> */}
              </Box>
            </Paper>
          </Box>
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default EditarBeneficiarioGravamen
