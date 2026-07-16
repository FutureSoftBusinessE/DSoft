import { useRef, useContext } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import { Box, Tooltip, IconButton } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import esLocale from "date-fns/locale/es"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import FormularioPlanServicio from "../componente/FormularioPlanServicio"

// CORREGIDO: Tema definido fuera del componente para evitar recreación en cada render
const theme = createTheme({
  palette: {
    primary: { main: "#196C87" },
    secondary: { main: "#2E7D32" },
  },
})

const CrearPlanServicio = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const formRef = useRef()

  const { mutateAsync: SaveCreacion, isPending: isSaving } = useMutation({
    queryKey: ["isCreatingPlanServicio"],
    fn: async (data) => {
      // El formData ya incluye artapliiva como string (ej: "01", "02")
      const response = await api.post("/PlanesServicios/crearPlanesServicios", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const ejecutarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")

  const handleSubmit = async (formData) => {
    // El FormularioPlanServicio ya envía artapliiva como código string
    await SaveCreacion(formData)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <ThemeProvider theme={theme}>
        <Header />
        <div className="main main-app p-3 p-lg-4">
          <BackIcon />

          <Box sx={{ mb: 2 }}>
            {ejecutarAction && (
              <Tooltip title={ejecutarAction.acccaption}>
                <IconButton
                  onClick={() => formRef.current?.handleSubmit()}
                  disabled={isSaving}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                >
                  {getIconComponent(ejecutarAction.accnameicono, ejecutarAction.acctipoico)}
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* CORREGIDO: Cambiado de div a Box para que mb funcione correctamente */}
          <Box sx={{ textAlign: "center", fontSize: "25px", mb: 3 }}>
            <b>Crear Nuevo Plan de Servicio</b>
          </Box>

          <CustomBackdrop isLoading={isSaving} />

          <FormularioPlanServicio ref={formRef} isLoading={isSaving} onSubmit={handleSubmit} modo="crear" />
        </div>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default CrearPlanServicio
