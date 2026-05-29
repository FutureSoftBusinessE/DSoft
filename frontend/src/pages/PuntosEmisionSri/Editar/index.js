import { useState, useContext, useEffect } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Box,
  Paper,
  TextField,
  Tooltip,
  IconButton,
  Grid,
  Typography,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, useQuery, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import StorefrontIcon from "@mui/icons-material/Storefront"
import AssignmentIcon from "@mui/icons-material/Assignment"

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

const accordionStyles = {
  mb: 2,
  border: "1px solid",
  borderColor: "divider",
  borderRadius: "8px !important",
  boxShadow: "none",
  "&:before": { display: "none" },
}

const EditarPuntosEmisionSri = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [formData, setFormData] = useState({
    cjacodigo: "",
    cjadescri: "",
    loccodigo: "",
    sripreauto: "",
    sriautnumero: null,
    sriserie01: "",
    sriserie02: "",
    cjastatus: "A",
    detalles: [], // Almacenará la data de siactsriseries
  })

  useEffect(() => {
    if (state) {
      setFormData((prev) => ({
        ...prev,
        cjacodigo: state.cjacodigo || "",
        cjadescri: state.cjadescri || "",
        loccodigo: state.loccodigo || "",
        sripreauto: state.sripreauto || "",
        sriautnumero: state.sriautnumero || null,
        sriserie01: state.sriserie01 || "",
        sriserie02: state.sriserie02 || "",
        cjastatus: state.cjastatus || "A",
      }))
    }
  }, [state])

  // 1. Carga de Combos Iniciales (Localidades y Autorizaciones)
  const { data: rawInitialData, isLoading: isLoadingCombos } = useQuery({
    queryKey: ["getInitialDataPuntosEmision"],
    queryFn: async () => {
      try {
        const response = await api.post("/PuntosEmisionSri/getInitialDataPuntosEmision")
        const resData = response?.data
        if (resData?.data?.data) return resData.data.data
        if (resData?.data) return resData.data
        return { localidades: [], autorizaciones: [] }
      } catch (error) {
        return { localidades: [], autorizaciones: [] }
      }
    },
    refetchOnWindowFocus: false,
  })

  const listaLocalidades = Array.isArray(rawInitialData?.localidades) ? rawInitialData.localidades : []
  const listaAutorizaciones = Array.isArray(rawInitialData?.autorizaciones) ? rawInitialData.autorizaciones : []

  // 2. Consulta de Secuencias (siactsriseries) por caja
  const { data: seriesCaja = [], isLoading: isLoadingSeries } = useQuery({
    queryKey: ["getSeriesSriByCaja", formData.cjacodigo],
    queryFn: async () => {
      if (!formData.cjacodigo) return []
      const response = await api.post("/PuntosEmisionSri/getSeriesSriByCaja", { cjacodigo: formData.cjacodigo })
      const resData = response?.data
      if (resData?.data?.data) return resData.data.data
      if (resData?.data) return resData.data
      return []
    },
    enabled: !!formData.cjacodigo,
    refetchOnWindowFocus: false,
  })

  // Alimentamos formData.detalles una vez que llegan las secuencias
  useEffect(() => {
    if (seriesCaja.length > 0) {
      setFormData((prev) => ({ ...prev, detalles: seriesCaja }))
    }
  }, [seriesCaja])

  // Mutación para guardar la edición
  const { mutateAsync: SaveEdicion, isPending: isSaving } = useMutation({
    queryKey: ["isEditingPuntoEmisionSri"],
    fn: async (dataPayload) => (await api.post("/PuntosEmisionSri/updatePuntosEmisionSri", dataPayload)).data,
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: typeof value === "string" ? value.toUpperCase() : value }))
  }

  // Manejador específico para el TextField de las secuencias
  const handleDetalleChange = (index, value) => {
    const newDetalles = [...formData.detalles]
    newDetalles[index].srisecact = value
    setFormData((prev) => ({ ...prev, detalles: newDetalles }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!formData.cjadescri) return showWarning("La descripción de la caja es requerida.")

    // Enviamos la data maestra y la lista de secuencias
    await SaveEdicion({
      cjacodigo: formData.cjacodigo,
      cjadescri: formData.cjadescri,
      cjastatus: formData.cjastatus,
      detalles: formData.detalles,
    })
  }

  const action = selectedMenuInfo?.data?.barraAcciones?.find(
    (a) => a.acccaption === "GRABAR" || a.acccaption === "ACTUALIZAR" || a.acccaption === "GUARDAR",
  )

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <Box sx={{ mb: 2 }}>
          {action && (
            <Tooltip title={action.acccaption}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSaving || isLoadingCombos || isLoadingSeries}
                sx={{ border: "1px solid #ddd", bgcolor: "white" }}
              >
                {getIconComponent(action.accnameicono, action.acctipoico)}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <div style={{ display: "flex", justifyContent: "center", mb: "30px", fontSize: "25px", textAlign: "center" }}>
          <b>Visualización y Edición de Punto de Emisión (Caja)</b>
        </div>

        <CustomBackdrop isLoading={isSaving || isLoadingCombos || isLoadingSeries} />

        <Box sx={StyledRoot} component="form" onSubmit={handleSubmit}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <b>Modo de Edición:</b> Por seguridad e integridad referencial, en la cabecera sólo se permite modificar la
            Descripción y el Estado. En los parámetros SRI, sólo podrá ajustar la Secuencia Actual.
          </Alert>

          <Accordion defaultExpanded sx={accordionStyles}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <StorefrontIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                  DATOS DE LA CAJA
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2}>
                  <TextField disabled fullWidth label="Código" value={formData.cjacodigo} sx={{ bgcolor: "#f0f0f0" }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Descripción *"
                    value={formData.cjadescri}
                    onChange={(e) => handleInputChange("cjadescri", e.target.value)}
                    inputProps={{ maxLength: 40 }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    select
                    fullWidth
                    label="Estado"
                    value={formData.cjastatus}
                    onChange={(e) => handleInputChange("cjastatus", e.target.value)}
                  >
                    <MenuItem value="A">ACTIVO</MenuItem>
                    <MenuItem value="I">INACTIVO</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={12}>
                  <Autocomplete
                    disabled
                    options={listaLocalidades}
                    getOptionLabel={(o) => o.label || ""}
                    value={
                      listaLocalidades.find((l) => l.id === formData.loccodigo) ||
                      (formData.loccodigo ? { id: formData.loccodigo, label: formData.loccodigo } : null)
                    }
                    renderInput={(p) => (
                      <TextField
                        {...p}
                        label="Localidad"
                        InputLabelProps={{ shrink: true }}
                        sx={{ bgcolor: "#f0f0f0" }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded sx={accordionStyles}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AssignmentIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                  PARÁMETROS DEL SRI (Actualización de Secuencia)
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Autocomplete
                    disabled
                    options={listaAutorizaciones}
                    getOptionLabel={(o) => o.label || ""}
                    value={
                      listaAutorizaciones.find((a) => a.sriautnumero === formData.sriautnumero) ||
                      (formData.sriautnumero
                        ? { sriautnumero: formData.sriautnumero, label: formData.sriautnumero }
                        : null)
                    }
                    renderInput={(p) => (
                      <TextField
                        {...p}
                        label="Nº de Autorización Asignada"
                        InputLabelProps={{ shrink: true }}
                        sx={{ bgcolor: "#f0f0f0" }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    disabled
                    fullWidth
                    label="Establecimiento"
                    value={formData.sriserie01}
                    sx={{ bgcolor: "#f0f0f0" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    disabled
                    fullWidth
                    label="Punto de Emisión"
                    value={formData.sriserie02}
                    sx={{ bgcolor: "#f0f0f0" }}
                  />
                </Grid>

                {/* --- TABLA DE EDICIÓN DE SECUENCIAS --- */}
                <Grid item xs={12}>
                  <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #ddd" }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                        <TableRow>
                          <TableCell>
                            <b>Doc.</b>
                          </TableCell>
                          <TableCell>
                            <b>Descripción</b>
                          </TableCell>
                          <TableCell align="center">
                            <b>Sec. Inicial</b>
                          </TableCell>
                          <TableCell align="center">
                            <b>Sec. Final</b>
                          </TableCell>
                          <TableCell align="center" sx={{ color: "#196C87" }}>
                            <b>Sec. Actual (Siguiente)</b>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.detalles.map((doc, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{doc.srisecdoc}</TableCell>
                            <TableCell>{doc.sridestipo}</TableCell>
                            <TableCell align="center">{doc.srisecini}</TableCell>
                            <TableCell align="center">
                              {doc.srisecfin === 999999999 ? "ILIMITADA (E)" : doc.srisecfin}
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                value={doc.srisecact}
                                onChange={(e) => handleDetalleChange(idx, e.target.value)}
                                sx={{ width: "120px" }}
                                inputProps={{ min: 0 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {formData.detalles.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              {isLoadingSeries ? "Cargando documentos..." : "No se encontraron series para esta caja."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                {/* --- FIN DE TABLA --- */}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default EditarPuntosEmisionSri
