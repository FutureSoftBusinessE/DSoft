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
  Grid,
} from "@mui/material"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api } from "../../../api"
import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"
import CustomDatePicker from "../../../components/CustomDatePicker"
import CustomTextField from "../../../components/CustomTextField"
import CustomTextFieldReadable from "../../../components/CustomTextFieldReadable"
import CustomHelperDetail from "../../../components/CustomHelperDetail"
import dayjs from "dayjs"
import BackIcon from "../../../components/BackIcon"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
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
  palette: {
    primary: { main: "#196C87" },
    secondary: { main: "#196C87" },
  },
})

// Layout CSS Grid para Cabecera
const ContainerCabecera = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto auto",
  gridTemplateAreas: `
    "Codigo Codigo Caja Caja Caja Caja Transpor Transpor Transpor Placa Placa Placa"
    "FechaI FechaI FechaI FechaF FechaF FechaF Ciudad Ciudad Ciudad Motivo Motivo Motivo"
  `,
  gap: "12px",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    gridTemplateAreas: `
      "Codigo Codigo Codigo Codigo Codigo Codigo Caja Caja Caja Caja Caja Caja"
      "Transpor Transpor Transpor Transpor Transpor Transpor Placa Placa Placa Placa Placa Placa"
      "FechaI FechaI FechaI FechaI FechaI FechaI FechaF FechaF FechaF FechaF FechaF FechaF"
      "Ciudad Ciudad Ciudad Ciudad Ciudad Ciudad Motivo Motivo Motivo Motivo Motivo Motivo"
    `,
  },
}))

// Layout CSS Grid para Cliente y Origen
const ContainerCliente = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto auto",
  gridTemplateAreas: `
    "Factura Factura Factura Cliente Cliente Cliente Cliente Cliente Cliente Id Id Id"
    "DirEnt DirEnt DirEnt DirEnt DirEnt Correo Correo Correo Correo Correo Correo Correo"
  `,
  gap: "12px",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    gridTemplateAreas: `
      "Factura Factura Factura Factura Factura Factura Factura Factura Factura Factura Factura Factura"
      "Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente"
      "Id Id Id Id Id Id Id Id Id Id Id Id"
      "DirEnt DirEnt DirEnt DirEnt DirEnt DirEnt DirEnt DirEnt DirEnt DirEnt DirEnt DirEnt"
      "Correo Correo Correo Correo Correo Correo Correo Correo Correo Correo Correo Correo"
    `,
  },
}))

// MOTIVOS RECOMENDADOS POR EL SRI
const MOTIVOS_SRI = [
  "VENTA",
  "COMPRA",
  "DEVOLUCION",
  "CONSIGNACION",
  "EXHIBICION",
  "TRASLADO ENTRE ESTABLECIMIENTOS",
  "EXPORTACION",
  "IMPORTACION",
  "OTROS",
]

const extractArrayData = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data
  return []
}

function useGetCajas() {
  return useQuery({
    queryKey: ["listaCajasGR"],
    queryFn: async () => {
      try {
        const res = await fetchwrapper("/GuiadeRemisionDF/getCajas", { method: "GET" }).then((r) => r.json())
        return extractArrayData(res)
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })
}

function useGetCodigoTemporalGR(cjacodigo) {
  return useQuery({
    queryKey: ["CodigoTemporalGR", cjacodigo],
    queryFn: async () => {
      try {
        const res = await fetchwrapper(`/GuiadeRemisionDF/generarCodigoTemporal/${cjacodigo}`, { method: "GET" }).then(
          (r) => r.json(),
        )
        if (!res.success && res.message) throw new Error(res.message)
        return res.data?.data || res.data || ""
      } catch (error) {
        console.log(error)
        throw error
      }
    },
    enabled: !!cjacodigo,
    refetchOnWindowFocus: false,
    retry: false,
  })
}

const CrearGuiaRemisionDF = () => {
  const navigate = useNavigate()
  const [expandedInfoGeneral, setExpandedInfoGeneral] = useState(true)
  const [expandedInfoCliente, setExpandedInfoCliente] = useState(true)
  const [codigoDocumento, setCodigoDocumento] = useState("Seleccione una Caja")

  const [cabecera, setCabecera] = useState({
    caja: { cjacodigo: "", cjadescri: "" },
    guifecha: dayjs(new Date()),
    guifecfintrans: dayjs(new Date()),

    transcodigo: "",
    transdescri: "",
    transruc: "",
    guiplacafinal: "",

    ciucodigo: "",
    ciudescri: "",
    motivo: "VENTA",

    facnumfac: "",
    cliente: { clicodigo: "", clinombre: "", cliruc: "", clidirec: "", clitelef1: "", cliemail: "" },
    guidirent: "",
    cliemail: "",
  })

  const [detallesAgregados, setDetallesAgregados] = useState([])
  const [isFacturaLoading, setIsFacturaLoading] = useState(false)

  // --- QUERYS ---
  const { data: listaCajasRaw, isLoading: isLoadingCajas } = useGetCajas()
  const listaCajas = Array.isArray(listaCajasRaw) ? listaCajasRaw : []

  const {
    data: codigoTemporal,
    isLoading: isLoadingCodigo,
    isError: isErrorCodigo,
    error: errorCodigo,
  } = useGetCodigoTemporalGR(cabecera.caja.cjacodigo)

  useEffect(() => {
    if (codigoTemporal) setCodigoDocumento(codigoTemporal)
    else if (isErrorCodigo) {
      setCodigoDocumento("Error")
      Swal.fire({ icon: "error", title: "Error", text: errorCodigo?.message || "No existe secuencia configurada." })
    }
  }, [codigoTemporal, isErrorCodigo, errorCodigo])

  const { data: listaCiudadesRaw, isLoading: isLoadingCiudades } = useQuery({
    queryKey: ["listaCiudades"],
    queryFn: async () => {
      try {
        const response = await fetchwrapper("/GuiadeRemisionDF/getCiudades", { method: "GET" })
        return extractArrayData(await response.json())
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })
  const listaCiudades = Array.isArray(listaCiudadesRaw) ? listaCiudadesRaw : []

  const { data: listaTransRaw, isLoading: isLoadingTrans } = useQuery({
    queryKey: ["listaTransportistas"],
    queryFn: async () => {
      try {
        const response = await fetchwrapper("/GuiadeRemisionDF/getTransportistas", { method: "GET" })
        return extractArrayData(await response.json())
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })
  const listaTransportistas = Array.isArray(listaTransRaw) ? listaTransRaw : []

  const { data: listaArticulosRaw, isLoading: isLoadingArticulos } = useQuery({
    queryKey: ["listaArticulos"],
    queryFn: async () => {
      try {
        const response = await fetchwrapper("/GuiadeRemisionDF/getArticulos", { method: "GET" })
        return extractArrayData(await response.json())
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })
  const listaArticulos = Array.isArray(listaArticulosRaw) ? listaArticulosRaw : []

  const { data: listaClientesRaw, isLoading: isLoadingClientes } = useQuery({
    queryKey: ["listaClientesGR"],
    queryFn: async () => {
      try {
        const response = await fetchwrapper("/GuiadeRemisionDF/getCliente", { method: "GET" })
        return extractArrayData(await response.json())
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
    enabled: !cabecera.facnumfac,
  })
  const listaClientes = Array.isArray(listaClientesRaw) ? listaClientesRaw : []

  // --- GUARDADO ---
  const { mutate: guardarGuiaMutation, isPending: isSaving } = useMutation({
    queryKey: ["guardarGuiaRemision"],
    mutationFn: async (payload) => {
      const response = await api.post("/GuiadeRemisionDF/guardarGuia", payload)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: (data) => {
      // Navegación segura para evitar Error: Cannot read properties of undefined
      const numGuia = data?.data?.guinumero || data?.guinumero || codigoDocumento

      Swal.fire({
        icon: "success",
        title: "¡Guía de Remisión Creada!",
        html: `<p>Documento N°: <strong>${numGuia}</strong></p>`,
        confirmButtonText: "Aceptar",
      }).then(() => navigate(-1))
    },
  })

  const handleGuardar = async () => {
    const validDetalles = detallesAgregados.filter(
      (p) => (!p.isNew || cabecera.facnumfac) && p.artcodigo && Number(p.cantidad) > 0,
    )

    if (!cabecera.caja.cjacodigo) return Swal.fire("Falta Caja", "Seleccione una Caja.", "warning")
    if (!cabecera.transcodigo) return Swal.fire("Falta Transportista", "Seleccione un transportista.", "warning")
    if (!cabecera.guiplacafinal) return Swal.fire("Falta Placa", "Debe digitar la placa del vehículo.", "warning")
    if (!cabecera.guifecfintrans) return Swal.fire("Fechas", "Falta la fecha de finalización del traslado.", "warning")
    if (validDetalles.length === 0)
      return Swal.fire("Sin artículos", "Agregue al menos un artículo a transportar.", "warning")
    if (!cabecera.cliente.clinombre) return Swal.fire("Falta Cliente", "Agregue el cliente o destinatario.", "warning")
    if (!cabecera.ciucodigo) return Swal.fire("Falta Ciudad", "Indique la ciudad de entrega.", "warning")

    Swal.fire({ title: "Guardando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() })

    const payload = {
      guinumero: codigoDocumento,
      cjacodigo: cabecera.caja.cjacodigo,
      facnumfac: cabecera.facnumfac,
      transcodigo: cabecera.transcodigo,
      guiplacafinal: cabecera.guiplacafinal,
      ciucodigo: cabecera.ciucodigo,
      motivo: cabecera.motivo,
      clicodigo: cabecera.cliente.clicodigo, // <-- AÑADIDO
      clinombre: cabecera.cliente.clinombre,
      cliruc: cabecera.cliente.cliruc,
      clidirec: cabecera.cliente.clidirec,
      cliemail: cabecera.cliemail,
      guidirent: cabecera.guidirent || cabecera.cliente.clidirec,
      guifecha: cabecera.guifecha.format("YYYY-MM-DD"),
      guifecfintrans: cabecera.guifecfintrans.format("YYYY-MM-DD"),
      detalles: validDetalles.map((d) => ({
        artcodigo: d.artcodigo,
        artdescri: d.artdescri,
        cantidad: Number(d.cantidad),
      })),
    }

    await guardarGuiaMutation(payload)
  }

  // --- CARGAR DATOS DE FACTURA ---
  const handleSeleccionarFactura = async (v) => {
    if (v === null || v === "" || (typeof v === "object" && Object.keys(v).length === 0)) {
      setCabecera((p) => ({
        ...p,
        facnumfac: "",
        cliente: { clicodigo: "", clinombre: "", cliruc: "", clidirec: "", clitelef1: "", cliemail: "" },
        guidirent: "",
        cliemail: "",
      }))
      setDetallesAgregados([])
      return
    }

    if (typeof v !== "object" || !v.facnumfac) return
    if (v.facnumfac === cabecera.facnumfac) return

    setIsFacturaLoading(true)
    Swal.fire({
      title: "Importando Factura...",
      text: "Cargando cliente y artículos",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    })

    try {
      const res = await api.post("/GuiadeRemisionDF/getFacturaDetalleGR", { facnumfac: v.facnumfac })
      const factData = res.data.data

      setCabecera((p) => ({
        ...p,
        facnumfac: v.facnumfac,
        cliente: {
          clicodigo: factData.cliente?.clicodigo || v.clicodigo || "",
          clinombre: factData.cliente?.clinombre || v.clinombre || "",
          cliruc: factData.cliente?.cliruc || v.cliruc || "",
          clidirec: factData.cliente?.clidirec || v.clidirec || "",
          clitelef1: factData.cliente?.clitelef1 || v.clitelef1 || "",
          cliemail: factData.cliente?.cliemail || "",
        },
        guidirent: factData.cliente?.clidirec || v.clidirec || "",
        cliemail: factData.cliente?.cliemail || "",
      }))

      const productosMapeados = (factData.productos || []).map((prod) => ({
        isNew: false,
        artcodigo: prod.artcodigo,
        artdescri: prod.artdescri,
        cantidad: prod.cantidad,
      }))
      setDetallesAgregados(productosMapeados)

      Swal.close()
    } catch (error) {
      console.error(error)
      Swal.fire("Error", "No se pudo extraer el detalle de la factura seleccionada.", "error")
    } finally {
      setIsFacturaLoading(false)
    }
  }

  const tieneFactura = !!cabecera.facnumfac

  return (
    <ThemeProvider theme={theme}>
      <CustomBackdrop
        isLoading={
          isLoadingCodigo ||
          isLoadingCajas ||
          isLoadingTrans ||
          isLoadingCiudades ||
          isLoadingArticulos ||
          isSaving ||
          isFacturaLoading ||
          isLoadingClientes
        }
      />
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div style={{ display: "flex", justifyContent: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Crear Guía de Remisión</b>
        </div>

        <Box className={StyledRoot}>
          {/* INFORMACION DEL TRASLADO (CABECERA) */}
          <CustomFieldsetAccordion
            title="Información del Traslado"
            expanded={expandedInfoGeneral}
            onToggle={() => setExpandedInfoGeneral(!expandedInfoGeneral)}
          >
            <ContainerCabecera>
              <Box sx={{ gridArea: "Codigo" }}>
                <CustomTextFieldReadable label="N° Guía" value={codigoDocumento} />
              </Box>

              <Box sx={{ gridArea: "Caja" }}>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Caja SRI</InputLabel>
                <Autocomplete
                  size="small"
                  options={listaCajas}
                  getOptionLabel={(opt) => (opt?.cjacodigo ? `${opt.cjacodigo} - ${opt.cjadescri}` : "")}
                  value={cabecera.caja?.cjacodigo ? cabecera.caja : null}
                  onChange={(e, val) => setCabecera((p) => ({ ...p, caja: val || { cjacodigo: "", cjadescri: "" } }))}
                  renderInput={(params) => <TextField {...params} placeholder="Seleccione..." />}
                />
              </Box>

              <Box sx={{ gridArea: "Transpor" }}>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Transportista</InputLabel>
                <Autocomplete
                  size="small"
                  options={listaTransportistas}
                  getOptionLabel={(opt) => (opt?.transcodigo ? `${opt.transcodigo} - ${opt.transdescri}` : "")}
                  onChange={(e, val) =>
                    setCabecera((p) => ({
                      ...p,
                      transcodigo: val?.transcodigo || "",
                      transdescri: val?.transdescri || "",
                      transruc: val?.transruc || "",
                      guiplacafinal: val?.transplaca || p.guiplacafinal,
                    }))
                  }
                  renderInput={(params) => <TextField {...params} placeholder="Buscar transportista..." />}
                />
              </Box>

              <Box sx={{ gridArea: "Placa" }}>
                <CustomTextField
                  label="Placa de Vehículo"
                  value={cabecera.guiplacafinal}
                  onChange={(e) => setCabecera((p) => ({ ...p, guiplacafinal: e.target.value.toUpperCase() }))}
                />
              </Box>

              <Box sx={{ gridArea: "FechaI" }}>
                <CustomDatePicker
                  label="Fecha Inicio Traslado"
                  value={cabecera.guifecha}
                  format="DD/MM/YYYY"
                  setValue={(val) => setCabecera((p) => ({ ...p, guifecha: val }))}
                />
              </Box>

              <Box sx={{ gridArea: "FechaF" }}>
                <CustomDatePicker
                  label="Fecha Fin Traslado"
                  value={cabecera.guifecfintrans}
                  format="DD/MM/YYYY"
                  setValue={(val) => setCabecera((p) => ({ ...p, guifecfintrans: val }))}
                />
              </Box>

              <Box sx={{ gridArea: "Ciudad" }}>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Ciudad Destino</InputLabel>
                <Autocomplete
                  size="small"
                  options={listaCiudades}
                  getOptionLabel={(opt) => (opt?.ciucodigo ? `${opt.ciudescri}` : "")}
                  onChange={(e, val) => setCabecera((p) => ({ ...p, ciucodigo: val?.ciucodigo || "" }))}
                  renderInput={(params) => <TextField {...params} placeholder="Buscar..." />}
                />
              </Box>

              <Box sx={{ gridArea: "Motivo" }}>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Motivo SRI</InputLabel>
                <Autocomplete
                  size="small"
                  options={MOTIVOS_SRI}
                  value={cabecera.motivo}
                  onChange={(e, val) => setCabecera((p) => ({ ...p, motivo: val || "OTROS" }))}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Box>
            </ContainerCabecera>
          </CustomFieldsetAccordion>
          <br />

          {/* INFORMACION CLIENTE Y FACTURA ORIGEN */}
          <CustomFieldsetAccordion
            title="Sustento & Destinatario"
            expanded={expandedInfoCliente}
            onToggle={() => setExpandedInfoCliente(!expandedInfoCliente)}
          >
            <ContainerCliente>
              <Box sx={{ gridArea: "Factura" }}>
                <CustomHelperDetail
                  label="Factura Origen (Opcional)"
                  valueSearched={cabecera.facnumfac}
                  endpoint="/GuiadeRemisionDF/buscarFacturaGR"
                  valueInputMain="facnumfac"
                  valueInputSecondary="clinombre"
                  idSearchField="busqueda"
                  errorMsgIdSearch="Error al buscar factura:"
                  queryKeyModal="buscarFacturaGR"
                  perPage={10}
                  columnsTable={[
                    { accessorKey: "facnumfac", header: "Nº Factura", size: 150 },
                    { accessorKey: "cliruc", header: "RUC", size: 120 },
                    { accessorKey: "clinombre", header: "Cliente", size: 250 },
                    { accessorKey: "facfecemi", header: "Emisión", size: 100 },
                  ]}
                  onHandleSelectedData={handleSeleccionarFactura}
                  sxInputMain={{ minWidth: "170px", maxWidth: "170px", marginRight: "10px" }}
                  sxInputSecondary={{ width: "100%" }}
                />
              </Box>

              <Box sx={{ gridArea: "Cliente" }}>
                {tieneFactura ? (
                  <CustomTextFieldReadable label="Nombre Destinatario" value={cabecera.cliente.clinombre} />
                ) : (
                  <>
                    <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>
                      Seleccionar Cliente Manual
                    </InputLabel>
                    <Autocomplete
                      size="small"
                      options={listaClientes}
                      getOptionLabel={(opt) => (opt?.clicodigo ? `${opt.clicodigo} - ${opt.clinombre}` : "")}
                      onChange={(e, val) => {
                        if (val) {
                          setCabecera((p) => ({
                            ...p,
                            cliente: {
                              clicodigo: val.clicodigo,
                              clinombre: val.clinombre,
                              cliruc: val.cliruc,
                              clidirec: val.clidirec,
                              clitelef1: val.clitelef1,
                            },
                            guidirent: val.clidirec || "",
                            cliemail: val.cliemail || "",
                          }))
                        } else {
                          setCabecera((p) => ({
                            ...p,
                            cliente: { clicodigo: "", clinombre: "", cliruc: "", clidirec: "", clitelef1: "" },
                            guidirent: "",
                            cliemail: "",
                          }))
                        }
                      }}
                      renderInput={(params) => <TextField {...params} placeholder="Buscar en catálogo..." />}
                    />
                  </>
                )}
              </Box>

              <Box sx={{ gridArea: "Id" }}>
                <CustomTextField
                  label="RUC/CI Destino"
                  value={cabecera.cliente.cliruc}
                  disabled={tieneFactura}
                  onChange={(e) => setCabecera((p) => ({ ...p, cliente: { ...p.cliente, cliruc: e.target.value } }))}
                />
              </Box>

              <Box sx={{ gridArea: "DirEnt" }}>
                <CustomTextField
                  label="Dirección de Entrega (Destino)"
                  value={cabecera.guidirent}
                  disabled={tieneFactura}
                  onChange={(e) => setCabecera((p) => ({ ...p, guidirent: e.target.value }))}
                />
              </Box>

              <Box sx={{ gridArea: "Correo" }}>
                <CustomTextField
                  label="Correo Destinatario"
                  value={cabecera.cliemail}
                  disabled={tieneFactura}
                  onChange={(e) => setCabecera((p) => ({ ...p, cliemail: e.target.value }))}
                />
              </Box>
            </ContainerCliente>
          </CustomFieldsetAccordion>
          <br />

          {/* GRILLA DE ARTÍCULOS A TRANSPORTAR */}
          <Paper id="productos" sx={{ width: "100%", p: 2, mb: 4, borderRadius: "10px", border: "1px solid #ddd" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                Artículos a Transportar
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                disabled={tieneFactura}
                onClick={() => {
                  setDetallesAgregados([...detallesAgregados, { isNew: true, cantidad: 1 }])
                }}
              >
                Añadir Artículo Libre
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    {!tieneFactura && (
                      <TableCell width="50px" align="center">
                        Acción
                      </TableCell>
                    )}
                    <TableCell>Buscador / Código de Artículo</TableCell>
                    <TableCell width="200px" align="center">
                      Cantidad a Enviar
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detallesAgregados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={tieneFactura ? 2 : 3} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {tieneFactura
                            ? "No se detectaron artículos en la factura origen."
                            : "Haga clic en 'Añadir Artículo Libre' para registrar carga."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    detallesAgregados.map((row, index) => (
                      <TableRow key={index} sx={{ verticalAlign: "top" }}>
                        {!tieneFactura && (
                          <TableCell align="center" sx={{ pt: 2 }}>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => {
                                const newArr = [...detallesAgregados]
                                newArr.splice(index, 1)
                                setDetallesAgregados(newArr)
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        )}

                        <TableCell>
                          {tieneFactura ? (
                            <Typography variant="body2" sx={{ pt: 2 }}>
                              <b>{row.artcodigo}</b> - {row.artdescri}
                            </Typography>
                          ) : (
                            <Autocomplete
                              options={listaArticulos}
                              getOptionLabel={(opt) => (opt?.artcodigo ? `${opt.artcodigo} - ${opt.artdescri}` : "")}
                              value={row?.artcodigo ? row : null}
                              onChange={(e, val) => {
                                const newArr = [...detallesAgregados]
                                if (val) newArr[index] = { ...val, isNew: false, cantidad: 1 }
                                else newArr[index] = { isNew: true, cantidad: 1 }
                                setDetallesAgregados(newArr)
                              }}
                              renderInput={(params) => (
                                <TextField {...params} size="small" placeholder="Buscar artículo..." />
                              )}
                            />
                          )}
                        </TableCell>

                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            disabled={(row.isNew && !tieneFactura) || tieneFactura}
                            value={row.cantidad}
                            onChange={(e) => {
                              const newArr = [...detallesAgregados]
                              newArr[index].cantidad = e.target.value
                              setDetallesAgregados(newArr)
                            }}
                            inputProps={{
                              min: 1,
                              style: { textAlign: "center", fontWeight: tieneFactura ? "bold" : "normal" },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="flex-end" mt={3} pr={2}>
              <Button variant="contained" size="large" onClick={handleGuardar}>
                Guardar Guía de Remisión
              </Button>
            </Box>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearGuiaRemisionDF
