/* eslint-disable camelcase */
import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  TextField,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
} from "@mui/material"
import { useQuery, useMutation, api, notificationService } from "../../../api"
import CustomBackdrop from "../../../components/CustomBackdrop"

/**
 * Modal para replicar un impuesto/retencion desde DSoft (compania 01)
 * hacia otras companias del sistema.
 *
 * El sistema reconoce automaticamente:
 * - Si la compania destino NO tiene el impuesto: lo crea nuevo.
 * - Si la compania destino YA tiene el impuesto: lo sobrescribe (actualiza).
 *
 * Las companias que ya tienen el impuesto aparecen pre-seleccionadas.
 *
 * Props:
 * - open: boolean - Controla si el modal esta abierto
 * - onClose: function - Funcion para cerrar el modal
 * - impuestoOrigen: object - Datos del impuesto a replicar (row.original)
 * - onReplicaCompleta: function - Callback al completar la replicacion
 */
const ModalReplicarImpuesto = ({ open, onClose, impuestoOrigen, onReplicaCompleta }) => {
  // Lista de companias obtenidas del backend
  const [companias, setCompanias] = useState([])
  // Array de ciacodigos seleccionados para replicar
  const [seleccionadas, setSeleccionadas] = useState([])
  // Compania seleccionada para ver detalle de comparacion
  const [companiaSeleccionada, setCompaniaSeleccionada] = useState(null)
  // Texto de busqueda
  const [busqueda, setBusqueda] = useState("")

  // Obtener lista de companias con su estado respecto al impuesto
  // La consulta se ejecuta cada vez que el modal se abre
  const { data: companiasParaReplica, isLoading: isLoadingCompanias } = useQuery({
    queryKey: ["getCompaniasParaReplica", impuestoOrigen?.impid, open],
    queryFn: async () => {
      if (!impuestoOrigen?.impid) return null
      const response = await api.post("/ImpuestosRetenciones/getCompaniasParaReplica", {
        impid_origen: impuestoOrigen.impid,
      })
      return response.data
    },
    enabled: open && !!impuestoOrigen?.impid,
    gcTime: 0,
  })

  // Cuando llegan los datos del backend, inicializar companias y pre-seleccionar
  useEffect(() => {
    if (companiasParaReplica && companiasParaReplica?.data?.companias) {
      const listaCompanias = companiasParaReplica?.data?.companias
      setCompanias(listaCompanias)

      // Pre-seleccionar automaticamente las companias que ya tienen el impuesto
      const preSeleccionadas = listaCompanias.filter((c) => c.existe).map((c) => c.ciacodigo)
      setSeleccionadas(preSeleccionadas)
    }
  }, [companiasParaReplica])

  // Resetear estado cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setCompanias([])
      setSeleccionadas([])
      setCompaniaSeleccionada(null)
      setBusqueda("")
    }
  }, [open])

  // Mutacion para ejecutar la replicacion
  const { mutateAsync: ejecutarReplica, isPending: isReplicando } = useMutation({
    queryKey: ["replicarImpuesto"],
    fn: async () => {
      // Construir array de companias con su accion automatica:
      // - Si ya existe: "sobrescribir"
      // - Si no existe: "crear"
      const companias_acciones = seleccionadas.map((ciacodigo) => {
        const compania = companias.find((c) => c.ciacodigo === ciacodigo)
        return {
          ciacodigo,
          accion: compania && compania.existe ? "sobrescribir" : "crear",
        }
      })
      const response = await api.post("/ImpuestosRetenciones/replicarImpuesto", {
        impid_origen: impuestoOrigen?.impid,
        companias_acciones,
      })
      return response.data
    },
    showError: "modal",
    showSuccess: "none",

    onSuccess: (data) => {
      const resumen = data?.resumen
      const mensaje = resumen
        ? `Creados: ${resumen.creados} | Actualizados: ${resumen.actualizados} | Omitidos: ${resumen.omitidos} | Errores: ${resumen.errores}`
        : "Replicacion completada"

      notificationService.showSuccess(mensaje, "modal")

      onClose()
      if (onReplicaCompleta) onReplicaCompleta()
    },
  })

  // Filtrar companias segun busqueda
  const companiasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return companias
    const termino = busqueda.toLowerCase()
    return companias.filter(
      (c) => c.ciacodigo.toLowerCase().includes(termino) || c.ciadescri.toLowerCase().includes(termino),
    )
  }, [companias, busqueda])

  // Manejar seleccion/deseleccion de una compania
  const toggleCompania = (ciacodigo) => {
    setSeleccionadas((prev) => {
      if (prev.includes(ciacodigo)) {
        return prev.filter((c) => c !== ciacodigo)
      }
      return [...prev, ciacodigo]
    })
  }

  // Seleccionar o deseleccionar todas las visibles
  const toggleTodas = () => {
    const codigosVisibles = companiasFiltradas.map((c) => c.ciacodigo)
    const todasSeleccionadas = codigosVisibles.every((c) => seleccionadas.includes(c))

    if (todasSeleccionadas) {
      setSeleccionadas((prev) => prev.filter((c) => !codigosVisibles.includes(c)))
    } else {
      setSeleccionadas((prev) => {
        const nuevas = new Set([...prev, ...codigosVisibles])
        return Array.from(nuevas)
      })
    }
  }

  // Calcular resumen en tiempo real
  const resumen = useMemo(() => {
    const seleccionadasData = companias.filter((c) => seleccionadas.includes(c.ciacodigo))
    const existen = seleccionadasData.filter((c) => c.existe).length
    const nuevas = seleccionadasData.filter((c) => !c.existe).length
    return {
      total: seleccionadasData.length,
      existen,
      nuevas,
    }
  }, [companias, seleccionadas])

  // Verificar si todas las visibles estan seleccionadas
  const todasSeleccionadas = useMemo(() => {
    if (companiasFiltradas.length === 0) return false
    return companiasFiltradas.every((c) => seleccionadas.includes(c.ciacodigo))
  }, [companiasFiltradas, seleccionadas])

  // Obtener datos de la compania seleccionada para mostrar comparacion
  const datosCompaniaSeleccionada = useMemo(() => {
    if (!companiaSeleccionada) return null
    return companias.find((c) => c.ciacodigo === companiaSeleccionada) || null
  }, [companiaSeleccionada, companias])

  // Manejar confirmacion
  const handleConfirmar = async () => {
    if (seleccionadas.length === 0) return
    await ejecutarReplica()
  }

  if (!impuestoOrigen) return null

  return (
    <>
      <CustomBackdrop isLoading={isReplicando} />
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>Replicar Impuesto/Retencion</DialogTitle>
        <DialogContent>
          {/* Informacion del impuesto origen */}
          <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Impuesto a replicar desde DSoft
            </Typography>
            <Typography variant="body1">
              <strong>{impuestoOrigen.impid}</strong> - {impuestoOrigen.impdescri}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Porcentaje: {impuestoOrigen.impporcent ?? 0}% | Tipo:{" "}
              {impuestoOrigen.impretimp === "I" ? "Impuesto" : "Retencion"}
            </Typography>
          </Box>

          {/* Campo de busqueda */}
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar compania por codigo o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Tabla de companias */}
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={todasSeleccionadas}
                      indeterminate={!todasSeleccionadas && seleccionadas.length > 0}
                      onChange={toggleTodas}
                    />
                  </TableCell>
                  <TableCell sx={{ width: 70 }}>Codigo</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell sx={{ width: 200 }}>Estado Actual</TableCell>
                  <TableCell sx={{ width: 180 }}>Accion Automatica</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingCompanias ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Cargando companias...
                    </TableCell>
                  </TableRow>
                ) : companiasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No se encontraron companias
                    </TableCell>
                  </TableRow>
                ) : (
                  companiasFiltradas.map((compania) => {
                    const estaSeleccionada = seleccionadas.includes(compania.ciacodigo)
                    return (
                      <TableRow
                        key={compania.ciacodigo}
                        hover
                        onClick={() => {
                          toggleCompania(compania.ciacodigo)
                          setCompaniaSeleccionada(compania.ciacodigo)
                        }}
                        selected={companiaSeleccionada === compania.ciacodigo}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={estaSeleccionada}
                            onChange={() => toggleCompania(compania.ciacodigo)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {compania.ciacodigo}
                          </Typography>
                        </TableCell>
                        <TableCell>{compania.ciadescri}</TableCell>
                        <TableCell>
                          {compania.existe ? (
                            <Chip
                              label={`Existe (${compania.porcentaje_actual}%)`}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          ) : (
                            <Chip label="No existe" size="small" color="success" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          {estaSeleccionada ? (
                            compania.existe ? (
                              <Chip label="Se sobrescribira" size="small" color="warning" />
                            ) : (
                              <Chip label="Se creara nuevo" size="small" color="success" />
                            )
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No se procesara
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Panel de comparacion para la compania seleccionada */}
          {companiaSeleccionada &&
            datosCompaniaSeleccionada &&
            datosCompaniaSeleccionada.existe &&
            seleccionadas.includes(companiaSeleccionada) && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "warning.50",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "warning.200",
                }}
              >
                <Typography variant="subtitle2" gutterBottom color="warning.main">
                  Comparacion para {datosCompaniaSeleccionada.ciadescri} ({datosCompaniaSeleccionada.ciacodigo}) - Se
                  sobrescribira
                </Typography>
                <Box sx={{ display: "flex", gap: 4 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      VALORES ACTUALES
                    </Typography>
                    <Typography variant="body2">
                      Descripcion: {datosCompaniaSeleccionada.datos_actuales?.impdescri || "-"}
                    </Typography>
                    <Typography variant="body2">
                      Porcentaje: {datosCompaniaSeleccionada.datos_actuales?.impporcent ?? "-"}%
                    </Typography>
                    <Typography variant="body2">
                      Codigo SRI: {datosCompaniaSeleccionada.datos_actuales?.codSRI || "-"}
                    </Typography>
                    <Typography variant="body2">
                      Concepto SRI: {datosCompaniaSeleccionada.datos_actuales?.desSRI || "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="h5" color="text.secondary">
                      &rarr;
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      NUEVOS VALORES (DESDE DSoft)
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Descripcion: {impuestoOrigen.impdescri}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Porcentaje: {impuestoOrigen.impporcent ?? 0}%
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Codigo SRI: {impuestoOrigen.codSRI || "-"}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Concepto SRI: {impuestoOrigen.desSRI || "-"}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  La cuenta contable de la compania destino no se modificara.
                </Typography>
              </Box>
            )}

          {/* Resumen final */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Resumen de la operacion
            </Typography>
            <Box sx={{ display: "flex", gap: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  SE SOBRESCRIBIRAN
                </Typography>
                <Typography variant="h6">{resumen.existen}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Ya existen, se actualizaran
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  SE CREARAN NUEVOS
                </Typography>
                <Typography variant="h6">{resumen.nuevas}</Typography>
                <Typography variant="caption" color="text.secondary">
                  No existen, se insertaran
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  TOTAL
                </Typography>
                <Typography variant="h6">{resumen.total}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Companias a procesar
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isReplicando}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} variant="contained" disabled={seleccionadas.length === 0 || isReplicando}>
            Confirmar Replicacion ({resumen.total} companias)
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ModalReplicarImpuesto
