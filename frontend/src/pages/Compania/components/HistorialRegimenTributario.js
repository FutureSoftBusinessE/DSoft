import { useState, useEffect } from "react"
import {
  Box,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Divider,
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material"
import { Add, Delete } from "@mui/icons-material"
import { useMutation, useQuery, api, showWarning, showSuccess, showError } from "../../../api"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { format } from "date-fns"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

export default function HistorialRegimenTributario({ ciacodigo, companiaData, readOnly = false }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [openModal, setOpenModal] = useState(false)
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null)

  // Consultar historial
  const {
    data: historial = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["historialRegimenTributario", ciacodigo],
    queryFn: async () => {
      const response = await api.post("/Compania/getHistorialRegimenTributario", { ciacodigo })
      return response?.data?.data?.data || response?.data?.data || response?.data || []
    },
    enabled: !!ciacodigo,
  })

  // Mutación para crear
  const { mutateAsync: crearRegistro, isPending: isCreating } = useMutation({
    queryKey: ["crearRegimenTributario"],
    fn: async (data) => {
      const response = await api.post("/Compania/crearRegimenTributario", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historialRegimenTributario", ciacodigo] })
      setOpenModal(false)
    },
  })

  // Mutación para eliminar
  const { mutateAsync: eliminarRegistro, isPending: isDeleting } = useMutation({
    queryKey: ["eliminarRegimenTributario"],
    fn: async (data) => {
      const response = await api.post("/Compania/eliminarRegimenTributario", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historialRegimenTributario", ciacodigo] })
    },
  })

  const [formRegistro, setFormRegistro] = useState({
    ciacodigo,
    // Régimen
    regregimenemprendedores: 0,
    regregimenpopular: 0,
    regregimengeneral: 0,
    // Bandera: Contribuyente Especial
    regcontribuyenteespecial: 0,
    regcontribuyenteespecialnumres: "",
    regcontribuyenteespecialfecres: "",
    // Bandera: Agente de Retención
    regagentretencion: 0,
    regagentretencionnumres: "",
    regagentretencionfecres: "",
    // Bandera: Llevar Contabilidad
    regllevarcontabilidad: 0,
    regllevarcontabilidadnumres: "",
    regllevarcontabilidadfecres: "",
    // Representante Legal
    regrepresentantelegalnombre: "",
    regrepresentantelegalcedula: "",
    // Presidente
    regpresidentenombre: "",
    regpresidentecedula: "",
    // Contador
    regcontadornombre: "",
    regcontadorcedula: "",
    regcontadorlicencia: "",
    // Datos generales del registro
    regruc: "",
    regfecinicio: "",
    regfecfin: "",
  })

  // Precargar datos desde siaccia al abrir modal
  const handleOpenModal = () => {
    setFormRegistro({
      ciacodigo,
      // Régimen
      regregimenemprendedores: companiaData?.ciaregimenemprendedores || 0,
      regregimenpopular: companiaData?.ciaregimenpopular || 0,
      regregimengeneral: companiaData?.ciaregimengeneral || 0,
      // Bandera: Contribuyente Especial (cualquier != 0 es true -> -1)
      regcontribuyenteespecial: companiaData?.ciaescontesp ? -1 : 0,
      regcontribuyenteespecialnumres: companiaData?.cianumresolucion || "",
      regcontribuyenteespecialfecres: companiaData?.ciafecresolucion || "",
      // Bandera: Agente de Retención (varchar 'S'/'N')
      regagentretencion: companiaData?.sriagenteretencion === "S" ? -1 : 0,
      regagentretencionnumres: companiaData?.sriagenteretencionnumres || "",
      regagentretencionfecres: companiaData?.sriagenteretencionfecres || "",
      // Bandera: Llevar Contabilidad (bit 1/0)
      regllevarcontabilidad: companiaData?.ciacontabilidad ? -1 : 0,
      regllevarcontabilidadnumres: companiaData?.ciacontabilidadnumres || "",
      regllevarcontabilidadfecres: companiaData?.ciacontabilidadfecres || "",
      // Representante Legal
      regrepresentantelegalnombre: companiaData?.ciagerente || "",
      regrepresentantelegalcedula: companiaData?.ciacedgerente || "",
      // Presidente
      regpresidentenombre: companiaData?.ciapresidente || "",
      regpresidentecedula: companiaData?.ciacedpresidente || "",
      // Contador
      regcontadornombre: companiaData?.ciacontador || "",
      regcontadorcedula: companiaData?.ciasriruccontador || "",
      regcontadorlicencia: companiaData?.ciaregcont || "",
      // Datos generales del registro
      regruc: companiaData?.ciaruc || "",
      regfecinicio: "",
      regfecfin: "",
    })
    setOpenModal(true)
  }

  const handleInputChange = (field, value) => {
    setFormRegistro((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleRegimenChange = (name, value) => {
    if (value === -1) {
      const otros = ["regregimenemprendedores", "regregimenpopular", "regregimengeneral"].filter(
        (field) => field !== name,
      )
      otros.forEach((field) => {
        setFormRegistro((prev) => ({
          ...prev,
          [field]: 0,
        }))
      })
    }
    setFormRegistro((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    // Validaciones
    const regimenSeleccionado = [
      formRegistro.regregimenemprendedores,
      formRegistro.regregimenpopular,
      formRegistro.regregimengeneral,
    ].filter((val) => val === -1).length

    if (regimenSeleccionado !== 1) {
      showWarning("Debe seleccionar exactamente un régimen tributario")
      return
    }

    try {
      await crearRegistro(formRegistro)
      navigate(0)
    } catch (error) {
      showError(error)
    }
  }

  const handleDelete = async (registro) => {
    if (window.confirm(`¿Está seguro de eliminar el registro ${registro.regsecuencia}?`)) {
      try {
        await eliminarRegistro({
          ciacodigo,
          regsecuencia: registro.regsecuencia,
        })
      } catch (error) {
        showError(error)
      }
    }
  }

  const getRegimenLabel = (registro) => {
    if (registro.regregimenemprendedores === -1) return "RIMPE Emprendedores"
    if (registro.regregimenpopular === -1) return "RIMPE Popular"
    if (registro.regregimengeneral === -1) return "Régimen General"
    return "No definido"
  }

  const formatDate = (date) => {
    if (!date) return "N/A"
    try {
      const d = new Date(date)
      if (d.getFullYear() === 1900) return "N/A"
      return format(d, "dd/MM/yyyy")
    } catch {
      return date
    }
  }

  return (
    <Box sx={{ mt: 4 }}>
      <CustomBackdrop isLoading={isLoading || isCreating || isDeleting} />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" color="primary">
          Historial de Régimen Tributario
        </Typography>
        {!readOnly && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenModal}>
            Nuevo Registro
          </Button>
        )}
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar el historial
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {!readOnly && <TableCell>Acciones</TableCell>}
              <TableCell>Sec.</TableCell>
              <TableCell>RUC</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Fin</TableCell>
              <TableCell>Contrib. Esp.</TableCell>
              <TableCell>Agente Ret.</TableCell>
              <TableCell>Contab.</TableCell>
              <TableCell>Rep. Legal</TableCell>
              <TableCell>Presidente</TableCell>
              <TableCell>Contador</TableCell>
              <TableCell>Régimen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historial?.map((registro) => (
              <TableRow key={registro.regsecuencia}>
                {!readOnly && (
                  <TableCell>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => handleDelete(registro)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
                <TableCell>{registro.regsecuencia}</TableCell>
                <TableCell>{registro.regruc}</TableCell>
                <TableCell>{formatDate(registro.regfecinicio)}</TableCell>
                <TableCell>{formatDate(registro.regfecfin)}</TableCell>
                <TableCell>{registro.regcontribuyenteespecial === -1 ? "Sí" : "No"}</TableCell>
                <TableCell>{registro.regagentretencion === -1 ? "Sí" : "No"}</TableCell>
                <TableCell>{registro.regllevarcontabilidad === -1 ? "Sí" : "No"}</TableCell>
                <TableCell>{registro.regrepresentantelegalnombre || "—"}</TableCell>
                <TableCell>{registro.regpresidentenombre || "—"}</TableCell>
                <TableCell>{registro.regcontadornombre || "—"}</TableCell>
                <TableCell>{getRegimenLabel(registro)}</TableCell>
              </TableRow>
            ))}
            {!historial?.length && (
              <TableRow>
                <TableCell colSpan={readOnly ? 11 : 12} align="center">
                  No hay registros
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal para nuevo registro - solo si no es readOnly */}
      {!readOnly && (
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
          <DialogTitle>Nuevo Registro Tributario</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* ── CABECERA: datos generales del régimen ── */}
              <Grid item xs={12} sm={3}>
                <TextField label="Código" value={formRegistro.ciacodigo} disabled fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="RUC"
                  value={formRegistro.regruc}
                  onChange={(e) => handleInputChange("regruc", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Fecha Inicio Vigencia"
                  type="date"
                  value={formRegistro.regfecinicio}
                  onChange={(e) => handleInputChange("regfecinicio", e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Fecha Fin Vigencia"
                  type="date"
                  value={formRegistro.regfecfin}
                  onChange={(e) => handleInputChange("regfecfin", e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* ── BANDERA: Contribuyente Especial ── */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary">
                  Contribuyente Especial
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formRegistro.regcontribuyenteespecial === -1}
                      onChange={(e) => handleInputChange("regcontribuyenteespecial", e.target.checked ? -1 : 0)}
                    />
                  }
                  label="Es Contribuyente Especial"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="No. Resolución"
                  value={formRegistro.regcontribuyenteespecialnumres}
                  onChange={(e) => handleInputChange("regcontribuyenteespecialnumres", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Fecha Resolución"
                  type="date"
                  value={formRegistro.regcontribuyenteespecialfecres}
                  onChange={(e) => handleInputChange("regcontribuyenteespecialfecres", e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* ── BANDERA: Agente de Retención ── */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary">
                  Agente de Retención
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formRegistro.regagentretencion === -1}
                      onChange={(e) => handleInputChange("regagentretencion", e.target.checked ? -1 : 0)}
                    />
                  }
                  label="Es Agente de Retención"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="No. Resolución"
                  value={formRegistro.regagentretencionnumres}
                  onChange={(e) => handleInputChange("regagentretencionnumres", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Fecha Resolución"
                  type="date"
                  value={formRegistro.regagentretencionfecres}
                  onChange={(e) => handleInputChange("regagentretencionfecres", e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* ── BANDERA: Llevar Contabilidad ── */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary">
                  Llevar Contabilidad
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formRegistro.regllevarcontabilidad === -1}
                      onChange={(e) => handleInputChange("regllevarcontabilidad", e.target.checked ? -1 : 0)}
                    />
                  }
                  label="Llevar Contabilidad"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="No. Resolución"
                  value={formRegistro.regllevarcontabilidadnumres}
                  onChange={(e) => handleInputChange("regllevarcontabilidadnumres", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Fecha Resolución"
                  type="date"
                  value={formRegistro.regllevarcontabilidadfecres}
                  onChange={(e) => handleInputChange("regllevarcontabilidadfecres", e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* ── REPRESENTANTE LEGAL ── */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary">
                  Representante Legal
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre Representante Legal"
                  value={formRegistro.regrepresentantelegalnombre}
                  onChange={(e) => handleInputChange("regrepresentantelegalnombre", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cédula Representante Legal"
                  value={formRegistro.regrepresentantelegalcedula}
                  onChange={(e) => handleInputChange("regrepresentantelegalcedula", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>

              {/* ── PRESIDENTE ── */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary">
                  Presidente
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre Presidente"
                  value={formRegistro.regpresidentenombre}
                  onChange={(e) => handleInputChange("regpresidentenombre", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cédula Presidente"
                  value={formRegistro.regpresidentecedula}
                  onChange={(e) => handleInputChange("regpresidentecedula", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>

              {/* ── CONTADOR ── */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary">
                  Contador
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Nombre Contador"
                  value={formRegistro.regcontadornombre}
                  onChange={(e) => handleInputChange("regcontadornombre", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Cédula/RUC Contador"
                  value={formRegistro.regcontadorcedula}
                  onChange={(e) => handleInputChange("regcontadorcedula", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Licencia Contador"
                  value={formRegistro.regcontadorlicencia}
                  onChange={(e) => handleInputChange("regcontadorlicencia", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>

              {/* ── RÉGIMEN TRIBUTARIO ── */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary">
                  Régimen Tributario
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formRegistro.regregimenemprendedores === -1}
                      onChange={(e) => handleRegimenChange("regregimenemprendedores", e.target.checked ? -1 : 0)}
                    />
                  }
                  label="RIMPE Emprendedores"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formRegistro.regregimenpopular === -1}
                      onChange={(e) => handleRegimenChange("regregimenpopular", e.target.checked ? -1 : 0)}
                    />
                  }
                  label="RIMPE Popular"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formRegistro.regregimengeneral === -1}
                      onChange={(e) => handleRegimenChange("regregimengeneral", e.target.checked ? -1 : 0)}
                    />
                  }
                  label="Régimen General"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}
