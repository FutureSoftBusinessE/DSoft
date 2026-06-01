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
  Tooltip,
  List,
  ListItem,
  TextField,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
} from "@mui/material"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api } from "../../../api"
import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"
import CustomDatePicker from "../../../components/CustomDatePicker"
import CustomTextField from "../../../components/CustomTextField"
import CustomTextFieldReadable from "../../../components/CustomTextFieldReadable"
import CustomHelperDetail from "../../../components/CustomHelperDetail"
import DescriptionIcon from "@mui/icons-material/Description"
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag"
import VendedorAutocomplete from "../components/VendedorAutocomplete"
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

const ContainerCabecera = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto auto",
  gridTemplateAreas: `
    "Codigo Codigo Codigo Caja Caja Caja FormaPago FormaPago FormaPago Vendedor Vendedor Vendedor"
    "FechaE FechaE FechaE FechaV FechaV FechaV Observacion Observacion Observacion Observacion Observacion Observacion"
  `,
  gap: "8px",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "repeat(12, 1fr)",
    gridTemplateAreas: `
      "Codigo Codigo Codigo Codigo Codigo Codigo Caja Caja Caja Caja Caja Caja"
      "FormaPago FormaPago FormaPago FormaPago FormaPago FormaPago Vendedor Vendedor Vendedor Vendedor Vendedor Vendedor"
      "FechaE FechaE FechaE FechaE FechaE FechaE FechaV FechaV FechaV FechaV FechaV FechaV"
      "Observacion Observacion Observacion Observacion Observacion Observacion Observacion Observacion Observacion Observacion Observacion Observacion"
    `,
  },
}))

const ContainerCliente = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto auto",
  gridTemplateAreas: `
    "Factura Factura Factura Factura Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente"
    "Direccion Direccion Direccion Direccion Telefono Telefono Telefono Telefono Id Id Id Id"
  `,
  gap: "8px",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "repeat(12, 1fr)",
    gridTemplateAreas: `
      "Factura Factura Factura Factura Factura Factura Factura Factura Factura Factura Factura Factura"
      "Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente"
      "Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion "
      "Telefono  Telefono Telefono Telefono Telefono Telefono Id Id Id Id Id Id"
    `,
  },
}))

const Factura = styled(Box)({ gridArea: "Factura" })
const Caja = styled(Box)({ gridArea: "Caja" })
const Cliente = styled(Box)({ gridArea: "Cliente" })
const Direccion = styled(Box)({ gridArea: "Direccion" })
const Telefono = styled(Box)({ gridArea: "Telefono" })
const Id = styled(Box)({ gridArea: "Id" })
const FechaE = styled(Box)({ gridArea: "FechaE" })
const FechaV = styled(Box)({ gridArea: "FechaV" })
const Codigo = styled(Box)({ gridArea: "Codigo" })
const FormaPago = styled(Box)({ gridArea: "FormaPago" })
const Vendedor = styled(Box)({ gridArea: "Vendedor" })
const Observacion = styled(Box)({ gridArea: "Observacion" })

// --- FUNCIÓN EXTRACTORA UNIVERSAL ---
const extractArrayData = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data
  return []
}

// --- FUNCIÓN PARA MAPEAR CÓDIGO SRI AL PORCENTAJE DE IVA MATEMÁTICO ---
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
    case "6":
      return 0 // No objeto
    case "7":
      return 0 // Exento
    case "8":
      return 0 // IVA Diferenciado
    case "10":
      return 13
    default:
      return 0
  }
}

