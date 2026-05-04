import React, { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Grid,
  IconButton,
  Avatar,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from "@mui/material"
import { Close, CloudUpload, InsertDriveFile, Lock, Save, VpnKey, Description } from "@mui/icons-material"
import CustomAutocomplete from "../CustomAutocomplete"
import fetchwrapper from "../../services/interceptors/fetchwrapper"
import CustomTextFieldClave from "./CustomTextFieldClave"

const ModalDocumento = ({
  open,
  onClose,
  entidadId,
  tipoEntidad,
  documento = null,
  tiposDocumentos = [],
  isLoadingTipos = false,
  errorTipos = null,
  onCreate,
  onEdit,
  isCreating = false,
  isEditing = false,
}) => {
  const [error, setError] = useState("")
  const [file, setFile] = useState(null)
  const [tipoEntrada, setTipoEntrada] = useState("documento") // "documento" o "clave"
  const [cargandoClave, setCargandoClave] = useState(false)

  // Estado específico para claves
  const [claveData, setClaveData] = useState({
    usuario: "",
    clave: "",
    url: "",
  })

  // Estado del formulario
  const [formData, setFormData] = useState({
    docnombre: "",
    docfecemi: "",
    docfecven: "",
    docindex1: null,
    docindex2: null,
    docindex3: null,
    docindex4: null,
    docindex5: null,
    docindex6: "",
  })

  // Función para cargar contenido de clave desde la API
  const cargarContenidoClave = async (documentouuid) => {
    setCargandoClave(true)
    try {
      const response = await fetchwrapper("/DocumentosAsociadosComponent/getDocumentoContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentouuid }),
      })
      const data = await response.json()

      if (data.success) {
        setClaveData({
          usuario: data.data.usuario || "",
          clave: data.data.clave || "",
          url: data.data.url || "",
        })
      } else {
        console.error("Error al cargar contenido de clave:", data.error)
      }
    } catch (error) {
      console.error("Error al cargar clave:", error)
    } finally {
      setCargandoClave(false)
    }
  }

  // Efecto para cargar datos del documento cuando cambia
  useEffect(() => {
    if (documento && open) {
      const findTipoDocObj = (codigo) => {
        if (!codigo) return null
        return tiposDocumentos.find((t) => t.tipdoccodigo === codigo) || null
      }

      const formatDateForInput = (dateString) => {
        if (!dateString) return ""
        try {
          const date = new Date(dateString)
          if (isNaN(date.getTime())) return ""
          return date.toISOString().split("T")[0]
        } catch (e) {
          return ""
        }
      }

      setFormData({
        docnombre: documento.docnombre || "",
        docfecemi: formatDateForInput(documento.docfecemi),
        docfecven: formatDateForInput(documento.docfecven),
        docindex1: findTipoDocObj(documento.docindex1),
        docindex2: findTipoDocObj(documento.docindex2),
        docindex3: findTipoDocObj(documento.docindex3),
        docindex4: findTipoDocObj(documento.docindex4),
        docindex5: findTipoDocObj(documento.docindex5),
        docindex6: documento.docindex6 || "",
      })

      // Detectar si es una clave por la extensión
      if (documento.docextension === "clv") {
        setTipoEntrada("clave")
        // Cargar el contenido de la clave desde la API
        cargarContenidoClave(documento.documentouuid)
      } else {
        setTipoEntrada("documento")
      }
    } else if (!documento && open) {
      // Resetear para nuevo documento
      setTipoEntrada("documento") // Por defecto, documento
      setFormData({
        docnombre: "",
        docfecemi: "",
        docfecven: "",
        docindex1: null,
        docindex2: null,
        docindex3: null,
        docindex4: null,
        docindex5: null,
        docindex6: "",
      })
      setFile(null)
      setClaveData({ usuario: "", clave: "", url: "" })
    }
  }, [documento, open, tiposDocumentos])

  // Manejar cambio de tipo de entrada (documento/clave)
  const handleChangeTipoEntrada = (event, nuevoTipo) => {
    if (nuevoTipo !== null) {
      setTipoEntrada(nuevoTipo)
      setFile(null) // Limpiar archivo si cambia
      setError("")
    }
  }

  // Configurar dropzone (solo para documentos)
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]

        const maxSize = 20 * 1024 * 1024
        if (selectedFile.size > maxSize) {
          setError("El archivo no debe superar los 20MB")
          return
        }

        const allowedExtensions = [
          "pdf",
          "jpg",
          "jpeg",
          "png",
          "gif",
          "doc",
          "docx",
          "xls",
          "xlsx",
          "xml",
          "pfx",
          "pf12",
          "p12",
          "cer",
          "key",
        ]

        const extension = selectedFile.name.split(".").pop().toLowerCase()
        if (!allowedExtensions.includes(extension)) {
          setError(`Extensión .${extension} no permitida`)
          return
        }

        setFile(selectedFile)
        setError("")

        if (!formData.docnombre && !documento) {
          const nombreSinExtension = selectedFile.name.replace(/\.[^/.]+$/, "")
          setFormData((prev) => ({
            ...prev,
            docnombre: nombreSinExtension,
          }))
        }
      }
    },
    [formData.docnombre, documento],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/*": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".xml", ".pfx", ".pf12", ".p12", ".cer", ".key"],
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
    disabled: tipoEntrada === "clave" || !!documento, // Deshabilitado si es clave o si es edición
  })

  // Obtener icono según extensión
  const getFileIcon = (fileName) => {
    if (!fileName) return <InsertDriveFile sx={{ fontSize: 40, color: "#757575" }} />

    const extension = fileName.split(".").pop().toLowerCase()
    if (["pfx", "pf12", "p12", "cer", "key"].includes(extension)) {
      return <Lock sx={{ fontSize: 40, color: "#ff9800" }} />
    }
    if (extension === "pdf") return <InsertDriveFile sx={{ fontSize: 40, color: "#f40f02" }} />
    if (["jpg", "jpeg", "png", "gif"].includes(extension))
      return <InsertDriveFile sx={{ fontSize: 40, color: "#4caf50" }} />
    return <InsertDriveFile sx={{ fontSize: 40, color: "#2b579a" }} />
  }

  // Manejar cambios en los CustomAutocomplete
  const handleAutocompleteChange = (field) => (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      [field]: selectedOption,
    }))
  }

  // Manejar cambios en los TextFields
  const handleTextFieldChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  // Manejar cambios en campos de clave
  const handleClaveChange = (field) => (event) => {
    setClaveData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  // Validar fechas
  const validarFechas = () => {
    if (formData.docfecven && formData.docfecemi) {
      const fechaEmision = new Date(formData.docfecemi)
      const fechaVencimiento = new Date(formData.docfecven)

      if (isNaN(fechaEmision.getTime()) || isNaN(fechaVencimiento.getTime())) {
        return "Las fechas ingresadas no son válidas"
      }

      if (fechaVencimiento < fechaEmision) {
        return "La fecha de vencimiento no puede ser anterior a la fecha de emisión"
      }
    }
    return null
  }

  // Validar campos según tipo
  const validarCampos = () => {
    // Validaciones comunes
    if (!formData.docindex6 || !formData.docindex6.trim()) {
      return "Etiqueta 6 (Texto libre obligatorio) es requerida"
    }

    const tieneEtiquetaSeleccionada =
      formData.docindex1 || formData.docindex2 || formData.docindex3 || formData.docindex4 || formData.docindex5

    if (!tieneEtiquetaSeleccionada) {
      return "Debe seleccionar al menos una etiqueta"
    }

    const errorFechas = validarFechas()
    if (errorFechas) return errorFechas

    // Validaciones según tipo
    if (tipoEntrada === "documento" && !documento && !file) {
      return "Debe seleccionar un archivo"
    }

    if (tipoEntrada === "clave") {
      // Para edición, claveData ya debería estar cargado
      if (!claveData.usuario.trim()) return "El campo Usuario es obligatorio"
      if (!claveData.clave.trim()) return "El campo Clave es obligatorio"
    }

    return null
  }

  // Guardar documento
  const handleSubmit = async () => {
    const errorValidacion = validarCampos()
    if (errorValidacion) {
      setError(errorValidacion)
      const dialogContent = document.querySelector(".MuiDialogContent-root")
      if (dialogContent) dialogContent.scrollTop = 0
      return
    }

    setError("")

    try {
      if (documento) {
        // ============================================
        // EDITAR DOCUMENTO
        // ============================================

        // Si es una CLAVE, usar FormData (igual que en creación)
        if (tipoEntrada === "clave") {
          // Construir el contenido de la clave con los datos actuales de claveData
          const contenidoClave = `${claveData.usuario};${claveData.clave};${claveData.url || ""}`

          // Crear archivo .clv con el nuevo contenido
          const blob = new Blob([contenidoClave], { type: "text/plain" })
          const fileName = `${formData.docnombre || "clave"}.clv`
          const file = new File([blob], fileName, { type: "text/plain" })

          // Crear FormData con TODOS los campos
          const formDataToSend = new FormData()
          formDataToSend.append("archivo", file)
          formDataToSend.append("documentouuid", documento.documentouuid)
          formDataToSend.append("docqgenero", entidadId)
          formDataToSend.append("docprocqgenero", tipoEntidad)
          formDataToSend.append("docnombre", formData.docnombre)
          formDataToSend.append("docfecemi", formData.docfecemi || "")
          formDataToSend.append("docfecven", formData.docfecven || "")
          formDataToSend.append("docindex1", formData.docindex1?.tipdoccodigo || "")
          formDataToSend.append("docindex2", formData.docindex2?.tipdoccodigo || "")
          formDataToSend.append("docindex3", formData.docindex3?.tipdoccodigo || "")
          formDataToSend.append("docindex4", formData.docindex4?.tipdoccodigo || "")
          formDataToSend.append("docindex5", formData.docindex5?.tipdoccodigo || "")
          formDataToSend.append("docindex6", formData.docindex6)

          await onEdit(formDataToSend)
        } else {
          // Para documentos NORMALES, seguir usando JSON (solo metadatos)
          const datosEditar = {
            documentouuid: documento.documentouuid,
            docnombre: formData.docnombre,
            docfecemi: formData.docfecemi || "",
            docfecven: formData.docfecven || "",
            docindex1: formData.docindex1?.tipdoccodigo || "",
            docindex2: formData.docindex2?.tipdoccodigo || "",
            docindex3: formData.docindex3?.tipdoccodigo || "",
            docindex4: formData.docindex4?.tipdoccodigo || "",
            docindex5: formData.docindex5?.tipdoccodigo || "",
            docindex6: formData.docindex6,
          }

          await onEdit(datosEditar) // Envía JSON
        }
      } else {
        // ============================================
        // CREAR NUEVO DOCUMENTO
        // ============================================
        const formDataToSend = new FormData()

        if (tipoEntrada === "clave") {
          // Para claves: crear un string con formato usuario;clave;url
          const contenidoClave = `${claveData.usuario};${claveData.clave};${claveData.url || ""}`
          const blob = new Blob([contenidoClave], { type: "text/plain" })
          const fileName = `${formData.docnombre || "clave"}.clv`
          const file = new File([blob], fileName, { type: "text/plain" })
          formDataToSend.append("archivo", file)
        } else {
          // Para documentos: el archivo seleccionado
          formDataToSend.append("archivo", file)
        }

        formDataToSend.append("docqgenero", entidadId)
        formDataToSend.append("docprocqgenero", tipoEntidad)
        formDataToSend.append("docnombre", formData.docnombre)
        formDataToSend.append("docfecemi", formData.docfecemi || "")
        formDataToSend.append("docfecven", formData.docfecven || "")
        formDataToSend.append("docindex1", formData.docindex1?.tipdoccodigo || "")
        formDataToSend.append("docindex2", formData.docindex2?.tipdoccodigo || "")
        formDataToSend.append("docindex3", formData.docindex3?.tipdoccodigo || "")
        formDataToSend.append("docindex4", formData.docindex4?.tipdoccodigo || "")
        formDataToSend.append("docindex5", formData.docindex5?.tipdoccodigo || "")
        formDataToSend.append("docindex6", formData.docindex6)

        await onCreate(formDataToSend)
      }
    } catch (error) {
      setError(error.details?.error?.message || "Error al guardar")
    }
  }

  // Cerrar y limpiar
  const handleClose = () => {
    setFile(null)
    setTipoEntrada("documento")
    setFormData({
      docnombre: "",
      docfecemi: "",
      docfecven: "",
      docindex1: null,
      docindex2: null,
      docindex3: null,
      docindex4: null,
      docindex5: null,
      docindex6: "",
    })
    setClaveData({ usuario: "", clave: "", url: "" })
    setError("")
    onClose()
  }

  const titulo = documento ? "Editar" : "Agregar"
  const isLoading = isCreating || isEditing || cargandoClave

  return (
    <Dialog open={open} onClose={isLoading ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{titulo}</Typography>
          <IconButton onClick={handleClose} disabled={isLoading} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {errorTipos && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Error al cargar tipos de documentos
          </Alert>
        )}

        {cargandoClave && (
          <Box display="flex" justifyContent="center" alignItems="center" py={2}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography>Cargando datos de la clave...</Typography>
          </Box>
        )}

        <Grid container spacing={2}>
          {/* Selector de tipo de entrada - SOLO para nuevo documento */}
          {!documento && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  ¿Qué desea agregar?
                </Typography>
                <ToggleButtonGroup
                  value={tipoEntrada}
                  exclusive
                  onChange={handleChangeTipoEntrada}
                  aria-label="tipo de entrada"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  <ToggleButton value="documento" aria-label="documento">
                    <Box display="flex" alignItems="center" gap={1} sx={{ py: 1 }}>
                      <Description />
                      <Typography>Subir Documento</Typography>
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="clave" aria-label="clave">
                    <Box display="flex" alignItems="center" gap={1} sx={{ py: 1 }}>
                      <VpnKey />
                      <Typography>Ingresar Clave</Typography>
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Paper>
            </Grid>
          )}

          {/* Información del archivo en edición */}
          {documento && (
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2} sx={{ p: 1.5, bgcolor: "grey.50", borderRadius: 1 }}>
                <Avatar sx={{ bgcolor: "grey.100", width: 48, height: 48 }}>
                  {documento.docextension === "clv" ? <VpnKey /> : getFileIcon(`.${documento.docextension}`)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">
                    {documento.docextension === "clv" ? "Editando clave" : "Editando documento"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {documento.docnombre || `Documento ${documento.docsecuen}`}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Área de subida - SOLO para tipo DOCUMENTO y NO edición */}
          {tipoEntrada === "documento" && !documento && (
            <Grid item xs={12}>
              <Box
                {...getRootProps()}
                sx={{
                  border: "2px dashed",
                  borderColor: isDragActive ? "primary.main" : "grey.300",
                  borderRadius: 1,
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: isDragActive ? "action.hover" : "grey.50",
                  transition: "all 0.3s",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "action.hover",
                  },
                }}
              >
                <input {...getInputProps()} />

                {file ? (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: "grey.100", width: 56, height: 56 }}>{getFileIcon(file.name)}</Avatar>
                    <Box textAlign="left">
                      <Typography variant="subtitle1">{file.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <CloudUpload sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                    <Typography variant="body1" gutterBottom>
                      {isDragActive ? "Suelte el archivo" : "Arrastre el archivo o haga clic"}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      PDF, JPG, PNG, DOC, XLS, XML, PFX, PF12 (Máx. 20MB)
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>
          )}

          {/* CAMPOS PARA CLAVES - SOLO para tipo CLAVE (en creación) */}
          {tipoEntrada === "clave" && !documento && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "grey.300",
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <VpnKey color="primary" />
                  <Typography variant="subtitle2">Datos de la Clave</Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Usuario *"
                      value={claveData.usuario}
                      onChange={handleClaveChange("usuario")}
                      disabled={isLoading}
                      placeholder="ej: usuario@email.com"
                      required
                      autoComplete="off"
                      inputProps={{
                        autoComplete: "off",
                        "data-lpignore": "true",
                        "data-form-type": "other",
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <CustomTextFieldClave
                      value={claveData.clave}
                      onChange={handleClaveChange("clave")}
                      disabled={isLoading}
                      required={true}
                      label="Clave *"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="URL (opcional)"
                      value={claveData.url}
                      onChange={handleClaveChange("url")}
                      disabled={isLoading}
                      placeholder="https://..."
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}

          {/* CAMPOS PARA CLAVES EN EDICIÓN - mostrar siempre cuando es edición de clave */}
          {tipoEntrada === "clave" && documento && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "grey.300",
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <VpnKey color="primary" />
                  <Typography variant="subtitle2">Datos de la Clave</Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Usuario *"
                      value={claveData.usuario}
                      onChange={handleClaveChange("usuario")}
                      disabled={isLoading || cargandoClave}
                      placeholder="ej: usuario@email.com"
                      required
                      autoComplete="off"
                      inputProps={{
                        autoComplete: "off",
                        "data-lpignore": "true",
                        "data-form-type": "other",
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <CustomTextFieldClave
                      value={claveData.clave}
                      onChange={handleClaveChange("clave")}
                      disabled={isLoading || cargandoClave}
                      required={true}
                      label="Clave *"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="URL (opcional)"
                      value={claveData.url}
                      onChange={handleClaveChange("url")}
                      disabled={isLoading || cargandoClave}
                      placeholder="https://..."
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}

          {/* Campos comunes para TODOS los casos */}

          {/* Nombre del documento */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Nombre del documento *"
              value={formData.docnombre || ""}
              onChange={handleTextFieldChange("docnombre")}
              disabled={isLoading}
              required
            />
          </Grid>

          {/* Etiqueta 6 (Texto libre obligatorio) */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Etiqueta 6 (Texto libre obligatorio)"
              value={formData.docindex6 || ""}
              onChange={handleTextFieldChange("docindex6")}
              disabled={isLoading}
              placeholder="Ingrese texto descriptivo obligatorio"
              required
              error={!formData.docindex6}
              helperText={!formData.docindex6 ? "Este campo es obligatorio" : ""}
            />
          </Grid>

          {/* Fechas */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Fecha de emisión"
              type="date"
              value={formData.docfecemi || ""}
              onChange={handleTextFieldChange("docfecemi")}
              disabled={isLoading}
              InputLabelProps={{ shrink: true }}
              helperText="Opcional"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Fecha de vencimiento"
              type="date"
              value={formData.docfecven || ""}
              onChange={handleTextFieldChange("docfecven")}
              disabled={isLoading}
              InputLabelProps={{ shrink: true }}
              helperText="Opcional"
            />
          </Grid>

          {/* Etiquetas 1-5 */}
          <Grid item xs={12}>
            <CustomAutocomplete
              label="Área/Depto"
              disabled={isLoading || isLoadingTipos}
              selectedOption={formData.docindex1}
              setSelectedOption={handleAutocompleteChange("docindex1")}
              options={tiposDocumentos}
              isOptionEqualToValue={(option, value) => option.tipdoccodigo === value?.tipdoccodigo}
              getOptionLabel={(option) => option.tipdocdescri || ""}
            />
          </Grid>

          <Grid item xs={12}>
            <CustomAutocomplete
              label="Categoría"
              disabled={isLoading || isLoadingTipos}
              selectedOption={formData.docindex2}
              setSelectedOption={handleAutocompleteChange("docindex2")}
              options={tiposDocumentos}
              isOptionEqualToValue={(option, value) => option.tipdoccodigo === value?.tipdoccodigo}
              getOptionLabel={(option) => option.tipdocdescri || ""}
            />
          </Grid>

          <Grid item xs={12}>
            <CustomAutocomplete
              label="Tipo Documento"
              disabled={isLoading || isLoadingTipos}
              selectedOption={formData.docindex3}
              setSelectedOption={handleAutocompleteChange("docindex3")}
              options={tiposDocumentos}
              isOptionEqualToValue={(option, value) => option.tipdoccodigo === value?.tipdoccodigo}
              getOptionLabel={(option) => option.tipdocdescri || ""}
            />
          </Grid>

          <Grid item xs={12}>
            <CustomAutocomplete
              label="Sub-Tipo / Detalle"
              disabled={isLoading || isLoadingTipos}
              selectedOption={formData.docindex4}
              setSelectedOption={handleAutocompleteChange("docindex4")}
              options={tiposDocumentos}
              isOptionEqualToValue={(option, value) => option.tipdoccodigo === value?.tipdoccodigo}
              getOptionLabel={(option) => option.tipdocdescri || ""}
            />
          </Grid>

          <Grid item xs={12}>
            <CustomAutocomplete
              label="Específico / Cronología"
              disabled={isLoading || isLoadingTipos}
              selectedOption={formData.docindex5}
              setSelectedOption={handleAutocompleteChange("docindex5")}
              options={tiposDocumentos}
              isOptionEqualToValue={(option, value) => option.tipdoccodigo === value?.tipdoccodigo}
              getOptionLabel={(option) => option.tipdocdescri || ""}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            isLoading ||
            (tipoEntrada === "documento" && !documento && !file) ||
            !formData.docindex6 ||
            (tipoEntrada === "clave" && (!claveData.usuario || !claveData.clave))
          }
          startIcon={isLoading ? <CircularProgress size={16} /> : <Save />}
        >
          {isLoading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ModalDocumento
