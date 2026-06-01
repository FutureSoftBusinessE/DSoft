import React, { useState, useEffect } from "react"
import Header from "../../../layouts/Header"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import { useQuery } from "@tanstack/react-query"
import { ThemeProvider, styled, createTheme } from "@mui/material/styles"
import Swal from "sweetalert2"
import {
  CircularProgress,
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
import { useNavigate, useLocation } from "react-router-dom"

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
    "Codigo Codigo Codigo Codigo FormaPago FormaPago FormaPago FormaPago Vendedor Vendedor Vendedor Vendedor"
    "FechaE FechaE FechaV FechaV Observacion Observacion Observacion Observacion Observacion Observacion Observacion Observacion"
  `,
  gap: "8px",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "repeat(12, 1fr)",
    gridTemplateAreas: `
      "Codigo Codigo Codigo Codigo Codigo Codigo FormaPago FormaPago FormaPago FormaPago FormaPago FormaPago"
      "Vendedor Vendedor Vendedor Vendedor Vendedor Vendedor Observacion Observacion Observacion Observacion Observacion Observacion"
      "FechaE FechaE FechaE FechaE FechaE FechaE FechaV FechaV FechaV FechaV FechaV FechaV"
    `,
  },
}))

const ContainerCliente = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto",
  gridTemplateAreas: `
    "Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente"
    "Direccion Direccion Direccion Direccion Telefono Telefono Telefono Telefono Id Id Id Id"
  `,
  gap: "8px",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "repeat(12, 1fr)",
    gridTemplateAreas: `
      "Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente Cliente"
      "Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion "
      "Telefono  Telefono Telefono Telefono Telefono Telefono Id Id Id Id Id Id"
    `,
  },
}))

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

// --- HOOKS DE CARGA DE DATOS ---
function useGetProformaDF(pednumped) {
  return useQuery({
    queryKey: ["proformaEditarDF", pednumped],
    queryFn: async () => {
      const response = await fetchwrapper(`/FacturaDesdeArticulosDF/getProforma/${pednumped}`)
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || "Error al cargar documento")
      }
      return data.data
    },
    refetchOnWindowFocus: false,
    enabled: !!pednumped,
  })
}

function useGetInfoCliente(clicodigo) {
  return useQuery({
    queryKey: ["FacturacionClienteInfoDF", clicodigo],
    queryFn: async () => {
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente: clicodigo }),
      }
      const response = await fetchwrapper(`/FacturaDesdeArticulosDF/getInfoCliente`, options)
      const data = await response.json()
      return data.data
    },
    refetchOnWindowFocus: false,
    enabled: false,
  })
}

// --- COMPONENTE DE BÚSQUEDA EN LA GRILLA ---
const ComboArticuloRow = ({ index, row, productosAgregados, setProductosAgregados }) => {
  const [inputValue, setInputValue] = useState("")
  const [options, setOptions] = useState(row.artcodigo ? [row] : [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!inputValue || inputValue.trim() === "") {
      setOptions(row.artcodigo ? [row] : [])
      return undefined
    }

    const fetchProductos = async () => {
      setLoading(true)
      try {
        const response = await fetchwrapper(`/FacturaDesdeArticulosDF/getSpecificArticulo/${inputValue}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        const res = await response.json()

        if (active && res.data && res.data.length > 0) {
          setOptions(res.data)
        } else {
          if (active) setOptions([])
        }
      } catch (err) {
        console.error(err)
        if (active) setOptions([])
      } finally {
        if (active) setLoading(false)
      }
    }

    const timer = setTimeout(() => fetchProductos(), 600)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [inputValue, row])

  return (
    <Autocomplete
      options={options}
      value={row.artcodigo ? row : null}
      getOptionLabel={(opt) => `${opt.artcodigo || ""} - ${opt.artdescri || ""}`}
      filterOptions={(x) => x}
      loading={loading}
      onInputChange={(e, val) => setInputValue(val)}
      onChange={(e, val) => {
        const newArr = [...productosAgregados]
        if (val) {
          const aplicaIva =
            val.artapliiva === "S" ||
            val.artapliiva === "SI" ||
            val.artapliiva === 1 ||
            val.artapliiva === true ||
            val.artapliiva === "-1" ||
            val.artapliiva === -1
          const porcIva = aplicaIva ? Number(val.sysiva || 0) : 0

          newArr[index] = {
            ...val,
            isNew: false,
            cantidadPedido: row.cantidadPedido || 1,
            precioUnitario: Number(val.artprecventa1 || val.precioUnitario || 0),
            descuentoPorcentaje: 0,
            ivaPorcentaje: porcIva,
          }
        } else {
          newArr[index] = {
            isNew: true,
            cantidadPedido: 1,
            precioUnitario: 0,
            descuentoPorcentaje: 0,
            ivaPorcentaje: 0,
          }
        }
        setProductosAgregados(newArr)
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Escriba el código o nombre..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={inputValue ? "No encontrado" : "Escriba para buscar"}
    />
  )
}

const EditarFacturaDesdeArticulosDF = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const proformaOriginal = location.state

  const [expandedInfoGeneral, setExpandedInfoGeneral] = useState(true)
  const [expandedInfoCliente, setExpandedInfoCliente] = useState(true)

  const [cabeceraProforma, setCabeceraProforma] = useState({
    cliente: { clicodigo: "" },
    direccion: "",
    ruc: "",
    telefono: "",
    factippag: "",
    fordescri: "",
    fortipo: "",
    fordias: 0,
    fordescuento: 0.0,
    vendedor: {
      vencodigo: "",
      vennombre: "",
      pedidossiac: "",
      pedidosweb: "",
    },
    // Objeto necesario exclusivamente para el componente VendedorAutocomplete
    vendedorSeleccionado: {
      vencodigo: "",
      vennombre: "",
    },
    observacion: "",
  })

  const [productosAgregados, setProductosAgregados] = useState([])

  // --- LÓGICA REFORZADA: CARGA DE FORMAS DE PAGO NATIVA ---
  const { data: rawFormasPago, isLoading: isLoadingFP } = useQuery({
    queryKey: ["listaFormasPagoDF"],
    queryFn: async () => {
      try {
        const response = await fetchwrapper("/FacturaDesdeArticulosDF/getFormaPago", { method: "GET" })
        const res = await response.json()
        return Array.isArray(res) ? res : res?.data || []
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })

  // Normalizamos limpiando espacios en blanco que arroja SQL Server
  const listaFormasPago = Array.isArray(rawFormasPago)
    ? rawFormasPago.map((item) => ({
        ...item,
        id: item.factippag ? item.factippag.trim() : "",
        label:
          `${item.factippag ? item.factippag.trim() : ""} - ${item.fordescri ? item.fordescri.trim() : ""}`.replace(
            /^ - |- $/g,
            "",
          ),
      }))
    : []

  // --- CARGA INICIAL DE LA FACTURA ---
  const { data: proformaData, isLoading: isLoadingProforma } = useGetProformaDF(proformaOriginal?.pednumped)

  useEffect(() => {
    if (proformaData) {
      const clienteInfo = proformaData.cliente || {}
      const formaPagoInfo = proformaData.formaPago || {}
      const vendedorInfo = proformaData.vendedor || {}
      const cabeceraInfo = proformaData.cabecera || {}

      const safeTrim = (str) => (typeof str === "string" ? str.trim() : str)

      setCabeceraProforma({
        cliente: {
          clicodigo: safeTrim(clienteInfo.clicodigo) || "",
          clinombre: safeTrim(clienteInfo.clinombre) || "",
          clidirec: safeTrim(clienteInfo.clidirec) || "",
          cliruc: safeTrim(clienteInfo.cliruc) || "",
          clitelef1: safeTrim(clienteInfo.clitelef1) || "",
        },
        direccion: safeTrim(clienteInfo.clidirec) || safeTrim(cabeceraInfo.peddirent) || "",
        ruc: safeTrim(clienteInfo.cliruc) || "",
        telefono: safeTrim(clienteInfo.clitelef1) || "",

        // Mapeo directo y limpio para nuestro Autocomplete nativo
        factippag: safeTrim(cabeceraInfo.factippag) || safeTrim(formaPagoInfo.factippag) || "",
        fordescri: safeTrim(formaPagoInfo.fordescri) || "",
        fortipo: safeTrim(formaPagoInfo.fortipo) || safeTrim(cabeceraInfo.fortipo) || "",
        fordias: parseFloat(cabeceraInfo.fordias || formaPagoInfo.fordias || 0),
        fordescuento: parseFloat(cabeceraInfo.fordescuento || formaPagoInfo.fordescuento || 0),

        vendedor: {
          vencodigo: safeTrim(vendedorInfo.vencodigo) || safeTrim(cabeceraInfo.vencodigo) || "",
          vennombre: safeTrim(vendedorInfo.vennombre) || "",
          pedidossiac: "",
          pedidosweb: "",
        },
        vendedorSeleccionado: {
          vencodigo: safeTrim(vendedorInfo.vencodigo) || safeTrim(cabeceraInfo.vencodigo) || "",
          vennombre: safeTrim(vendedorInfo.vennombre) || "",
        },
        observacion: safeTrim(cabeceraInfo.peddetalle) || "",
      })

      if (proformaData.productos && proformaData.productos.length > 0) {
        const productosFormateados = proformaData.productos.map((prod) => ({
          ...prod,
          isNew: false,
          precioUnitario: Number(prod.precioUnitario || 0),
          ivaPorcentaje: Number(prod.ivaPorcentaje || 0),
          descuentoPorcentaje: Number(prod.descuentoPorcentaje || 0),
          cantidadPedido: Number(prod.cantidadPedido || 1),
        }))
        setProductosAgregados(productosFormateados)
      }
    }
  }, [proformaData])

  // --- CARGA DINÁMICA DE CLIENTE ---
  const { data: fetchedInfoCliente = {}, refetch: refetchInfoCliente } = useGetInfoCliente(
    cabeceraProforma.cliente.clicodigo,
  )

  useEffect(() => {
    if (cabeceraProforma.cliente.clicodigo) refetchInfoCliente()
  }, [cabeceraProforma.cliente.clicodigo])

  useEffect(() => {
    if (Object.keys(fetchedInfoCliente).length > 0) {
      setCabeceraProforma((prev) => ({
        ...prev,
        direccion: fetchedInfoCliente.clidirec || prev.direccion,
        ruc: fetchedInfoCliente.cliruc || prev.ruc,
        telefono: fetchedInfoCliente.clitelef1 || prev.telefono,
      }))
    }
  }, [fetchedInfoCliente])

  const handleSetCabeceraProforma = (k, v) => setCabeceraProforma((prev) => ({ ...prev, [k]: v }))

  // --- MUTACIÓN PARA ACTUALIZAR ---
  const { mutate: actualizarPedidoMutation, isPending: isUpdating } = useMutation({
    queryKey: ["actualizarPedidoDF"],
    mutationFn: async (payload) => {
      const response = await api.post("/FacturaDesdeArticulosDF/editarPedido", payload)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: (data) => {
      Swal.fire({
        icon: "success",
        title: "¡Documento Actualizado!",
        html: `
        <p>Documento N°: <strong>${data.pednumped}</strong></p>
        <p>Total: <strong>$${data.total.toFixed(2)}</strong></p>
        <p>Productos: <strong>${data.productos}</strong></p>
      `,
        confirmButtonText: "Aceptar",
      }).then(() => {
        navigate(-1)
      })
    },
  })

  const handleActualizarPedido = async () => {
    const productosValidos = productosAgregados.filter((p) => !p.isNew && p.artcodigo)

    if (productosValidos.length === 0) {
      Swal.fire({ icon: "warning", title: "Sin productos", text: "Debe agregar al menos un producto válido." })
      return
    }
    if (!cabeceraProforma.cliente.clicodigo) {
      Swal.fire({ icon: "warning", title: "Falta Cliente", text: "Debe seleccionar un cliente." })
      return
    }
    if (!cabeceraProforma.factippag) {
      Swal.fire({ icon: "warning", title: "Falta Forma de Pago", text: "Debe seleccionar una forma de pago." })
      return
    }
    if (!cabeceraProforma.vendedor.vencodigo) {
      Swal.fire({ icon: "warning", title: "Falta Vendedor", text: "Debe seleccionar un vendedor." })
      return
    }

    Swal.fire({
      title: "Actualizando documento...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    const payload = {
      pednumped: proformaOriginal.pednumped,
      cliente: cabeceraProforma.cliente,
      productos: productosValidos.map((p) => ({
        artcodigo: p.artcodigo,
        artdescri: p.artdescri,
        meddescri: p.meddescri,
        predescri: p.predescri,
        lindescri: p.lindescri,
        artcantactual: p.artcantactual,
        mardescri: p.mardescri,
        precioUnitario: Number(p.precioUnitario),
        ivaPorcentaje: Number(p.ivaPorcentaje),
        artapliiva: p.artapliiva,
        descuentoPorcentaje: Number(p.descuentoPorcentaje),
        imagen: p.imagen,
        cantidadPedido: Number(p.cantidadPedido),
      })),
      formaPago: cabeceraProforma.factippag,
      vendedor: cabeceraProforma.vendedor,
      observacion: cabeceraProforma.observacion,
    }

    await actualizarPedidoMutation(payload)
  }

  // --- MOTOR DE CÁLCULOS ---
  const calcularTotales = () => {
    let subtotal = 0
    let descuentoTotal = 0
    let ivaTotal = 0

    const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100

    productosAgregados.forEach((p) => {
      if (p.isNew || !p.artcodigo) return
      const cant = Number(p.cantidadPedido) || 0
      const precio = Number(p.precioUnitario) || 0
      const desc = Number(p.descuentoPorcentaje) || 0
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
            <Tooltip title={<span style={{ fontSize: "16px" }}>Productos</span>} placement="left">
              <IconButton onClick={() => scrollToSection("productos")}>
                <ShoppingBagIcon />
              </IconButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    )
  }

  if (isLoadingProforma) {
    return (
      <ThemeProvider theme={theme}>
        <CustomBackdrop isLoading={true} />
        <Header />
        <div className="main main-app p-3 p-lg-4" style={{ textAlign: "center", paddingTop: "50px" }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Cargando documento...
          </Typography>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CustomBackdrop isLoading={isUpdating || isLoadingFP} />
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div style={{ display: "flex", justifyContent: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Editar Proforma: {proformaOriginal?.pednumped}</b>
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
                <CustomTextFieldReadable label="Código de Proforma" value={proformaOriginal?.pednumped || ""} />
              </Codigo>
              <FechaE>
                <CustomDatePicker
                  label="Fecha Emision"
                  value={proformaData ? dayjs(proformaData.cabecera.pedfecemi) : dayjs(new Date())}
                  format="DD/MM/YYYY"
                  setValue={() => {}}
                  isOptional={true}
                />
              </FechaE>
              <FechaV>
                <CustomDatePicker
                  label="Fecha Vencimiento"
                  value={proformaData ? dayjs(proformaData.cabecera.pedfecven) : dayjs(new Date())}
                  setValue={() => {}}
                  format="DD/MM/YYYY"
                  isOptional={true}
                />
              </FechaV>

              {/* COMBO FORMA DE PAGO REFORZADO */}
              <FormaPago>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Forma de pago</InputLabel>
                <Autocomplete
                  options={listaFormasPago}
                  getOptionLabel={(option) => option.label || ""}
                  value={
                    listaFormasPago.find((c) => c.id === cabeceraProforma.factippag) ||
                    (cabeceraProforma.factippag
                      ? {
                          id: cabeceraProforma.factippag,
                          label: `${cabeceraProforma.factippag} - ${cabeceraProforma.fordescri}`,
                        }
                      : null)
                  }
                  onChange={(event, newValue) => {
                    setCabeceraProforma((prev) => ({
                      ...prev,
                      factippag: newValue ? newValue.id : "",
                      fordescri: newValue ? newValue.fordescri : "",
                      fortipo: newValue ? newValue.fortipo : "",
                      fordias: newValue ? parseFloat(newValue.fordias || 0) : 0,
                      fordescuento: newValue ? parseFloat(newValue.fordescuento || 0) : 0,
                    }))
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Buscar..." InputLabelProps={{ shrink: true }} />
                  )}
                />
              </FormaPago>

              <Vendedor>
                <InputLabel sx={{ mb: 1, fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>Vendedor</InputLabel>
                {/* COMBO VENDEDOR (Se mantiene su componente original que funciona bien) */}
                <VendedorAutocomplete cabeceraProforma={cabeceraProforma} setCabeceraProforma={setCabeceraProforma} />
              </Vendedor>

              <Observacion>
                <CustomTextField
                  label="Observacion cliente"
                  value={cabeceraProforma.observacion}
                  onChange={(e) => handleSetCabeceraProforma("observacion", e.target.value)}
                />
              </Observacion>
            </ContainerCabecera>
          </CustomFieldsetAccordion>
          <br />

          {/* INFORMACION CLIENTE */}
          <CustomFieldsetAccordion
            title="Información Cliente"
            expanded={expandedInfoCliente}
            onToggle={() => setExpandedInfoCliente(!expandedInfoCliente)}
          >
            <ContainerCliente>
              <Cliente>
                <CustomHelperDetail
                  label="Cliente"
                  valueSearched={cabeceraProforma.cliente.clicodigo}
                  endpoint="/FacturaDesdeArticulosDF/getCliente"
                  valueInputMain="clicodigo"
                  valueInputSecondary="clinombre"
                  idSearchField="clicodigo"
                  errorMsgIdSearch="Error fetching data:"
                  queryKeyModal="clienteAsociacionProd"
                  perPage={10}
                  columnsTable={[
                    { accessorKey: "clicodigo", header: "Código de Cliente", size: 100 },
                    { accessorKey: "clinombre", header: "Nombre del Cliente", size: 250 },
                    { accessorKey: "cliruc", header: "Identificación", size: 150 },
                    { accessorKey: "clidirec", header: "Dirección", size: 400 },
                  ]}
                  onHandleSelectedData={(v) => {
                    handleSetCabeceraProforma("cliente", v)
                    handleSetCabeceraProforma("nombre", v.clinombre)
                  }}
                  sxInputMain={{ minWidth: "170px", maxWidth: "170px", marginRight: "10px" }}
                  sxInputSecondary={{ width: "100%" }}
                />
              </Cliente>
              <Direccion>
                <CustomTextFieldReadable label="Direccion" value={cabeceraProforma.direccion} />
              </Direccion>
              <Telefono>
                <CustomTextFieldReadable disabled label="Telefono" value={cabeceraProforma.telefono} />
              </Telefono>
              <Id>
                <CustomTextFieldReadable disabled label="Id" value={cabeceraProforma.ruc} />
              </Id>
            </ContainerCliente>
          </CustomFieldsetAccordion>
          <br />

          {/* GRILLA DE PRODUCTOS */}
          <Paper id="productos" sx={{ width: "100%", p: 2, mb: 4, borderRadius: "10px", border: "1px solid #ddd" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                Detalle de Productos
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={() => {
                  setProductosAgregados([
                    ...productosAgregados,
                    { isNew: true, cantidadPedido: 1, precioUnitario: 0, descuentoPorcentaje: 0, ivaPorcentaje: 0 },
                  ])
                }}
              >
                Añadir Línea
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell width="50px" align="center">
                      Acción
                    </TableCell>
                    <TableCell>Buscador de Artículo</TableCell>
                    <TableCell width="120px" align="center">
                      Cantidad
                    </TableCell>
                    <TableCell width="140px" align="center">
                      Precio Unit.
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
                  {productosAgregados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          Haga clic en "Añadir Línea" para buscar y agregar productos.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    productosAgregados.map((row, index) => {
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
                                const newArr = [...productosAgregados]
                                newArr.splice(index, 1)
                                setProductosAgregados(newArr)
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <ComboArticuloRow
                              index={index}
                              row={row}
                              productosAgregados={productosAgregados}
                              setProductosAgregados={setProductosAgregados}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              disabled={row.isNew || !row.artcodigo}
                              value={row.cantidadPedido}
                              onChange={(e) => {
                                const newArr = [...productosAgregados]
                                newArr[index].cantidadPedido = e.target.value
                                setProductosAgregados(newArr)
                              }}
                              inputProps={{ min: 1, style: { textAlign: "center" } }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              disabled={row.isNew || !row.artcodigo}
                              value={row.precioUnitario}
                              onChange={(e) => {
                                const newArr = [...productosAgregados]
                                newArr[index].precioUnitario = e.target.value
                                setProductosAgregados(newArr)
                              }}
                              inputProps={{ min: 0, step: "0.0001", style: { textAlign: "right" } }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              disabled={row.isNew || !row.artcodigo}
                              value={row.descuentoPorcentaje}
                              onChange={(e) => {
                                let val = e.target.value
                                if (val !== "") {
                                  const num = Number(val)
                                  if (num > 100) val = "100"
                                  if (num < 0) val = "0"
                                }
                                const newArr = [...productosAgregados]
                                newArr[index].descuentoPorcentaje = val
                                setProductosAgregados(newArr)
                              }}
                              inputProps={{ min: 0, max: 100, style: { textAlign: "right" } }}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ pt: 2 }}>
                            <Typography variant="body2">{iva}%</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ pt: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                              ${!row.isNew && row.artcodigo ? totalRow.toFixed(2) : "0.00"}
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
                  <Typography variant="body2">Subtotal:</Typography>
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
                  <Typography variant="body2">IVA:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${ivaTotal.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    ${total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box display="flex" justifyContent="flex-end" mt={3} pr={2}>
              <Button variant="contained" size="large" onClick={handleActualizarPedido}>
                Actualizar Proforma
              </Button>
            </Box>
          </Paper>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default EditarFacturaDesdeArticulosDF
