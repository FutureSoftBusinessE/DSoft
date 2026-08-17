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

export default function HistorialRegimenTributario({ ciacodigo, companiaData, readOnly = false }) {
  const queryClient = useQueryClient()
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
    regruc: "",
    regcedula: "",
    reglicencia: "",
    regresolucion: "",
    regfecinicio: "",
    regfecfin: "",
    regagentretencion: 0,
    regllevarcontabilidad: 0,
    regrepresentantelegal: 0,
    regpresidente: 0,
    regcontador: 0,
    regregimenemprendedores: 0,
    regregimenpopular: 0,
    regregimengeneral: 0,
  })

  // Precargar datos desde siaccia al abrir modal
  const handleOpenModal = () => {
    setFormRegistro({
      ciacodigo,
      regruc: companiaData?.ciaruc || "",
      regcedula: companiaData?.ciacedgerente || "",
      reglicencia: "",
      regresolucion: companiaData?.cianumresolucion || "",
      regfecinicio: "",
      regfecfin: "",
      regagentretencion: companiaData?.sriagenteretencion === "S" ? -1 : 0,
      regllevarcontabilidad: companiaData?.ciacontabilidad ? -1 : 0,
      regrepresentantelegal: companiaData?.ciasrirazon ? -1 : 0,
      regpresidente: companiaData?.ciapresidente ? -1 : 0,
      regcontador: companiaData?.ciacontador ? -1 : 0,
      regregimenemprendedores: companiaData?.ciaregimenemprendedores || 0,
      regregimenpopular: companiaData?.ciaregimenpopular || 0,
      regregimengeneral: companiaData?.ciaregimengeneral || 0,
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
    if (!formRegistro.regresolucion) {
      showWarning("El número de resolución es requerido")
      return
    }

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
      return format(new Date(date), "dd/MM/yyyy")
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
              <TableCell>Cédula</TableCell>
              <TableCell>Licencia</TableCell>
              <TableCell>Resolución</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Fin</TableCell>
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
                <TableCell>{registro.regcedula}</TableCell>
                <TableCell>{registro.reglicencia}</TableCell>
                <TableCell>{registro.regresolucion}</TableCell>
                <TableCell>{formatDate(registro.regfecinicio)}</TableCell>
                <TableCell>{formatDate(registro.regfecfin)}</TableCell>
                <TableCell>{registro.regagentretencion === -1 ? "Sí" : "No"}</TableCell>
                <TableCell>{registro.regllevarcontabilidad === -1 ? "Sí" : "No"}</TableCell>
                <TableCell>{registro.regrepresentantelegal === -1 ? "Sí" : "No"}</TableCell>
                <TableCell>{registro.regpresidente === -1 ? "Sí" : "No"}</TableCell>
                <TableCell>{registro.regcontador === -1 ? "Sí" : "No"}</TableCell>
                <TableCell>{getRegimenLabel(registro)}</TableCell>
              </TableRow>
            ))}
            {!historial?.length && (
              <TableRow>
                <TableCell colSpan={readOnly ? 13 : 14} align="center">
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
              <Grid item xs={12} sm={2}>
                <TextField label="Código" value={formRegistro.ciacodigo} disabled fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="RUC"
                  value={formRegistro.regruc}
                  onChange={(e) => handleInputChange("regruc", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Cédula Representante"
                  value={formRegistro.regcedula}
                  onChange={(e) => handleInputChange("regcedula", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Licencia"
                  value={formRegistro.reglicencia}
                  onChange={(e) => handleInputChange("reglicencia", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="No. Resolución *"
                  value={formRegistro.regresolucion}
                  onChange={(e) => handleInputChange("regresolucion", e.target.value)}
                  fullWidth
                  size="small"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha Inicio"
                  type="date"
                  value={formRegistro.regfecinicio}
                  onChange={(e) => handleInputChange("regfecinicio", e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha Fin"
                  type="date"
                  value={formRegistro.regfecfin}
                  onChange={(e) => handleInputChange("regfecfin", e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary">
                  Banderas
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
                  label="Agente de Retención"
                />
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
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formRegistro.regrepresentantelegal === -1}
                      onChange={(e) => handleInputChange("regrepresentantelegal", e.target.checked ? -1 : 0)}
                    />
                  }
                  label="Representante Legal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formRegistro.regpresidente === -1}
                      onChange={(e) => handleInputChange("regpresidente", e.target.checked ? -1 : 0)}
                    />
                  }
                  label="Presidente"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formRegistro.regcontador === -1}
                      onChange={(e) => handleInputChange("regcontador", e.target.checked ? -1 : 0)}
                    />
                  }
                  label="Contador"
                />
              </Grid>

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
