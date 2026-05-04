import { useState } from "react"
import {
  Grid,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Button,
  IconButton,
  Alert,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"

const HistorialSection = ({
  data = {},
  change,
  readOnly,
  Field,
  Section,
  selectOptions = {},
  currentUser = "",
  currentStation = "",
}) => {
  const historial = Array.isArray(data.historial) ? data.historial : []
  const [validationError, setValidationError] = useState("")

  const handleAddHistorial = () => {
    const observacion = String(data.historialObservacion || "").trim()
    if (!observacion) {
      setValidationError("La observación es requerida")
      return
    }

    const uid = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    change("historial", [
      ...historial,
      {
        observacion,
        usuario: currentUser || data.cliusumsys || data.cliusuisys || "",
        estacion: currentStation || data.cliestmsys || data.cliestisys || "",
        _uid: uid,
      },
    ])
    change("historialObservacion", "")
    setValidationError("")
  }

  const handleRemoveHistorial = (idx) => {
    change(
      "historial",
      historial.filter((_, i) => i !== idx),
    )
  }

  return (
    <Section title="Historial">
      {validationError && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setValidationError("")}>
            {validationError}
          </Alert>
        </Box>
      )}
      <Grid item xs={12}>
        <Field
          label="Observación"
          name="historialObservacion"
          value={data.historialObservacion}
          onChange={change}
          readOnly={readOnly}
          multiline
          rows={4}
        />
      </Grid>

      <Grid item xs={12} display="flex" justifyContent="flex-end">
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddHistorial}
          disabled={readOnly}
        >
          Agregar Observación
        </Button>
      </Grid>

      <Grid item xs={12}>
        <Box mt={1} />
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Estación</TableCell>
                <TableCell>Observación</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historial.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay historial
                  </TableCell>
                </TableRow>
              ) : (
                historial.map((h, idx) => (
                  <TableRow key={h._uid || idx}>
                    <TableCell>{h.usuario || ""}</TableCell>
                    <TableCell>{h.fecha || ""}</TableCell>
                    <TableCell>{h.hora || ""}</TableCell>
                    <TableCell>{h.estacion || ""}</TableCell>
                    <TableCell>{h.observacion || ""}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveHistorial(idx)}
                        disabled={readOnly}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Section>
  )
}

export default HistorialSection
