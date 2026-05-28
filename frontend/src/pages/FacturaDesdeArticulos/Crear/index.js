// app/FacturaDesdeArticulos/CrearFacturaDesdeArticulos.jsx

import React, { useState, useEffect, useRef } from "react"
import Header from "../../../layouts/Header"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import { useQuery } from "@tanstack/react-query"
import { ThemeProvider, styled, createTheme } from "@mui/material/styles"
import PaymentIcon from "@mui/icons-material/Payment"
import Swal from "sweetalert2"
import {
  CircularProgress,
  useMediaQuery,
  Fab,
  Badge,
  Box,
  Tabs,
  Tab,
  InputLabel,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  TextField,
  Divider,
  Dialog,
} from "@mui/material"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useMutation, api } from "../../../api"
import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"

import ExpandMore from "@mui/icons-material/ExpandMore"
import CustomDatePicker from "../../../components/CustomDatePicker"
import CustomTextField from "../../../components/CustomTextField"
import CustomTextFieldReadable from "../../../components/CustomTextFieldReadable"
import CustomHelperDetail from "../../../components/CustomHelperDetail"
import DescriptionIcon from "@mui/icons-material/Description"
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag"
import FormaDePagoAutocomplete from "../components/FormaDePagoAutocomplete"
import VendedorAutocomplete from "../components/VendedorAutocomplete"
import ProductGrid from "../components/ProductGrid"
import DetallePedido from "../components/DetallePedido"
import AccordionFiltros from "../components/AccordionFiltros"
import dayjs from "dayjs"
import BackIcon from "../../../components/BackIcon"
import CloseIcon from "@mui/icons-material/Close"
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
    primary: {
      main: "#196C87",
    },
    secondary: {
      main: "#196C87",
    },
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

const ContainerArticulos = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateRows: "auto",
  gridTemplateAreas: `
    "Productos Productos Productos Productos Productos Productos Productos Productos Detalle Detalle Detalle Detalle"
  `,
  gap: "8px",
  alignItems: "flex-start",

  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "repeat(12, 1fr)",
    gridTemplateAreas: `
      "Productos Productos Productos Productos Productos Productos Productos Productos Productos Productos Productos Productos"
      "Detalle Detalle Detalle Detalle Detalle Detalle Detalle Detalle Detalle Detalle Detalle Detalle"
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
      "Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion Direccion"
      "Telefono  Telefono Telefono Telefono Telefono Telefono Id Id Id Id Id Id"
    `,
  },
}))

const Productos = styled(Box)({
  gridArea: "Productos",
})

const Detalle = styled(Box)({
  gridArea: "Detalle",
  height: "100%",
})

const Cliente = styled(Box)({
  gridArea: "Cliente",
})

const Direccion = styled(Box)({
  gridArea: "Direccion",
})

const Telefono = styled(Box)({
  gridArea: "Telefono",
})

const Id = styled(Box)({
  gridArea: "Id",
})

const FechaE = styled(Box)({
  gridArea: "FechaE",
})

const FechaV = styled(Box)({
  gridArea: "FechaV",
})

const Codigo = styled(Box)({
  gridArea: "Codigo",
})

const FormaPago = styled(Box)({
  gridArea: "FormaPago",
})

const Vendedor = styled(Box)({
  gridArea: "Vendedor",
})

const Observacion = styled(Box)({
  gridArea: "Observacion",
})

// Hook para TOP 30
function useGetArticulos(clicodigo, factippag) {
  return useQuery({
    queryKey: ["FacturacionArticulos", clicodigo, factippag],
    queryFn: async () => {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          clicodigo: clicodigo || "000001",
          factippag: factippag || "",
        }),
      }
      let response = await fetchwrapper(`/FacturaDesdeArticulos/getTOP30Articulos`, options)
      response = await response.json()
      return response?.data ?? []
    },
    refetchOnWindowFocus: false,
    enabled: !!(clicodigo && clicodigo !== ""),
  })
}

// Hook para info del cliente
function useGetInfoCliente(clicodigo) {
  return useQuery({
    queryKey: ["FacturacionClienteInfo", clicodigo],
    queryFn: async () => {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          cliente: clicodigo,
        }),
      }
      const response = await fetchwrapper(`/FacturaDesdeArticulos/getInfoCliente`, options)
      const data = await response.json()
      return data.data
    },
    refetchOnWindowFocus: false,
    enabled: false,
  })
}

