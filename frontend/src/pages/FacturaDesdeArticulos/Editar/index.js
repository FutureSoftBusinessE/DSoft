// app/FacturaDesdeArticulos/EditarFacturaDesdeArticulos.jsx
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
  Typography,
  IconButton,
  Tooltip,
  List,
  ListItem,
  Dialog,
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

function useGetProforma(pednumped) {
  return useQuery({
    queryKey: ["proformaEditar", pednumped],
    queryFn: async () => {
      const response = await fetchwrapper(`/FacturaDesdeArticulos/getProforma/${pednumped}`)
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || "Error al cargar proforma")
      }
      return data.data
    },
    refetchOnWindowFocus: false,
    enabled: !!pednumped,
  })
}
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
const EditarFacturaDesdeArticulos = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const proformaOriginal = location.state // Datos pasados desde la tabla

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
    observacion: "",
  })

  const [productosAgregados, setProductosAgregados] = useState([])
  const [productosGrid, setProductosGrid] = useState([])
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [tabValue, setTabValue] = useState(0)
  const [isModalOpen, setModalOpen] = useState(false)
  const [mostrandoFiltros, setMostrandoFiltros] = useState(false)

  const isMobile = useMediaQuery("(max-width:600px)")
  const accordionFiltrosRef = useRef()

  // Cargar datos de la proforma a editar
  const { data: proformaData, isLoading: isLoadingProforma } = useGetProforma(proformaOriginal?.pednumped)

  // Cargar TOP 30
  const {
    data: fetchedArticulos = [],
    refetch: refetchTop30,
    isFetching: isFetchingTop30,
  } = useGetArticulos(cabeceraProforma.cliente.clicodigo, cabeceraProforma.fortipo)

  const { data: fetchedInfoCliente = {}, refetch: refetchInfoCliente } = useGetInfoCliente(
    cabeceraProforma.cliente.clicodigo,
  )

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

  // Efecto para inicializar datos de la proforma
  useEffect(() => {
    if (proformaData) {
      // Extraer información
      const clienteInfo = proformaData.cliente || {}
      const formaPagoInfo = proformaData.formaPago || {}
      const vendedorInfo = proformaData.vendedor || {}
      const cabeceraInfo = proformaData.cabecera || {}

      setCabeceraProforma({
        cliente: {
          clicodigo: clienteInfo.clicodigo || "",
          clinombre: clienteInfo.clinombre || "",
          clidirec: clienteInfo.clidirec || "",
          cliruc: clienteInfo.cliruc || "",
          clitelef1: clienteInfo.clitelef1 || "",
        },
        direccion: clienteInfo.clidirec || cabeceraInfo.peddirent || "",
        ruc: clienteInfo.cliruc || "",
        telefono: clienteInfo.clitelef1 || "",
        factippag: cabeceraInfo.factippag || "",
        fordescri: formaPagoInfo.fordescri || "",
        fortipo: cabeceraInfo.factippag || formaPagoInfo.factippag || "",
        fordias: parseFloat(cabeceraInfo.fordias || formaPagoInfo.fordias || 0),
        fordescuento: parseFloat(cabeceraInfo.fordescuento || formaPagoInfo.fordescuento || 0),
        vendedor: {
          vencodigo: vendedorInfo.vencodigo || cabeceraInfo.vencodigo || "",
          vennombre: vendedorInfo.vennombre || "",
          pedidossiac: "",
          pedidosweb: "",
        },
        observacion: cabeceraInfo.peddetalle || "",
        formaPagoSeleccionada: {
          factippag: cabeceraInfo.factippag || formaPagoInfo.factippag || "",
          fordescri: formaPagoInfo.fordescri || "",
          fordias: parseFloat(formaPagoInfo.fordias || 0),
          fortipo: formaPagoInfo.fortipo || "",
          forcuotas: formaPagoInfo.forcuotas || 1,
          fordescuento: parseFloat(formaPagoInfo.fordescuento || 0),
        },
        vendedorSeleccionado: {
          vencodigo: vendedorInfo.vencodigo || "",
          vennombre: vendedorInfo.vennombre || "",
        },
      })

      // Cargar productos existentes
      if (proformaData.productos && proformaData.productos.length > 0) {
        const productosFormateados = proformaData.productos.map((prod) => ({
          artcodigo: prod.artcodigo,
          artdescri: prod.artdescri,
          meddescri: prod.meddescri || "",
          predescri: prod.predescri || "",
          lindescri: prod.lindescri || "",
          artcantactual: prod.artcantactual || 0,
          mardescri: prod.mardescri || "",
          precioUnitario: prod.precioUnitario,
          ivaPorcentaje: prod.ivaPorcentaje,
          artapliiva: prod.artapliiva,
          descuentoPorcentaje: prod.descuentoPorcentaje,
          imagen: prod.imagen,
          cantidadPedido: prod.cantidadPedido,
          pedsecuen: prod.pedsecuen,
          pedvaldesc: prod.pedvaldesc,
          pedvaliva: prod.pedvaliva,
          pedvalor: prod.pedvalor,
          pedvaltot: prod.pedvaltot,
        }))
        setProductosAgregados(productosFormateados)
      }
    }
  }, [proformaData])

  // Efectos para TOP 30 y filtros (igual que en crear)
  useEffect(() => {
    if (cabeceraProforma.cliente.clicodigo) {
      refetchTop30()
    }
  }, [cabeceraProforma.cliente.clicodigo, cabeceraProforma.fortipo])

  useEffect(() => {
    if (tabValue === 0 && fetchedArticulos.length > 0) {
      setProductosGrid(fetchedArticulos)
      setMostrandoFiltros(false)
    }
  }, [tabValue, fetchedArticulos])

  useEffect(() => {
    if (tabValue === 1 && productosFiltrados.length > 0) {
      setProductosGrid(productosFiltrados)
    }
  }, [tabValue, productosFiltrados])

  useEffect(() => {
    if (cabeceraProforma.cliente.clicodigo) {
      refetchInfoCliente()
    }
  }, [cabeceraProforma.cliente.clicodigo])

  useEffect(() => {
    if (Object.keys(fetchedInfoCliente).length > 0) {
      setCabeceraProforma((prev) => ({
        ...prev,
        direccion: fetchedInfoCliente.clidirec || "",
        ruc: fetchedInfoCliente.cliruc || "",
        telefono: fetchedInfoCliente.clitelef1 || "",
      }))
    }
  }, [fetchedInfoCliente])

  const handleSetCabeceraProforma = (k, v) => setCabeceraProforma((prev) => ({ ...prev, [k]: v }))

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

  // Mutation para actualizar proforma
  const { mutate: actualizarProformaMutation, isPending: isUpdating } = useMutation({
    queryKey: ["actualizarProforma"],
    mutationFn: async (payload) => {
      const response = await api.post("/FacturaDesdeArticulos/editarProforma", payload)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: (data) => {
      Swal.fire({
        icon: "success",
        title: "¡Proforma actualizada!",
        html: `
          <p>Proforma N°: <strong>${data.pednumped}</strong></p>
          <p>Total: <strong>$${data.total.toFixed(2)}</strong></p>
          <p>Productos: <strong>${data.productos}</strong></p>
        `,
        confirmButtonText: "Aceptar",
      }).then(() => {
        navigate(-1)
      })
    },
  })

  const handleActualizarProforma = async () => {
    if (productosAgregados.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin productos",
        text: "Debe agregar al menos un producto para actualizar la proforma",
      })
      return
    }

    if (!cabeceraProforma.cliente.clicodigo) {
      Swal.fire({
        icon: "warning",
        title: "Cliente no seleccionado",
        text: "Debe seleccionar un cliente",
      })
      return
    }

    if (!cabeceraProforma.fortipo) {
      Swal.fire({
        icon: "warning",
        title: "Forma de pago no seleccionada",
        text: "Debe seleccionar una forma de pago",
      })
      return
    }

    if (!cabeceraProforma.vendedor.vencodigo) {
      Swal.fire({
        icon: "warning",
        title: "Vendedor no seleccionado",
        text: "Debe seleccionar un vendedor",
      })
      return
    }

    Swal.fire({
      title: "Actualizando proforma...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    const payload = {
      pednumped: proformaOriginal.pednumped,
      cliente: cabeceraProforma.cliente,
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
      formaPago: cabeceraProforma.fortipo,
      vendedor: cabeceraProforma.vendedor,
      observacion: cabeceraProforma.observacion,
    }

    await actualizarProformaMutation(payload)
  }

  // FloatingMenu (igual que en crear)
  const FloatingMenu = () => {
    const menuItems = [
      { icon: <DescriptionIcon />, label: "Información", sectionId: "informacion" },
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

  if (isLoadingProforma) {
    return (
      <ThemeProvider theme={theme}>
        <CustomBackdrop isLoading={true} />
        <Header />
        <div className="main main-app p-3 p-lg-4" style={{ textAlign: "center", paddingTop: "50px" }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Cargando proforma...
          </Typography>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CustomBackdrop isLoading={isUpdating || isFetchingTop30} />
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
          <b>Editar Proforma: {proformaOriginal?.pednumped}</b>
        </div>
        <FloatingMenu />

        <Box className={StyledRoot}>
          {/* Información General - Igual que en crear pero con valores existentes */}
          <CustomFieldsetAccordion
            title="Información General"
            expanded={expandedInfoGeneral}
            onToggle={() => setExpandedInfoGeneral(!expandedInfoGeneral)}
          >
            <ContainerCabecera id="informacion">
              <Codigo>
                <CustomTextFieldReadable label="Código Proforma" value={proformaOriginal?.pednumped || ""} />
              </Codigo>
              <FechaE>
                <CustomDatePicker
                  label="Fecha Emisión"
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
              <FormaPago>
                <InputLabel>Forma de pago</InputLabel>
                <FormaDePagoAutocomplete
                  cabeceraProforma={cabeceraProforma}
                  setCabeceraProforma={setCabeceraProforma}
                />
              </FormaPago>
              <Vendedor>
                <InputLabel>Vendedor</InputLabel>
                <VendedorAutocomplete cabeceraProforma={cabeceraProforma} setCabeceraProforma={setCabeceraProforma} />
              </Vendedor>
              <Observacion>
                <CustomTextField
                  label="Observación cliente"
                  value={cabeceraProforma.observacion}
                  onChange={(e) => handleSetCabeceraProforma("observacion", e.target.value)}
                />
              </Observacion>
            </ContainerCabecera>
          </CustomFieldsetAccordion>

          <br />

          {/* Información Cliente */}
          <div style={{ paddingBottom: "10px" }}>
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
                      { accessorKey: "clicodigo", header: "Código de Cliente", size: 100 },
                      { accessorKey: "clinombre", header: "Nombre del Cliente", size: 250 },
                      { accessorKey: "cliruc", header: "Número de identificación", size: 150 },
                      { accessorKey: "clitelef1", header: "Teléfono", size: 100 },
                      { accessorKey: "clidirec", header: "Dirección", size: 400 },
                      { accessorKey: "clireferencia1", header: "Referencia Rápida", size: 120 },
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
                      handleSetCabeceraProforma("cliente", v)
                      handleSetCabeceraProforma("nombre", v.clinombre)
                    }}
                    sxInputMain={{ minWidth: "170px", maxWidth: "170px", marginRight: "10px" }}
                    sxInputSecondary={{ width: "100%" }}
                  />
                </Cliente>
                <Direccion>
                  <CustomTextFieldReadable label="Dirección" value={cabeceraProforma.direccion} />
                </Direccion>
                <Telefono>
                  <CustomTextFieldReadable label="Teléfono" value={cabeceraProforma.telefono} />
                </Telefono>
                <Id>
                  <CustomTextFieldReadable label="RUC/CI" value={cabeceraProforma.ruc} />
                </Id>
              </ContainerCliente>
            </CustomFieldsetAccordion>
          </div>

          <br />

          {/* Productos - Misma estructura que crear */}
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
                        clicodigo={cabeceraProforma.cliente.clicodigo}
                        factippag={cabeceraProforma.fortipo}
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
                  onRealizarPedido={handleActualizarProforma}
                  buttonText="Actualizar Proforma"
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
                          handleActualizarProforma()
                          setModalOpen(false)
                        }}
                        buttonText="Actualizar Proforma"
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

export default EditarFacturaDesdeArticulos
