import React, { useState, useEffect, useContext } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  RadioGroup,
  FormLabel,
  FormControl,
  Divider,
  Paper,
  IconButton,
} from "@mui/material"
import { DataGrid, GridActionsCellItem, GridRowModes, GridToolbarContainer } from "@mui/x-data-grid"

import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material"
import Swal from "sweetalert2"

import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import CustomBackdrop from "../../../components/CustomBackdrop"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import { GlobalContext } from "../../../contexts/GlobalContext"
import getIconComponent from "../../utils/getIconComponent"

// =================================================================
// ESTILOS Y TEMA
// =================================================================
const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  padding: "0 16px",
  minHeight: "80vh",
}))

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#2E7D32" }, error: { main: "#d32f2f" } },
})

// =================================================================
// OPCIONES ESTÁTICAS
// =================================================================
const opcIdentificacion = [
  { id: "C", label: "Cédula" },
  { id: "R", label: "R.U.C." },
  { id: "P", label: "Pasaporte" },
  { id: "O", label: "No Aplica" },
]
const opcSexo = [
  { id: "M", label: "Masculino" },
  { id: "F", label: "Femenino" },
]
const opcEstCiv = [
  { id: "SOLTERO", label: "Soltero" },
  { id: "CASADO", label: "Casado" },
  { id: "DIVORCIADO", label: "Divorciado" },
  { id: "VIUDO", label: "Viudo" },
  { id: "UNION LIBRE", label: "Unión Libre" },
]
const opcPersona = [
  { id: "N", label: "Natural" },
  { id: "J", label: "Jurídica" },
]
const opcOrigenIng = [
  { id: "B", label: "Empleado Público" },
  { id: "V", label: "Empleado Privado" },
  { id: "I", label: "Independiente" },
  { id: "A", label: "Ama de Casa / Estudiante" },
  { id: "R", label: "Rentista" },
  { id: "H", label: "Jubilado" },
  { id: "M", label: "Remesas del Exterior" },
]

const initialMaestroState = {
  clicodigo: "",
  cliruc: "",
  clinombre: "",
  cliidentifica: "C",
  tipcodigo: "",
  clidirec: "",
  clidirec2: "",
  clitelef1: "",
  clitelef2: "",
  clifax: "",
  cliemail: "",
  website: "",
  clisexo: "",
  cliestciv: "",
  clifecnac: "",
  clipersona: "",
  cliprofesion: "",
  cliintersec: "",
  clistatus: "A",
  procodigo: "",
  ciucodigo: "",
  zoncodigo: "",
  regcodigo: "",
  parrocodigo: "",
  activicodigo: "",
  sectorcodigo: "",
  usrcodigo: "",
  cliorigening: "I",
  calfcodigo: "",
  clirucrepres: "",
  clirepres: "",
  cliidenrep: "O",
  cliidencon: "O",
  cliruccon: "",
  clinombrecon: "",
  clidireccon: "",
  cliprofesioncon: "",
  clidiascrs: 0,
  climontocrs: 0,
  cliprefac: 1,
  cliapliiva: -1,
  clibloqueo: 0,
  cliobserva: "",
  clitipodomicilio: "",
  clitiempodomicilio: "",
  cliubicacionrapido: "",
  tarenviosta: "D",
  cliparterel: 0,
  cliconespecial: 0,
  clireferencia1: "",
  cliparentesco1: "",
  clireftelefono1: "",
  clireferencia2: "",
  cliparentesco2: "",
  clireftelefono2: "",
  clirucmatriz: "",
  clinommatriz: "",
  clifecmsys: null,
  clihormsys: null,
}

const mapToValueLabel = (arr) => (arr ? arr.map((item) => ({ value: item.id || item.value, label: item.label })) : [])

const CrearCreacionClientes = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const clienteEdit = location.state
  const modo = clienteEdit ? "EDIT" : "NEW"

  const [isLoading, setIsLoading] = useState(false)
  const [maestro, setMaestro] = useState(initialMaestroState)

  const [agencias, setAgencias] = useState([])
  const [contactos, setContactos] = useState([])
  const [referencias, setReferencias] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [descuentosLinea, setDescuentosLinea] = useState([])
  const [descuentosArticulo, setDescuentosArticulo] = useState([])
  const [historial, setHistorial] = useState([])
  const [imagenes, setImagenes] = useState([])

  const [catalogos, setCatalogos] = useState({})
  const [permisos, setPermisos] = useState({})

  const [rowModesAg, setRowModesAg] = useState({})
  const [rowModesCo, setRowModesCo] = useState({})
  const [rowModesRef, setRowModesRef] = useState({})
  const [rowModesVen, setRowModesVen] = useState({})
  const [rowModesDL, setRowModesDL] = useState({})
  const [rowModesDA, setRowModesDA] = useState({})

  const grabarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "GRABAR")

  useEffect(() => {
    cargarEntorno()
  }, [])

  const cargarEntorno = async () => {
    setIsLoading(true)
    try {
      const [reqPermisos, reqCat] = await Promise.all([
        fetchwrapper("/CreacionCliente/getPermisosCliente", { method: "POST" }),
        fetchwrapper("/CreacionCliente/getCatalogosCliente", { method: "POST" }),
      ])
      const resPermisos = await reqPermisos.json()
      const resCat = await reqCat.json()

      if (resPermisos?.success) setPermisos(resPermisos.data)
      if (resCat?.success) setCatalogos(resCat.data)

      if (modo === "EDIT" && clienteEdit?.clicodigo) {
        const reqCompleto = await fetchwrapper("/CreacionCliente/getClienteCompleto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clicodigo: clienteEdit.clicodigo }),
        })
        const resCompleto = await reqCompleto.json()

        if (resCompleto?.success) {
          const mData = resCompleto.data.maestro
          if (mData.clifecnac) mData.clifecnac = mData.clifecnac.split(" ")[0]
          setMaestro({ ...initialMaestroState, ...mData })

          setAgencias((resCompleto.data.agencias || []).map((a, i) => ({ id: `ag_${i}`, ...a })))
          setContactos((resCompleto.data.contactos || []).map((c, i) => ({ id: `co_${i}`, ...c })))
          setReferencias((resCompleto.data.referencias || []).map((r, i) => ({ id: `ref_${i}`, ...r })))
          setVendedores((resCompleto.data.vendedores || []).map((v, i) => ({ id: `ven_${i}`, ...v })))
          setDescuentosLinea((resCompleto.data.descuentosLinea || []).map((d, i) => ({ id: `dl_${i}`, ...d })))
          setDescuentosArticulo((resCompleto.data.descuentosArticulo || []).map((d, i) => ({ id: `da_${i}`, ...d })))
          setHistorial((resCompleto.data.historial || []).map((h, i) => ({ id: `h_${i}`, ...h })))

          fetchImagenes(clienteEdit.clicodigo)
        }
      }
    } catch (error) {
      Swal.fire("Error de Conexión", error.message, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchImagenes = async (clicodigo) => {
    try {
      const res = await fetchwrapper("/CreacionCliente/getImagenesCliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clicodigo }),
      })
      const data = await res.json()
      if (data.success) setImagenes(data.data)
    } catch (err) {
      console.error("Error al cargar imágenes", err)
    }
  }

  const handleMaestroChange = (field, value) => setMaestro((prev) => ({ ...prev, [field]: value }))

  // =================================================================
  // VALIDACIÓN ESTRICTA SRI (CÉDULA Y RUC - MÓDULO 10 y MÓDULO 11)
  // =================================================================
  const validarIdentificacion = (tipo, valor, nombreCampo) => {
    if (tipo === "O" || tipo === "P") return null
    if (!valor || valor.trim() === "") return `La identificación de ${nombreCampo} es obligatoria.`

    const soloNumeros = /^\d+$/.test(valor)
    if (!soloNumeros) return `La identificación de ${nombreCampo} debe contener solo números.`

    const prov = parseInt(valor.substring(0, 2), 10)
    if (prov < 1 || (prov > 24 && prov !== 30)) return `El código de provincia de ${nombreCampo} es inválido.`

    const d3 = parseInt(valor.charAt(2), 10)

    // Lógica para Cédula (10 dígitos - Módulo 10)
    if (tipo === "C") {
      if (valor.length !== 10) return `La Cédula de ${nombreCampo} debe tener exactamente 10 dígitos.`
      if (d3 >= 6) return `El tercer dígito de la cédula de ${nombreCampo} es inválido.`

      let suma = 0
      for (let i = 0; i < 9; i++) {
        let v = parseInt(valor.charAt(i), 10)
        if (i % 2 === 0) {
          v *= 2
          if (v > 9) v -= 9
        }
        suma += v
      }
      const mod = suma % 10
      const res = mod === 0 ? 0 : 10 - mod
      if (res !== parseInt(valor.charAt(9), 10))
        return `La Cédula de ${nombreCampo} es incorrecta. No pasa la validación SRI.`
    }

    // Lógica para RUC (13 dígitos - Diferentes Módulos)
    if (tipo === "R") {
      if (valor.length !== 13) return `El RUC de ${nombreCampo} debe tener exactamente 13 dígitos.`
      if (!valor.endsWith("001")) return `El RUC de ${nombreCampo} debe terminar en 001.`

      if (d3 < 6) {
        // RUC Persona Natural (Módulo 10)
        let suma = 0
        for (let i = 0; i < 9; i++) {
          let v = parseInt(valor.charAt(i), 10)
          if (i % 2 === 0) {
            v *= 2
            if (v > 9) v -= 9
          }
          suma += v
        }
        const mod = suma % 10
        const res = mod === 0 ? 0 : 10 - mod
        if (res !== parseInt(valor.charAt(9), 10)) return `El RUC (Natural) de ${nombreCampo} es incorrecto.`
      } else if (d3 === 6) {
        // RUC Entidad Pública (Módulo 11)
        let suma = 0
        const coef = [3, 2, 7, 6, 5, 4, 3, 2]
        for (let i = 0; i < 8; i++) suma += parseInt(valor.charAt(i), 10) * coef[i]
        const mod = suma % 11
        const res = mod === 0 ? 0 : 11 - mod
        if (res !== parseInt(valor.charAt(8), 10)) return `El RUC (Público) de ${nombreCampo} es incorrecto.`
      } else if (d3 === 9) {
        // RUC Sociedad Privada (Módulo 11)
        let suma = 0
        const coef = [4, 3, 2, 7, 6, 5, 4, 3, 2]
        for (let i = 0; i < 9; i++) suma += parseInt(valor.charAt(i), 10) * coef[i]
        const mod = suma % 11
        const res = mod === 0 ? 0 : 11 - mod
        if (res !== parseInt(valor.charAt(9), 10)) return `El RUC (Privado) de ${nombreCampo} es incorrecto.`
      } else {
        return `El tercer dígito del RUC de ${nombreCampo} es inválido.`
      }
    }
    return null
  }

  const handleGuardar = async () => {
    if (!maestro.clinombre || (modo === "NEW" && !maestro.clicodigo && !permisos.autoCodigoCliente)) {
      return Swal.fire("Datos Incompletos", "El nombre/razón social es obligatorio.", "warning")
    }

    let errorIden = validarIdentificacion(maestro.cliidentifica, maestro.cliruc, "Cliente Principal")
    if (errorIden) return Swal.fire("Identificación Inválida", errorIden, "error")

    if (maestro.clirucmatriz) {
      errorIden = validarIdentificacion("R", maestro.clirucmatriz, "Empresa Matriz")
      if (errorIden) return Swal.fire("Identificación Inválida", errorIden, "error")
    }

    if (maestro.cliidenrep !== "O" && maestro.clirucrepres) {
      errorIden = validarIdentificacion(maestro.cliidenrep, maestro.clirucrepres, "Representante Legal")
      if (errorIden) return Swal.fire("Identificación Inválida", errorIden, "error")
    }

    if (maestro.cliidencon !== "O" && maestro.cliruccon) {
      errorIden = validarIdentificacion(maestro.cliidencon, maestro.cliruccon, "Cónyuge")
      if (errorIden) return Swal.fire("Identificación Inválida", errorIden, "error")
    }

    const maestroSanitizado = { ...maestro }
    const fkFields = [
      "sectorcodigo",
      "activicodigo",
      "procodigo",
      "ciucodigo",
      "zoncodigo",
      "regcodigo",
      "tipcodigo",
      "usrcodigo",
      "calfcodigo",
      "parrocodigo",
    ]
    fkFields.forEach((f) => {
      if (maestroSanitizado[f] === "") maestroSanitizado[f] = null
    })

    const payload = {
      modo,
      maestro: maestroSanitizado,
      hijos: { agencias, contactos, referencias, vendedores, descuentosLinea, descuentosArticulo },
    }

    setIsLoading(true)
    try {
      const resReq = await fetchwrapper("/CreacionCliente/guardarCliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const res = await resReq.json()

      if (res?.success) {
        Swal.fire({ title: "¡Guardado Exitoso!", icon: "success", confirmButtonColor: "#196C87" }).then(() =>
          navigate(-1),
        )
      } else {
        Swal.fire("Error al Guardar", res.message, "error")
      }
    } catch (error) {
      Swal.fire("Error", "Fallo la comunicación con el servidor.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Imágenes
  const handleUploadImagen = async (e) => {
    if (modo === "NEW") return Swal.fire("Aviso", "Debe guardar el cliente primero para adjuntar imágenes.", "info")
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append("clicodigo", maestro.clicodigo)
    formData.append("imagen", file)
    setIsLoading(true)
    try {
      const resReq = await fetchwrapper(
        "/CreacionCliente/uploadImagenCliente",
        { method: "POST", body: formData },
        true,
      )
      const res = await resReq.json()
      if (res.success) fetchImagenes(maestro.clicodigo)
      else Swal.fire("Error", res.message, "error")
    } catch (err) {
      Swal.fire("Error", "No se pudo subir la imagen", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteImagen = async (secuencia) => {
    const confirm = await Swal.fire({ title: "¿Eliminar Imagen?", icon: "warning", showCancelButton: true })
    if (!confirm.isConfirmed) return
    setIsLoading(true)
    try {
      const resReq = await fetchwrapper("/CreacionCliente/deleteImagenCliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clicodigo: maestro.clicodigo, secuencia }),
      })
      const res = await resReq.json()
      if (res.success) fetchImagenes(maestro.clicodigo)
    } catch (err) {
      Swal.fire("Error", "No se pudo eliminar", "error")
    } finally {
      setIsLoading(false)
    }
  }

  // =================================================================
  // GENERADORES DE COLUMNAS PARA DATAGRIDS
  // =================================================================
  const createActionsColumn = (rowModesModel, setRowModesModel, dataList, setDataList) => ({
    field: "actions",
    type: "actions",
    headerName: "Acc.",
    width: 80,
    getActions: ({ id }) => {
      const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit
      if (isInEditMode) {
        return [
          <GridActionsCellItem
            key={`save-${id}`}
            icon={<SaveIcon />}
            label="Guardar"
            onClick={() => setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } })}
          />,
          <GridActionsCellItem
            key={`cancel-${id}`}
            icon={<CancelIcon />}
            label="Cancelar"
            onClick={() =>
              setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View, ignoreModifications: true } })
            }
          />,
        ]
      }
      return [
        <GridActionsCellItem
          key={`edit-${id}`}
          icon={<EditIcon />}
          label="Editar"
          onClick={() => setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } })}
        />,
        <GridActionsCellItem
          key={`delete-${id}`}
          icon={<DeleteIcon />}
          label="Eliminar"
          onClick={() => setDataList(dataList.filter((row) => row.id !== id))}
        />,
      ]
    },
  })

  const ToolbarBtn = ({ label, onClick }) => (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={onClick}>
        {label}
      </Button>
    </GridToolbarContainer>
  )

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <CustomBackdrop isLoading={isLoading} />

      <div className="main main-app p-2 p-lg-3" style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          p={2}
          bgcolor="white"
          borderRadius={2}
          boxShadow={1}
        >
          <Box display="flex" alignItems="center">
            <BackIcon />
            <Typography variant="h5" fontWeight="bold" color="primary.main" ml={2}>
              {modo === "NEW" ? "Crear Nuevo Cliente" : `Editando Cliente: ${maestro.clicodigo || ""}`}
            </Typography>
          </Box>

          {grabarAction ? (
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={getIconComponent(grabarAction.accnameicono, grabarAction.acctipoico)}
              onClick={handleGuardar}
              sx={{ fontWeight: "bold", px: 4, py: 1 }}
            >
              {grabarAction.acccaption}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleGuardar}
              sx={{ fontWeight: "bold", px: 4, py: 1 }}
            >
              GRABAR CLIENTE
            </Button>
          )}
        </Box>

        <StyledRoot>
          {/* ======================= ACORDEÓN 1: GENERALES ======================= */}
          <Accordion defaultExpanded elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#e1f5fe" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.dark">
                1. Generales y Ubicación
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} pt={1}>
                {modo === "NEW" && (
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label={
                        permisos.autoCodigoCliente ? "Cód. Cliente (Automático)" : "Cód. Cliente (Digite un código)"
                      }
                      value={maestro.clicodigo}
                      disabled={permisos.autoCodigoCliente}
                      onChange={(e) => handleMaestroChange("clicodigo", e.target.value)}
                      size="small"
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de Ident."
                    value={maestro.cliidentifica || ""}
                    onChange={(e) => handleMaestroChange("cliidentifica", e.target.value)}
                    size="small"
                  >
                    {opcIdentificacion.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Nº Identificación"
                    value={maestro.cliruc || ""}
                    onChange={(e) => handleMaestroChange("cliruc", e.target.value)}
                    size="small"
                    inputProps={{ maxLength: 13 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Estado"
                    value={maestro.clistatus || ""}
                    onChange={(e) => handleMaestroChange("clistatus", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="A">ACTIVO</MenuItem>
                    <MenuItem value="P">POTENCIAL</MenuItem>
                    <MenuItem value="I">INACTIVO</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label="Razón Social / Nombre"
                    value={maestro.clinombre || ""}
                    onChange={(e) => handleMaestroChange("clinombre", e.target.value.toUpperCase())}
                    size="small"
                    required
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="RUC Matriz (Si aplica)"
                    value={maestro.clirucmatriz || ""}
                    onChange={(e) => handleMaestroChange("clirucmatriz", e.target.value)}
                    size="small"
                    inputProps={{ maxLength: 13 }}
                  />
                </Grid>
                <Grid item xs={12} md={9}>
                  <TextField
                    fullWidth
                    label="Nombre Matriz (Si aplica)"
                    value={maestro.clinommatriz || ""}
                    onChange={(e) => handleMaestroChange("clinommatriz", e.target.value.toUpperCase())}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ fontSize: "0.8rem" }}>
                      Tipo de Domicilio
                    </FormLabel>
                    <RadioGroup
                      row
                      value={maestro.clitipodomicilio || ""}
                      onChange={(e) => handleMaestroChange("clitipodomicilio", e.target.value)}
                    >
                      <FormControlLabel value="P" control={<Radio size="small" />} label="Propio" />
                      <FormControlLabel value="A" control={<Radio size="small" />} label="Arrienda" />
                      <FormControlLabel value="F" control={<Radio size="small" />} label="Familiar" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tiempo de Residencia"
                    value={maestro.clitiempodomicilio || ""}
                    onChange={(e) => handleMaestroChange("clitiempodomicilio", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observaciones Adicionales"
                    value={maestro.cliobserva || ""}
                    onChange={(e) => handleMaestroChange("cliobserva", e.target.value.toUpperCase())}
                    multiline
                    rows={3}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label="Referencia rápido Ubicación"
                    value={maestro.cliubicacionrapido || ""}
                    onChange={(e) => handleMaestroChange("cliubicacionrapido", e.target.value.toUpperCase())}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label="Dirección Domicilio"
                    value={maestro.clidirec || ""}
                    onChange={(e) => handleMaestroChange("clidirec", e.target.value.toUpperCase())}
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Actividad Económica"
                    value={maestro.activicodigo || ""}
                    onChange={(e) => handleMaestroChange("activicodigo", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {catalogos.actividades?.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Sector Público"
                    value={maestro.sectorcodigo || ""}
                    onChange={(e) => handleMaestroChange("sectorcodigo", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {catalogos.sectores?.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Profesión"
                    value={maestro.cliprofesion || ""}
                    onChange={(e) => handleMaestroChange("cliprofesion", e.target.value)}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Teléfono 1"
                    value={maestro.clitelef1 || ""}
                    onChange={(e) => handleMaestroChange("clitelef1", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Teléfono 2"
                    value={maestro.clitelef2 || ""}
                    onChange={(e) => handleMaestroChange("clitelef2", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Fax"
                    value={maestro.clifax || ""}
                    onChange={(e) => handleMaestroChange("clifax", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Celular"
                    value={maestro.cliintersec || ""}
                    onChange={(e) => handleMaestroChange("cliintersec", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={maestro.cliemail || ""}
                    onChange={(e) => handleMaestroChange("cliemail", e.target.value.toLowerCase())}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Web Site"
                    value={maestro.website || ""}
                    onChange={(e) => handleMaestroChange("website", e.target.value.toLowerCase())}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de Cliente"
                    value={maestro.tipcodigo || ""}
                    onChange={(e) => handleMaestroChange("tipcodigo", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {catalogos.tiposCliente?.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Estado Civil"
                    value={maestro.cliestciv || ""}
                    onChange={(e) => handleMaestroChange("cliestciv", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {opcEstCiv.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fec. Const/Nacimiento"
                    value={maestro.clifecnac || ""}
                    onChange={(e) => handleMaestroChange("clifecnac", e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    select
                    fullWidth
                    label="Sexo"
                    value={maestro.clisexo || ""}
                    onChange={(e) => handleMaestroChange("clisexo", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {opcSexo.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    select
                    fullWidth
                    label="Persona"
                    value={maestro.clipersona || ""}
                    onChange={(e) => handleMaestroChange("clipersona", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {opcPersona.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Origen de Ingresos"
                    value={maestro.cliorigening || ""}
                    onChange={(e) => handleMaestroChange("cliorigening", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {opcOrigenIng.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Calificación"
                    value={maestro.calfcodigo || ""}
                    onChange={(e) => handleMaestroChange("calfcodigo", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {catalogos.calificaciones?.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={maestro.cliparterel !== 0}
                        onChange={(e) => handleMaestroChange("cliparterel", e.target.checked ? -1 : 0)}
                      />
                    }
                    label="Parte Relacionada (ATS)"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={maestro.cliconespecial !== 0}
                        onChange={(e) => handleMaestroChange("cliconespecial", e.target.checked ? -1 : 0)}
                        color="secondary"
                      />
                    }
                    label="Contribuyente Especial"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 2: CRÉDITO ======================= */}
          <Accordion
            elevation={2}
            sx={{
              mb: 2,
              borderRadius: 2,
              borderLeft: permisos.modificarCredito ? "4px solid #2E7D32" : "4px solid #9e9e9e",
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                2. Crédito, Oficial y Referencias
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {!permisos.modificarCredito && (
                <Typography color="error" variant="caption" display="block" mb={2}>
                  * Su usuario no tiene permisos para modificar crédito.
                </Typography>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Plazo Máx (Días)"
                    disabled={!permisos.modificarCredito}
                    value={maestro.clidiascrs}
                    onChange={(e) => handleMaestroChange("clidiascrs", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cupo Crédito ($)"
                    disabled={!permisos.modificarCredito}
                    value={maestro.climontocrs}
                    onChange={(e) => handleMaestroChange("climontocrs", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Lista de Precios"
                    disabled={!permisos.modificarCredito}
                    value={maestro.cliprefac}
                    onChange={(e) => handleMaestroChange("cliprefac", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Oficial de Crédito"
                    value={maestro.usrcodigo || ""}
                    onChange={(e) => handleMaestroChange("usrcodigo", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {catalogos.oficialesCredito?.map((o, idx) => (
                      <MenuItem key={`ofi_${o.value || o.id || idx}`} value={o.value || o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={maestro.clibloqueo !== 0}
                        onChange={(e) => handleMaestroChange("clibloqueo", e.target.checked ? -1 : 0)}
                        disabled={!permisos.modificarCredito}
                      />
                    }
                    label="Bloqueo Crédito"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={maestro.cliapliiva !== 0}
                        onChange={(e) => handleMaestroChange("cliapliiva", e.target.checked ? -1 : 0)}
                        color="secondary"
                      />
                    }
                    label="Aplica I.V.A."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption">Datos del Representante Legal (Obligatorio para Crédito)</Typography>
                  </Divider>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Id. Representante"
                    value={maestro.cliidenrep || ""}
                    onChange={(e) => handleMaestroChange("cliidenrep", e.target.value)}
                    size="small"
                  >
                    {opcIdentificacion.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Nº Identificación Rep."
                    value={maestro.clirucrepres || ""}
                    onChange={(e) => handleMaestroChange("clirucrepres", e.target.value)}
                    size="small"
                    inputProps={{ maxLength: 13 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre Representante Legal"
                    value={maestro.clirepres || ""}
                    onChange={(e) => handleMaestroChange("clirepres", e.target.value.toUpperCase())}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption">Referencias Personales / Familiares</Typography>
                  </Divider>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Referencia 1"
                    value={maestro.clireferencia1 || ""}
                    onChange={(e) => handleMaestroChange("clireferencia1", e.target.value.toUpperCase())}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Parentesco 1"
                    value={maestro.cliparentesco1 || ""}
                    onChange={(e) => handleMaestroChange("cliparentesco1", e.target.value.toUpperCase())}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Teléfono 1"
                    value={maestro.clireftelefono1 || ""}
                    onChange={(e) => handleMaestroChange("clireftelefono1", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Referencia 2"
                    value={maestro.clireferencia2 || ""}
                    onChange={(e) => handleMaestroChange("clireferencia2", e.target.value.toUpperCase())}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Parentesco 2"
                    value={maestro.cliparentesco2 || ""}
                    onChange={(e) => handleMaestroChange("cliparentesco2", e.target.value.toUpperCase())}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Teléfono 2"
                    value={maestro.clireftelefono2 || ""}
                    onChange={(e) => handleMaestroChange("clireftelefono2", e.target.value)}
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* DataGrid Referencias Bancarias */}
              <Box sx={{ height: 250, mt: 3 }}>
                <Typography variant="subtitle2" color="primary">
                  Referencias Bancarias / Tarjetas
                </Typography>
                <DataGrid
                  rows={referencias}
                  editMode="row"
                  rowModesModel={rowModesRef}
                  onRowModesModelChange={setRowModesRef}
                  processRowUpdate={(newRow) => {
                    const updatedRow = { ...newRow, isNew: false }
                    setReferencias(referencias.map((r) => (r.id === newRow.id ? updatedRow : r)))
                    return updatedRow
                  }}
                  slots={{
                    toolbar: () => (
                      <ToolbarBtn
                        label="Añadir Referencia Bancaria"
                        onClick={() => {
                          const id = `nr_${Date.now()}`
                          setReferencias((old) => [
                            ...old,
                            { id, bcotipo: "", bcocodigo: "", bconumcta: "", boccalifi: "", isNew: true },
                          ])
                          setRowModesRef((old) => ({
                            ...old,
                            [id]: { mode: GridRowModes.Edit, fieldToFocus: "bcotipo" },
                          }))
                        }}
                      />
                    ),
                  }}
                  columns={[
                    {
                      field: "bcotipo",
                      headerName: "Tipo",
                      width: 130,
                      editable: true,
                      type: "singleSelect",
                      valueOptions: ["CORRIENTE", "AHORROS", "TARJETA"],
                    },
                    {
                      field: "bcocodigo",
                      headerName: "Banco / Tarjeta",
                      width: 250,
                      editable: true,
                      type: "singleSelect",
                      valueOptions: mapToValueLabel(catalogos.bancos),
                    },
                    { field: "bconumcta", headerName: "Nº Cuenta/Tarjeta", width: 180, editable: true },
                    { field: "boccalifi", headerName: "Calificación", width: 100, editable: true },
                    {
                      field: "bcofecape",
                      headerName: "Fec. Apertura",
                      type: "date",
                      width: 130,
                      editable: true,
                      valueGetter: (params) => (params.value ? new Date(params.value) : null),
                    },
                    createActionsColumn(rowModesRef, setRowModesRef, referencias, setReferencias),
                  ]}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 3: UBICACIÓN Y VENDEDORES ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                3. Vendedor / Ubicación (Rutas)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Región"
                    value={maestro.regcodigo || ""}
                    onChange={(e) => handleMaestroChange("regcodigo", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {catalogos.regiones?.map((o) => (
                      <MenuItem key={`reg_${o.id}`} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Zona Comercial"
                    value={maestro.zoncodigo || ""}
                    onChange={(e) => handleMaestroChange("zoncodigo", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {catalogos.zonas?.map((o) => (
                      <MenuItem key={`zon_${o.id || o.value}`} value={o.id || o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Provincia"
                    value={maestro.procodigo || ""}
                    onChange={(e) => handleMaestroChange("procodigo", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {catalogos.provincias?.map((o) => (
                      <MenuItem key={`pro_${o.id}`} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Cantón / Ciudad"
                    value={maestro.ciucodigo || ""}
                    onChange={(e) => handleMaestroChange("ciucodigo", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {catalogos.ciudades?.map((o) => (
                      <MenuItem key={`ciu_${o.id}`} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Parroquia (DINARDAP)"
                    value={maestro.parrocodigo || ""}
                    onChange={(e) => handleMaestroChange("parrocodigo", e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {catalogos.parroquias?.map((o) => (
                      <MenuItem key={`par_${o.id}`} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ height: 250, mt: 1 }}>
                    <DataGrid
                      rows={vendedores}
                      editMode="row"
                      rowModesModel={rowModesVen}
                      onRowModesModelChange={setRowModesVen}
                      processRowUpdate={(newRow) => {
                        const updatedRow = { ...newRow, isNew: false }
                        setVendedores(vendedores.map((r) => (r.id === newRow.id ? updatedRow : r)))
                        return updatedRow
                      }}
                      slots={{
                        toolbar: () => (
                          <ToolbarBtn
                            label="Añadir Vendedor"
                            onClick={() => {
                              const id = `nv_${Date.now()}`
                              setVendedores((old) => [...old, { id, vencodigo: "", loccodigo: "", isNew: true }])
                              setRowModesVen((old) => ({
                                ...old,
                                [id]: { mode: GridRowModes.Edit, fieldToFocus: "vencodigo" },
                              }))
                            }}
                          />
                        ),
                      }}
                      columns={[
                        {
                          field: "vencodigo",
                          headerName: "Vendedor Asignado",
                          width: 250,
                          editable: true,
                          type: "singleSelect",
                          valueOptions: mapToValueLabel(catalogos.vendedores),
                        },
                        {
                          field: "loccodigo",
                          headerName: "Localidad",
                          width: 250,
                          editable: true,
                          type: "singleSelect",
                          valueOptions: mapToValueLabel(catalogos.localidades),
                        },
                        createActionsColumn(rowModesVen, setRowModesVen, vendedores, setVendedores),
                      ]}
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 4: AGENCIAS Y CONTACTOS ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                4. Agencias y Contactos
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary">
                    Agencias / Sucursales
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <DataGrid
                      rows={agencias}
                      editMode="row"
                      rowModesModel={rowModesAg}
                      onRowModesModelChange={setRowModesAg}
                      processRowUpdate={(newRow) => {
                        const updatedRow = { ...newRow, isNew: false }
                        setAgencias(agencias.map((r) => (r.id === newRow.id ? updatedRow : r)))
                        return updatedRow
                      }}
                      slots={{
                        toolbar: () => (
                          <ToolbarBtn
                            label="Añadir Agencia"
                            onClick={() => {
                              const id = `na_${Date.now()}`
                              setAgencias((old) => [
                                ...old,
                                {
                                  id,
                                  agencodigo: "",
                                  agendescri: "",
                                  agendirec: "",
                                  agentelef1: "",
                                  agenemail: "",
                                  isNew: true,
                                },
                              ])
                              setRowModesAg((old) => ({
                                ...old,
                                [id]: { mode: GridRowModes.Edit, fieldToFocus: "agencodigo" },
                              }))
                            }}
                          />
                        ),
                      }}
                      columns={[
                        { field: "agencodigo", headerName: "Código", width: 90, editable: true },
                        { field: "agendescri", headerName: "Nombre de Agencia", width: 180, editable: true },
                        { field: "agendirec", headerName: "Dirección", width: 200, editable: true },
                        { field: "agentelef1", headerName: "Teléfono 1", width: 120, editable: true },
                        { field: "agenemail", headerName: "Email", width: 180, editable: true },
                        {
                          field: "regcodigo",
                          headerName: "Región",
                          width: 150,
                          editable: true,
                          type: "singleSelect",
                          valueOptions: mapToValueLabel(catalogos.regiones),
                        },
                        {
                          field: "procodigo",
                          headerName: "Provincia",
                          width: 150,
                          editable: true,
                          type: "singleSelect",
                          valueOptions: mapToValueLabel(catalogos.provincias),
                        },
                        {
                          field: "ciucodigo",
                          headerName: "Ciudad",
                          width: 150,
                          editable: true,
                          type: "singleSelect",
                          valueOptions: mapToValueLabel(catalogos.ciudades),
                        },
                        {
                          field: "zoncodigo",
                          headerName: "Zona",
                          width: 150,
                          editable: true,
                          type: "singleSelect",
                          valueOptions: mapToValueLabel(catalogos.zonas),
                        },
                        createActionsColumn(rowModesAg, setRowModesAg, agencias, setAgencias),
                      ]}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" mt={2}>
                    Contactos
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <DataGrid
                      rows={contactos}
                      editMode="row"
                      rowModesModel={rowModesCo}
                      onRowModesModelChange={setRowModesCo}
                      processRowUpdate={(newRow) => {
                        const updatedRow = { ...newRow, isNew: false }
                        setContactos(contactos.map((r) => (r.id === newRow.id ? updatedRow : r)))
                        return updatedRow
                      }}
                      slots={{
                        toolbar: () => (
                          <ToolbarBtn
                            label="Añadir Contacto"
                            onClick={() => {
                              const id = `nc_${Date.now()}`
                              setContactos((old) => [
                                ...old,
                                {
                                  id,
                                  agencodigo: "",
                                  condescri: "",
                                  concargo: "",
                                  contelef1: "",
                                  concelular: "",
                                  conemail: "",
                                  concomenta: "",
                                  isNew: true,
                                },
                              ])
                              setRowModesCo((old) => ({
                                ...old,
                                [id]: { mode: GridRowModes.Edit, fieldToFocus: "agencodigo" },
                              }))
                            }}
                          />
                        ),
                      }}
                      columns={[
                        { field: "agencodigo", headerName: "Cod. Agencia", width: 100, editable: true },
                        { field: "condescri", headerName: "Nombre Contacto", width: 180, editable: true },
                        { field: "concargo", headerName: "Cargo", width: 120, editable: true },
                        { field: "contelef1", headerName: "Teléfono", width: 120, editable: true },
                        { field: "concelular", headerName: "Celular", width: 120, editable: true },
                        { field: "conemail", headerName: "Email", width: 160, editable: true },
                        {
                          field: "areadescri",
                          headerName: "Área de Trabajo",
                          width: 160,
                          editable: true,
                          type: "singleSelect",
                          valueOptions: mapToValueLabel(catalogos.areasTrabajo),
                        },
                        { field: "concomenta", headerName: "Comentario", width: 200, editable: true },
                        createActionsColumn(rowModesCo, setRowModesCo, contactos, setContactos),
                      ]}
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 5: DESCUENTOS ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                5. Descuentos
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">
                    Descuentos por Línea / Marca
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <DataGrid
                      rows={descuentosLinea}
                      editMode="row"
                      rowModesModel={rowModesDL}
                      onRowModesModelChange={setRowModesDL}
                      processRowUpdate={(newRow) => {
                        const updatedRow = { ...newRow, isNew: false }
                        setDescuentosLinea(descuentosLinea.map((r) => (r.id === newRow.id ? updatedRow : r)))
                        return updatedRow
                      }}
                      slots={{
                        toolbar: () => (
                          <ToolbarBtn
                            label="Añadir Desc. Línea"
                            onClick={() => {
                              const id = `ndl_${Date.now()}`
                              setDescuentosLinea((old) => [
                                ...old,
                                { id, lincodigo: "", desporcentaje: 0, isNew: true },
                              ])
                              setRowModesDL((old) => ({
                                ...old,
                                [id]: { mode: GridRowModes.Edit, fieldToFocus: "lincodigo" },
                              }))
                            }}
                          />
                        ),
                      }}
                      columns={[
                        {
                          field: "lincodigo",
                          headerName: "Línea",
                          width: 180,
                          editable: true,
                          type: "singleSelect",
                          valueOptions: mapToValueLabel(catalogos.lineas),
                        },
                        {
                          field: "marcodigo",
                          headerName: "Marca",
                          width: 180,
                          editable: true,
                          type: "singleSelect",
                          valueOptions: mapToValueLabel(catalogos.marcas),
                        },
                        { field: "desporcentaje", headerName: "% Desc", type: "number", width: 100, editable: true },
                        { field: "deslistaprecio", headerName: "Lista", type: "number", width: 80, editable: true },
                        createActionsColumn(rowModesDL, setRowModesDL, descuentosLinea, setDescuentosLinea),
                      ]}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">
                    Descuentos por Artículo
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <DataGrid
                      rows={descuentosArticulo}
                      editMode="row"
                      rowModesModel={rowModesDA}
                      onRowModesModelChange={setRowModesDA}
                      processRowUpdate={(newRow) => {
                        const updatedRow = { ...newRow, isNew: false }
                        setDescuentosArticulo(descuentosArticulo.map((r) => (r.id === newRow.id ? updatedRow : r)))
                        return updatedRow
                      }}
                      slots={{
                        toolbar: () => (
                          <ToolbarBtn
                            label="Añadir Desc. Artículo"
                            onClick={() => {
                              const id = `nda_${Date.now()}`
                              setDescuentosArticulo((old) => [
                                ...old,
                                { id, artcodigo: "", desporcentaje: 0, isNew: true },
                              ])
                              setRowModesDA((old) => ({
                                ...old,
                                [id]: { mode: GridRowModes.Edit, fieldToFocus: "artcodigo" },
                              }))
                            }}
                          />
                        ),
                      }}
                      columns={[
                        {
                          field: "artcodigo",
                          headerName: "Artículo",
                          width: 250,
                          editable: true,
                          type: "singleSelect",
                          valueOptions: mapToValueLabel(catalogos.articulos),
                        },
                        { field: "desporcentaje", headerName: "% Desc", type: "number", width: 100, editable: true },
                        { field: "deslistaprecio", headerName: "Lista", type: "number", width: 80, editable: true },
                        createActionsColumn(rowModesDA, setRowModesDA, descuentosArticulo, setDescuentosArticulo),
                      ]}
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 6: OTROS Y CONYUGE ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                6. Otros Datos / Cónyuge
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary">
                    Datos del Cónyuge
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Id. Cónyuge"
                    value={maestro.cliidencon || ""}
                    onChange={(e) => handleMaestroChange("cliidencon", e.target.value)}
                    size="small"
                  >
                    {opcIdentificacion.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Nº Identificación"
                    value={maestro.cliruccon || ""}
                    onChange={(e) => handleMaestroChange("cliruccon", e.target.value)}
                    size="small"
                    inputProps={{ maxLength: 13 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    value={maestro.clinombrecon || ""}
                    onChange={(e) => handleMaestroChange("clinombrecon", e.target.value.toUpperCase())}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    value={maestro.clidireccon || ""}
                    onChange={(e) => handleMaestroChange("clidireccon", e.target.value.toUpperCase())}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Profesión"
                    value={maestro.cliprofesioncon || ""}
                    onChange={(e) => handleMaestroChange("cliprofesioncon", e.target.value.toUpperCase())}
                    size="small"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 7: HISTORIAL ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                7. Historial / Auditoría
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ height: 300 }}>
                <DataGrid
                  rows={historial}
                  disableRowSelectionOnClick
                  columns={[
                    { field: "obsusuisys", headerName: "Usuario", width: 120 },
                    { field: "obsfecisys", headerName: "Fecha", width: 120 },
                    { field: "obshorisys", headerName: "Hora", width: 120 },
                    { field: "obsestisys", headerName: "Estación", width: 150 },
                    { field: "obsobserva", headerName: "Observación / Acción", width: 450 },
                  ]}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* ======================= ACORDEÓN 8: IMÁGENES ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                8. Imágenes
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} display="flex" alignItems="center">
                  <Button variant="contained" component="label" startIcon={<CloudUploadIcon />} color="primary">
                    Subir Imagen
                    <input type="file" hidden accept="image/*" onChange={handleUploadImagen} />
                  </Button>
                  <Typography variant="caption" ml={2} color="textSecondary">
                    * Debe grabar el cliente primero para poder adjuntar imágenes.
                  </Typography>
                </Grid>
                <Grid item xs={12} container spacing={2} mt={1}>
                  {imagenes.map((img) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={img.secuencia}>
                      <Paper elevation={3} sx={{ p: 1, position: "relative" }}>
                        <img
                          src={img.imagenBase64}
                          alt={`Cliente ${img.secuencia}`}
                          style={{ width: "100%", height: "200px", objectFit: "contain" }}
                        />
                        <Typography variant="caption" display="block" align="center" mt={1}>
                          Sec: {img.secuencia} | {img.fecha}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          sx={{ position: "absolute", top: 5, right: 5, bgcolor: "rgba(255,255,255,0.7)" }}
                          onClick={() => handleDeleteImagen(img.secuencia)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                  {imagenes.length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" align="center">
                        No hay imágenes registradas.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </StyledRoot>
      </div>
    </ThemeProvider>
  )
}

export default CrearCreacionClientes
