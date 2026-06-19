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
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from "@mui/material"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api } from "../../../api"
import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"
import CustomDatePicker from "../../../components/CustomDatePicker"
import CustomTextFieldReadable from "../../../components/CustomTextFieldReadable"
import CustomTextField from "../../../components/CustomTextField"
import CustomHelperDetail from "../../../components/CustomHelperDetail"
import dayjs from "dayjs"
import BackIcon from "../../../components/BackIcon"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import { useNavigate } from "react-router-dom"
import VendedorAutocomplete from "../components/VendedorAutocomplete"

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
  gridTemplateRows: "auto auto",
  gridTemplateAreas: `
    "Codigo Codigo Caja Caja Caja Vendedor Vendedor Vendedor Vendedor Tipo Tipo Tipo"
    "FechaE FechaE FechaE Observacion Observacion Observacion Observacion Observacion Observacion Observacion Observacion Observacion"
  `,
  gap: "12px",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    gridTemplateAreas: `
      "Codigo Codigo Codigo Codigo Codigo Codigo Caja Caja Caja Caja Caja Caja"
      "Vendedor Vendedor Vendedor Vendedor Vendedor Vendedor Tipo Tipo Tipo Tipo Tipo Tipo"
      "FechaE FechaE FechaE FechaE FechaE FechaE Observacion Observacion Observacion Observacion Observacion Observacion"
    `,
  },
}))

const ContainerCliente = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto",
  gridTemplateAreas: `"Factura Factura Factura Cliente Cliente Cliente Cliente Cliente Id Id Id Id"`,
  gap: "12px",
  alignItems: "center",
}))

const extractArrayData = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data
  return []
}

const obtenerPorcentajeIva = (codigoSri) => {
  const cod = String(codigoSri).trim()
  switch (cod) {
    case "0":
      return 0
    case "2":
      return 12
    case "3":
      return 14
    case "4":
      return 15
    case "5":
      return 5
    default:
      return 0
  }
}

