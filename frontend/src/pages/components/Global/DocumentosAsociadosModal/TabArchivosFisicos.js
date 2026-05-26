// import React from "react";
import {
  Grid,
  Box,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  InputAdornment,
  Button,
  Chip,
  Divider,
} from "@mui/material"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import CameraAltIcon from "@mui/icons-material/CameraAlt"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import Swal from "sweetalert2"
import CustomDatePicker from "../../../../components/CustomDatePicker"
import { api } from "../../../../api"
import dayjs from "dayjs" // <-- Importante para no romper el CustomDatePicker

// Helper para alertas frontales
const mostrarAlerta = (titulo, mensaje, icono) => {
  Swal.fire({
    title: titulo,
    text: mensaje,
    icon: icono,
    didOpen: () => {
      const container = document.querySelector(".swal2-container")
      if (container) container.style.zIndex = "9999"
    },
  })
}

const TabArchivosFisicos = ({
  archivos,
  setArchivos,
  docindex1,
  setDocindex1,
  docindex2,
  setDocindex2,
  docindex3,
  setDocindex3,
  docindex4,
  setDocindex4,
  docindex5,
  setDocindex5,
  docindex6,
  setDocindex6,
  docfecemi,
  setDocfecemi,
  docfecven,
  setDocfecven,
  passwordP12,
  setPasswordP12,
  isP12,
  setIsP12,
  showPassword,
  setShowPassword,
  tiposDoc,
  onFirmaCargada,
}) => {
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setArchivos((prev) => [...prev, ...files])

    const hasP12 = files.some((f) => f.name.toLowerCase().endsWith(".p12") || f.name.toLowerCase().endsWith(".pfx"))
    if (hasP12) setIsP12(true)
  }

  const removeFile = (indexToRemove) => {
    const nuevosArchivos = archivos.filter((_, index) => index !== indexToRemove)
    setArchivos(nuevosArchivos)

    const hasP12 = nuevosArchivos.some(
      (f) => f.name.toLowerCase().endsWith(".p12") || f.name.toLowerCase().endsWith(".pfx"),
    )
    setIsP12(hasP12)
  }

  const handleValidarCertificado = async () => {
    const p12File = archivos.find((f) => f.name.toLowerCase().endsWith(".p12") || f.name.toLowerCase().endsWith(".pfx"))

    if (!p12File || !passwordP12) {
      return mostrarAlerta("Atención", "Escriba la contraseña del certificado", "warning")
    }

    const formData = new FormData()
    formData.append("firma", p12File)
    formData.append("password", passwordP12)

    try {
      const response = await api.post("/FirmarPDFDF/validarFirmaP12", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      // Validamos que el backend responda con success: true
      if (response.data && response.data.success) {
        // CORRECCIÓN CLAVE: Extraemos la data del backend (snake_case) y la asignamos a variables (camelCase)
        const { valido_desde: validoDesde, valido_hasta: validoHasta } = response.data.data

        const fechaEmiStr = validoDesde.split(" ")[0]
        const fechaVenStr = validoHasta.split(" ")[0]

        // Convertimos a dayjs para que el componente CustomDatePicker los pueda procesar sin romper
        setDocfecemi(dayjs(fechaEmiStr))
        setDocfecven(dayjs(fechaVenStr))

        // Enviamos el string limpio a la función padre para guardarlo en la base de datos
        onFirmaCargada({ emision: fechaEmiStr, vencimiento: fechaVenStr })

        mostrarAlerta("Éxito", "Certificado validado correctamente", "success")
      } else {
        mostrarAlerta("Error", "No se pudo validar el certificado. Verifique la contraseña.", "error")
      }
    } catch (error) {
      mostrarAlerta("Error", "No se pudo validar el certificado. Verifique la contraseña.", "error")
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Button
          variant="outlined"
          component="label"
          fullWidth
          startIcon={<CloudUploadIcon />}
          sx={{ height: "100%", py: 1.5, borderStyle: "dashed" }}
        >
          Subir Documentos
          <input type="file" multiple hidden onChange={handleFilesChange} />
        </Button>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Button
          variant="outlined"
          color="secondary"
          component="label"
          fullWidth
          startIcon={<CameraAltIcon />}
          sx={{ height: "100%", py: 1.5, borderStyle: "dashed" }}
        >
          Tomar Fotos
          <input type="file" accept="image/*" capture="environment" multiple hidden onChange={handleFilesChange} />
        </Button>
      </Grid>

      {archivos.length > 0 && (
        <Grid item xs={12}>
          <Box sx={{ p: 1.5, backgroundColor: "#f0f4f8", borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: "block" }}>
              Archivos listos para subir ({archivos.length}):
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {archivos.map((f, i) => (
                <Chip
                  key={i}
                  label={f.name}
                  onDelete={() => removeFile(i)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </Grid>
      )}

      <Grid item xs={12}>
        <Divider />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Etiqueta Principal (Obligatorio)"
          value={docindex1}
          onChange={(e) => setDocindex1(e.target.value)}
          size="small"
          required
        />
      </Grid>

      {[2, 3, 4, 5, 6].map((num) => (
        <Grid item xs={12} sm={6} key={num}>
          <TextField
            select
            fullWidth
            label={`Etiqueta ${num}`}
            value={
              num === 2 ? docindex2 : num === 3 ? docindex3 : num === 4 ? docindex4 : num === 5 ? docindex5 : docindex6
            }
            onChange={(e) => {
              const val = e.target.value
              num === 2
                ? setDocindex2(val)
                : num === 3
                  ? setDocindex3(val)
                  : num === 4
                    ? setDocindex4(val)
                    : num === 5
                      ? setDocindex5(val)
                      : setDocindex6(val)
            }}
            size="small"
          >
            <MenuItem value="">
              <em>Ninguno</em>
            </MenuItem>
            {tiposDoc?.data?.map((t) => (
              <MenuItem key={t.tipdoccodigo} value={t.tipdoccodigo}>
                {t.tipdocdescri}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      ))}

      {isP12 && (
        <Grid item xs={12}>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              label="Clave P12"
              type={showPassword ? "text" : "password"}
              value={passwordP12}
              onChange={(e) => setPasswordP12(e.target.value)}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" color="secondary" onClick={handleValidarCertificado} disabled={!passwordP12}>
              Validar
            </Button>
          </Box>
        </Grid>
      )}

      <Grid item xs={6}>
        <CustomDatePicker label="Emisión" value={docfecemi} setValue={setDocfecemi} isOptional />
      </Grid>
      <Grid item xs={6}>
        <CustomDatePicker label="Vencimiento" value={docfecven} setValue={setDocfecven} isOptional />
      </Grid>
    </Grid>
  )
}
export default TabArchivosFisicos
