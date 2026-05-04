// components/ArbolPermisos/ArbolPermisos.jsx - VERSIÓN DEBUG
import React, { memo, useCallback, useState, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton,
  Collapse,
} from "@mui/material"
import { ExpandMore, ExpandLess } from "@mui/icons-material"

const ArbolPermisos = memo(
  ({ permisosManager, expandidos, expandidosAcciones, onToggleExpandir, onToggleAccionesExpandir }) => {
    const { permisos } = permisosManager
    const [nodosVisibles, setNodosVisibles] = useState([])

    // Debug: mostrar información del estado
    useEffect(() => {
      console.log("🌳 Estado de ArbolPermisos:", {
        totalOpciones: permisos.opciones?.size,
        relaciones: Array.from(permisos.hijos?.entries() || []).slice(0, 3),
        expandidos: Array.from(expandidos || []),
        raiz: permisos.raiz,
      })
    }, [permisos, expandidos])

    // Calcular nodos visibles
    useEffect(() => {
      const calcularVisibilidad = () => {
        if (!permisos.raiz || !permisos.hijos) return []

        const visibles = []
        const stack = []

        // Comenzar con hijos de la raíz
        const hijosRaiz = permisos.hijos.get(permisos.raiz) || []
        console.log("👶 Hijos de raíz:", hijosRaiz)

        hijosRaiz.forEach((hijo) => stack.push({ opctag: hijo, nivel: 0 }))

        while (stack.length > 0) {
          const { opctag, nivel } = stack.pop()
          const nodo = permisos.opciones.get(opctag)

          if (!nodo) {
            console.warn(`Nodo no encontrado: ${opctag}`)
            continue
          }

          visibles.push({
            ...nodo,
            nivel,
          })

          // Si está expandido, agregar hijos
          if (expandidos.has(opctag)) {
            const hijos = permisos.hijos.get(opctag) || []
            // Agregar en orden inverso para mantener orden
            for (let i = hijos.length - 1; i >= 0; i--) {
              stack.push({ opctag: hijos[i], nivel: nivel + 1 })
            }
          }
        }

        console.log(`👁️ Nodos visibles calculados: ${visibles.length}`)
        return visibles
      }

      const visibles = calcularVisibilidad()
      setNodosVisibles(visibles)
    }, [permisos, expandidos])

    // Componente de nodo simple
    const NodoSimple = ({ nodo, nivel }) => {
      const tieneHijos = permisos.hijos.has(nodo.opctag) && permisos.hijos.get(nodo.opctag).length > 0
      const estaExpandido = expandidos.has(nodo.opctag)
      const estadoCheckbox = permisosManager.obtenerEstadoOpcion(nodo.opctag)

      return (
        <Box sx={{ pl: nivel * 3, py: 1, borderBottom: "1px solid #eee" }}>
          <Box display="flex" alignItems="center">
            <Checkbox
              checked={estadoCheckbox === true}
              indeterminate={estadoCheckbox === "indeterminate"}
              onChange={(e) => permisosManager.toggleOpcion(nodo.opctag, e.target.checked)}
              size="small"
            />
            <Box flex={1}>
              <Typography variant="body2">{nodo.opccaption}</Typography>
              <Typography variant="caption" color="textSecondary">
                {nodo.opctag} | Nivel {nivel} | {nodo.esHoja ? "Hoja" : "Padre"} |{" "}
                {tieneHijos ? `${permisos.hijos.get(nodo.opctag)?.length} hijos` : "Sin hijos"}
              </Typography>
            </Box>
            {tieneHijos && (
              <IconButton size="small" onClick={() => onToggleExpandir(nodo.opctag)} sx={{ ml: 1 }}>
                {estaExpandido ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </Box>
        </Box>
      )
    }

    // Si no hay datos
    if (permisos.opciones?.size === 0) {
      return <Alert severity="warning">No hay opciones de menú para mostrar</Alert>
    }

    return (
      <Paper variant="outlined" sx={{ p: 2, maxHeight: 500, overflow: "auto" }}>
        <Typography variant="h6" gutterBottom>
          🌳 Árbol de Permisos (Debug Mode)
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="textSecondary">
            Total opciones: {permisos.opciones?.size} | Nodos visibles: {nodosVisibles.length} | Expandidos:{" "}
            {expandidos.size}
          </Typography>
        </Box>

        {/* Lista simple de nodos */}
        {nodosVisibles.length === 0 ? (
          <Alert severity="info">No hay nodos visibles. ¿Has expandido algún nodo?</Alert>
        ) : (
          <Box>
            {nodosVisibles.map((nodo, index) => (
              <NodoSimple key={`${nodo.opctag}-${index}`} nodo={nodo} nivel={nodo.nivel} />
            ))}
          </Box>
        )}

        {/* Botón para expandir todo */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              // Expandir todos los nodos que tienen hijos
              const todosConHijos = Array.from(permisos.hijos.keys()).filter(
                (key) => permisos.hijos.get(key).length > 0,
              )

              const nuevosExpandidos = new Set(todosConHijos)
              // Actualizar estado (necesitarías pasar setExpandidos como prop)
            }}
          >
            Expandir Todo
          </Button>
        </Box>
      </Paper>
    )
  },
)

export default ArbolPermisos
