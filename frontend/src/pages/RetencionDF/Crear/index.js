/* eslint-disable camelcase */
import React, { useState, useEffect } from "react"
import Header from "../../../layouts/Header"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import { useQuery } from "@tanstack/react-query"
import { ThemeProvider, styled, createTheme } from "@mui/material/styles"
import Swal from "sweetalert2"
import {
  Box,
  InputLabel,
  Typography,
  Button,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Divider,
} from "@mui/material"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api } from "../../../api"
import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"
import CustomTextFieldReadable from "../../../components/CustomTextFieldReadable"
import BackIcon from "../../../components/BackIcon"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import SearchIcon from "@mui/icons-material/Search"
import SaveIcon from "@mui/icons-material/Save"
import { useNavigate } from "react-router-dom"

const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(8),
  flexGrow: 1,
  padding: "0 16px",
  height: "100vh",
}))

const theme = createTheme({
  palette: { primary: { main: "#196C87" }, secondary: { main: "#196C87" } },
})

const ContainerCabecera = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto",
  gridTemplateAreas: `"Codigo Codigo Codigo Caja Caja Caja Caja Caja . . . ."`,
  gap: "12px",
  alignItems: "center",
}))

const ContainerSRI = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto auto auto",
  gridTemplateAreas: `
    "Clave Clave Clave Clave Clave Clave Clave Clave Clave BtnBuscar BtnBuscar BtnBuscar"
    "Ruc Ruc Ruc Nombre Nombre Nombre Nombre Nombre Nombre Email Email Email"
    "Doc Doc Doc Fecha Fecha Fecha Base0 Base0 BaseGrav BaseGrav Iva Iva"
  `,
  gap: "12px",
  alignItems: "center",
}))

const extractArrayData = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data
  return []
}

const CrearRetencionDF = () => {
  const navigate = useNavigate()
  const [expandedInfoGeneral, setExpandedInfoGeneral] = useState(true)
  const [expandedInfoSRI, setExpandedInfoSRI] = useState(true)
  const [codigoDocumento, setCodigoDocumento] = useState("Cargando...")

  // --- ESTADOS PRINCIPALES ---
  const [cabecera, setCabecera] = useState({ caja: { cjacodigo: "", cjadescri: "" } })
  const [claveAccesoInput, setClaveAccesoInput] = useState("")

  // Datos extraídos del SRI
  const [proveedor, setProveedor] = useState({ procodigo: "", proruc: "", pronombre: "", proemail: "" })
  const [factura, setFactura] = useState({
    establecimiento: "",
    punto_emision: "",
    secuencial: "",
    fecha_emision: "",
    clave_acceso: "",
  })
  const [montos, setMontos] = useState({ base_iva_0: 0, base_iva_grabado: 0, monto_iva: 0, total_sin_impuestos: 0 })

  const [detallesAgregados, setDetallesAgregados] = useState([])

  // --- QUERYS: CAJAS, CÓDIGO TEMPORAL E IMPUESTOS ---
  const { data: listaCajasRaw, isLoading: isLoadingCajas } = useQuery({
    queryKey: ["listaCajasRet"],
    queryFn: async () => {
      const res = await fetchwrapper("/RetencionDF/getCajas", { method: "GET" }).then((r) => r.json())
      return extractArrayData(res)
    },
    refetchOnWindowFocus: false,
  })
  const listaCajas = Array.isArray(listaCajasRaw) ? listaCajasRaw : []

  const {
    data: codigoTemporal,
    isLoading: isLoadingCodigo,
    isError: isErrorCodigo,
    error: errorCodigo,
  } = useQuery({
    queryKey: ["CodigoTemporalRet", cabecera.caja.cjacodigo],
    queryFn: async () => {
      const res = await fetchwrapper(`/RetencionDF/generarCodigoTemporal/${cabecera.caja.cjacodigo}`, {
        method: "GET",
      }).then((r) => r.json())
      if (!res.success && res.message) throw new Error(res.message)
      return res.data?.data || res.data || ""
    },
    enabled: !!cabecera.caja.cjacodigo,
    refetchOnWindowFocus: false,
    retry: false,
  })

  useEffect(() => {
    if (codigoTemporal) setCodigoDocumento(codigoTemporal)
    else if (isErrorCodigo) setCodigoDocumento("Error")
  }, [codigoTemporal, isErrorCodigo, errorCodigo])

  const { data: listaImpuestosRaw, isLoading: isLoadingImpuestos } = useQuery({
    queryKey: ["listaImpuestosRet"],
    queryFn: async () => {
      const res = await fetchwrapper("/RetencionDF/getImpuestos", { method: "GET" }).then((r) => r.json())
      return extractArrayData(res)
    },
    refetchOnWindowFocus: false,
  })
  const listaImpuestos = Array.isArray(listaImpuestosRaw) ? listaImpuestosRaw : []

  // --- MUTACIONES ---
  const { mutateAsync: consultarSRI, isPending: isConsultando } = useMutation({
    mutationFn: async (clave) => {
      const response = await api.post("/RetencionDF/consultarFacturaSRI", { claveAcceso: clave })
      return response.data
    },
  })

  const { mutateAsync: guardarRetencion, isPending: isSaving } = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/RetencionDF/guardarRetencion", payload)
      return response.data
    },
  })

  // --- ACCIONES ---
  const handleBuscarClaveSRI = async () => {
    const clave = claveAccesoInput.trim()
    if (clave.length !== 49) {
      return Swal.fire("Atención", "La clave de acceso debe tener exactamente 49 dígitos.", "warning")
    }

    Swal.fire({
      title: "Consultando al SRI...",
      text: "Extrayendo XML de la factura",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    })

    try {
      const res = await consultarSRI(clave)
      if (res.success) {
        setProveedor(res.data.proveedor)
        setFactura(res.data.factura)
        setMontos(res.data.montos)
        setDetallesAgregados([]) // Limpiamos la grilla si busca otra factura
        Swal.close()
      } else {
        Swal.fire("Error", res.message, "error")
      }
    } catch (error) {
      Swal.fire("Error", error?.response?.data?.message || "Error de conexión con el SRI.", "error")
    }
  }

  const handleChangeImpuesto = (index, val) => {
    const newArr = [...detallesAgregados]
    if (val) {
      newArr[index].impid = val.impid
      newArr[index].descripcion = val.impdescri
      newArr[index].impretimp = val.impretimp // 'R' o 'I'
      newArr[index].porcentaje = val.impporcent
      newArr[index].codSRI = val.codSRI

      // Auto-calculamos la base según el tipo de impuesto seleccionado
      let base = 0
      if (val.impretimp === "R") base = montos.total_sin_impuestos
      if (val.impretimp === "I") base = montos.monto_iva

      newArr[index].baseImponible = base
      newArr[index].valorRetenido = Number((base * (val.impporcent / 100)).toFixed(2))
    } else {
      newArr[index] = {
        impid: "",
        descripcion: "",
        impretimp: "",
        baseImponible: 0,
        porcentaje: 0,
        valorRetenido: 0,
        codSRI: "",
      }
    }
    setDetallesAgregados(newArr)
  }

  const handleRecalcularFila = (index, nuevaBase) => {
    const newArr = [...detallesAgregados]
    const base = Number(nuevaBase) || 0
    newArr[index].baseImponible = base
    newArr[index].valorRetenido = Number((base * (newArr[index].porcentaje / 100)).toFixed(2))
    setDetallesAgregados(newArr)
  }

  const handleGuardar = async () => {
    if (!cabecera.caja.cjacodigo) return Swal.fire("Atención", "Seleccione una Caja emisora.", "warning")
    if (!proveedor.procodigo)
      return Swal.fire("Atención", "Debe buscar una factura válida en el SRI primero.", "warning")

    // CORRECCIÓN: Validamos que exista el impuesto y que la BASE IMPONIBLE sea > 0.
    // Esto permite que el valor retenido sea $0.00 para retenciones tipo 332 (0%).
    const validDetalles = detallesAgregados.filter((p) => p.impid && Number(p.baseImponible) > 0)

    if (validDetalles.length === 0)
      return Swal.fire(
        "Atención",
        "Debe agregar al menos un impuesto a retener con base imponible mayor a 0.",
        "warning",
      )

    Swal.fire({
      title: "¿Grabar Retención?",
      text: "El documento se guardará y estará listo para autorizarse.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, Grabar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: "Guardando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() })
        try {
          const docSustento = `${factura.establecimiento}-${factura.punto_emision}-${factura.secuencial}`
          const payload = {
            cjacodigo: cabecera.caja.cjacodigo,
            procodigo: proveedor.procodigo,
            proruc: proveedor.proruc,
            numDocSustento: docSustento,
            fechaEmisionDocSustento: factura.fecha_emision,
            detalles: validDetalles,
          }

          const res = await guardarRetencion(payload)
          if (res.success) {
            Swal.fire({
              icon: "success",
              title: "¡Retención Grabada!",
              html: `<p>Documento N°: <strong>${res.data?.retid || ""}</strong></p>`,
              confirmButtonText: "Aceptar",
            }).then(() => navigate(-1))
          } else {
            Swal.fire("Error", res.message, "error")
          }
        } catch (error) {
          Swal.fire("Error", error?.response?.data?.message || "Error al grabar.", "error")
        }
      }
    })
  }

  // --- CÁLCULO TOTALES ---
  const totales = detallesAgregados.reduce(
    (acc, curr) => {
      const val = Number(curr.valorRetenido) || 0
      if (curr.impretimp === "R") acc.renta += val
      if (curr.impretimp === "I") acc.iva += val
      acc.total += val
      return acc
    },
    { renta: 0, iva: 0, total: 0 },
  )

  return (
    <ThemeProvider theme={theme}>
      <CustomBackdrop
        isLoading={isLoadingCajas || isLoadingCodigo || isLoadingImpuestos || isConsultando || isSaving}
      />
      <Header />
      <div className="main main-app p-3 p-lg-4">
        {/* BARRA SUPERIOR CON BOTÓN DE GRABAR */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} mx={2}>
          <Box display="flex" alignItems="center">
            <BackIcon />
            <Typography variant="h5" fontWeight="bold" ml={2}>
              Emisión de Retención (07)
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleGuardar}
            sx={{ fontWeight: "bold", px: 4, py: 1.5, borderRadius: "8px" }}
          >
            GRABAR RETENCIÓN
          </Button>
        </Box>

        <StyledRoot sx={{ mt: 0 }}>
          {/* CAJA Y CÓDIGO */}
          <CustomFieldsetAccordion
            title="Parámetros de Emisión"
            expanded={expandedInfoGeneral}
            onToggle={() => setExpandedInfoGeneral(!expandedInfoGeneral)}
          >
            <ContainerCabecera>
              <Box sx={{ gridArea: "Codigo" }}>
                <CustomTextFieldReadable label="N° Comprobante a Generar" value={codigoDocumento} />
              </Box>
              <Box sx={{ gridArea: "Caja" }}>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Caja Emisora</InputLabel>
                <Autocomplete
                  size="small"
                  options={listaCajas}
                  getOptionLabel={(opt) => (opt?.cjacodigo ? `${opt.cjacodigo} - ${opt.cjadescri}` : "")}
                  onChange={(e, val) => setCabecera({ caja: val || { cjacodigo: "", cjadescri: "" } })}
                  renderInput={(params) => <TextField {...params} placeholder="Seleccione..." />}
                />
              </Box>
            </ContainerCabecera>
          </CustomFieldsetAccordion>
          <br />

          {/* CAZADOR SRI */}
          <CustomFieldsetAccordion
            title="Datos de la Factura (SRI)"
            expanded={expandedInfoSRI}
            onToggle={() => setExpandedInfoSRI(!expandedInfoSRI)}
          >
            <ContainerSRI>
              <Box sx={{ gridArea: "Clave" }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Pegue la Clave de Acceso (49 dígitos)"
                  variant="outlined"
                  value={claveAccesoInput}
                  onChange={(e) => setClaveAccesoInput(e.target.value.replace(/\D/g, "").slice(0, 49))}
                  inputProps={{ maxLength: 49, style: { letterSpacing: "2px", fontWeight: "bold" } }}
                />
              </Box>
              <Box sx={{ gridArea: "BtnBuscar" }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleBuscarClaveSRI}
                  startIcon={<SearchIcon />}
                  disabled={claveAccesoInput.length !== 49}
                >
                  BUSCAR EN SRI
                </Button>
              </Box>

              {/* Fila 2: Proveedor */}
              <Box sx={{ gridArea: "Ruc" }}>
                <CustomTextFieldReadable label="RUC Proveedor" value={proveedor.proruc} />
              </Box>
              <Box sx={{ gridArea: "Nombre" }}>
                <CustomTextFieldReadable label="Razón Social" value={proveedor.pronombre} />
              </Box>
              <Box sx={{ gridArea: "Email" }}>
                <CustomTextFieldReadable label="Correo (XML)" value={proveedor.proemail} />
              </Box>

              {/* Fila 3: Factura y Montos */}
              <Box sx={{ gridArea: "Doc" }}>
                <CustomTextFieldReadable
                  label="Factura Sustento"
                  value={
                    factura.secuencial
                      ? `${factura.establecimiento}-${factura.punto_emision}-${factura.secuencial}`
                      : ""
                  }
                />
              </Box>
              <Box sx={{ gridArea: "Fecha" }}>
                <CustomTextFieldReadable label="Fecha Emisión" value={factura.fecha_emision} />
              </Box>
              <Box sx={{ gridArea: "Base0" }}>
                <CustomTextFieldReadable
                  label="Base Imponible 0%"
                  value={montos.base_iva_0 ? `$${montos.base_iva_0.toFixed(2)}` : ""}
                />
              </Box>
              <Box sx={{ gridArea: "BaseGrav" }}>
                <CustomTextFieldReadable
                  label="Base Gravada"
                  value={montos.base_iva_grabado ? `$${montos.base_iva_grabado.toFixed(2)}` : ""}
                />
              </Box>
              <Box sx={{ gridArea: "Iva" }}>
                <CustomTextFieldReadable
                  label="Monto IVA"
                  value={montos.monto_iva ? `$${montos.monto_iva.toFixed(2)}` : ""}
                />
              </Box>
            </ContainerSRI>
          </CustomFieldsetAccordion>
          <br />

          {/* GRILLA DE IMPUESTOS */}
          <Paper sx={{ width: "100%", p: 2, mb: 4, borderRadius: "10px", border: "1px solid #ddd" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                Detalle de Impuestos a Retener
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                disabled={!proveedor.procodigo}
                onClick={() =>
                  setDetallesAgregados([
                    ...detallesAgregados,
                    {
                      impid: "",
                      descripcion: "",
                      impretimp: "",
                      baseImponible: 0,
                      porcentaje: 0,
                      valorRetenido: 0,
                      codSRI: "",
                    },
                  ])
                }
              >
                Añadir Fila
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell width="50px">Acción</TableCell>
                    <TableCell>Concepto de Retención (Catálogo)</TableCell>
                    <TableCell width="100px" align="center">
                      Tipo
                    </TableCell>
                    <TableCell width="150px" align="center">
                      Base Imponible ($)
                    </TableCell>
                    <TableCell width="100px" align="center">
                      % Retención
                    </TableCell>
                    <TableCell width="150px" align="right">
                      Valor Retenido ($)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detallesAgregados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          Haga clic en 'Añadir Fila' para registrar las retenciones aplicables.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    detallesAgregados.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => setDetallesAgregados(detallesAgregados.filter((_, i) => i !== index))}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>

                        <TableCell>
                          <Autocomplete
                            size="small"
                            options={listaImpuestos}
                            getOptionLabel={(opt) =>
                              opt?.impid ? `${opt.codSRI} - ${opt.impdescri} (${opt.impporcent}%)` : ""
                            }
                            onChange={(e, val) => handleChangeImpuesto(index, val)}
                            renderInput={(params) => <TextField {...params} placeholder="Buscar concepto SRI..." />}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={row.impretimp === "R" ? "primary" : "secondary"}
                          >
                            {row.impretimp === "R" ? "RENTA" : row.impretimp === "I" ? "IVA" : ""}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={row.baseImponible}
                            onChange={(e) => handleRecalcularFila(index, e.target.value)}
                            inputProps={{ min: 0, step: "0.01", style: { textAlign: "right" } }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Typography variant="body2">{row.porcentaje ? `${row.porcentaje}%` : "0%"}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="error">
                            ${row.valorRetenido.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* TOTALES GLOBALES */}
            <Box display="flex" justifyContent="flex-end" mt={3} pr={2}>
              <Box
                width="300px"
                sx={{ p: 2, backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #eee" }}
              >
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Total Retención Renta:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${totales.renta.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Total Retención IVA:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${totales.iva.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Total a Retener:</Typography>
                  <Typography variant="h6" color="error" fontWeight="bold">
                    ${totales.total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </StyledRoot>
      </div>
    </ThemeProvider>
  )
}

export default CrearRetencionDF
