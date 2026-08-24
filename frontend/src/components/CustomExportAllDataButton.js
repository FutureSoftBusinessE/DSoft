// Componente: CustomExportAllDataButton.jsx
import React, { useState, useEffect } from "react"
import {
  Button,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from "@mui/material"
import DownloadIcon from "@mui/icons-material/Download"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import { handleAllExportDataCSV } from "../pages/utils/reactTableActions/exportToolbarActions"

const CustomExportAllDataButton = ({
  columnsTable = [],
  endpoint = "",
  fileName = "Reporte",
  onClose = () => {},
  onLoadingChange = () => {},
}) => {
  const [selectedColumns, setSelectedColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setSelectedColumns(columnsTable.map((col) => col.accessorKey))
    setError(null)
  }, [columnsTable])

  const handleToggleColumn = (accessorKey) => {
    setSelectedColumns((prev) =>
      prev.includes(accessorKey) ? prev.filter((col) => col !== accessorKey) : [...prev, accessorKey],
    )
  }

  const handleSelectAll = () => {
    if (selectedColumns.length === columnsTable.length) {
      setSelectedColumns([])
    } else {
      setSelectedColumns(columnsTable.map((col) => col.accessorKey))
    }
  }

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      setError("Debe seleccionar al menos una columna")
      return
    }

    setLoading(true)
    setError(null)

    // Notificar al padre que está cargando
    if (typeof onLoadingChange === "function") {
      onLoadingChange(true)
    }

    try {
      const response = await fetchwrapper(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnas: selectedColumns,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const data = result.data
        if (data && data.length > 0) {
          // Transformar datos para usar headers amigables
          const filteredData = data.map((row) => {
            const newRow = {}
            selectedColumns.forEach((col) => {
              const columnDef = columnsTable.find((c) => c.accessorKey === col)
              const headerKey = columnDef?.header || col
              newRow[headerKey] = row[col] || ""
            })
            return newRow
          })

          // Usar la función existente para exportar CSV
          handleAllExportDataCSV(filteredData, `${fileName}_${new Date().toLocaleDateString()}`)

          if (typeof onClose === "function") {
            onClose()
          }
        } else {
          setError("No hay datos para exportar")
        }
      } else {
        setError(result.message || "Error al exportar datos")
      }
    } catch (err) {
      setError("Error al conectar con el servidor")
      console.error("Export error:", err)
    } finally {
      setLoading(false)

      // Notificar al padre que terminó de cargar
      if (typeof onLoadingChange === "function") {
        onLoadingChange(false)
      }
    }
  }

  return (
    <>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Seleccione las columnas que desea incluir en la descarga completa
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Button size="small" onClick={handleSelectAll} disabled={loading}>
            {selectedColumns.length === columnsTable.length ? "Deseleccionar todas" : "Seleccionar todas"}
          </Button>
        </Box>

        <FormGroup>
          {columnsTable.map((col) => (
            <FormControlLabel
              key={col.accessorKey}
              control={
                <Checkbox
                  checked={selectedColumns.includes(col.accessorKey)}
                  onChange={() => handleToggleColumn(col.accessorKey)}
                  disabled={loading}
                  size="small"
                />
              }
              label={col.header}
              sx={{
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.875rem",
                },
              }}
            />
          ))}
        </FormGroup>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => typeof onClose === "function" && onClose()} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={loading || selectedColumns.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
        >
          {loading ? "Exportando..." : "Descargar CSV"}
        </Button>
      </DialogActions>
    </>
  )
}

export default CustomExportAllDataButton
