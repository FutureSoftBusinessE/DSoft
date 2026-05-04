import { useState, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, MenuItem } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import Save from "@mui/icons-material/Save" // Importamos el icono por defecto

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

// Estilos para el contenedor principal idénticos a TiposPredio
const StyledRoot = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const CrearCargo = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const {
    mutateAsync: SaveCreacionCargo,
    isPending: isSavingCreacionCargo,
    isError: isErrorSavingCreacion,
  } = useMutation({
    queryKey: ["isCreatingCargo"],
    fn: async (data) => {
      const response = await api.post("/api/cargos/createCargo", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1), // Regresa a la pantalla anterior automáticamente
  })

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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    const cargoDataToSave = { ...formData }

    try {
      if (!cargoDataToSave.cargocodigo || !cargoDataToSave.cargodescri) {
        showWarning("El código y la descripción del cargo son obligatorios")
        return
      }
      await SaveCreacionCargo(cargoDataToSave)
    } catch (error) {
      console.error("Error al crear el cargo:", error)
      if (error?.code === "VALIDATION_ERROR") {
        showWarning(error.message)
      }
    }
  }

  // BARRA DE ACCIONES AL ESTILO TIPOSPREDIO
  // Buscamos si la base de datos devuelve "CREAR", "EJECUTAR" o "GUARDAR"
  const crearAction = selectedMenuInfo?.data?.barraAcciones?.find(
    (action) => action?.acccaption === "CREAR" || action?.acccaption === "EJECUTAR" || action?.acccaption === "GUARDAR",
  )

  const toolbarActions = []

  if (crearAction) {
    toolbarActions.push({
      label: crearAction.acccaption,
      key: crearAction.acccaption,
      icon: getIconComponent(crearAction.accnameicono, crearAction.acctipoico),
    })
  } else {
    // Fallback: Si no hay configuración en la BD, dibujamos el botón de guardar por defecto
    toolbarActions.push({
      label: "Crear Cargo",
      key: "CREAR",
      icon: <Save />,
    })
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />

        {/* BARRA SUPERIOR DE ICONOS */}
        <Box>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSavingCreacionCargo}
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
          <b>Crear Nuevo Cargo</b>
        </div>

        <CustomBackdrop isLoading={isSavingCreacionCargo} />

        <Box sx={StyledRoot}>
          <Paper
            elevation={3}
            sx={{ p: 3, mb: 3, borderRadius: 3, background: "white" }}
            component="form"
            onSubmit={handleSubmit}
          >
            {/* CAMPOS DEL FORMULARIO EN GRID PARA APROVECHAR EL ESPACIO */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Código (Máx 5) *"
                  value={formData.cargocodigo}
                  onChange={(e) => handleInputChange("cargocodigo", e.target.value)}
                  error={isErrorSavingCreacion}
                  inputProps={{ maxLength: 5 }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Descripción del Cargo *"
                  value={formData.cargodescri}
                  onChange={(e) => handleInputChange("cargodescri", e.target.value)}
                  error={isErrorSavingCreacion}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sueldo Base ($)"
                  value={formData.carsueldo}
                  onChange={(e) => handleInputChange("carsueldo", e.target.value)}
                  error={isErrorSavingCreacion}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Representación ($)"
                  value={formData.carrepresen}
                  onChange={(e) => handleInputChange("carrepresen", e.target.value)}
                  error={isErrorSavingCreacion}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Residencia ($)"
                  value={formData.carresiden}
                  onChange={(e) => handleInputChange("carresiden", e.target.value)}
                  error={isErrorSavingCreacion}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.cargostatus}
                  onChange={(e) => handleInputChange("cargostatus", e.target.value)}
                  error={isErrorSavingCreacion}
                >
                  <MenuItem value="A">ACTIVO</MenuItem>
                  <MenuItem value="I">INACTIVO</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Espacio reservado igual que en TiposPredio */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}></Box>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearCargo
