import { useEffect, useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
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

const EditarIva = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const {
    mutateAsync: SaveEdicionIva,
    isPending: isSavingEdicionIva,
    isError: isErrorSavingEdicion,
  } = useMutation({
    queryKey: ["isEditingIva"],
    fn: async (data) => {
      const response = await api.post("/Iva/editarIva", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const ivafeciniOld = state?.ivafecini ?? null
  const ivavalorOld = state?.ivavalor ?? ""

  const [formData, setFormData] = useState({
    ivafecini: null,
    ivavalor: "",
  })

  useEffect(() => {
    if (ivafeciniOld) {
      const date = new Date(ivafeciniOld)
      setFormData({
        ivafecini: date,
        ivavalor: ivavalorOld,
      })
    }
  }, [ivafeciniOld, ivavalorOld])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      ivafecini: date,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.ivafecini) {
      showWarning("Ingresa una Fecha de IVA primero")
      return
    }

    if (!formData.ivavalor) {
      showWarning("Ingresa un Valor de IVA primero")
      return
    }

    const payload = {
      ivafeciniOld,
      ivafeciniNew: formData.ivafecini,
      ivavalor: parseFloat(formData.ivavalor),
    }

    try {
      await SaveEdicionIva(payload)
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
                  disabled={isSavingEdicionIva}
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
            <b>Editar IVA</b>
          </div>

          <CustomBackdrop isLoading={isSavingEdicionIva} />

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
                    label="Fecha de IVA"
                    value={formData.ivafecini ? formData.ivafecini.toLocaleDateString("es-ES") : ""}
                    disabled
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 3 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <TextField
                    fullWidth
                    label="Valor de IVA (%)"
                    type="number"
                    inputProps={{ step: "0.01" }}
                    value={formData.ivavalor}
                    onChange={(e) => handleInputChange("ivavalor", e.target.value)}
                    error={isErrorSavingEdicion}
                    onFocus={(e) => e.target.select()}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                {/* Botones comentados como en TiposGravamen */}
              </Box>
            </Paper>
          </Box>
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default EditarIva
