import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, MenuItem } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
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

// Opciones de la Regla de Negocio
const FRECUENCIAS = ["MENSUAL", "ANUAL"]

const CrearTipodeContraCli = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    concodigo: "",
    condescri: "",
    confrecuencia: "MENSUAL", // Valor por defecto
    constatus: "A",
  })

  // Hook de mutación estandarizado SIACDEV1.0
  const { mutateAsync: SaveNuevoContrato, isPending: isSavingContrato } = useMutation({
    queryKey: ["isCreatingContrato"],
    fn: async (data) => {
      const response = await api.post("/tipocontracli/createTipodeContraCli", data)
      return response.data
    },
    showError: "modal", // Se conecta con tu @api_endpoint y ValidationError
    showSuccess: "toast",
    onSuccess: () => navigate(-1), // Regresa a la tabla tras guardar el éxito
  })

  // Manejador de cambios con validación de longitud y mayúsculas
  const handleInputChange = (field, value) => {
    let finalValue = value

    if (field === "concodigo") {
      finalValue = value.toUpperCase().slice(0, 3) // Límite varchar(3)
    } else if (field === "condescri") {
      finalValue = value.toUpperCase().slice(0, 60) // Límite varchar(60)
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  // Validación previa al envío
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    try {
      if (!formData.concodigo.trim()) {
        showWarning("El código de contrato es obligatorio")
        return
      }
      if (!formData.condescri.trim()) {
        showWarning("La descripción del contrato es obligatoria")
        return
      }

      await SaveNuevoContrato(formData)
    } catch (error) {
      console.error("Error al crear el Tipo de Contrato:", error)
      // Si el backend rechaza, el showError: "modal" lo mostrará en pantalla
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

        {/* Barra de Herramientas */}
        <Box>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSavingContrato}
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
          <b>Crear Tipo de Contrato Cliente</b>
        </div>

        <CustomBackdrop isLoading={isSavingContrato} />

        <Box sx={StyledRoot}>
          <Paper
            elevation={3}
            sx={{ p: 3, mb: 3, borderRadius: 3, background: "white" }}
            component="form"
            onSubmit={handleSubmit}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Código *"
                  value={formData.concodigo}
                  onChange={(e) => handleInputChange("concodigo", e.target.value)}
                  placeholder="Ej: 01"
                />
              </Grid>

              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  label="Descripción *"
                  value={formData.condescri}
                  onChange={(e) => handleInputChange("condescri", e.target.value)}
                  placeholder="Ej: BPADT MENSUAL"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Frecuencia *"
                  value={formData.confrecuencia}
                  onChange={(e) => handleInputChange("confrecuencia", e.target.value)}
                >
                  {FRECUENCIAS.map((opcion) => (
                    <MenuItem key={opcion} value={opcion}>
                      {opcion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.constatus}
                  onChange={(e) => handleInputChange("constatus", e.target.value)}
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

export default CrearTipodeContraCli
