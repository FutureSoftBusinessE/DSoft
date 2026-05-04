/* eslint-disable camelcase */
import { useState, useRef, useMemo } from "react"
import {
  Box,
  Button,
  Modal,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Chip,
  LinearProgress,
} from "@mui/material"
import { CloudUpload, Close, Visibility, CheckCircle, Error, Download, Refresh } from "@mui/icons-material"
import Papa from "papaparse"
import { api } from "../api"
import CustomCheckReadableTable from "./CustomCheckReadableTable"

// Utilidades de validación
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateRow = (row, fieldConfigs = {}) => {
  const errors = []

  // Validar solo los campos que están en fieldConfigs
  Object.keys(fieldConfigs).forEach((field) => {
    const value = row[field]
    const config = fieldConfigs[field]

    // Validar campo requerido
    if (config.required && (!value || value.toString().trim() === "")) {
      errors.push(`Campo requerido faltante: ${field}`)
      return
    }

    // Si el campo está vacío y no es requerido, no validar más
    if (!value || value.toString().trim() === "") return

    // Validaciones específicas por tipo
    if (config.type === "email" && !isValidEmail(value)) {
      errors.push(`Email inválido en campo ${field}: ${value}`)
    }

    if (config.type === "number" && isNaN(Number(value))) {
      errors.push(`Valor numérico inválido en campo ${field}: ${value}`)
    }

    if (config.minLength && value.toString().length < config.minLength) {
      errors.push(`Campo ${field} debe tener al menos ${config.minLength} caracteres`)
    }

    if (config.maxLength && value.toString().length > config.maxLength) {
      errors.push(`Campo ${field} no puede exceder ${config.maxLength} caracteres`)
    }

    if (config.pattern && !config.pattern.test(value)) {
      errors.push(`Formato inválido en campo ${field}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Filtrar solo los campos que nos interesan
const filterRowData = (row, fieldConfigs = {}) => {
  const filteredRow = {}
  Object.keys(fieldConfigs).forEach((field) => {
    filteredRow[field] = row[field] || ""
  })
  return filteredRow
}

const ModalImportCSV = ({
  onImportComplete,
  open,
  onClose,
  fieldConfigs = {},
  maxFileSize = 5 * 1024 * 1024,
  previewRows = 10,
  templateFileName = "template.csv",
  validateEndpoint = null,
  insertEndpoint = null,
}) => {
  const [activeStep, setActiveStep] = useState(0)
  const [file, setFile] = useState(null)
  const [previewData, setPreviewData] = useState([])
  const [headers, setHeaders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [currentProcessing, setCurrentProcessing] = useState(0)
  const [importTotal, setImportTotal] = useState(0)
  const [validatedRows, setValidatedRows] = useState([])
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [selectedRowObjects, setSelectedRowObjects] = useState([])
  const [rowFilter, setRowFilter] = useState("all")
  const [retryWarning, setRetryWarning] = useState("")
  const fileInputRef = useRef(null)

  // Se memoriza la referencia del array para que la tabla no se reinicie (selección ni paginación)
  // cada vez que el componente padre se re-renderiza. Solo cambia cuando cambian los datos o el filtro.
  const filteredTableData = useMemo(() => {
    if (rowFilter === "valid") return validatedRows.filter((r) => r.ok !== false)
    if (rowFilter === "errors") return validatedRows.filter((r) => r.ok === false)
    return validatedRows
  }, [validatedRows, rowFilter])

  const validationTableColumns = useMemo(
    () => [
      ...headers.map((key) => ({
        accessorKey: key,
        header: key,
        id: key,
      })),
      {
        accessorKey: "ok",
        header: "Estado",
        id: "ok",
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue() === false ? "Error" : "Válido"}
            color={cell.getValue() === false ? "error" : "success"}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        accessorKey: "feedback",
        header: "Feedback",
        id: "feedback",
      },
    ],
    [headers],
  )

  const steps = ["Seleccionar archivo", "Previsualizar", "Confirmar"]

  // Obtener lista de campos aceptados desde la configuración
  const acceptedFields = Object.keys(fieldConfigs)
  const requiredFields = Object.keys(fieldConfigs).filter((field) => fieldConfigs[field].required)
  const keyColumns = Object.keys(fieldConfigs).filter((field) => fieldConfigs[field].key)

  // Descargar template
  const downloadTemplate = () => {
    if (acceptedFields.length === 0) return

    const templateData = [acceptedFields]
    const csv = Papa.unparse(templateData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", templateFileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Manejar la selección de archivo
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Por favor, selecciona un archivo CSV válido")
      return
    }

    if (selectedFile.size > maxFileSize) {
      setError(`El archivo es demasiado grande. Tamaño máximo: ${Math.round(maxFileSize / (1024 * 1024))}MB`)
      return
    }

    setFile(selectedFile)
    setError("")
    setValidationErrors([])
    parseCSVFile(selectedFile)
  }

  // Parsear el archivo CSV
  const parseCSVFile = (file) => {
    setLoading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          setError("Error al leer el archivo CSV: " + results.errors[0].message)
          setLoading(false)
          return
        }

        if (results.data.length === 0) {
          setError("El archivo CSV está vacío")
          setLoading(false)
          return
        }

        const fileHeaders = Object.keys(results.data[0])
        const headersToUse =
          acceptedFields.length > 0 ? fileHeaders.filter((header) => acceptedFields.includes(header)) : fileHeaders

        const processedData = results.data.map((row) => filterRowData(row, fieldConfigs))

        setHeaders(headersToUse)
        setTotalRecords(results.data.length)

        const preview = processedData

        if (validateEndpoint) {
          try {
            const payload = {
              columns: acceptedFields,
              required: requiredFields,
              key_columns: keyColumns,
              rows: processedData,
            }
            const response = await api.post(validateEndpoint, payload)
            const apiRows = response.data.data.rows || []

            // Usar directamente las filas que devuelve el back (ya tienen todos los campos + feedback)
            setValidatedRows(apiRows)
            setPreviewData(apiRows)

            // Derivar headers de la response, excluyendo feedback y ok
            if (apiRows.length > 0) {
              const responseKeys = Object.keys(apiRows[0]).filter((k) => k !== "feedback" && k !== "ok")
              setHeaders(responseKeys)
            }

            // Seleccionar las filas sin feedback
            const autoSelected = new Set()
            apiRows.forEach((row, i) => {
              if (row.ok !== false) autoSelected.add(i)
            })
            setSelectedRows(autoSelected)
            setValidationErrors([])
          } catch (err) {
            setError("Error al validar datos: " + (err.message || "Error desconocido"))
            setLoading(false)
            return
          }
        } else {
          const errors = []
          preview.forEach((row, index) => {
            const validation = validateRow(row, fieldConfigs)
            if (!validation.isValid) {
              errors.push({
                row: index + 1,
                errors: validation.errors,
              })
            }
          })
          setValidationErrors(errors)
          setPreviewData(preview)
        }

        setActiveStep(1)
        setLoading(false)
      },
      error: (error) => {
        setError("Error al procesar el archivo: " + error.message)
        setLoading(false)
      },
    })
  }

  // Manejar arrastrar y soltar
  const handleDrop = (event) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      parseCSVFile(droppedFile)
    }
  }

  // Manejar drag over
  const handleDragOver = (event) => {
    event.preventDefault()
  }

  // Continuar al siguiente paso
  const handleNext = () => {
    if (activeStep === 1) {
      setShowConfirmDialog(true)
    } else {
      setActiveStep((prev) => prev + 1)
    }
  }

  // Volver al paso anterior
  const handleBack = () => {
    if (activeStep === 0) {
      handleReset()
      onClose()
    } else {
      setActiveStep((prev) => prev - 1)
    }
  }

  // Función principal para procesar la importación
  const processImport = async (validRecords) => {
    const total = validRecords.length
    setLoading(true)
    setImportProgress(0)
    setCurrentProcessing(0)
    setImportTotal(total)

    const startTime = Date.now()
    let rafId = null
    // Animación hiperbólica: la barra sube rápido al principio y se frena acercándose al 99%,
    // así nunca llega al 100% hasta que el servidor responda de verdad.
    // T controla la velocidad: a los 6 segundos lleva ~50%, a los 54 segundos ~90%.
    const T = 6000
    const animate = () => {
      const elapsed = Date.now() - startTime
      const ratio = elapsed / (elapsed + T)
      setImportProgress(ratio * 99)
      setCurrentProcessing(Math.min(Math.round(ratio * total), total - 1))
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    // Llamada real al servidor de inserción. Mismo formato de payload que el endpoint de validación.
    // Si el servidor responde con 4xx, Axios lanza un error pero el cuerpo puede traer datos útiles
    // (filas con ok/feedback), por eso se captura el error y se intenta leer igualmente.
    const payload = {
      columns: acceptedFields,
      required: requiredFields,
      key_columns: keyColumns,
      rows: validRecords,
    }
    let responseData
    try {
      const response = await api.post(insertEndpoint, payload)
      responseData = response.data
    } catch (err) {
      // El interceptor de api convierte los errores de Axios en instancias de APIError.
      // El cuerpo de la respuesta original queda en err.details (no en err.response).
      // Si hay datos ahí, los usamos igual; si no, relanzamos el error para que lo capture el catch superior.
      const body = err.details ?? err.response?.data
      if (body) {
        responseData = body
      } else {
        throw err
      }
    }

    // Se detiene la animación y se lleva la barra al 100% ahora que el servidor ya respondió.
    if (rafId !== null) cancelAnimationFrame(rafId)
    setImportProgress(100)
    setCurrentProcessing(total)

    const inner = responseData?.data ?? responseData ?? {}

    let results, successful, failed
    if (inner.inserted > 0) {
      // Inserción exitosa: el back solo devuelve { inserted: N }, sin detalle de filas.
      // Se construye el array de resultados marcando todo como ok para mostrar en pantalla.
      successful = inner.inserted
      failed = 0
      results = validRecords.map((r) => ({ ...r, ok: true, feedback: "" }))
    } else if (Array.isArray(inner.rows)) {
      // El back encontró errores en la re-validación y no insertó nada.
      // Devuelve las filas con ok/feedback actualizados para mostrar qué falló.
      // Se retorna retryRows para que el llamador sepa que debe mostrar la pantalla de reintento.
      results = inner.rows
      successful = inner.summary?.valid_rows ?? results.filter((r) => r.ok !== false).length
      failed = inner.summary?.invalid_rows ?? results.filter((r) => r.ok === false).length
      return { results, successful, failed, retryRows: inner.rows }
    } else {
      // Respuesta inesperada del servidor, se trata como fallo total.
      results = []
      successful = 0
      failed = validRecords.length
    }

    return { results, successful, failed }
  }

  // Confirmar importación
  const handleConfirmImport = async () => {
    setLoading(true)
    setShowConfirmDialog(false)

    try {
      // Cuando la validación ya fue hecha en el servidor, importar solo las filas seleccionadas directamente
      if (validateEndpoint) {
        // Se mandan todas las filas seleccionadas por el usuario, incluyendo las que tienen errores.
        // El backend re-valida todo y decide si insertar o rechazar. No filtramos aquí en el front.
        // Se quitan ok y feedback antes de enviar porque son campos internos del flujo de validación.
        const validRecords = selectedRowObjects.map(({ ok, feedback, ...rest }) => rest)

        if (validRecords.length === 0) {
          setError("No hay registros seleccionados para importar")
          setLoading(false)
          return
        }

        const apiImportResults = await processImport(validRecords)

        // Backend rechazó la inserción por errores de validación — ir a pantalla de error con opción de reintentar
        if (apiImportResults.retryRows) {
          // El servidor rechazó la inserción por errores de validación.
          // Se actualizan las filas enviadas con la respuesta del servidor (ok/feedback nuevo)
          // y se mezclan de vuelta con el set completo de filas para mostrar todo en el reintento.
          //
          // Se usa igualdad por referencia (r === selRow) en vez de comparar por clave,
          // para evitar colisiones cuando dos filas tienen la misma clave con distinto casing
          // (por ejemplo "tp0001" y "TP0001" normalizados ambos a "tp0001" colisionarían).
          // retryRows[i] corresponde posicionalmente a selectedRowObjects[i] porque el back
          // devuelve las filas en el mismo orden en que se enviaron.
          const mergedRows = [...validatedRows]
          selectedRowObjects.forEach((selRow, selIdx) => {
            const retryRow = apiImportResults.retryRows[selIdx]
            if (!retryRow) return
            const pos = mergedRows.findIndex((r) => r === selRow)
            if (pos !== -1) mergedRows[pos] = retryRow
          })

          setImportResults({
            total: selectedRowObjects.length,
            successful: apiImportResults.successful,
            failed: apiImportResults.failed,
            canRetry: true,
            retryData: mergedRows,
            detailedErrors: apiImportResults.retryRows
              .filter((r) => r.ok === false)
              .map((r) => ({
                label: keyColumns.map((k) => r[k]).join(" / "),
                errors: [r.feedback || "Error desconocido"],
                type: "api",
              })),
          })
          setActiveStep(2)
          setLoading(false)
          return
        }

        setImportResults({
          total: selectedRowObjects.length,
          successful: apiImportResults.successful,
          failed: apiImportResults.failed,
          validationFailed: 0,
          apiFailed: apiImportResults.failed,
          data: apiImportResults.results.filter((r) => r.ok !== false),
          detailedErrors: apiImportResults.results
            .filter((r) => r.ok === false)
            .map((r, idx) => ({
              row: idx + 1,
              errors: [r.feedback || "Error desconocido"],
              type: "api",
            })),
          apiResults: apiImportResults.results,
        })

        if (onImportComplete) {
          onImportComplete(apiImportResults.results.filter((r) => r.ok !== false))
        }

        setActiveStep(2)
        setLoading(false)
        return
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          // Filtrar solo los campos que nos interesan
          const filteredData = results.data.map((row) => filterRowData(row, fieldConfigs))

          // Validar todos los registros
          const validationResults = filteredData.map((row, index) => ({
            row: index + 1,
            data: row,
            ...validateRow(row, fieldConfigs),
          }))

          const validRecords = validationResults.filter((result) => result.isValid).map((result) => result.data)

          const invalidRecords = validationResults.filter((result) => !result.isValid)

          if (validRecords.length === 0) {
            setError("No hay registros válidos para importar")
            setLoading(false)
            return
          }

          // Procesar importación
          const apiImportResults = await processImport(validRecords)

          setImportResults({
            total: results.data.length,
            successful: apiImportResults.successful,
            failed: apiImportResults.failed + invalidRecords.length,
            validationFailed: invalidRecords.length,
            apiFailed: apiImportResults.failed,
            data: apiImportResults.results.filter((r) => r.ok !== false),
            detailedErrors: [
              ...invalidRecords.map((error) => ({
                row: error.row,
                errors: error.errors,
                type: "validation",
              })),
              ...apiImportResults.results
                .filter((r) => r.ok === false)
                .map((r, index) => ({
                  row: index + 1,
                  errors: [r.feedback || "Error desconocido"],
                  type: "api",
                })),
            ],
            apiResults: apiImportResults.results,
          })

          // Llamar al callback con los datos exitosos de la API
          if (onImportComplete) {
            onImportComplete(apiImportResults.results.filter((r) => r.ok !== false))
          }

          setActiveStep(2)
          setLoading(false)
        },
        error: (error) => {
          setError("Error durante la importación: " + error.message)
          setLoading(false)
        },
      })
    } catch (error) {
      setError("Error durante el procesamiento: " + error.message)
      setLoading(false)
    }
  }

  // Volver al paso de previsualización con los datos actualizados del reintento
  const handleRetry = () => {
    setValidatedRows(importResults.retryData)
    setImportResults(null)
    setRetryWarning("")
    setActiveStep(1)
  }

  // Reiniciar el proceso
  const handleReset = () => {
    setFile(null)
    setPreviewData([])
    setHeaders([])
    setActiveStep(0)
    setError("")
    setImportResults(null)
    setValidationErrors([])
    setTotalRecords(0)
    setShowConfirmDialog(false)
    setImportProgress(0)
    setCurrentProcessing(0)
    setImportTotal(0)
    setValidatedRows([])
    setSelectedRows(new Set())
    setSelectedRowObjects([])
    setRowFilter("all")
    setRetryWarning("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Cerrar modal
  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <>
      {/* Modal principal */}
      <Modal
        open={open}
        onClose={loading ? undefined : handleClose}
        aria-labelledby="csv-import-modal"
        aria-describedby="csv-import-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: 800,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 4,
            overflow: "auto",
          }}
        >
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              Importar Datos desde CSV
            </Typography>
            <IconButton onClick={handleClose} size="small" disabled={loading}>
              <Close />
            </IconButton>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontSize: { xs: "0.65rem", sm: "0.875rem" },
                      mt: { xs: "2px !important", sm: "8px !important" },
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Contenido según el paso */}
          <Box sx={{ mt: 2 }}>
            {/* Paso 1: Seleccionar archivo */}
            {activeStep === 0 && (
              <Box>
                {acceptedFields.length > 0 && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Estructura esperada del CSV:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Campos que se importarán:</strong> {acceptedFields.join(", ")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Los campos adicionales en el archivo serán ignorados
                    </Typography>
                    {requiredFields.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Campos obligatorios:</strong> {requiredFields.join(", ")}
                      </Typography>
                    )}
                    <Button startIcon={<Download />} onClick={downloadTemplate} size="small" sx={{ mt: 1 }}>
                      Descargar Template
                    </Button>
                  </Box>
                )}

                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    textAlign: "center",
                    border: "2px dashed",
                    borderColor: "grey.300",
                    backgroundColor: "grey.50",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: "primary.main",
                      backgroundColor: "action.hover",
                    },
                  }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById("csv-file-input").click()}
                >
                  <input
                    id="csv-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />

                  <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Selecciona o arrastra tu archivo CSV
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Haz clic aquí o arrastra un archivo CSV para comenzar la importación
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    Formatos soportados: .csv | Tamaño máximo: {Math.round(maxFileSize / (1024 * 1024))}MB
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* Paso 2: Previsualización */}
            {activeStep === 1 && (
              <Box sx={{ pointerEvents: loading ? "none" : "auto", userSelect: loading ? "none" : "auto" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Visibility color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Previsualización de datos</Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Archivo: <strong>{file?.name}</strong> | Registros totales: <strong>{totalRecords}</strong> |
                  Mostrando: <strong>{previewData.length} registros</strong>
                </Typography>

                {acceptedFields.length > 0 && (
                  <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Nota:</strong> Solo se muestran los campos configurados. Los campos adicionales del
                      archivo serán ignorados.
                    </Typography>
                  </Alert>
                )}

                {/* Errores de validación en preview (solo modo sin API) */}
                {!validateEndpoint && validationErrors.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Se encontraron errores en la previsualización:
                    </Typography>
                    {validationErrors.slice(0, 5).map((errorGroup, index) => (
                      <Typography key={index} variant="body2" component="div">
                        <strong>Fila {errorGroup.row}:</strong> {errorGroup.errors[0]}
                        {errorGroup.errors.length > 1 && ` (+${errorGroup.errors.length - 1} más)`}
                      </Typography>
                    ))}
                    {validationErrors.length > 5 && (
                      <Typography variant="body2">Y {validationErrors.length - 5} errores más...</Typography>
                    )}
                  </Alert>
                )}

                {previewData.length > 0 && (
                  <>
                    {validateEndpoint && (
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mt: 1,
                          mb: 1,
                          flexWrap: "wrap",
                          alignItems: "center",
                          pointerEvents: loading ? "none" : "auto",
                          opacity: loading ? 0.5 : 1,
                          transition: "opacity 0.2s",
                        }}
                      >
                        <Chip
                          icon={<CheckCircle />}
                          label={`${validatedRows.filter((r) => r.ok !== false).length} válidos`}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<Error />}
                          label={`${validatedRows.filter((r) => r.ok === false).length} con errores`}
                          color={validatedRows.filter((r) => r.ok === false).length > 0 ? "error" : "default"}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${selectedRows.size} seleccionados para importar`}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                        <Box sx={{ ml: "auto", display: "flex", gap: 0.5 }}>
                          {["all", "valid", "errors"].map((f) => (
                            <Chip
                              key={f}
                              label={f === "all" ? "Todos" : f === "valid" ? "Válidos" : "Con errores"}
                              size="small"
                              color={rowFilter === f ? "primary" : "default"}
                              variant={rowFilter === f ? "filled" : "outlined"}
                              onClick={() => !loading && setRowFilter(f)}
                              sx={{ cursor: loading ? "not-allowed" : "pointer" }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Tabla de previsualización con resultado de validación */}
                    <CustomCheckReadableTable
                      data={filteredTableData}
                      columnsTable={validationTableColumns}
                      isLoading={loading}
                      isError={false}
                      refetch={() => {}}
                      perPage={10}
                      isRowError={(row) => row.ok === false}
                      onSelectionChange={(rows) => {
                        setSelectedRows(new Set(rows.map((_, i) => i)))
                        setSelectedRowObjects(rows)
                      }}
                    />
                  </>
                )}
              </Box>
            )}

            {/* Paso 3: Resultados */}
            {activeStep === 2 && importResults && (
              <Box sx={{ textAlign: "center" }}>
                {importResults.canRetry ? (
                  <Error sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
                ) : importResults.successful > 0 ? (
                  <CheckCircle sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
                ) : (
                  <Error sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
                )}

                <Typography variant="h6" gutterBottom>
                  {importResults.canRetry
                    ? "No se realizó ninguna inserción"
                    : importResults.successful > 0
                      ? "Importación Completada"
                      : "Importación Fallida"}
                </Typography>

                {!importResults.canRetry && (
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 2, my: 3, flexWrap: "wrap" }}>
                    <Chip
                      icon={<CheckCircle />}
                      label={`${importResults.successful} exitosos`}
                      color={importResults.successful > 0 ? "success" : "default"}
                      variant="outlined"
                    />
                    <Chip
                      icon={<Error />}
                      label={`${importResults.failed} fallidos`}
                      color={importResults.failed > 0 ? "error" : "default"}
                      variant="outlined"
                    />
                    <Chip label={`${importResults.total} total`} variant="outlined" />
                  </Box>
                )}

                {importResults.detailedErrors && importResults.detailedErrors.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2, textAlign: "left" }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Detalle de errores:
                    </Typography>
                    {importResults.detailedErrors.slice(0, 10).map((error, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2" component="div">
                          <strong>{error.label ?? `Fila ${error.row}`}:</strong> {error.errors[0]}
                          <Chip
                            label={error.type === "api" ? "Error API" : "Validación"}
                            size="small"
                            color={error.type === "api" ? "secondary" : "default"}
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                      </Box>
                    ))}
                    {importResults.detailedErrors.length > 10 && (
                      <Typography variant="body2">
                        Y {importResults.detailedErrors.length - 10} errores más...
                      </Typography>
                    )}
                  </Alert>
                )}

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {importResults.canRetry
                    ? "El servidor encontró errores en la validación y no insertó ningún registro. Revisa el detalle, corrige los errores y vuelve a intentar."
                    : importResults.successful > 0
                      ? "Los datos válidos han sido importados correctamente al sistema."
                      : "No se pudieron importar registros debido a errores de validación o de servidor."}
                </Typography>
              </Box>
            )}

            {/* Progreso de importación */}
            {loading && activeStep === 1 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" gutterBottom>
                  Procesando importación... ({currentProcessing}/{importTotal})
                </Typography>
                <LinearProgress variant="determinate" value={importProgress} sx={{ height: 10, borderRadius: 5 }} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  {importProgress < 100 ? "Importando registros..." : "Finalizando..."}
                </Typography>
              </Box>
            )}

            {/* Mensajes de error */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {/* Loading inicial */}
            {loading && activeStep === 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", my: 3 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Leyendo archivo...
                </Typography>
              </Box>
            )}
          </Box>

          {/* Botones de navegación */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button onClick={handleBack} disabled={loading}>
              {activeStep === 0 ? "Cancelar" : "Atrás"}
            </Button>

            {activeStep === 2 ? (
              importResults?.canRetry ? (
                <Button variant="contained" color="warning" onClick={handleRetry} startIcon={<Refresh />}>
                  Reintentar
                </Button>
              ) : (
                <Button variant="contained" onClick={handleClose} startIcon={<CheckCircle />}>
                  Finalizar
                </Button>
              )
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  !file || loading || !!error || (validateEndpoint && activeStep === 1 && selectedRows.size === 0)
                }
                endIcon={activeStep === 1 && <CheckCircle />}
              >
                {activeStep === 0 ? "Siguiente" : "Confirmar Importación"}
              </Button>
            )}
          </Box>
        </Box>
      </Modal>

      {/* Dialog de confirmación */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirmar Importación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas importar <strong>{validateEndpoint ? selectedRows.size : totalRecords}</strong>{" "}
            registros del archivo <strong>{file?.name}</strong>?
            {validateEndpoint && selectedRows.size < totalRecords && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                <strong>Nota:</strong> {totalRecords - selectedRows.size} registro(s) no seleccionados serán omitidos.
              </Typography>
            )}
            {!validateEndpoint && acceptedFields.length > 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Se importarán solo los campos: <strong>{acceptedFields.join(", ")}</strong>
              </Typography>
            )}
            {!validateEndpoint && validationErrors.length > 0 && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                <strong>Advertencia:</strong> Se detectaron posibles errores en la previsualización. Solo los registros
                válidos serán procesados.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmImport} variant="contained" autoFocus>
            Iniciar Importación
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ModalImportCSV
