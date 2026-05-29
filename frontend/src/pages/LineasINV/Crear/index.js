/* eslint-disable camelcase */
import { useState, useContext, useEffect } from "react"
import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import { Box, Paper, TextField, Tooltip, IconButton, Grid, Typography, MenuItem, InputAdornment } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api, showWarning } from "../../../api"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"
import AccountTreeIcon from "@mui/icons-material/AccountTree"

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" } },
})

const StyledRootStyles = {
  width: "100%",
  maxWidth: "900px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const CrearLineasINV = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // Configuración dinámica desde siaccia
  const [configCia, setConfigCia] = useState({
    format: "##-##-##",
    lengths: [2, 2, 2],
    delimiter: "-",
    totalLength: 6,
    maxLevels: 3,
  })
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  const [formData, setFormData] = useState({
    lincodigo: "",
    lindescri: "",
    coscodigo: null,
    lintipo: "T",
    linstatus: "A",
    numsecini: null,
    numseccont: null,
    linnivel: 1,
  })

  const [padreInfo, setPadreInfo] = useState({ codigoVisual: "", codigoBD: "", descri: "" })
  const [isLoadingPadre, setIsLoadingPadre] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get("/LineasINV/getConfigLineas")
        const resultData = response.data?.data || response.data
        if (resultData) {
          const formato_db = resultData.ciaforlin || "##-##-##"
          const delimiter = formato_db.replace(/[#09X]/g, "")[0] || ""
          const lengths = delimiter ? formato_db.split(delimiter).map((s) => s.length) : [formato_db.length]
          const totalLength = lengths.reduce((acc, val) => acc + val, 0)
          setConfigCia({
            format: formato_db,
            delimiter,
            lengths,
            totalLength,
            maxLevels: resultData.cianiveleslin || lengths.length,
          })
        }
      } catch (error) {
        console.error("Error obteniendo configuración:", error)
      } finally {
        setIsLoadingConfig(false)
      }
    }
    fetchConfig()
  }, [])

  const {
    mutateAsync: SaveCreacionLinea,
    isPending: isSaving,
    isError,
  } = useMutation({
    queryKey: ["isCreatingLineaINV"],
    fn: async (data) => {
      const response = await api.post("/LineasINV/createLineasINV", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => navigate(-1),
  })

  const handleInputChange = (field, value) => {
    let processedValue = value
    if (typeof value === "string" && field !== "lintipo" && field !== "linstatus") {
      processedValue = value.toUpperCase()
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }))
  }

  const handleBlurCodigo = async () => {
    const code = formData.lincodigo.trim()
    if (!code) {
      setPadreInfo({ codigoVisual: "", codigoBD: "", descri: "" })
      setFormData((prev) => ({ ...prev, linnivel: 1, lincodigo: "" }))
      return
    }

    let clean = code.replace(/[^a-zA-Z0-9]/g, "")
    if (clean.length > 0 && clean.length <= configCia.totalLength) {
      clean = clean.padEnd(configCia.totalLength, "0")
    }

    const segments = []
    let currentIndex = 0
    for (const len of configCia.lengths) {
      segments.push(clean.substring(currentIndex, currentIndex + len))
      currentIndex += len
    }

    const formattedCode = configCia.delimiter ? segments.join(configCia.delimiter) : clean
    let nivelCalc = 1
    let parentCodeBD = ""
    let parentCodeVisual = ""

    for (let i = segments.length - 1; i >= 0; i--) {
      if (!/^0+$/.test(segments[i])) {
        nivelCalc = i + 1
        if (i > 0) {
          const parentSegs = [...segments]
          for (let j = i; j < parentSegs.length; j++) {
            parentSegs[j] = "0".repeat(configCia.lengths[j])
          }
          parentCodeBD = parentSegs.join("")
          parentCodeVisual = configCia.delimiter ? parentSegs.join(configCia.delimiter) : parentCodeBD
        }
        break
      }
    }

    setFormData((prev) => ({ ...prev, lincodigo: formattedCode, linnivel: nivelCalc }))

    if (parentCodeBD) {
      setIsLoadingPadre(true)
      try {
        const response = await api.post("/LineasINV/getLineaByCodigo", { codigo: parentCodeBD })
        const resultData = response.data?.data || response.data
        if (resultData && resultData.encontrado) {
          setPadreInfo({ codigoVisual: parentCodeVisual, codigoBD: parentCodeBD, descri: resultData.lindescri })
        } else {
          setPadreInfo({ codigoVisual: parentCodeVisual, codigoBD: parentCodeBD, descri: "NO ENCONTRADO EN BD" })
        }
      } catch (error) {
        setPadreInfo({ codigoVisual: parentCodeVisual, codigoBD: parentCodeBD, descri: "ERROR DE BÚSQUEDA" })
      } finally {
        setIsLoadingPadre(false)
      }
    } else {
      setPadreInfo({ codigoVisual: "N/A", codigoBD: "", descri: "NODO RAÍZ" })
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!formData.lincodigo.trim()) return showWarning("El Código es obligatorio")
    if (!formData.lindescri.trim()) return showWarning("La Descripción es obligatoria")

    const cleanCode = formData.lincodigo.replace(/[^a-zA-Z0-9]/g, "")
    const payload = {
      ...formData,
      lincodigo: cleanCode,
      linlindes: padreInfo.codigoBD ? padreInfo.codigoBD : null,
    }
    await SaveCreacionLinea(payload)
  }

  const grabarAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action?.acccaption === "GRABAR")
  const toolbarActions = grabarAction
    ? [
        {
          label: grabarAction.acccaption,
          key: grabarAction.acccaption,
          icon: getIconComponent(grabarAction.accnameicono, grabarAction.acctipoico),
        },
      ]
    : []

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <Box sx={{ mb: 2 }}>
          {toolbarActions.map((action) => (
            <Tooltip title={action.label} key={action.key}>
              <IconButton
                onClick={handleSubmit}
                disabled={isSaving || isLoadingConfig}
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
          <b>Crear Línea de Productos</b>
        </div>
        <CustomBackdrop isLoading={isSaving || isLoadingConfig} />
        <Box sx={StyledRootStyles}>
          <Paper
            elevation={3}
            sx={{ p: 4, borderRadius: 3, background: "white" }}
            component="form"
            onSubmit={handleSubmit}
          >
            <Typography variant="h6" color="primary" gutterBottom sx={{ mb: 3 }}>
              Datos Generales
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Código *"
                  value={formData.lincodigo}
                  onChange={(e) => handleInputChange("lincodigo", e.target.value)}
                  onBlur={handleBlurCodigo}
                  error={isError && !formData.lincodigo}
                  inputProps={{ maxLength: 20 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Nivel"
                  value={formData.linnivel}
                  disabled
                  InputLabelProps={{ shrink: true }}
                  sx={{ backgroundColor: "#f9fafb" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}></Grid>
              <Grid item xs={12} sm={12}>
                <TextField
                  fullWidth
                  label="Descripción *"
                  value={formData.lindescri}
                  onChange={(e) => handleInputChange("lindescri", e.target.value)}
                  error={isError && !formData.lindescri}
                  inputProps={{ maxLength: 40 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Línea Descargo"
                  value={padreInfo.codigoVisual}
                  disabled
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountTreeIcon color="disabled" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ backgroundColor: "#f9fafb" }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  value={isLoadingPadre ? "Buscando..." : padreInfo.descri}
                  disabled
                  variant="filled"
                  sx={{
                    backgroundColor: "#f9fafb",
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: padreInfo.descri.includes("NO ENCONTRADO") ? "#d32f2f" : "#8e24aa",
                      fontWeight: "bold",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo Línea"
                  value={formData.lintipo}
                  onChange={(e) => handleInputChange("lintipo", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="M">MAYOR (Padre)</MenuItem>
                  <MenuItem value="T">TRANSACCIONAL</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.linstatus}
                  onChange={(e) => handleInputChange("linstatus", e.target.value)}
                  InputLabelProps={{ shrink: true }}
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
export default CrearLineasINV