function useGetCodigoPedidoTemporal() {
  return useQuery({
    queryKey: ["CodigoPedidoTemporal"],
    queryFn: async () => {
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
      let response = await fetchwrapper(`/FacturaDesdeArticulos/generarCodigoPedidoTemporal`, options)
      response = await response.json()

      if (!response.success) {
        throw new Error(response.error)
      }

      return response.data
    },
    refetchOnWindowFocus: false,
    enabled: true,
    retry: false,
  })
}

// Hook para obtener datos de factura para clonar
function useGetFacturaParaClonar(facnumfac, ciacodigo, loccodigo) {
  return useQuery({
    queryKey: ["facturaParaClonar", facnumfac],
    queryFn: async () => {
      const response = await fetchwrapper("/FacturaDesdeArticulos/getFacturaParaClonar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facnumfac,
          ciacodigo,
          loccodigo,
        }),
      })
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || "Error al cargar factura para clonar")
      }
      console.log(data.data, "aquiiiii")
      return data.data.data
    },
    refetchOnWindowFocus: false,
    enabled: !!facnumfac,
  })
}

const CrearFacturaDesdeArticulos = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const datosClonacion = location.state
  const esClonacion = !!datosClonacion?.facnumfac

  const [expandedInfoGeneral, setExpandedInfoGeneral] = useState(true)
  const handleToggleInfoGeneral = () => setExpandedInfoGeneral((prev) => !prev)
  const [expandedInfoCliente, setExpandedInfoCliente] = useState(true)
  const handleToggleInfoCliente = () => setExpandedInfoCliente((prev) => !prev)

  const [codigoFactura, setCodigoFactura] = useState("")

  const {
    data: codigoPedidoTemporal,
    isError: codigoPedidoError,
    error: codigoPedidoErrorData,
    isLoading: isLoadingCodigo,
    refetch: refetchCodigoPedido,
  } = useGetCodigoPedidoTemporal()

  const { data: datosFacturaClonar, isLoading: isLoadingClonacion } = useGetFacturaParaClonar(
    datosClonacion?.facnumfac,
    datosClonacion?.ciacodigo,
    datosClonacion?.loccodigo,
  )

  useEffect(() => {
    refetchCodigoPedido()
  }, [])

  useEffect(() => {
    if (codigoPedidoTemporal) {
      setCodigoFactura(codigoPedidoTemporal)
    }
  }, [codigoPedidoTemporal])

  useEffect(() => {
    if (codigoPedidoError) {
      Swal.fire({
        icon: "error",
        title: "Error de configuracion",
        text: codigoPedidoErrorData?.message || "No se ha configurado la secuencia PED en el sistema",
      })
    }
  }, [codigoPedidoError])

  const [cabeceraFactura, setCabeceraFactura] = useState({
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
    observacion: "",
  })

  const [productosAgregados, setProductosAgregados] = useState([])
  const [productosGrid, setProductosGrid] = useState([])
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [tabValue, setTabValue] = useState(0)
  const [isModalOpen, setModalOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [mostrandoFiltros, setMostrandoFiltros] = useState(false)

  const isMobile = useMediaQuery("(max-width:600px)")
  const accordionFiltrosRef = useRef()

  const {
    data: fetchedArticulos = [],
    refetch: refetchTop30,
    isFetching: isFetchingTop30,
  } = useGetArticulos(cabeceraFactura.cliente.clicodigo, cabeceraFactura.fortipo)

  const { data: fetchedInfoCliente = {}, refetch: refetchInfoCliente } = useGetInfoCliente(
    cabeceraFactura.cliente.clicodigo,
  )

  // Efecto para cargar datos de clonacion
  useEffect(() => {
    if (datosFacturaClonar) {
      const clienteInfo = datosFacturaClonar.cliente || {}
      const formaPagoInfo = datosFacturaClonar.formaPago || {}
      const vendedorInfo = datosFacturaClonar.vendedor || {}

      setCabeceraFactura({
        cliente: {
          clicodigo: clienteInfo.clicodigo || "",
          clinombre: clienteInfo.clinombre || "",
          clidirec: clienteInfo.clidirec || "",
          cliruc: clienteInfo.cliruc || "",
          clitelef1: clienteInfo.clitelef1 || "",
        },
        direccion: clienteInfo.clidirec || "",
        ruc: clienteInfo.cliruc || "",
        telefono: clienteInfo.clitelef1 || "",
        factippag: formaPagoInfo.factippag || "",
        fordescri: formaPagoInfo.fordescri || "",
        fortipo: formaPagoInfo.fortipo || "",
        fordias: parseFloat(formaPagoInfo.fordias || 0),
        fordescuento: parseFloat(formaPagoInfo.fordescuento || 0),
        vendedor: {
          vencodigo: vendedorInfo.vencodigo || "",
          vennombre: vendedorInfo.vennombre || "",
          pedidossiac: "",
          pedidosweb: "",
        },
        observacion: datosFacturaClonar.observacion || "",
      })

      if (datosFacturaClonar.productos && datosFacturaClonar.productos.length > 0) {
        setProductosAgregados(datosFacturaClonar.productos)
      }
    }
  }, [datosFacturaClonar])

  // Efecto para cargar TOP 30 cuando cambia cliente o forma de pago
  useEffect(() => {
    if (cabeceraFactura.cliente.clicodigo) {
      refetchTop30()
    }
  }, [cabeceraFactura.cliente.clicodigo, cabeceraFactura.fortipo])

  // Efecto para actualizar productosGrid en pestana TOP 30
  useEffect(() => {
    if (tabValue === 0 && fetchedArticulos.length > 0) {
      setProductosGrid(fetchedArticulos)
      setMostrandoFiltros(false)
    }
  }, [tabValue, fetchedArticulos])

  // Efecto para mostrar productos filtrados
  useEffect(() => {
    if (tabValue === 1 && productosFiltrados.length > 0) {
      setProductosGrid(productosFiltrados)
    }
  }, [tabValue, productosFiltrados])

  // Efecto para cargar info del cliente
  useEffect(() => {
    if (cabeceraFactura.cliente.clicodigo) {
      refetchInfoCliente()
    }
  }, [cabeceraFactura.cliente.clicodigo])

  useEffect(() => {
    if (Object.keys(fetchedInfoCliente).length > 0) {
      setCabeceraFactura((prev) => ({
        ...prev,
        direccion: fetchedInfoCliente.clidirec || "",
        ruc: fetchedInfoCliente.cliruc || "",
        telefono: fetchedInfoCliente.clitelef1 || "",
      }))
    }
  }, [fetchedInfoCliente])

  const handleSetCabeceraFactura = (k, v) => setCabeceraFactura((prev) => ({ ...prev, [k]: v }))

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    if (newValue === 0) {
      setProductosGrid(fetchedArticulos)
      setMostrandoFiltros(false)
    }
  }

  const handleFilteredProducts = (productos) => {
    setProductosFiltrados(productos)
    setProductosGrid(productos)
    setMostrandoFiltros(true)
  }

  // Mutation para guardar pedido
  const { mutate: guardarPedidoMutation, isPending: isSavingPedido } = useMutation({
    queryKey: ["guardarPedido"],
    mutationFn: async (payload) => {
      const response = await api.post("/FacturaDesdeArticulos/guardarPedido", payload)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: (data, variables, context, message) => {
      Swal.fire({
        icon: "success",
        title: "Proforma realizado!",
        html: `
        <p>Profroma N: <strong>${data.pednumped}</strong></p>
        <p>Total: <strong>$${data.total.toFixed(2)}</strong></p>
        <p>Productos: <strong>${data.productos}</strong></p>
      `,
        confirmButtonText: "Aceptar",
      }).then(() => {
        setProductosAgregados([])
        navigate(-1)
      })
    },
  })

  const handleRealizarPedido = async () => {
    if (productosAgregados.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin productos",
        text: "Debe agregar al menos un producto para realizar el proforma",
      })
      return
    }

    if (!cabeceraFactura.cliente.clicodigo) {
      Swal.fire({
        icon: "warning",
        title: "Cliente no seleccionado",
        text: "Debe seleccionar un cliente para realizar el proforma",
      })
      return
    }

    if (!cabeceraFactura.fortipo) {
      Swal.fire({
        icon: "warning",
        title: "Forma de pago no seleccionada",
        text: "Debe seleccionar una forma de pago",
      })
      return
    }

    if (!cabeceraFactura.vendedor.vencodigo) {
      Swal.fire({
        icon: "warning",
        title: "Vendedor no seleccionado",
        text: "Debe seleccionar una vendedor",
      })
      return
    }

    Swal.fire({
      title: "Guardando proforma...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    const payload = {
      cliente: cabeceraFactura.cliente,
      productos: productosAgregados.map((p) => ({
        artcodigo: p.artcodigo,
        artdescri: p.artdescri,
        meddescri: p.meddescri,
        predescri: p.predescri,
        lindescri: p.lindescri,
        artcantactual: p.artcantactual,
        mardescri: p.mardescri,
        precioUnitario: p.precioUnitario,
        ivaPorcentaje: p.ivaPorcentaje,
        artapliiva: p.artapliiva,
        descuentoPorcentaje: p.descuentoPorcentaje,
        imagen: p.imagen,
        cantidadPedido: p.cantidadPedido,
      })),
      formaPago: cabeceraFactura.factippag,
      vendedor: cabeceraFactura.vendedor,
      observacion: cabeceraFactura.observacion,
    }

    await guardarPedidoMutation(payload)
  }

  const FloatingMenu = () => {
    const menuItems = [
      { icon: <DescriptionIcon />, label: "Informacion", sectionId: "informacion" },
      { icon: <ShoppingBagIcon />, label: "Productos", sectionId: "productos" },
    ]

    const scrollToSection = (id) => {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }

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
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <List>
          {menuItems.map((item, index) => (
            <ListItem key={index} sx={{ padding: 0, marginBottom: "10px" }}>
              <Tooltip title={<span style={{ fontSize: "16px" }}>{item.label}</span>} placement="left">
                <IconButton
                  onClick={() => scrollToSection(item.sectionId)}
                  sx={{
                    color: "#666",
                    backgroundColor: "white",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  {item.icon}
                </IconButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>
    )
  }

  const styles = {
    accordionSummary: {
      backgroundColor: "rgb(25, 108, 135)",
      color: "white",
      fontWeight: "bolder",
    },
    tabsContainer: {
      maxWidth: "100%",
      margin: "0 auto",
      fontFamily: "Arial, sans-serif",
    },
    tabButtons: {
      display: "flex",
      gap: "4px",
      marginTop: "14px",
    },
    activeTab: {
      backgroundColor: "rgb(25, 108, 135)",
      borderRadius: "10px 10px 0 0",
      color: "white",
      "&.Mui-selected": {
        color: "white",
      },
    },
    tabContent: {
      padding: "20px",
      border: "1px solid #ddd",
      borderRadius: "0 0 10px 10px",
      backgroundColor: "#f9f9f9",
    },
  }

  return (
    <ThemeProvider theme={theme}>
      <CustomBackdrop isLoading={isLoadingCodigo || isSavingPedido || isLoadingClonacion} />
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 30px 30px 30px",
            fontSize: "25px",
          }}
        >
          <b>{esClonacion ? "Clonar Factura" : "Crear Factura"}</b>
        </div>
        <FloatingMenu />

        <Box className={StyledRoot}>
          <CustomFieldsetAccordion
            title="Informacion General"
            expanded={expandedInfoGeneral}
            onToggle={handleToggleInfoGeneral}
          >
            <ContainerCabecera id="informacion">
              <Codigo>
                <CustomTextFieldReadable label="Codigo Factura" value={codigoFactura} />
              </Codigo>
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
                <InputLabel>Forma de pago</InputLabel>
                <FormaDePagoAutocomplete cabeceraProforma={cabeceraFactura} setCabeceraProforma={setCabeceraFactura} />
              </FormaPago>
              <Vendedor>
                <InputLabel>Vendedor</InputLabel>
                <VendedorAutocomplete cabeceraProforma={cabeceraFactura} setCabeceraProforma={setCabeceraFactura} />
              </Vendedor>
              <Observacion>
                <CustomTextField
                  label="Observacion cliente"
                  value={cabeceraFactura.observacion}
                  onChange={(e) => handleSetCabeceraFactura("observacion", e.target.value)}
                />
              </Observacion>
            </ContainerCabecera>
          </CustomFieldsetAccordion>

          <br />

          <div style={{ paddingBottom: "10px" }}>
            <CustomFieldsetAccordion
              title="Informacion Cliente"
              expanded={expandedInfoCliente}
              onToggle={handleToggleInfoCliente}
            >
              <ContainerCliente>
                <Cliente>
                  <CustomHelperDetail
                    label="Cliente"
                    valueSearched={cabeceraFactura.cliente.clicodigo}
                    endpoint="/FacturaDesdeArticulos/getCliente"
                    valueInputMain="clicodigo"
                    valueInputSecondary="clinombre"
                    idSearchField="clicodigo"
                    errorMsgIdSearch="Error fetching data:"
                    errorMsgFilterSearch="Error en cargar datos"
                    queryKeyModal="clienteAsociacionProdAgencia"
                    perPage={10}
                    placeholder=""
                    columnsTable={[
                      { accessorKey: "ciacodigo", header: "Ciacodigo", size: 100 },
                      { accessorKey: "clicodigo", header: "Codigo de Cliente", size: 100 },
                      { accessorKey: "clinombre", header: "Nombre del Cliente", size: 250 },
                      { accessorKey: "cliruc", header: "Numero de identificacion", size: 150 },
                      { accessorKey: "clitelef1", header: "Telefono", size: 100 },
                      { accessorKey: "clidirec", header: "Direccion", size: 400 },
                      { accessorKey: "clireferencia1", header: "Referencia Rapida", size: 120 },
                      { accessorKey: "zoncodigo", header: "Zona", size: 120 },
                      {
                        accessorKey: "clistatus",
                        header: "Estado",
                        size: 120,
                        Cell: ({ cell }) => {
                          const value = cell.getValue()
                          if (value === "A") return "Activo"
                          if (value === "I") return "Inactivo"
                          return value
                        },
                      },
                    ]}
                    onHandleSelectedData={(v) => {
                      handleSetCabeceraFactura("cliente", v)
                      handleSetCabeceraFactura("nombre", v.clinombre)
                    }}
                    sxInputMain={{ minWidth: "170px", maxWidth: "170px", marginRight: "10px" }}
                    sxInputSecondary={{ width: "100%" }}
                  />
                </Cliente>
                <Direccion>
                  <CustomTextFieldReadable label="Direccion" value={cabeceraFactura.direccion} />
                </Direccion>
                <Telefono>
                  <CustomTextFieldReadable disabled label="Telefono" value={cabeceraFactura.telefono} />
                </Telefono>
                <Id>
                  <CustomTextFieldReadable disabled label="Id" value={cabeceraFactura.ruc} />
                </Id>
              </ContainerCliente>
            </CustomFieldsetAccordion>
          </div>

          <br />

          <ContainerArticulos>
            <Productos id="productos">
              <div style={styles.tabsContainer}>
                <Tabs value={tabValue} onChange={handleTabChange} centered variant="fullWidth">
                  <Tab label="TOP 30 Productos" />
                  <Tab label="Todos los productos" />
                </Tabs>

                <div style={styles.tabContent}>
                  {tabValue === 0 && (
                    <>
                      {isFetchingTop30 && (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                          <CircularProgress />
                        </Box>
                      )}
                      {!isFetchingTop30 && (
                        <ProductGrid productos={productosGrid} setProductosAgregados={setProductosAgregados} />
                      )}
                    </>
                  )}

                  {tabValue === 1 && (
                    <Box>
                      <AccordionFiltros
                        ref={accordionFiltrosRef}
                        onFilteredProducts={handleFilteredProducts}
                        clicodigo={cabeceraFactura.cliente.clicodigo}
                        factippag={cabeceraFactura.fortipo}
                      />

                      {!mostrandoFiltros && (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                          <Typography variant="body1" color="text.secondary">
                            Seleccione los filtros y haga clic en "Filtrar" para buscar productos
                          </Typography>
                        </Box>
                      )}

                      {mostrandoFiltros && (
                        <ProductGrid productos={productosGrid} setProductosAgregados={setProductosAgregados} />
                      )}
                    </Box>
                  )}
                </div>
              </div>
            </Productos>

            <Detalle>
              {!isMobile ? (
                <DetallePedido
                  productosAgregados={productosAgregados}
                  setProductosAgregados={setProductosAgregados}
                  onRealizarPedido={handleRealizarPedido}
                />
              ) : (
                <>
                  <Box sx={{ position: "fixed", bottom: 16, right: 16 }}>
                    <Fab color="primary" onClick={() => setModalOpen(true)}>
                      <Badge
                        badgeContent={productosAgregados.length}
                        color="error"
                        overlap="circular"
                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                        sx={{
                          "& .MuiBadge-badge": {
                            color: "white",
                            backgroundColor: "#8BC34A",
                            borderRadius: "50%",
                            height: 24,
                            minWidth: 24,
                            fontSize: 14,
                            fontWeight: "bold",
                            border: "2px solid white",
                          },
                        }}
                      >
                        <PaymentIcon />
                      </Badge>
                    </Fab>
                  </Box>

                  <Dialog open={isModalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
                    <IconButton onClick={() => setModalOpen(false)} sx={{ position: "absolute", top: 8, right: 8 }}>
                      <CloseIcon />
                    </IconButton>
                    <Box sx={{ p: 3 }}>
                      <DetallePedido
                        productosAgregados={productosAgregados}
                        setProductosAgregados={setProductosAgregados}
                        onRealizarPedido={() => {
                          handleRealizarPedido()
                          setModalOpen(false)
                        }}
                      />
                    </Box>
                  </Dialog>
                </>
              )}
            </Detalle>
          </ContainerArticulos>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CrearFacturaDesdeArticulos