// --- HOOKS DE CARGA NATIVOS ---
function useGetCajas() {
  return useQuery({
    queryKey: ["listaCajasND"],
    queryFn: async () => {
      try {
        const response = await fetchwrapper("/NotaDebitoDF/getCajas", { method: "GET" })
        const res = await response.json()
        return extractArrayData(res)
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })
}

function useGetCodigoTemporalND(cjacodigo) {
  return useQuery({
    queryKey: ["CodigoTemporalND", cjacodigo],
    queryFn: async () => {
      try {
        const response = await fetchwrapper(`/NotaDebitoDF/generarCodigoTemporal/${cjacodigo}`, { method: "GET" })
        const data = await response.json()
        if (!data.success) throw new Error(data.message)
        return data.data?.data || data.data || ""
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

// --- COMPONENTE DE BÚSQUEDA EN LA GRILLA ---
const ComboServicioRow = ({ index, row, serviciosAgregados, setServiciosAgregados, listaServicios }) => {
  const safeOptions = Array.isArray(listaServicios) ? listaServicios : []

  return (
    <Autocomplete
      options={safeOptions}
      getOptionLabel={(opt) => (opt && opt.sercodigo ? `${opt.sercodigo} - ${opt.serdescri}` : "")}
      value={row?.sercodigo ? row : null}
      isOptionEqualToValue={(option, value) => option?.sercodigo === value?.sercodigo}
      onChange={(e, val) => {
        const newArr = [...serviciosAgregados]
        if (val) {
          // REGLA APLICADA: Calculamos el IVA real según el código del SRI
          const porcentajeRealIva = obtenerPorcentajeIva(val?.seriva)

          newArr[index] = {
            ...val,
            isNew: false,
            cantidadPedido: row?.cantidadPedido || 1,
            precioUnitario: Number(val?.precio1 || 0),
            descuentoPorcentaje: Number(row?.descuentoPorcentaje || 0),
            ivaPorcentaje: porcentajeRealIva, // Aquí se aplicará el 15% matemático
            codigoIvaSri: val?.seriva || "0", // Guardamos el código original (Ej: '4')
          }
        } else {
          newArr[index] = {
            isNew: true,
            cantidadPedido: 1,
            precioUnitario: 0,
            descuentoPorcentaje: 0,
            ivaPorcentaje: 0,
            codigoIvaSri: "0",
          }
        }
        setServiciosAgregados(newArr)
      }}
      renderInput={(params) => <TextField {...params} size="small" placeholder="Buscar motivo / servicio..." />}
      noOptionsText="Motivo no encontrado"
    />
  )
}

const CrearNotaDebitoDF = () => {
  const navigate = useNavigate()
  const [expandedInfoGeneral, setExpandedInfoGeneral] = useState(true)
  const [expandedInfoCliente, setExpandedInfoCliente] = useState(true)
  const [codigoDocumento, setCodigoDocumento] = useState("Seleccione una Caja")

  // ESTADO CENTRALIZADO
  const [cabeceraND, setCabeceraND] = useState({
    facnumref: "",
    caja: { cjacodigo: "", cjadescri: "" },
    cliente: { clicodigo: "", clinombre: "" },
    direccion: "",
    ruc: "",
    telefono: "",
    factippag: "",
    fordescri: "",
    fortipo: "",
    fordias: 0,
    fordescuento: 0.0,
    vendedor: { vencodigo: "", vennombre: "", pedidossiac: "", pedidosweb: "" },
    vendedorSeleccionado: { vencodigo: "", vennombre: "" },
    observacion: "",
  })

  const [serviciosAgregados, setServiciosAgregados] = useState([])

  const { data: listaCajasRaw, isLoading: isLoadingCajas } = useGetCajas()
  const listaCajas = Array.isArray(listaCajasRaw) ? listaCajasRaw : []

  const {
    data: codigoTemporal,
    isLoading: isLoadingCodigo,
    isError: isErrorCodigo,
    error: errorCodigo,
  } = useGetCodigoTemporalND(cabeceraND.caja.cjacodigo)

  useEffect(() => {
    if (codigoTemporal) {
      setCodigoDocumento(codigoTemporal)
    } else if (isErrorCodigo) {
      setCodigoDocumento("Error de Secuencia")
      Swal.fire({ icon: "error", title: "Error", text: errorCodigo?.message || "No existe secuencia configurada." })
    } else if (!cabeceraND.caja.cjacodigo) {
      setCodigoDocumento("Seleccione una Caja")
    }
  }, [codigoTemporal, cabeceraND.caja.cjacodigo, isErrorCodigo, errorCodigo])

  // --- CARGA DE CATÁLOGOS NATIVOS ---
  const { data: rawFormasPagoResponse, isLoading: isLoadingFP } = useQuery({
    queryKey: ["listaFormasPagoDF"],
    queryFn: async () => {
      try {
        const response = await fetchwrapper("/FacturaDesdeArticulosDF/getFormaPago", { method: "GET" })
        const res = await response.json()
        return extractArrayData(res)
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })

  const safeFormasPagoRaw = Array.isArray(rawFormasPagoResponse) ? rawFormasPagoResponse : []
  const listaFormasPago = safeFormasPagoRaw.map((item) => ({
    ...item,
    id: item.factippag ? item.factippag.trim() : "",
    label: `${item.factippag ? item.factippag.trim() : ""} - ${item.fordescri ? item.fordescri.trim() : ""}`.replace(
      /^ - |- $/g,
      "",
    ),
  }))

  const { data: rawServiciosResponse, isLoading: isLoadingServicios } = useQuery({
    queryKey: ["listaServiciosND"],
    queryFn: async () => {
      try {
        const response = await fetchwrapper("/NotaDebitoDF/getServicios", { method: "GET" })
        const res = await response.json()
        return extractArrayData(res)
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })

  const listaServicios = Array.isArray(rawServiciosResponse) ? rawServiciosResponse : []

  const handleSetCabecera = (k, v) => setCabeceraND((prev) => ({ ...prev, [k]: v }))

  // --- MUTACIÓN PARA GUARDAR ---
  const { mutate: guardarNDMutation, isPending: isSavingND } = useMutation({
    queryKey: ["guardarNotaDebitoDF"],
    mutationFn: async (payload) => {
      const response = await api.post("/NotaDebitoDF/guardarNotaDebito", payload)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: (data) => {
      Swal.fire({
        icon: "success",
        title: "¡Nota de Débito Creada!",
        html: `
        <p>Documento N°: <strong>${data.facnumfac}</strong></p>
        <p>Modifica a: <strong>${data.facnumref}</strong></p>
        <p>Total: <strong>$${data.total.toFixed(2)}</strong></p>
      `,
        confirmButtonText: "Aceptar",
      }).then(() => {
        setServiciosAgregados([])
        navigate(-1)
      })
    },
  })

  const handleRealizarPedido = async () => {
    const serviciosValidos = serviciosAgregados.filter((p) => !p.isNew && p.sercodigo)

    if (!cabeceraND.caja.cjacodigo) {
      Swal.fire({ icon: "warning", title: "Falta Caja", text: "Debe seleccionar una Caja para generar el documento." })
      return
    }
    if (!cabeceraND.facnumref) {
      Swal.fire({ icon: "warning", title: "Falta Factura", text: "Debe buscar y seleccionar la factura a modificar." })
      return
    }
    if (serviciosValidos.length === 0) {
      Swal.fire({ icon: "warning", title: "Sin motivos", text: "Debe agregar al menos un motivo (servicio)." })
      return
    }
    if (!cabeceraND.factippag) {
      Swal.fire({ icon: "warning", title: "Falta Forma de Pago", text: "Debe seleccionar una forma de pago." })
      return
    }
    if (!cabeceraND.vendedor.vencodigo) {
      Swal.fire({ icon: "warning", title: "Falta Vendedor", text: "Debe seleccionar un vendedor." })
      return
    }

    Swal.fire({
      title: "Guardando documento...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    const payload = {
      facnumfac: codigoDocumento,
      facnumref: cabeceraND.facnumref,
      cjacodigo: cabeceraND.caja.cjacodigo,
      cliente: cabeceraND.cliente,
      servicios: serviciosValidos.map((p) => ({
        sercodigo: p.sercodigo,
        serdescri: p.serdescri,
        cantidad: Number(p.cantidadPedido),
        precioUnitario: Number(p.precioUnitario),
        ivaPorcentaje: Number(p.ivaPorcentaje),
        codigoIvaSri: p.codigoIvaSri, // Se envía el código original por si lo requiere el backend (Ej: 4)
        descuentoPorcentaje: Number(p.descuentoPorcentaje),
      })),
      formaPago: cabeceraND.factippag,
      vendedor: cabeceraND.vendedor,
      observacion: cabeceraND.observacion,
    }

    await guardarNDMutation(payload)
  }

  // --- MOTOR DE CÁLCULOS ---
  const calcularTotales = () => {
    let subtotal = 0
    let descuentoTotal = 0
    let ivaTotal = 0

    const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100

    serviciosAgregados.forEach((p) => {
      if (p.isNew || !p.sercodigo) return
      const cant = Number(p.cantidadPedido) || 0
      const precio = Number(p.precioUnitario) || 0
      const desc = Number(p.descuentoPorcentaje) || 0

      // Aquí el ivaPorcentaje ya viene con el valor real (15%, 12%, etc)
      const iva = Number(p.ivaPorcentaje) || 0

      const subP = round2(precio * cant)
      const descP = round2(subP * (desc / 100))
      const baseImponible = round2(subP - descP)
      const ivaP = round2(baseImponible * (iva / 100))

      subtotal += subP
      descuentoTotal += descP
      ivaTotal += ivaP
    })

    subtotal = round2(subtotal)
    descuentoTotal = round2(descuentoTotal)
    ivaTotal = round2(ivaTotal)
    const total = round2(subtotal - descuentoTotal + ivaTotal)

    return { subtotal, descuentoTotal, ivaTotal, total }
  }

  const { subtotal, descuentoTotal, ivaTotal, total } = calcularTotales()

  // --- MENU FLOTANTE ---
  const FloatingMenu = () => {
    const scrollToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    return (
      <Box
        sx={{
          position: "fixed",
          top: "50%",
          right: "10px",
          transform: "translateY(-50%)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "30px",
          padding: "10px",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        <List>
          <ListItem sx={{ padding: 0, marginBottom: "10px" }}>
            <Tooltip title={<span style={{ fontSize: "16px" }}>Información</span>} placement="left">
              <IconButton onClick={() => scrollToSection("informacion")}>
                <DescriptionIcon />
              </IconButton>
            </Tooltip>
          </ListItem>
          <ListItem sx={{ padding: 0 }}>
            <Tooltip title={<span style={{ fontSize: "16px" }}>Motivos</span>} placement="left">
              <IconButton onClick={() => scrollToSection("productos")}>
                <ShoppingBagIcon />
              </IconButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CustomBackdrop
        isLoading={isLoadingCodigo || isSavingND || isLoadingFP || isLoadingServicios || isLoadingCajas}
      />
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div style={{ display: "flex", justifyContent: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Crear Nota de Débito</b>
        </div>
        <FloatingMenu />

        <Box className={StyledRoot}>
          {/* INFORMACION GENERAL */}
          <CustomFieldsetAccordion
            title="Información General"
            expanded={expandedInfoGeneral}
            onToggle={() => setExpandedInfoGeneral(!expandedInfoGeneral)}
          >
            <ContainerCabecera id="informacion">
              <Codigo>
                <CustomTextFieldReadable label="Código ND" value={codigoDocumento} />
              </Codigo>

              <Caja>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Caja Asignada</InputLabel>
                <Autocomplete
                  options={listaCajas}
                  getOptionLabel={(opt) => (opt && opt.cjacodigo ? `${opt.cjacodigo} - ${opt.cjadescri}` : "")}
                  value={cabeceraND.caja?.cjacodigo ? cabeceraND.caja : null}
                  onChange={(e, val) => {
                    setCabeceraND((prev) => ({
                      ...prev,
                      caja: val || { cjacodigo: "", cjadescri: "" },
                    }))
                  }}
                  isOptionEqualToValue={(option, value) => option?.cjacodigo === value?.cjacodigo}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Seleccione..." InputLabelProps={{ shrink: true }} />
                  )}
                />
              </Caja>

              <FechaE>
                <CustomDatePicker
                  label="Fecha Emision"
                  value={dayjs(new Date())}
                  format="DD/MM/YYYY"
                  setValue={() => {}}
                  isOptional={true}
                />
              </FechaE>
              <FechaV>
                <CustomDatePicker
                  label="Fecha Vencimiento"
                  value={dayjs(new Date())}
                  setValue={() => {}}
                  format="DD/MM/YYYY"
                  isOptional={true}
                />
              </FechaV>

              <FormaPago>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Forma de pago</InputLabel>
                <Autocomplete
                  options={listaFormasPago}
                  getOptionLabel={(opt) => opt?.label || ""}
                  value={
                    listaFormasPago.find((c) => c.id === cabeceraND.factippag) ||
                    (cabeceraND.factippag
                      ? { id: cabeceraND.factippag, label: `${cabeceraND.factippag} - ${cabeceraND.fordescri}` }
                      : null)
                  }
                  onChange={(event, newValue) => {
                    setCabeceraND((prev) => ({
                      ...prev,
                      factippag: newValue ? newValue.id : "",
                      fordescri: newValue ? newValue.fordescri : "",
                      fortipo: newValue ? newValue.fortipo : "",
                      fordias: newValue ? parseFloat(newValue.fordias || 0) : 0,
                      fordescuento: newValue ? parseFloat(newValue.fordescuento || 0) : 0,
                    }))
                  }}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Buscar..." InputLabelProps={{ shrink: true }} />
                  )}
                />
              </FormaPago>

              <Vendedor>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Vendedor</InputLabel>
                <VendedorAutocomplete cabeceraProforma={cabeceraND} setCabeceraProforma={setCabeceraND} />
              </Vendedor>

              <Observacion>
                <CustomTextField
                  label="Observacion cliente"
                  value={cabeceraND.observacion}
                  onChange={(e) => handleSetCabecera("observacion", e.target.value)}
                />
              </Observacion>
            </ContainerCabecera>
          </CustomFieldsetAccordion>
          <br />

          {/* INFORMACION CLIENTE Y FACTURA MODIFICADA */}
          <CustomFieldsetAccordion
            title="Factura Original & Cliente"
            expanded={expandedInfoCliente}
            onToggle={() => setExpandedInfoCliente(!expandedInfoCliente)}
          >
            <ContainerCliente>
              <Factura>
                <CustomHelperDetail
                  label="Factura a Modificar"
                  valueSearched={cabeceraND.facnumref}
                  endpoint="/NotaDebitoDF/buscarFacturaND"
                  valueInputMain="facnumfac"
                  valueInputSecondary="sriautnumero"
                  idSearchField="busqueda"
                  errorMsgIdSearch="Error al buscar factura:"
                  queryKeyModal="buscarFacturaND"
                  perPage={10}
                  columnsTable={[
                    { accessorKey: "facnumfac", header: "Nº Factura", size: 150 },
                    { accessorKey: "cliruc", header: "RUC", size: 120 },
                    { accessorKey: "clinombre", header: "Cliente", size: 250 },
                    { accessorKey: "facfecemi", header: "Emisión", size: 100 },
                    { accessorKey: "factotal", header: "Total", size: 100 },
                    { accessorKey: "clidirec", header: "Dirección", size: 100, isVisible: false },
                    { accessorKey: "clitelef1", header: "Teléfono", size: 100, isVisible: false },
                  ]}
                  onHandleSelectedData={(v) => {
                    if (!v || Object.keys(v).length === 0 || !v.facnumfac) return

                    setCabeceraND((prev) => ({
                      ...prev,
                      facnumref: v.facnumfac || "",
                      cliente: { clicodigo: v.clicodigo || "", clinombre: v.clinombre || "" },
                      ruc: v.cliruc || "",
                      direccion: v.clidirec || "",
                      telefono: v.clitelef1 || "",
                    }))
                  }}
                  sxInputMain={{ minWidth: "170px", maxWidth: "170px", marginRight: "10px" }}
                  sxInputSecondary={{ width: "100%" }}
                />
              </Factura>
              <Cliente>
                <CustomTextFieldReadable label="Cliente" value={cabeceraND.cliente.clinombre} />
              </Cliente>
              <Direccion>
                <CustomTextFieldReadable label="Direccion" value={cabeceraND.direccion || "Se heredará al guardar"} />
              </Direccion>
              <Telefono>
                <CustomTextFieldReadable disabled label="Telefono" value={cabeceraND.telefono} />
              </Telefono>
              <Id>
                <CustomTextFieldReadable disabled label="RUC / CI" value={cabeceraND.ruc} />
              </Id>
            </ContainerCliente>
          </CustomFieldsetAccordion>
          <br />

          {/* GRILLA DE MOTIVOS (SERVICIOS) */}
          <Paper id="productos" sx={{ width: "100%", p: 2, mb: 4, borderRadius: "10px", border: "1px solid #ddd" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                Detalle de Motivos (Servicios)
              </Typography>

              {/* REGLA APLICADA: Deshabilitamos el botón si ya hay 1 fila */}
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                disabled={serviciosAgregados.length >= 1}
                onClick={() => {
                  if (serviciosAgregados.length >= 1) {
                    Swal.fire(
                      "Límite alcanzado",
                      "Las Notas de Débito solo admiten un motivo por documento.",
                      "warning",
                    )
                    return
                  }
                  setServiciosAgregados([
                    ...serviciosAgregados,
                    { isNew: true, cantidadPedido: 1, precioUnitario: 0, descuentoPorcentaje: 0, ivaPorcentaje: 0 },
                  ])
                }}
              >
                Añadir Motivo
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell width="50px" align="center">
                      Acción
                    </TableCell>
                    <TableCell>Buscador de Motivo (Servicio)</TableCell>
                    <TableCell width="120px" align="center">
                      Cantidad
                    </TableCell>
                    <TableCell width="140px" align="center">
                      Valor Unit.
                    </TableCell>
                    <TableCell width="120px" align="center">
                      % Desc.
                    </TableCell>
                    <TableCell width="80px" align="center">
                      % IVA
                    </TableCell>
                    <TableCell width="140px" align="right">
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serviciosAgregados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          Haga clic en "Añadir Motivo" para buscar el motivo del débito.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    serviciosAgregados.map((row, index) => {
                      const cant = Number(row.cantidadPedido) || 0
                      const prec = Number(row.precioUnitario) || 0
                      const desc = Number(row.descuentoPorcentaje) || 0
                      const iva = Number(row.ivaPorcentaje) || 0

                      const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100

                      const subP = round2(cant * prec)
                      const descP = round2(subP * (desc / 100))
                      const baseImponible = round2(subP - descP)
                      const ivaP = round2(baseImponible * (iva / 100))
                      const totalRow = round2(baseImponible + ivaP)

                      return (
                        <TableRow key={index} sx={{ verticalAlign: "top" }}>
                          <TableCell align="center" sx={{ pt: 2 }}>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => {
                                const newArr = [...serviciosAgregados]
                                newArr.splice(index, 1)
                                setServiciosAgregados(newArr)
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <ComboServicioRow
                              index={index}
                              row={row}
                              serviciosAgregados={serviciosAgregados}
                              setServiciosAgregados={setServiciosAgregados}
                              listaServicios={listaServicios}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              disabled={row.isNew || !row.sercodigo}
                              value={row.cantidadPedido}
                              onChange={(e) => {
                                const newArr = [...serviciosAgregados]
                                newArr[index].cantidadPedido = e.target.value
                                setServiciosAgregados(newArr)
                              }}
                              inputProps={{ min: 1, style: { textAlign: "center" } }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              disabled={row.isNew || !row.sercodigo}
                              value={row.precioUnitario}
                              onChange={(e) => {
                                const newArr = [...serviciosAgregados]
                                newArr[index].precioUnitario = e.target.value
                                setServiciosAgregados(newArr)
                              }}
                              inputProps={{ min: 0, step: "0.0001", style: { textAlign: "right" } }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              disabled={row.isNew || !row.sercodigo}
                              value={row.descuentoPorcentaje}
                              onChange={(e) => {
                                let val = e.target.value
                                if (val !== "") {
                                  const num = Number(val)
                                  if (num > 100) val = "100"
                                  if (num < 0) val = "0"
                                }
                                const newArr = [...serviciosAgregados]
                                newArr[index].descuentoPorcentaje = val
                                setServiciosAgregados(newArr)
                              }}
                              inputProps={{ min: 0, max: 100, style: { textAlign: "right" } }}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ pt: 2 }}>
                            {/* Mostrará el IVA Real (ej: 15%) */}
                            <Typography variant="body2">{iva}%</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ pt: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                              ${!row.isNew && row.sercodigo ? totalRow.toFixed(2) : "0.00"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* SECCIÓN TOTALES */}
            <Box display="flex" justifyContent="flex-end" mt={3} pr={2}>
              <Box
                width="300px"
                sx={{ p: 2, backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #eee" }}
              >
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Subtotal Base:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${subtotal.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="error">
                    Descuento:
                  </Typography>
                  <Typography variant="body2" color="error" fontWeight="bold">
                    -${descuentoTotal.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">IVA de Servicios:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${ivaTotal.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Total ND:</Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    ${total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box display="flex" justifyContent="flex-end" mt={3} pr={2}>
              <Button variant="contained" size="large" onClick={handleRealizarPedido}>
                Guardar Nota de Débito
              </Button>
            </Box>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearNotaDebitoDF
