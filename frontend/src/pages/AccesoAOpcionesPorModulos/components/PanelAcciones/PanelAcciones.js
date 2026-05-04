// components/PanelAcciones.jsx
import React, { useState, useEffect } from "react"
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  CircularProgress,
  Chip,
  Alert,
  Collapse,
} from "@mui/material"
import { Close, CheckBox, CheckBoxOutlineBlank, ExpandMore, ExpandLess } from "@mui/icons-material"

const PanelAcciones = ({ opctag, accionesManager, onClose, opcionInfo }) => {
  const [acciones, setAcciones] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)

  // Cargar acciones cuando se monta
  useEffect(() => {
    if (opctag) {
      cargarAcciones()
    }
  }, [opctag])

  const cargarAcciones = async () => {
    setLoading(true)
    try {
      const result = await accionesManager.cargarAccionesOpcion(opctag)
      setAcciones(result || [])
    } catch (error) {
      console.error("Error cargando acciones:", error)
    } finally {
      setLoading(false)
    }
  }

  // Manejar toggle de acción
  const handleToggleAccion = (acccaption) => {
    accionesManager.toggleAccion(opctag, acccaption)
  }

  // Manejar toggle de todas
  const handleToggleTodas = (permitir) => {
    accionesManager.toggleTodasAcciones(opctag, permitir)
  }

  // Calcular estadísticas
  const accionesPermitidas = acciones.filter((a) => accionesManager.accionEstaPermitida(opctag, a.acccaption)).length

  if (loading) {
    return (
      <Paper sx={{ p: 2, mt: 2, mb: 2 }}>
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Cargando acciones...
          </Typography>
        </Box>
      </Paper>
    )
  }

  if (acciones.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2, mb: 2 }}>
        <Alert severity="info">No hay acciones configuradas para esta opción</Alert>
      </Paper>
    )
  }

  return (
    <Paper sx={{ mt: 2, mb: 2, overflow: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: "primary.light",
          color: "primary.contrastText",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box display="flex" alignItems="center">
          <Typography variant="subtitle1" fontWeight="bold">
            Acciones para: {opcionInfo?.opccaption || opctag}
          </Typography>
          <Chip
            label={`${accionesPermitidas}/${acciones.length}`}
            size="small"
            sx={{ ml: 2, bgcolor: "white", color: "primary.main" }}
          />
        </Box>
        <Box display="flex" alignItems="center">
          <IconButton
            size="small"
            sx={{ color: "white" }}
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            <Close />
          </IconButton>
          <IconButton size="small" sx={{ color: "white", ml: 1 }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* Contenido */}
      <Collapse in={expanded}>
        <Box p={2}>
          {/* Controles rápidos */}
          <Box display="flex" gap={1} mb={2}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CheckBox />}
              onClick={() => handleToggleTodas(true)}
              sx={{ flex: 1 }}
            >
              Permitir todas
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CheckBoxOutlineBlank />}
              onClick={() => handleToggleTodas(false)}
              sx={{ flex: 1 }}
            >
              Denegar todas
            </Button>
          </Box>

          {/* Lista de acciones */}
          <Grid container spacing={2}>
            {acciones.map((accion, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    borderColor: accionesManager.accionEstaPermitida(opctag, accion.acccaption)
                      ? "success.main"
                      : "divider",
                    bgcolor: accionesManager.accionEstaPermitida(opctag, accion.acccaption)
                      ? "success.light"
                      : "background.paper",
                    transition: "all 0.2s",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={accionesManager.accionEstaPermitida(opctag, accion.acccaption)}
                        onChange={() => handleToggleAccion(accion.acccaption)}
                        size="small"
                        color="success"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {accion.acccaption}
                        </Typography>
                        {accion.accnameicono && (
                          <Typography variant="caption" color="textSecondary">
                            {accion.accnameicono}
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{ width: "100%", m: 0 }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Resumen */}
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography variant="caption" color="textSecondary">
              {accionesPermitidas} de {acciones.length} acciones permitidas
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  )
}

export default PanelAcciones