const CrearNotaCreditoDF = () => {
  const navigate = useNavigate()
  const [expandedInfoGeneral, setExpandedInfoGeneral] = useState(true)
  const [expandedInfoCliente, setExpandedInfoCliente] = useState(true)
  const [codigoDocumento, setCodigoDocumento] = useState("Cargando...")

  // TIPO DE NOTA MAESTRO: 'DEVOLUCION' o 'MONTO'
  const [tipoNota, setTipoNota] = useState("DEVOLUCION")

  const [cabecera, setCabecera] = useState({
    facnumfac: "",
    caja: { cjacodigo: "", cjadescri: "" },
    cliente: { clicodigo: "", clinombre: "", cliruc: "" },
    vendedor: { vencodigo: "", vennombre: "" },
    vendedorSeleccionado: { vencodigo: "", vennombre: "" },
    observacion: "",
    fechaEmision: dayjs(new Date()),
  })

  const [detallesAgregados, setDetallesAgregados] = useState([])
  const [isCargandoFactura, setIsCargandoFactura] = useState(false)

  // --- QUERYS BÁSICOS ---
  const { data: listaCajasRaw, isLoading: isLoadingCajas } = useQuery({
    queryKey: ["listaCajasNC"],
    queryFn: async () => {
      const res = await fetchwrapper("/NotaCreditoDF/getCajas", { method: "GET" }).then((r) => r.json())
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
    queryKey: ["CodigoTemporalNC", cabecera.caja.cjacodigo],
    queryFn: async () => {
      const res = await fetchwrapper(`/NotaCreditoDF/generarCodigoTemporal/${cabecera.caja.cjacodigo}`, {
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
    else if (isErrorCodigo) {
      setCodigoDocumento("Error")
      Swal.fire({ icon: "error", title: "Error", text: errorCodigo?.message || "No existe secuencia." })
    }
  }, [codigoTemporal, isErrorCodigo, errorCodigo])

  const { data: listaServiciosRaw, isLoading: isLoadingServicios } = useQuery({
    queryKey: ["listaServiciosNC"],
    queryFn: async () => {
      const res = await fetchwrapper("/NotaCreditoDF/getServicios", { method: "GET" }).then((r) => r.json())
      return extractArrayData(res)
    },
    refetchOnWindowFocus: false,
  })
  const listaServicios = Array.isArray(listaServiciosRaw) ? listaServiciosRaw : []

  // --- 1. EVENTO DEL BUSCADOR: LÓGICA IDÉNTICA A LA NOTA DE DÉBITO ---
  const handleSeleccionarFactura = (v) => {
    // Si viene nulo, vacío, o la respuesta cruda de la API sin el formato de fila, lo ignoramos para proteger el estado.
    if (!v || Object.keys(v).length === 0 || !v.facnumfac) return

    // Actualizamos la cabecera instantáneamente de forma síncrona
    setCabecera((prev) => ({
      ...prev,
      facnumfac: v.facnumfac || "",
      cliente: {
        clicodigo: v.clicodigo || "",
        clinombre: v.clinombre || "",
        cliruc: v.cliruc || "",
      },
    }))
  }

  // --- 2. OBSERVADOR EN SEGUNDO PLANO (Carga la Grilla de forma segura) ---
  useEffect(() => {
    const fetchDetallesFactura = async () => {
      if (!cabecera.facnumfac) {
        setDetallesAgregados([])
        return
      }

      if (tipoNota === "DEVOLUCION") {
        setIsCargandoFactura(true)
        try {
          const res = await api.post("/NotaCreditoDF/getFacturaDetalleNC", { facnumfac: cabecera.facnumfac })
          const factData = res.data.data

          const productosMapeados = (factData.productos || [])
            .filter((prod) => prod.cantidad_maxima > 0)
            .map((prod) => ({
              isNew: false,
              codigo: prod.artcodigo,
              descripcion: prod.artdescri,
              cantidad: prod.cantidad_maxima,
              cantidad_maxima: prod.cantidad_maxima,
              precioUnitario: prod.precioUnitario,
              descuentoPorcentaje: prod.descuentoPorcentaje,
              ivaPorcentaje: prod.ivaPorcentaje,
              invcodigo: prod.invcodigo,
              bodcodigo: prod.bodcodigo,
              facsecuen: prod.facsecuen,
            }))

          if (productosMapeados.length === 0) {
            Swal.fire("Atención", "Todos los productos de esta factura ya han sido devueltos.", "info")
          }

          setDetallesAgregados(productosMapeados)
        } catch (error) {
          console.error("Error al cargar detalle de factura:", error)
          const msg = error?.response?.data?.message || "No se pudo extraer el detalle de productos."
          Swal.fire("Atención", msg, "warning")
          setDetallesAgregados([])
        } finally {
          setIsCargandoFactura(false)
        }
      } else {
        // Por Monto: limpiamos grilla para ingreso manual
        setDetallesAgregados([])
      }
    }

    fetchDetallesFactura()
  }, [cabecera.facnumfac, tipoNota]) // Solo reacciona si cambia la factura o el tipo de nota

  // --- MUTACION GUARDAR ---
  const { mutate: guardarNCMutation, isPending: isSaving } = useMutation({
    queryKey: ["guardarNotaCredito"],
    mutationFn: async (payload) => {
      const response = await api.post("/NotaCreditoDF/guardarNotaCredito", payload)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: (data) => {
      Swal.fire({
        icon: "success",
        title: "¡Nota de Crédito Creada!",
        html: `<p>Documento N°: <strong>${data.data?.nccodigo || ""}</strong></p>`,
        confirmButtonText: "Aceptar",
      }).then(() => navigate(-1))
    },
  })

  const handleGuardar = async () => {
    const validDetalles = detallesAgregados.filter((p) => p.codigo && Number(p.cantidad) > 0)

    if (!cabecera.caja.cjacodigo) return Swal.fire("Atención", "Seleccione una Caja.", "warning")
    if (!cabecera.vendedor.vencodigo) return Swal.fire("Atención", "Seleccione un vendedor.", "warning")
    if (!cabecera.facnumfac) return Swal.fire("Atención", "Seleccione la factura de origen.", "warning")
    if (validDetalles.length === 0) return Swal.fire("Atención", "Agregue al menos un detalle válido.", "warning")

    Swal.fire({ title: "Guardando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() })

    const payload = {
      tipoNota,
      facnumfac: cabecera.facnumfac,
      cjacodigo: cabecera.caja.cjacodigo,
      vendedor: cabecera.vendedor,
      cliente: cabecera.cliente,
      observacion: cabecera.observacion,
      detalles: validDetalles,
    }

    await guardarNCMutation(payload)
  }

  // --- CALCULOS TOTALES ---
  const calcularTotales = () => {
    let subtotal = 0
    let descuentoTotal = 0
    let ivaTotal = 0
    const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100

    detallesAgregados.forEach((p) => {
      if (!p.codigo) return
      const cant = Number(p.cantidad) || 0
      const precio = Number(p.precioUnitario) || 0
      const desc = Number(p.descuentoPorcentaje) || 0
      const iva = Number(p.ivaPorcentaje) || 0

      const subP = round2(precio * cant)
      const descP = round2(subP * (desc / 100))
      const baseImp = round2(subP - descP)
      const ivaP = round2(baseImp * (iva / 100))

      subtotal += subP
      descuentoTotal += descP
      ivaTotal += ivaP
    })

    return {
      subtotal: round2(subtotal),
      descuentoTotal: round2(descuentoTotal),
      ivaTotal: round2(ivaTotal),
      total: round2(subtotal - descuentoTotal + ivaTotal),
    }
  }

  const totales = calcularTotales()
  const isDevolucion = tipoNota === "DEVOLUCION"
  const isMonto = tipoNota === "MONTO"

  return (
    <ThemeProvider theme={theme}>
      {/* El CustomBackdrop manejará la animación de carga sin interferir con los componentes visuales */}
      <CustomBackdrop
        isLoading={isLoadingCodigo || isLoadingCajas || isLoadingServicios || isSaving || isCargandoFactura}
      />
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div style={{ display: "flex", justifyContent: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Crear Nota de Crédito</b>
        </div>

        <StyledRoot>
          {/* INFORMACION GENERAL Y TIPO DE NOTA */}
          <CustomFieldsetAccordion
            title="Parámetros Generales"
            expanded={expandedInfoGeneral}
            onToggle={() => setExpandedInfoGeneral(!expandedInfoGeneral)}
          >
            <ContainerCabecera>
              <Box sx={{ gridArea: "Codigo" }}>
                <CustomTextFieldReadable label="N° Comprobante" value={codigoDocumento} />
              </Box>

              <Box sx={{ gridArea: "Caja" }}>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Caja Asignada</InputLabel>
                <Autocomplete
                  size="small"
                  options={listaCajas}
                  getOptionLabel={(opt) => (opt?.cjacodigo ? `${opt.cjacodigo} - ${opt.cjadescri}` : "")}
                  onChange={(e, val) => setCabecera((p) => ({ ...p, caja: val || { cjacodigo: "", cjadescri: "" } }))}
                  renderInput={(params) => <TextField {...params} placeholder="Seleccione..." />}
                />
              </Box>

              <Box sx={{ gridArea: "Vendedor" }}>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Vendedor</InputLabel>
                <VendedorAutocomplete cabeceraProforma={cabecera} setCabeceraProforma={setCabecera} />
              </Box>

              <Box sx={{ gridArea: "Tipo", p: 1, border: "1px solid #ddd", borderRadius: 1 }}>
                <RadioGroup row value={tipoNota} onChange={(e) => setTipoNota(e.target.value)}>
                  <FormControlLabel value="DEVOLUCION" control={<Radio size="small" />} label="Por Devolución" />
                  <FormControlLabel value="MONTO" control={<Radio size="small" />} label="Por Monto (Servicio)" />
                </RadioGroup>
              </Box>

              <Box sx={{ gridArea: "FechaE" }}>
                <CustomDatePicker
                  label="Fecha Emisión"
                  value={cabecera.fechaEmision}
                  format="DD/MM/YYYY"
                  setValue={() => {}}
                  disabled
                />
              </Box>

              <Box sx={{ gridArea: "Observacion" }}>
                <CustomTextField
                  label="Motivo / Observación SRI"
                  value={cabecera.observacion}
                  onChange={(e) => setCabecera((p) => ({ ...p, observacion: e.target.value.toUpperCase() }))}
                />
              </Box>
            </ContainerCabecera>
          </CustomFieldsetAccordion>
          <br />

          {/* DOCUMENTO SUSTENTO */}
          <CustomFieldsetAccordion
            title="Documento Sustento"
            expanded={expandedInfoCliente}
            onToggle={() => setExpandedInfoCliente(!expandedInfoCliente)}
          >
            <ContainerCliente>
              <Box sx={{ gridArea: "Factura" }}>
                <CustomHelperDetail
                  label="Buscar Factura Autorizada"
                  valueSearched={cabecera.facnumfac}
                  endpoint="/NotaCreditoDF/buscarFacturaNC"
                  valueInputMain="facnumfac"
                  valueInputSecondary="clinombre"
                  idSearchField="busqueda"
                  queryKeyModal="buscarFacturaNC"
                  perPage={10}
                  columnsTable={[
                    { accessorKey: "facnumfac", header: "Nº Factura", size: 150 },
                    { accessorKey: "cliruc", header: "RUC", size: 120 },
                    { accessorKey: "clinombre", header: "Cliente", size: 250 },
                  ]}
                  // La función puramente síncrona estilo Nota de Débito
                  onHandleSelectedData={handleSeleccionarFactura}
                  sxInputMain={{ minWidth: "170px", maxWidth: "170px", marginRight: "10px" }}
                  sxInputSecondary={{ width: "100%" }}
                />
              </Box>
              <Box sx={{ gridArea: "Cliente" }}>
                <CustomTextFieldReadable label="Cliente" value={cabecera.cliente.clinombre} />
              </Box>
              <Box sx={{ gridArea: "Id" }}>
                <CustomTextFieldReadable label="RUC/CI" value={cabecera.cliente.cliruc} />
              </Box>
            </ContainerCliente>
          </CustomFieldsetAccordion>
          <br />

          {/* GRILLA DINÁMICA */}
          <Paper sx={{ width: "100%", p: 2, mb: 4, borderRadius: "10px", border: "1px solid #ddd" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {isDevolucion ? "Productos a Devolver" : "Servicio a Descontar"}
              </Typography>

              {isMonto && (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AddIcon />}
                  disabled={!cabecera.facnumfac || detallesAgregados.length >= 1}
                  onClick={() => {
                    setDetallesAgregados([
                      {
                        isNew: true,
                        codigo: "",
                        descripcion: "",
                        cantidad: 1,
                        precioUnitario: 0,
                        descuentoPorcentaje: 0,
                        ivaPorcentaje: 0,
                      },
                    ])
                  }}
                >
                  Añadir Monto
                </Button>
              )}
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    {isMonto && <TableCell width="50px">Acción</TableCell>}
                    <TableCell>{isDevolucion ? "Artículo Facturado" : "Buscador de Servicio"}</TableCell>
                    <TableCell width="120px" align="center">
                      Cantidad
                    </TableCell>
                    <TableCell width="120px" align="center">
                      V. Unitario
                    </TableCell>
                    <TableCell width="100px" align="center">
                      % Desc.
                    </TableCell>
                    <TableCell width="80px" align="center">
                      % IVA
                    </TableCell>
                    <TableCell width="120px" align="right">
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detallesAgregados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {isDevolucion
                            ? "Seleccione una factura para ver sus productos."
                            : "Haga clic en 'Añadir Monto' para registrar el descuento financiero."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    detallesAgregados.map((row, index) => {
                      const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100
                      const sub = round2((Number(row.cantidad) || 0) * (Number(row.precioUnitario) || 0))
                      const desc = round2(sub * ((Number(row.descuentoPorcentaje) || 0) / 100))
                      const iva = round2((sub - desc) * ((Number(row.ivaPorcentaje) || 0) / 100))
                      const totalRow = round2(sub - desc + iva)

                      return (
                        <TableRow key={index}>
                          {isMonto && (
                            <TableCell align="center">
                              <IconButton color="error" size="small" onClick={() => setDetallesAgregados([])}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          )}

                          <TableCell>
                            {isDevolucion ? (
                              <Typography variant="body2">
                                <b>{row.codigo}</b> - {row.descripcion} <br />
                                <span style={{ fontSize: "11px", color: "gray" }}>
                                  (Max a devolver: {row.cantidad_maxima})
                                </span>
                              </Typography>
                            ) : (
                              <Autocomplete
                                size="small"
                                options={listaServicios}
                                getOptionLabel={(opt) => (opt?.sercodigo ? `${opt.sercodigo} - ${opt.serdescri}` : "")}
                                onChange={(e, val) => {
                                  const newArr = [...detallesAgregados]
                                  if (val) {
                                    newArr[index] = {
                                      ...row,
                                      isNew: false,
                                      codigo: val.sercodigo,
                                      descripcion: val.serdescri,
                                      ivaPorcentaje: obtenerPorcentajeIva(val.seriva),
                                    }
                                  } else {
                                    newArr[index] = {
                                      isNew: true,
                                      codigo: "",
                                      descripcion: "",
                                      cantidad: 1,
                                      precioUnitario: 0,
                                      descuentoPorcentaje: 0,
                                      ivaPorcentaje: 0,
                                    }
                                  }
                                  setDetallesAgregados(newArr)
                                }}
                                renderInput={(params) => <TextField {...params} placeholder="Buscar servicio..." />}
                              />
                            )}
                          </TableCell>

                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              disabled={isMonto}
                              value={row.cantidad}
                              onChange={(e) => {
                                let val = e.target.value === "" ? "" : Number(e.target.value)
                                if (isDevolucion && val > row.cantidad_maxima) {
                                  val = row.cantidad_maxima
                                  Swal.fire("Límite", `Sólo puede devolver hasta ${val} unidades.`, "warning")
                                }
                                const newArr = [...detallesAgregados]
                                newArr[index].cantidad = val
                                setDetallesAgregados(newArr)
                              }}
                              inputProps={{ min: 1, style: { textAlign: "center" } }}
                            />
                          </TableCell>

                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              disabled={isDevolucion}
                              value={row.precioUnitario}
                              onChange={(e) => {
                                const newArr = [...detallesAgregados]
                                newArr[index].precioUnitario = e.target.value
                                setDetallesAgregados(newArr)
                              }}
                              inputProps={{ min: 0, step: "0.01", style: { textAlign: "right" } }}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <Typography variant="body2">{Number(row.descuentoPorcentaje).toFixed(2)}%</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{Number(row.ivaPorcentaje)}%</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              ${totalRow.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })
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
                  <Typography variant="body2">Subtotal Base:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${totales.subtotal.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="error">
                    Descuento:
                  </Typography>
                  <Typography variant="body2" color="error" fontWeight="bold">
                    -${totales.descuentoTotal.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">I.V.A.:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${totales.ivaTotal.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Total N/C:</Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    ${totales.total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box display="flex" justifyContent="flex-end" mt={3} pr={2}>
              <Button variant="contained" size="large" onClick={handleGuardar}>
                Guardar Nota de Crédito
              </Button>
            </Box>
          </Paper>
        </StyledRoot>
      </div>
    </ThemeProvider>
  )
}

export default CrearNotaCreditoDF
