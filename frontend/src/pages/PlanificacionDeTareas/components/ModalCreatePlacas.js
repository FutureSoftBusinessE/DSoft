import React, { useState, useEffect } from "react"
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Modal,
  IconButton,
  Alert,
  CircularProgress,
  Autocomplete,
} from "@mui/material"
import { styled } from "@mui/system"
import { useMutation, useQuery, api } from "../../../api"
import CustomBackdrop from "../../../components/CustomBackdrop"
import CloseIcon from "@mui/icons-material/Close"
import SearchIcon from "@mui/icons-material/Search"

const ModalContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 900,
  maxWidth: "95vw",
  maxHeight: "90vh",
  overflow: "auto",
  backgroundColor: theme.palette.background.paper,
  boxShadow: 24,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0),
  outline: "none",
}))

const ModalHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
}))

const Section = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  position: "relative",
  border: "1px solid #0072B1",
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  position: "absolute",
  top: "-0.75em",
  left: "1em",
  backgroundColor: theme.palette.background.paper,
  padding: "0 16px",
}))

const FlexRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  flexDirection: "column",
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
  },
}))

const SearchSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: "#f5f5f5",
  borderRadius: theme.shape.borderRadius,
}))

const ReadOnlyField = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: "#f5f5f5",
  border: "1px solid #e0e0e0",
  borderRadius: theme.shape.borderRadius,
  minHeight: "56px",
  display: "flex",
  alignItems: "center",
  fontSize: "0.875rem",
}))

const CustomModalCreateVehiculo = ({
  open = false,
  onClose,
  onSuccess,
  defaultValues = {},
  resetOnClose = true,
  title = "Crear Nuevo Vehículo",
}) => {
  const [searchPlaca, setSearchPlaca] = useState("")
  const [searchError, setSearchError] = useState("")
  const [formData, setFormData] = useState({
    placa: "",
    marca: null,
    modelo: null,
    clase: null,
    tipo: null,
    combustible: null,
    carroceria: null,
    pais: null,
    cilindraje: "",
    toneladas: "",
    pasajeros: "",
    anio: "",
    ...defaultValues,
  })

  // Estados para datos cargados de APIs
  const [clases, setClases] = useState([])
  const [tipos, setTipos] = useState([])
  const [combustibles, setCombustibles] = useState([])
  const [carrocerias, setCarrocerias] = useState([])
  const [paises, setPaises] = useState([])

  const [isSearched, setIsSearched] = useState(false)

  // Cargar datos de tablas básicas al abrir el modal
  useEffect(() => {
    if (open) {
      loadBasicData()
    }
  }, [open])

  // Cargar todas las tablas básicas
  const loadBasicData = async () => {
    try {
      const [clasesRes, tiposRes, combustiblesRes, carroceriasRes, paisesRes] = await Promise.all([
        api.get("/PlanificacionTareas/getallclases"),
        api.get("/PlanificacionTareas/getalltipos"),
        api.get("/PlanificacionTareas/getAllCombustibles"),
        api.get("/PlanificacionTareas/getAllCarrocerias"),
        api.get("/PlanificacionTareas/getAllPaises"),
      ])

      setClases(clasesRes.data?.data || [])
      setTipos(tiposRes.data?.data || [])
      setCombustibles(combustiblesRes.data?.data || [])
      setCarrocerias(carroceriasRes.data?.data || [])
      setPaises(paisesRes.data?.data || [])
    } catch (error) {
      console.error("Error cargando datos básicos:", error)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTextChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Buscar vehículo en el SRI
  const { mutate: searchVehicleInSRI, isPending: isSearchingSRI } = useMutation({
    fn: async (placa) => {
      const response = await api.get(`/PlanificacionTareas/getInfoVehicleSRI/${placa}`)
      return response
    },
    showSuccess: "silent",
    onSuccess: (response) => {
      const sriData = response

      // Preparar objetos para los campos bloqueados
      const marcaObj = {
        value: "SIN", // Código temporal para nuevo registro
        label: sriData.descripcionMarca,
      }

      const modeloObj = {
        value: "SIN", // Código temporal para nuevo registro
        label: sriData.descripcionModelo,
      }

      // Actualizar formData con datos del SRI
      const newFormData = {
        placa: sriData.numeroPlaca || "",
        marca: marcaObj,
        modelo: modeloObj,
        anio: sriData.anioAuto?.toString() || "",
        cilindraje: sriData.cilindraje?.toString() || "",
      }

      setFormData((prev) => ({ ...prev, ...newFormData }))
      setSearchError("")
      setIsSearched(true)
    },
  })

  // Crear vehículo
  const { mutate: createNewVehiculo, isPending: isCreatingNewVehiculo } = useMutation({
    fn: async (data) => {
      const requestData = {
        placa: data.placa,
        vehmarcodigo: data.marca.value,
        vehmardesci: data.marca.label,
        vehmodcodigo: data.modelo.value,
        vehmoddesci: data.modelo.label,
        vehclacodigo: data.clase?.value || "",
        // vehcladesci: data.clase?.label || "",
        vehtipcodigo: data.tipo?.value || "",
        // vehtipdesci: data.tipo?.label || "",
        vehanio: data.anio,
        vehcilindraje: data.cilindraje || "",
        vehtoneladas: data.toneladas || "",
        vehpasajeros: data.pasajeros || "",
        vehcombustible: data.combustible?.label || "",
        vehcarroceria: data.carroceria?.label || "",
        paiscodigo: data.pais?.value || "",
        // chasis: "", // Agregar campo si es necesario
        // motor: "", // Agregar campo si es necesario
        // ramv: "", // Agregar campo si es necesario
        // colorcodigo: "", // Agregar campo si es necesario
      }

      const response = await api.post("/PlanificacionTareas/createPlacaYVehiculo", requestData)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data)
      }

      if (resetOnClose) {
        resetForm()
      }

      if (onClose) {
        onClose()
      }
    },
  })

  const handleSearch = () => {
    if (!searchPlaca.trim()) {
      setSearchError("Ingrese una placa para buscar en el SRI")
      return
    }

    setSearchError("")
    searchVehicleInSRI(searchPlaca)
  }

  const resetForm = () => {
    setSearchPlaca("")
    setSearchError("")
    setIsSearched(false)
    setFormData({
      placa: "",
      marca: null,
      modelo: null,
      clase: null,
      tipo: null,
      combustible: null,
      carroceria: null,
      pais: null,
      cilindraje: "",
      toneladas: "",
      pasajeros: "",
      anio: "",
    })
  }

  const validateForm = () => {
    const { placa, marca, modelo, anio, clase, tipo } = formData

    if (!placa) {
      alert("La placa es obligatoria")
      return false
    }

    if (!marca) {
      alert("La marca es obligatoria")
      return false
    }

    if (!modelo) {
      alert("El modelo es obligatorio")
      return false
    }

    if (!anio) {
      alert("El año es obligatorio")
      return false
    }

    if (!clase) {
      alert("La clase es obligatoria")
      return false
    }

    if (!tipo) {
      alert("El tipo es obligatorio")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    createNewVehiculo(formData)
  }

  const handleClose = () => {
    if (resetOnClose) {
      resetForm()
    }
    if (onClose) {
      onClose()
    }
  }

  const isLoading = isSearchingSRI || isCreatingNewVehiculo

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-create-vehiculo"
      aria-describedby="modal-create-vehiculo-description"
    >
      <>
        <CustomBackdrop isLoading={isLoading} />
        <ModalContainer>
          <ModalHeader>
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
            <IconButton
              onClick={handleClose}
              sx={{
                color: "inherit",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
              disabled={isLoading}
            >
              <CloseIcon />
            </IconButton>
          </ModalHeader>

          <Box sx={{ p: 3 }}>
            <SearchSection>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Buscar vehículo en el SRI (Obligatorio)
              </Typography>
              <FlexRow>
                <TextField
                  label="Número de Placa"
                  value={searchPlaca}
                  onChange={(e) => {
                    setSearchPlaca(e.target.value)
                    setSearchError("")
                  }}
                  fullWidth
                  variant="outlined"
                  placeholder="Ej: OBT0522"
                  autoComplete="off"
                  disabled={isLoading || isSearched}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch()
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={isLoading || !searchPlaca.trim() || isSearched}
                  startIcon={<SearchIcon />}
                  sx={{ minWidth: "120px" }}
                >
                  {isSearchingSRI ? <CircularProgress size={24} color="inherit" /> : "Buscar en SRI"}
                </Button>
              </FlexRow>
              {searchError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {searchError}
                </Alert>
              )}
              {isSearched && !searchError && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Datos obtenidos del SRI. Complete los campos faltantes.
                </Alert>
              )}
            </SearchSection>

            <Section elevation={0}>
              <SectionTitle variant="subtitle1">Datos del Vehículo</SectionTitle>

              {/* Campos bloqueados del SRI */}
              <Typography variant="subtitle2" sx={{ mb: 2, color: "text.secondary" }}>
                Datos del SRI (No editables)
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Placa
                  </Typography>
                  <ReadOnlyField>{formData.placa || "No encontrada"}</ReadOnlyField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Marca
                  </Typography>
                  <ReadOnlyField>{formData.marca?.label || "No encontrada"}</ReadOnlyField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Modelo
                  </Typography>
                  <ReadOnlyField>{formData.modelo?.label || "No encontrado"}</ReadOnlyField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Año
                  </Typography>
                  <ReadOnlyField>{formData.anio || "No encontrado"}</ReadOnlyField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Cilindraje
                  </Typography>
                  {formData?.vehcilindraje ? (
                    <ReadOnlyField>{formData.cilindraje || "No encontrado"}</ReadOnlyField>
                  ) : (
                    <TextField
                      name="cilindraje"
                      value={formData.cilindraje}
                      onChange={handleTextChange}
                      fullWidth
                      variant="outlined"
                      placeholder="Ingrese cilindraje"
                      autoComplete="off"
                      disabled={isLoading}
                    />
                  )}
                </Grid>
              </Grid>

              {/* Campos editables */}
              <Typography variant="subtitle2" sx={{ mb: 2, color: "text.secondary" }}>
                Complete los siguientes datos
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={clases}
                    getOptionLabel={(option) => option.label}
                    value={formData.clase}
                    onChange={(event, newValue) => handleChange("clase", newValue)}
                    renderInput={(params) => <TextField {...params} label="Clase *" variant="outlined" required />}
                    disabled={isLoading || !isSearched}
                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={tipos}
                    getOptionLabel={(option) => option.label}
                    value={formData.tipo}
                    onChange={(event, newValue) => handleChange("tipo", newValue)}
                    renderInput={(params) => <TextField {...params} label="Tipo *" variant="outlined" required />}
                    disabled={isLoading || !isSearched}
                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={combustibles}
                    getOptionLabel={(option) => option.label}
                    value={formData.combustible}
                    onChange={(event, newValue) => handleChange("combustible", newValue)}
                    renderInput={(params) => <TextField {...params} label="Combustible" variant="outlined" />}
                    disabled={isLoading || !isSearched}
                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={carrocerias}
                    getOptionLabel={(option) => option.label}
                    value={formData.carroceria}
                    onChange={(event, newValue) => handleChange("carroceria", newValue)}
                    renderInput={(params) => <TextField {...params} label="Carrocería" variant="outlined" />}
                    disabled={isLoading || !isSearched}
                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={paises}
                    getOptionLabel={(option) => option.label}
                    value={formData.pais}
                    onChange={(event, newValue) => handleChange("pais", newValue)}
                    renderInput={(params) => <TextField {...params} label="País" variant="outlined" />}
                    disabled={isLoading || !isSearched}
                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Toneladas"
                    name="toneladas"
                    value={formData.toneladas}
                    onChange={handleTextChange}
                    fullWidth
                    variant="outlined"
                    autoComplete="off"
                    disabled={isLoading || !isSearched}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Pasajeros"
                    name="pasajeros"
                    value={formData.pasajeros}
                    onChange={handleTextChange}
                    fullWidth
                    variant="outlined"
                    autoComplete="off"
                    disabled={isLoading || !isSearched}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button variant="outlined" color="secondary" fullWidth onClick={handleClose} disabled={isLoading}>
                      Cancelar
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      color="primary"
                      style={{ backgroundColor: "#114B5E", color: "white" }}
                      fullWidth
                      onClick={handleSubmit}
                      disabled={isLoading || !isSearched}
                    >
                      {isCreatingNewVehiculo ? "Creando..." : "Crear Vehículo"}
                    </Button>
                  </Grid>
                </Grid>
                {!isSearched && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Debe buscar primero el vehículo en el SRI para habilitar la creación.
                  </Alert>
                )}
              </Box>
            </Section>
          </Box>
        </ModalContainer>
      </>
    </Modal>
  )
}

export default CustomModalCreateVehiculo
