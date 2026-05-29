import React, { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, MenuItem, Autocomplete } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useQuery, useMutation, api, showWarning } from "../../../api"
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

const CrearSecuenciasDoc = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    dptoanio: new Date().getFullYear(),
    loccodigo: "",
    modcodigo: "",
    doccodigo: "",
    dptodescri: "",
    dptonumsec: 0,
    locservidor: "A",
  })

  // --- 1. LÓGICA DEFENSIVA PARA CATÁLOGO DE LOCALIDADES ---
  const { data: rawLoc, isLoading: isLocLoading } = useQuery({
    queryKey: ["listaLocalidadesSecDoc"],
    queryFn: async () => {
      try {
        const response = await api.get("/SecuenciasDoc/getListaLocalidades")
        return response?.data?.data || response?.data || response || []
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })
  const locValidadas = Array.isArray(rawLoc) ? rawLoc : Array.isArray(rawLoc?.data) ? rawLoc.data : []
  const listaLocalidades = locValidadas.map((item) => ({
    id: item.loccodigo || item.id || "",
    label: item.label || `${item.loccodigo || ""} - ${item.locdescri || ""}`.replace(/^ - |- $/g, ""),
  }))

  // --- 2. LÓGICA DEFENSIVA PARA CATÁLOGO DE MÓDULOS ---
  const { data: rawMod, isLoading: isModLoading } = useQuery({
    queryKey: ["listaModulosSecDoc"],
    queryFn: async () => {
      try {
        const response = await api.post("/SecuenciasDoc/getModulos", {})
        return response?.data?.data || response?.data || response || []
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })
  const modValidadas = Array.isArray(rawMod) ? rawMod : Array.isArray(rawMod?.data) ? rawMod.data : []
  const listaModulos = modValidadas.map((item) => ({
    id: item.modcodigo || item.id || "",
    label: item.label || `${item.modcodigo || ""} - ${item.moddescri || ""}`.replace(/^ - |- $/g, ""),
  }))

  // --- 3. LÓGICA DEFENSIVA Y CASCADA PARA CATÁLOGO DE DOCUMENTOS ---
  const { data: rawDoc, isLoading: isDocLoading } = useQuery({
    queryKey: ["listaDocumentosSecDoc"],
    queryFn: async () => {
      try {
        const response = await api.post("/SecuenciasDoc/getDocumentos", {})
        return response?.data?.data || response?.data || response || []
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })
  const docValidadas = Array.isArray(rawDoc) ? rawDoc : Array.isArray(rawDoc?.data) ? rawDoc.data : []

  // FILTRO CASCADA: Solo mapeamos los documentos que pertenezcan al módulo seleccionado
  const listaDocumentos = docValidadas
    .filter((item) => !formData.modcodigo || item.modcodigo === formData.modcodigo)
    .map((item) => ({
      id: item.doccodigo || item.id || "",
      label: item.label || `${item.doccodigo || ""} - ${item.docdescri || ""}`.replace(/^ - |- $/g, ""),
    }))
  // --- FIN LÓGICAS DEFENSIVAS ---

  // Hook de mutación para guardar
  const { mutateAsync: SaveNuevaSecuencia, isPending: isSavingSecuencia } = useMutation({
    queryKey: ["isCreatingSecuencia"],
    fn: async (data) => {
      const response = await api.post("/SecuenciasDoc/createSecuenciasDoc", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  // Manejador de cambios con limpieza en cascada
  const handleInputChange = (field, value) => {
    let finalValue = value

    if (field === "loccodigo") {
      finalValue = value.toUpperCase().slice(0, 2)
    } else if (field === "modcodigo" || field === "doccodigo") {
      finalValue = value.toUpperCase().slice(0, 3)
    } else if (field === "dptodescri") {
      finalValue = value.toUpperCase().slice(0, 100)
    }

    setFormData((prev) => {
      const newData = { ...prev, [field]: finalValue }

      // REGLA CASCADA: Si el usuario cambia el módulo, se borra el documento que tenía seleccionado
      if (field === "modcodigo") {
        newData.doccodigo = ""
      }

      return newData
    })
  }

  // Validación previa al envío
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    try {
      if (!formData.dptoanio) return showWarning("El año es obligatorio")
      if (!formData.loccodigo.trim()) return showWarning("El código de localidad es obligatorio")
      if (!formData.modcodigo.trim()) return showWarning("El código de módulo es obligatorio")
      if (!formData.doccodigo.trim()) return showWarning("El código de documento es obligatorio")
      if (!formData.dptodescri.trim()) return showWarning("La descripción de la secuencia es obligatoria")
      if (formData.dptonumsec === "" || formData.dptonumsec === null)
        return showWarning("El número de secuencia inicial es obligatorio")

      await SaveNuevaSecuencia(formData)
    } catch (error) {
      console.error("Error al crear la Secuencia de Documento:", error)
    }
  }

  // BARRA DE ACCIONES DINÁMICA (Buscamos estrictamente GRABAR o GUARDAR)
  const grabarAction = selectedMenuInfo?.data?.barraAcciones?.find(
    (action) => action?.acccaption === "GRABAR" || action?.acccaption === "GUARDAR",
  )

  const toolbarActions = []

  if (grabarAction) {
    toolbarActions.push({
      label: grabarAction.acccaption,
      key: grabarAction.acccaption,
      icon: getIconComponent(grabarAction.accnameicono, grabarAction.acctipoico),
    })
  } else {
    toolbarActions.push({
      label: "Grabar Secuencia",
      key: "GRABAR",
      icon: <Save />,
    })
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
                disabled={isSavingSecuencia}
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
          <b>Crear Secuencia de Documento</b>
        </div>

        <CustomBackdrop isLoading={isSavingSecuencia || isLocLoading || isModLoading || isDocLoading} />

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
                  type="number"
                  label="Año *"
                  value={formData.dptoanio}
                  onChange={(e) => handleInputChange("dptoanio", e.target.value)}
                  placeholder="Ej: 2026"
                />
              </Grid>

              {/* COMBO: LOCALIDAD */}
              <Grid item xs={12} sm={3}>
                <Autocomplete
                  options={listaLocalidades}
                  getOptionLabel={(option) => option.label || ""}
                  value={
                    listaLocalidades.find((c) => c.id === formData.loccodigo) ||
                    (formData.loccodigo ? { id: formData.loccodigo, label: `${formData.loccodigo}` } : null)
                  }
                  onChange={(event, newValue) => handleInputChange("loccodigo", newValue ? newValue.id : "")}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Localidad *"
                      placeholder="Buscar..."
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              {/* COMBO: MÓDULO */}
              <Grid item xs={12} sm={3}>
                <Autocomplete
                  options={listaModulos}
                  getOptionLabel={(option) => option.label || ""}
                  value={
                    listaModulos.find((c) => c.id === formData.modcodigo) ||
                    (formData.modcodigo ? { id: formData.modcodigo, label: `${formData.modcodigo}` } : null)
                  }
                  onChange={(event, newValue) => handleInputChange("modcodigo", newValue ? newValue.id : "")}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Módulo *"
                      placeholder="Buscar..."
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              {/* COMBO CASCADA: DOCUMENTO */}
              <Grid item xs={12} sm={3}>
                <Autocomplete
                  options={listaDocumentos}
                  disabled={!formData.modcodigo} // Desactivado si no hay módulo
                  getOptionLabel={(option) => option.label || ""}
                  value={
                    listaDocumentos.find((c) => c.id === formData.doccodigo) ||
                    (formData.doccodigo ? { id: formData.doccodigo, label: `${formData.doccodigo}` } : null)
                  }
                  onChange={(event, newValue) => handleInputChange("doccodigo", newValue ? newValue.id : "")}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Documento *"
                      placeholder={formData.modcodigo ? "Buscar..." : "Seleccione un módulo"}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Descripción de la Secuencia *"
                  value={formData.dptodescri}
                  onChange={(e) => handleInputChange("dptodescri", e.target.value)}
                  placeholder="Ej: FACTURAS LOCAL MATRIZ"
                  inputProps={{ maxLength: 100 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Secuencia Inicial *"
                  value={formData.dptonumsec}
                  onChange={(e) => handleInputChange("dptonumsec", e.target.value)}
                  placeholder="Ej: 1"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Servidor Lógico"
                  value={formData.locservidor}
                  onChange={(e) => handleInputChange("locservidor", e.target.value)}
                >
                  <MenuItem value="A">ACTIVO (A)</MenuItem>
                  <MenuItem value="I">INACTIVO (I)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearSecuenciasDoc
