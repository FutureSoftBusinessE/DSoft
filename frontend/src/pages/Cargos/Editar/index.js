import { useState, useEffect, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, MenuItem } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import Save from "@mui/icons-material/Save"

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
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

const EditarCargo = () => {
  const navigate = useNavigate()
  const location = useLocation() // Usamos esto para recibir la fila seleccionada
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    cargocodigo: "",
    cargodescri: "",
    carsueldo: 0,
    carrepresen: 0,
    carresiden: 0,
    carrespon: 0,
    tipempvalhor: 0,
    tipempvaldia: 0,
    tipempvalsem: 0,
    cargostatus: "A",
  })

  // Cuando carga la pantalla, llenamos el formulario con los datos que mandó la tabla
  useEffect(() => {
    if (location.state) {
      setFormData(location.state)
    } else {
      // Si entran por URL directa sin seleccionar, los devolvemos
      navigate("/home/dashboard/Cargos")
    }
  }, [location, navigate])

  const { mutateAsync: SaveEdicionCargo, isPending: isSavingEdicionCargo } = useMutation({
    queryKey: ["isUpdatingCargo"],
    fn: async (data) => {
      const response = await api.post("/api/cargos/updateCargo", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    try {
      if (!formData.cargodescri) {
        showWarning("La descripción del cargo es obligatoria")
        return
      }
      await SaveEdicionCargo(formData)
    } catch (error) {
      console.error("Error al actualizar el cargo:", error)
      if (error?.code === "VALIDATION_ERROR") showWarning(error.message)
    }
  }

  const actualizarAction = selectedMenuInfo?.data?.barraAcciones?.find(
    (action) =>
      action?.acccaption === "ACTUALIZAR" || action?.acccaption === "GUARDAR" || action?.acccaption === "EDITAR",
  )

  const toolbarActions = []
  if (actualizarAction) {
    toolbarActions.push({
      label: actualizarAction.acccaption,
      key: actualizarAction.acccaption,
      icon: getIconComponent(actualizarAction.accnameicono, actualizarAction.acctipoico),
    })
  } else {
    toolbarActions.push({ label: "Actualizar Cargo", key: "ACTUALIZAR", icon: <Save /> })
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <Box>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSavingEdicionCargo}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
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
          <b>Editar Cargo: {formData.cargocodigo}</b>
        </div>

        <CustomBackdrop isLoading={isSavingEdicionCargo} />

        <Box sx={StyledRoot}>
          <Paper
            elevation={3}
            sx={{ p: 3, mb: 3, borderRadius: 3, background: "white" }}
            component="form"
            onSubmit={handleSubmit}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                {/* El Código está DISABLED porque es llave primaria y no debe cambiar */}
                <TextField fullWidth label="Código *" value={formData.cargocodigo} disabled />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Descripción del Cargo *"
                  value={formData.cargodescri}
                  onChange={(e) => handleInputChange("cargodescri", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sueldo Base ($)"
                  value={formData.carsueldo}
                  onChange={(e) => handleInputChange("carsueldo", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Representación ($)"
                  value={formData.carrepresen}
                  onChange={(e) => handleInputChange("carrepresen", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Residencia ($)"
                  value={formData.carresiden}
                  onChange={(e) => handleInputChange("carresiden", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.cargostatus}
                  onChange={(e) => handleInputChange("cargostatus", e.target.value)}
                >
                  <MenuItem value="A">ACTIVO</MenuItem>
                  <MenuItem value="I">INACTIVO</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default EditarCargo
