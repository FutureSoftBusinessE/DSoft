import React, { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  InputAdornment,
} from "@mui/material"
import {
  Visibility,
  VisibilityOff,
  Download,
  Delete,
  Edit,
  PictureAsPdf,
  Image,
  Description,
  Lock,
  InsertDriveFile,
  CalendarToday,
  EventBusy,
  VpnKey,
  ContentCopy,
  Save,
  Close,
} from "@mui/icons-material"
import fetchwrapper from "../../services/interceptors/fetchwrapper"
import CustomAutocomplete from "../CustomAutocomplete"
import CustomTextFieldClave from "./CustomTextFieldClave"

const DocumentoItem = ({
  documento,
  onEliminar,
  onEditar,
  onDownload,
  readOnly = false,
  isDeleting = false,
  tiposDocumentos = [], // Recibir tipos para los autocomplete
}) => {
  const [openVerClave, setOpenVerClave] = useState(false)
  const [openEditarClave, setOpenEditarClave] = useState(false)
  const [claveData, setClaveData] = useState({ usuario: "", clave: "", url: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [showClave, setShowClave] = useState(false)

  // Estado para edición (IGUAL que en ModalDocumento)
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

  // Estado para claves en edición
  const [editClaveData, setEditClaveData] = useState({
    usuario: "",
    clave: "",
    url: "",
  })

  // Detectar si es una clave por la extensión
  const esClave = documento.docextension?.toLowerCase() === "clv"

  // Función para obtener icono según extensión
  const getFileIcon = (extension, tipo) => {
    const ext = extension?.toLowerCase()

    if (esClave) {
      return <VpnKey sx={{ color: "#ff9800" }} />
    }

    if (ext === "pfx" || ext === "pf12" || ext === "p12" || tipo === "PFX" || tipo === "PF12") {
      return <Lock sx={{ color: "#ff9800" }} />
    }
    if (ext === "pdf") return <PictureAsPdf sx={{ color: "#f40f02" }} />
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return <Image sx={{ color: "#4caf50" }} />
    if (["xml"].includes(ext)) return <Description sx={{ color: "#2196f3" }} />
    if (["xls", "xlsx"].includes(ext)) return <Description sx={{ color: "#217346" }} />
    if (["doc", "docx"].includes(ext)) return <Description sx={{ color: "#2b579a" }} />
    return <InsertDriveFile sx={{ color: "#757575" }} />
  }

  // Función para eliminar documento
  const handleEliminar = async () => {
    if (window.confirm(`¿Eliminar ${esClave ? "clave" : "documento"} "${documento.docnombre || "documento"}"?`)) {
      onEliminar()
    }
  }

  // Verificar si está vencido
  const estaVencido = () => {
    if (!documento.docfecven) return false
    try {
      const hoy = new Date()
      const fechaVencimiento = new Date(documento.docfecven)
      if (isNaN(fechaVencimiento.getTime())) return false
      return fechaVencimiento < hoy
    } catch (e) {
      return false
    }
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "No definida"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Fecha inválida"
      return date.toLocaleDateString("es-ES")
    } catch (e) {
      return "Fecha inválida"
    }
  }

  // Función para encontrar objeto tipo documento
  const findTipoDocObj = (codigo) => {
    if (!codigo) return null
    return tiposDocumentos.find((t) => t.tipdoccodigo === codigo) || null
  }

  // Formatear fecha para input type="date"
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

  // Cargar contenido de la clave y preparar edición
  const cargarContenidoClave = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetchwrapper("/DocumentosAsociadosComponent/getDocumentoContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentouuid: documento.documentouuid }),
      })
      const data = await response.json()

      if (data.success) {
        setClaveData({
          usuario: data.data.usuario || "",
          clave: data.data.clave || "",
          url: data.data.url || "",
        })

        // Preparar formData para edición (IGUAL que en ModalDocumento)
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

        // Preparar datos de clave para edición
        setEditClaveData({
          usuario: data.data.usuario || "",
          clave: data.data.clave || "",
          url: data.data.url || "",
        })
      } else {
        setError(data.error?.message || "Error al cargar contenido")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal de visualización
  const handleVerClave = async () => {
    await cargarContenidoClave()
    setOpenVerClave(true)
  }

  // Abrir modal de edición de clave (CON TODOS LOS CAMPOS)
  const handleEditarClave = async () => {
    await cargarContenidoClave()
    setOpenEditarClave(true)
  }

  // Manejar cambios en autocomplete
  const handleAutocompleteChange = (field) => (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      [field]: selectedOption,
    }))
  }

  // Manejar cambios en textfields
  const handleTextFieldChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  // Manejar cambios en campos de clave
  const handleClaveChange = (field) => (event) => {
    setEditClaveData((prev) => ({
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

  // Guardar cambios (TODOS los campos)
  const handleGuardarClave = async () => {
    // Validaciones
    if (!formData.docindex6 || !formData.docindex6.trim()) {
      setError("Etiqueta 6 es requerida")
      return
    }

    const tieneEtiqueta =
      formData.docindex1 || formData.docindex2 || formData.docindex3 || formData.docindex4 || formData.docindex5
    if (!tieneEtiqueta) {
      setError("Debe seleccionar al menos una etiqueta")
      return
    }

    const errorFechas = validarFechas()
    if (errorFechas) {
      setError(errorFechas)
      return
    }

    if (!editClaveData.usuario.trim() || !editClaveData.clave.trim()) {
      setError("Usuario y clave son obligatorios")
      return
    }

    setSaving(true)
    setError("")

    try {
      // Construir el contenido en formato usuario;clave;url
      const contenidoTexto = `${editClaveData.usuario};${editClaveData.clave};${editClaveData.url || ""}`

      // Crear un archivo .clv con el nuevo contenido
      const blob = new Blob([contenidoTexto], { type: "text/plain" })
      const file = new File([blob], documento.docnombre || "clave.clv", { type: "text/plain" })

      // Crear FormData con TODOS los campos
      const formDataToSend = new FormData()
      formDataToSend.append("archivo", file)
      formDataToSend.append("docqgenero", documento.docqgenero)
      formDataToSend.append("docprocqgenero", documento.docprocqgenero)
      formDataToSend.append("docnombre", formData.docnombre)
      formDataToSend.append("docfecemi", formData.docfecemi || "")
      formDataToSend.append("docfecven", formData.docfecven || "")
      formDataToSend.append("docindex1", formData.docindex1?.tipdoccodigo || "")
      formDataToSend.append("docindex2", formData.docindex2?.tipdoccodigo || "")
      formDataToSend.append("docindex3", formData.docindex3?.tipdoccodigo || "")
      formDataToSend.append("docindex4", formData.docindex4?.tipdoccodigo || "")
      formDataToSend.append("docindex5", formData.docindex5?.tipdoccodigo || "")
      formDataToSend.append("docindex6", formData.docindex6)

      // Llamar al endpoint de edición
      const response = await fetchwrapper("/DocumentosAsociadosComponent/editSpecificDocumento", {
        method: "PUT",
        body: formDataToSend,
      })

      const data = await response.json()

      if (data.success) {
        setOpenEditarClave(false)
        onEditar(documento) // Recargar la lista
      } else {
        setError(data.error?.message || "Error al guardar")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  // Copiar al portapapeles
  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  // Obtener descripción para cada etiqueta
  const getEtiquetaDescripcion = (docindex, docindexDescri) => {
    if (docindexDescri) return docindexDescri
    if (docindex) return docindex
    return ""
  }

  // Filtrar etiquetas con valor
  const etiquetas = [
    { label: "Área/Depto", value: documento.docindex1, desc: documento.docindex1_descri },
    { label: "Categoría", value: documento.docindex2, desc: documento.docindex2_descri },
    { label: "Tipo Doc", value: documento.docindex3, desc: documento.docindex3_descri },
    { label: "Sub-Tipo", value: documento.docindex4, desc: documento.docindex4_descri },
    { label: "Específico", value: documento.docindex5, desc: documento.docindex5_descri },
    { label: "Texto Libre", value: documento.docindex6, desc: documento.docindex6 },
  ].filter((etiqueta) => etiqueta.value && etiqueta.value.trim())

  return (
    <>
      {/* Modal para ver detalles de la clave */}
      <Dialog open={openVerClave} onClose={() => setOpenVerClave(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <VpnKey color="primary" />
              <Typography>Detalles de la Clave</Typography>
            </Box>
            <IconButton onClick={() => setOpenVerClave(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del documento"
                  value={documento.docnombre || ""}
                  InputProps={{ readOnly: true }}
                  variant="filled"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Usuario"
                  value={claveData.usuario}
                  InputProps={{ readOnly: true }}
                  variant="filled"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <CustomTextFieldClave value={claveData.clave} readOnly={true} label="Clave" variant="filled" />
              </Grid>
              {claveData.url && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="URL"
                    value={claveData.url}
                    InputProps={{ readOnly: true }}
                    variant="filled"
                    size="small"
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVerClave(false)}>Cerrar</Button>
          <Button onClick={() => handleCopyToClipboard(claveData.usuario)} startIcon={<ContentCopy />}>
            Copiar usuario
          </Button>
          <Button onClick={() => handleCopyToClipboard(claveData.clave)} startIcon={<ContentCopy />}>
            Copiar clave
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tarjeta del documento (igual que antes) */}
      <Card variant="outlined" sx={{ mb: 1.5, "&:hover": { boxShadow: 1 } }}>
        <CardContent sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: "grey.100", width: 48, height: 48 }}>
              {getFileIcon(documento.docextension, documento.docindex3)}
            </Avatar>

            <Box sx={{ flexGrow: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  {documento.documento_origen_uuid && (
                    <Chip
                      label={`REFERENCIA a ${documento.documento_origen_uuid}`}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ fontSize: "0.6rem", marginBottom: "0.2rem" }}
                    />
                  )}
                  <Typography variant="subtitle2" fontWeight="medium">
                    {documento.docnombre || `Documento #${documento.docsecuen}`}
                  </Typography>

                  <Typography variant="caption" color="textSecondary" display="block">
                    {documento.docextension?.toUpperCase()} • Secuencia: #{documento.docsecuen}
                  </Typography>

                  {(documento.docfecemi || documento.docfecven) && (
                    <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                      {documento.docfecemi && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <CalendarToday sx={{ fontSize: 12, color: "text.secondary" }} />
                          <Typography variant="caption" color="textSecondary">
                            Emisión: {formatDate(documento.docfecemi)}
                          </Typography>
                        </Box>
                      )}

                      {documento.docfecven && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <EventBusy
                            sx={{
                              fontSize: 12,
                              color: estaVencido() ? "error.main" : "text.secondary",
                            }}
                          />
                          <Typography variant="caption" color={estaVencido() ? "error" : "textSecondary"}>
                            Vence: {formatDate(documento.docfecven)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>

                <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                  <Chip label={`#${documento.docsecuen}`} size="small" color="primary" variant="outlined" />
                  {estaVencido() && (
                    <Chip
                      label="VENCIDO"
                      size="small"
                      color="error"
                      variant="filled"
                      sx={{ fontSize: "0.6rem", height: 18 }}
                    />
                  )}
                </Box>
              </Box>

              {etiquetas.length > 0 && (
                <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {etiquetas.map((etiqueta, idx) => (
                    <Chip
                      key={idx}
                      label={`${etiqueta.label}: ${getEtiquetaDescripcion(etiqueta.value, etiqueta.desc)}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ pt: 0, justifyContent: "flex-end", gap: 0.5, px: 1.5, pb: 1 }}>
          {esClave ? (
            <>
              <Tooltip title="Ver detalles">
                <span>
                  <IconButton size="small" onClick={handleVerClave}>
                    <Visibility fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              {!readOnly && (
                <Tooltip title="Editar clave (todos los campos)">
                  <span>
                    <IconButton size="small" onClick={() => onEditar(documento)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              <Tooltip title="Copiar usuario">
                <span>
                  <IconButton size="small" onClick={() => handleCopyToClipboard(claveData.usuario)}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              {!readOnly && (
                <Tooltip title="Eliminar">
                  <span>
                    <IconButton size="small" onClick={handleEliminar} disabled={isDeleting} color="error">
                      {isDeleting ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <Tooltip title="Descargar">
                <span>
                  <IconButton size="small" onClick={onDownload}>
                    <Download fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              {!readOnly && (
                <>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => onEditar(documento)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Eliminar">
                    <span>
                      <IconButton size="small" onClick={handleEliminar} disabled={isDeleting} color="error">
                        {isDeleting ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
            </>
          )}
        </CardActions>
      </Card>
    </>
  )
}

export default DocumentoItem
