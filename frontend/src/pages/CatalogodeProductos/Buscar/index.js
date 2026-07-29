import React, { useState, useEffect } from "react"
import { useParams, useLocation } from "react-router-dom"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import {
  Box,
  TextField,
  Typography,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  IconButton,
  Autocomplete,
  Dialog,
} from "@mui/material"
import { DataGrid, GridToolbarQuickFilter } from "@mui/x-data-grid"

import { ExpandMore as ExpandMoreIcon, PictureAsPdf as PdfIcon, Close as CloseIcon } from "@mui/icons-material"

import Header from "../../../layouts/Header"
import BackIcon from "../../../components/BackIcon"
import CustomBackdrop from "../../../components/CustomBackdrop"
import { useQuery, api } from "../../../api"

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

const initialFormData = {
  invcodigo: "",
  artcodigo: "",
  artnumparte: "",
  artdescri: "",
  artalias: "",
  artetiqueta: "S",
  lincodigo: "",
  lindescri: "",
  marcodigo: "",
  medcodigo: "",
  precodigo: "",
  jefecodigo: "",
  paiscodigo: "",
  artstatus: "A",

  // CANTIDADES (Nuevas)
  artcantinicial: 0,
  artcantactual: 0,
  artcanttranfer: 0,
  artcantimporta: 0,
  // COSTOS (Nuevos)
  artcostoinidol: 0,
  artcostoactdol: 0,
  cif: 0,
  fob: 0,

  artvolumen: 0,
  artpesogm2: 0,
  artancho: 0,
  artcantbulto: 0,
  artcomentario: "",
  artobservacion: "",
  artwebsite: "",
  artprodven: false,
  artapliiva: false,
  artretiene: false,
  artnocompra: false,
  artfaccero: false,
  artservicio: false,
  artexplosion: false,
  artmodpvp: false,
  artdecimales: false,
  artfacsinstock: false,
  artsincosto: false,
  artminimo: 0,
  artmaximo: 0,
  artdiasrep: 0,
  artdiaseg: 0,
  artfrecllegada: 0,
  artpergarantia: 0,
  artapligarantia: false,
  artnoimprimeseries: false,
  artnogeneraseries: false,
  artserie: false,
  artseriedesp: false,
  artlote: false,
  artconfirmaingreso: false,
  arttiposerie: "",
  artprecventa1: "",
  artprecventa2: "",
  artprecventa3: "",
  artprecventa4: "",
  artprecventa5: "",
  artprecventa6: "",
  inencodigo: "",
  inendescri: "",
  parcodigo: "",
  pardescri: "",
  parporcentaje: 0,
  calfcodigo: "",
}

const fetchCatalog = async (endpoint, payload = null) => {
  try {
    const response = payload ? await api.post(endpoint, payload) : await api.get(endpoint)
    const rawData = response?.data?.data || response?.data || response || []
    return Array.isArray(rawData) ? rawData : Array.isArray(rawData?.data) ? rawData.data : []
  } catch (error) {
    console.error(`Error cargando catálogo desde ${endpoint}:`, error)
    return []
  }
}

const BuscarCatalogodeProductos = () => {
  const location = useLocation()

  const urlParams = useParams()
  const rowData = location.state || {}
  const invParam = rowData.invcodigo || urlParams.invcodigo
  const artParam = rowData.artcodigo || urlParams.artcodigo

  const [formData, setFormData] = useState(initialFormData)
  const [imagenAmpliada, setImagenAmpliada] = useState(null)

  const [imagenes, setImagenes] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [proveedoresProd, setProveedoresProd] = useState([])
  const [barrasProd, setBarrasProd] = useState([])
  const [sustitutos, setSustitutos] = useState([])
  const [principiosProd, setPrincipiosProd] = useState([])
  const [auditoriaProd, setAuditoriaProd] = useState([]) // NUEVO HISTORIAL

  // ====================================================================================
  // CARGA DE DATOS DEL PRODUCTO EXISTENTE (LLAMA A getProductoBuscar)
  // ====================================================================================
  const { data: dataBuscar, isLoading: loadBuscar } = useQuery({
    queryKey: ["getProductoBuscar", invParam, artParam],
    queryFn: async () => {
      if (!invParam || !artParam) return null
      const res = await api.post("/CatalogodeProductos/getProductoBuscar", { invcodigo: invParam, artcodigo: artParam })

      let responseData = res?.data?.data || res?.data || null
      if (Array.isArray(responseData)) responseData = responseData[0]
      if (responseData && responseData.data) responseData = responseData.data

      return responseData || null
    },
    enabled: !!invParam && !!artParam,
  })

  useEffect(() => {
    if (dataBuscar && dataBuscar.cabecera) {
      setFormData((prev) => ({ ...prev, ...dataBuscar.cabecera }))
      setProveedoresProd(dataBuscar.proveedores || [])
      setBarrasProd(dataBuscar.barras || [])
      setSustitutos(dataBuscar.sustitutos || [])
      setPrincipiosProd(dataBuscar.principios || [])
      setImagenes(dataBuscar.imagenes || [])
      setDocumentos(dataBuscar.documentos_pdf || [])
      setAuditoriaProd(dataBuscar.auditoria || [])
    }
  }, [dataBuscar])

  // Consultas de Combos para mostrar descripciones en Autocompletes
  const { data: listInventarios = [] } = useQuery({
    queryKey: ["inv_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaInventarios"),
  })
  const { data: listMarcas = [] } = useQuery({
    queryKey: ["mar_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaMarcas"),
  })
  const { data: listMedidas = [] } = useQuery({
    queryKey: ["med_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaMedidas"),
  })
  const { data: listPresentaciones = [] } = useQuery({
    queryKey: ["pre_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaPresentaciones"),
  })
  const { data: listJefes = [] } = useQuery({
    queryKey: ["jef_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaJefes"),
  })
  const { data: listPaises = [] } = useQuery({
    queryKey: ["pai_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaPaises"),
  })
  const { data: listProveedores = [] } = useQuery({
    queryKey: ["provl_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaProveedores"),
  })
  const { data: listArticulos = [] } = useQuery({
    queryKey: ["artl_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaArticulos"),
  })
  const { data: listPrincipios = [] } = useQuery({
    queryKey: ["prinl_cr"],
    queryFn: () => fetchCatalog("/CatalogodeProductos/getListaPrincipiosActivos"),
  })

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <CustomBackdrop isLoading={loadBuscar} />

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
              Consultar Producto
            </Typography>
          </Box>
        </Box>

        <StyledRoot>
          {/* ======================= PESTAÑA 1: IDENTIFICACIÓN Y CLASIFICACIÓN ======================= */}
          <Accordion defaultExpanded elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#e1f5fe" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.dark">
                1. Identificación y Clasificación
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} pt={1}>
                {/* FILA 1 */}
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    readOnly
                    disabled
                    options={listInventarios}
                    getOptionLabel={(option) => option.label || ""}
                    value={listInventarios.find((c) => c.invcodigo === formData.invcodigo) || null}
                    isOptionEqualToValue={(option, value) => option.invcodigo === value?.invcodigo}
                    renderInput={(params) => <TextField {...params} label="Inventario" size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Código Artículo"
                    value={formData.artcodigo}
                    size="small"
                    InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Estado"
                    value={
                      formData.artstatus === "A" ? "ACTIVO" : formData.artstatus === "I" ? "INACTIVO" : "POTENCIAL"
                    }
                    size="small"
                    InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Número de Parte / Entrada"
                    value={formData.artnumparte}
                    size="small"
                    InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                  />
                </Grid>

                {/* FILA 2: DESCRIPCIÓN Y ALIAS */}
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Descripción del Producto"
                    value={formData.artdescri}
                    size="small"
                    InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Alias (Nombre Corto / Comercial)"
                    value={formData.artalias}
                    size="small"
                    InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* FILA 3: CLASIFICACIÓN */}
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Línea"
                    value={formData.lincodigo ? `${formData.lincodigo} - ${formData.lindescri}` : ""}
                    size="small"
                    InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    readOnly
                    disabled
                    options={listMarcas}
                    getOptionLabel={(option) => option.label || ""}
                    value={listMarcas.find((c) => c.marcodigo === formData.marcodigo) || null}
                    isOptionEqualToValue={(option, value) => option.marcodigo === value?.marcodigo}
                    renderInput={(params) => <TextField {...params} label="Marca" size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    readOnly
                    disabled
                    options={listMedidas}
                    getOptionLabel={(option) => option.label || ""}
                    value={listMedidas.find((c) => c.medcodigo === formData.medcodigo) || null}
                    isOptionEqualToValue={(option, value) => option.medcodigo === value?.medcodigo}
                    renderInput={(params) => <TextField {...params} label="Medida/Clase" size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    readOnly
                    disabled
                    options={listPresentaciones}
                    getOptionLabel={(option) => option.label || ""}
                    value={listPresentaciones.find((c) => c.precodigo === formData.precodigo) || null}
                    isOptionEqualToValue={(option, value) => option.precodigo === value?.precodigo}
                    renderInput={(params) => <TextField {...params} label="Presentación/Modelo" size="small" />}
                  />
                </Grid>

                {/* FILA 4: EXTRAS Y ETIQUETA */}
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    readOnly
                    disabled
                    options={listJefes}
                    getOptionLabel={(option) => option.label || ""}
                    value={listJefes.find((c) => c.jefecodigo === formData.jefecodigo) || null}
                    isOptionEqualToValue={(option, value) => option.jefecodigo === value?.jefecodigo}
                    renderInput={(params) => <TextField {...params} label="Jefe de Producto" size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    readOnly
                    disabled
                    options={listPaises}
                    getOptionLabel={(option) => option.label || ""}
                    value={listPaises.find((c) => c.paiscodigo === formData.paiscodigo) || null}
                    isOptionEqualToValue={(option, value) => option.paiscodigo === value?.paiscodigo}
                    renderInput={(params) => <TextField {...params} label="País de Origen" size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Tipo de Etiqueta"
                    value={formData.artetiqueta === "S" ? "ESTÁNDAR (SÍ)" : "SIN ETIQUETA (NO)"}
                    size="small"
                    InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* NUEVO: CANTIDADES Y COSTOS */}
                <Grid item xs={12} md={12}>
                  <Grid container spacing={2}>
                    {/* CANTIDADES */}
                    <Grid item xs={12} md={6}>
                      <fieldset
                        style={{
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          padding: "16px",
                          marginBottom: "10px",
                          height: "100%",
                        }}
                      >
                        <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                          Cantidades
                        </legend>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Inicial"
                              value={formData.artcantinicial}
                              size="small"
                              InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Actual"
                              value={formData.artcantactual}
                              size="small"
                              InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Transferida"
                              value={formData.artcanttranfer}
                              size="small"
                              InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Por Comprar"
                              value={formData.artcantimporta}
                              size="small"
                              InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                            />
                          </Grid>
                        </Grid>
                      </fieldset>
                    </Grid>
                    {/* COSTOS */}
                    <Grid item xs={12} md={6}>
                      <fieldset
                        style={{
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          padding: "16px",
                          marginBottom: "10px",
                          height: "100%",
                        }}
                      >
                        <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                          Costos
                        </legend>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Costo Inicial"
                              value={formData.artcostoinidol}
                              size="small"
                              InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Promedio Actual"
                              value={formData.artcostoactdol}
                              size="small"
                              InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Último CIF"
                              value={formData.cif}
                              size="small"
                              InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Último FOB"
                              value={formData.fob}
                              size="small"
                              InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                            />
                          </Grid>
                        </Grid>
                      </fieldset>
                    </Grid>
                  </Grid>
                </Grid>

                {/* SSFRAME: OTROS DATOS */}
                <Grid item xs={12} md={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Otros Datos
                    </legend>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Registro Sanitario"
                          value={formData.artregissani}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Concentración"
                          value={formData.artconcentra}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Volumen presentación (cm3)"
                          value={formData.artvolumen}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Peso GM2/oz"
                          value={formData.artpesogm2}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Ancho CMS"
                          value={formData.artancho}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Cantidad Recipiente"
                          value={formData.artcantrecip}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Cantidad Bulto"
                          value={formData.artcantbulto}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Web Site"
                          value={formData.artwebsite}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Comentario (se visualiza al Proformar)"
                          value={formData.artcomentario}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Observación"
                          value={formData.artobservacion}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>

                {/* SSFRAME: LISTAS DE PRECIOS */}
                <Grid item xs={12} md={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Listas de Precios de Venta
                    </legend>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Precio Lista 1"
                          value={formData.artprecventa1}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Precio Lista 2"
                          value={formData.artprecventa2}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Precio Lista 3"
                          value={formData.artprecventa3}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Precio Lista 4"
                          value={formData.artprecventa4}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Precio Lista 5"
                          value={formData.artprecventa5}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Precio Lista 6"
                          value={formData.artprecventa6}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 2: PARÁMETROS ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                2. Parámetros Físicos y Control
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* 1. SSFRAME PARÁMETROS GENERALES */}
                <Grid item xs={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Parámetros Generales
                    </legend>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artprodven} disabled />}
                          label="Para Venta"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artapliiva} disabled />}
                          label="Aplica I.V.A."
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artretiene} disabled />}
                          label="Retiene"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artnocompra} disabled />}
                          label="No Compra"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artfaccero} disabled />}
                          label="Permite facturar con Valor Cero"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artservicio} disabled />}
                          label="Servicio"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artexplosion} disabled />}
                          label="Explosión de Insumos"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artmodpvp} disabled />}
                          label="Modifica P.V.P."
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artdecimales} disabled />}
                          label="Cantidad permite decimales"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artfacsinstock} disabled />}
                          label="Factura sin Stock"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} lg={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artsincosto} disabled />}
                          label="Sin Costo (Consumo Interno)"
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>

                {/* 2. SSFRAME PARÁMETROS DE CONTROL */}
                <Grid item xs={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Parámetros de Control
                    </legend>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4} md={2}>
                        <TextField
                          fullWidth
                          label="Cantidad Mínima"
                          value={formData.artminimo}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={2}>
                        <TextField
                          fullWidth
                          label="Cantidad Máxima"
                          value={formData.artmaximo}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={2}>
                        <TextField
                          fullWidth
                          label="Días Reposición"
                          value={formData.artdiasrep}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={2}>
                        <TextField
                          fullWidth
                          label="Días de Seguridad"
                          value={formData.artdiaseg}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} md={4}>
                        <TextField
                          fullWidth
                          label="Frecuencia de Llegada (Días)"
                          value={formData.artfrecllegada}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>

                {/* 3. SSFRAME GARANTÍAS */}
                <Grid item xs={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Garantías
                    </legend>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4} md={3}>
                        <TextField
                          fullWidth
                          label="Periodo de Garantía (Meses)"
                          value={formData.artpergarantia}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={8} md={9}>
                        <Grid container spacing={1}>
                          <Grid item xs={12} md={4}>
                            <FormControlLabel
                              control={<Checkbox checked={formData.artapligarantia} disabled />}
                              label="Aplica Garantía"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <FormControlLabel
                              control={<Checkbox checked={formData.artnoimprimeseries} disabled />}
                              label="NO Imprime Series en Certificado"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <FormControlLabel
                              control={<Checkbox checked={formData.artnogeneraseries} disabled />}
                              label="NO Genera Series Automáticas"
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>

                {/* 4. SSFRAME SERIES / LOTES */}
                <Grid item xs={12}>
                  <fieldset
                    style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Series / Lotes
                    </legend>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel control={<Checkbox checked={formData.artserie} disabled />} label="Series" />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artseriedesp} disabled />}
                          label="Series Despacho"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <FormControlLabel control={<Checkbox checked={formData.artlote} disabled />} label="Lote" />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                          control={<Checkbox checked={formData.artconfirmaingreso} disabled />}
                          label="Confirmación de Ingreso (Firma Químico)"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Tipo de Serie"
                          value={
                            formData.arttiposerie === "E"
                              ? "ELECTRODOMÉSTICOS"
                              : formData.arttiposerie === "C"
                                ? "GIFT CARD"
                                : formData.arttiposerie === "O"
                                  ? "OTROS"
                                  : "NINGUNO"
                          }
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 3: IMÁGENES ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                3. Imágenes
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} container spacing={2}>
                  {imagenes.map((img, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={img.id || index}>
                      <Paper elevation={3} sx={{ p: 1, position: "relative", cursor: "zoom-in" }}>
                        <img
                          src={img.base64 || img}
                          alt={`Preview ${index}`}
                          style={{ width: "100%", height: "200px", objectFit: "contain" }}
                          onClick={() => setImagenAmpliada(img.base64 || img)}
                        />
                      </Paper>
                    </Grid>
                  ))}
                  {imagenes.length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" align="center">
                        No hay imágenes adjuntas en este producto.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {/* Visor Modal de Imágenes */}
              <Dialog open={!!imagenAmpliada} onClose={() => setImagenAmpliada(null)} maxWidth="xl">
                <Box p={2} position="relative" bgcolor="#000">
                  <IconButton
                    onClick={() => setImagenAmpliada(null)}
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      bgcolor: "rgba(255,255,255,0.3)",
                      color: "#fff",
                      zIndex: 10,
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                  <img
                    src={imagenAmpliada}
                    alt="Zoom Preview"
                    style={{ width: "100%", maxHeight: "85vh", objectFit: "contain" }}
                  />
                </Box>
              </Dialog>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 4: DOCUMENTOS ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                4. Documentos (PDF)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} container spacing={2}>
                  {documentos.map((doc, index) => (
                    <Grid item xs={12} md={6} lg={4} key={doc.id || index}>
                      <Paper
                        elevation={2}
                        sx={{ p: 2, position: "relative", display: "flex", flexDirection: "column" }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Box display="flex" alignItems="center">
                            <PdfIcon color="error" sx={{ mr: 1 }} />
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {doc.nombre}
                            </Typography>
                          </Box>
                        </Box>
                        <iframe
                          src={doc.base64 || doc}
                          width="100%"
                          height="300px"
                          title={`PDF Preview ${doc.id || index}`}
                          style={{ border: "1px solid #eee", borderRadius: "4px" }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                  {documentos.length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" align="center">
                        No hay documentos PDF adjuntos en este producto.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 5: CÓDIGO PROVEEDOR Y BARRAS ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                5. Código Proveedor y Barras
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* SSFRAME: CÓDIGO DE PROVEEDOR */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Código de Proveedor
                    </legend>
                    <Box sx={{ height: 300, mt: 1 }}>
                      <DataGrid
                        rows={proveedoresProd}
                        disableRowSelectionOnClick
                        hideFooterSelectedRowCount
                        columns={[
                          {
                            field: "provcodigo",
                            headerName: "Proveedor",
                            width: 300,
                            valueGetter: (params) => {
                              const prov = listProveedores.find((p) => p.provcodigo === params.value)
                              return prov ? prov.label : params.value
                            },
                          },
                          { field: "codigoprov", headerName: "Código del Producto", width: 220 },
                        ]}
                      />
                    </Box>
                  </fieldset>
                </Grid>

                {/* SSFRAME: CÓDIGO DE BARRAS */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Códigos de Barras Relacionados
                    </legend>
                    <Box sx={{ height: 300, mt: 1 }}>
                      <DataGrid
                        rows={Array.isArray(barrasProd) ? barrasProd : []}
                        disableRowSelectionOnClick
                        hideFooterSelectedRowCount
                        columns={[{ field: "codigobarra", headerName: "Código de Barras", width: 400 }]}
                      />
                    </Box>
                  </fieldset>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 6: PRODUCTOS SUSTITUTOS Y PRINCIPIO ACTIVO ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                6. Productos Sustitutos y Principio Activo
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* SSFRAME: PRODUCTO SUSTITUTO */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Producto Sustituto
                    </legend>
                    <Box sx={{ height: 300, mt: 1 }}>
                      <DataGrid
                        rows={sustitutos}
                        disableRowSelectionOnClick
                        hideFooterSelectedRowCount
                        columns={[
                          {
                            field: "artsustituto",
                            headerName: "Producto Sustituto",
                            width: 450,
                            valueGetter: (params) => {
                              const art = listArticulos.find((a) => a.artcodigo === params.value)
                              return art ? art.label : params.value
                            },
                          },
                        ]}
                      />
                    </Box>
                  </fieldset>
                </Grid>

                {/* SSFRAME: PRINCIPIO ACTIVO */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Principio Activo
                    </legend>
                    <Box sx={{ height: 300, mt: 1 }}>
                      <DataGrid
                        rows={principiosProd}
                        disableRowSelectionOnClick
                        hideFooterSelectedRowCount
                        columns={[
                          {
                            field: "pricodigo",
                            headerName: "Principio Activo",
                            width: 350,
                            valueGetter: (params) => {
                              const pri = listPrincipios.find((p) => p.pricodigo === params.value)
                              return pri ? pri.label : params.value
                            },
                          },
                          { field: "priprimario", headerName: "Primario", width: 100, type: "boolean" },
                        ]}
                      />
                    </Box>
                  </fieldset>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= PESTAÑA 7: PARTIDA ARANCELARIA Y CÓDIGO INEN ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                7. Partida Arancelaria y Codigo INEN
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* SSFRAME: PARTIDA ARANCELARIA */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      Partida Arancelaria
                    </legend>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Código"
                          value={formData.parcodigo}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          label="Descripción"
                          value={formData.pardescri}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Porcentaje (%)"
                          value={formData.parporcentaje}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>
                {/* SSFRAME: INEN */}
                <Grid item xs={12} md={6}>
                  <fieldset
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "10px",
                      height: "100%",
                    }}
                  >
                    <legend style={{ fontSize: "14px", fontWeight: "bold", color: "#196C87", padding: "0 5px" }}>
                      INEN
                    </legend>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Código"
                          value={formData.inencodigo}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          label="Descripción"
                          value={formData.inendescri}
                          size="small"
                          InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }}
                        />
                      </Grid>
                    </Grid>
                  </fieldset>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ======================= NUEVA PESTAÑA 8: HISTORIAL DE CAMBIOS ======================= */}
          <Accordion elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                8. Historial de Cambios (Auditoría)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ height: 400, width: "100%" }}>
                    <DataGrid
                      rows={auditoriaProd}
                      disableRowSelectionOnClick
                      density="compact"
                      slots={{ toolbar: GridToolbarQuickFilter }}
                      initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
                      columns={[
                        { field: "artfecmsys", headerName: "Fecha Mod.", width: 100 },
                        { field: "arthorsys", headerName: "Hora", width: 90 },
                        { field: "artusumsys", headerName: "Usuario", width: 110 },
                        { field: "ciacodigo", headerName: "Cía", width: 60 },
                        { field: "invcodigo", headerName: "Inv.", width: 60 },
                        { field: "artcodigo", headerName: "Cód. Artículo", width: 120 },
                        { field: "artdescri", headerName: "Artículo", width: 250 },
                        { field: "artnumparte", headerName: "Nº Parte", width: 120 },
                        { field: "lincodigo", headerName: "Cód. Línea", width: 100 },
                        { field: "lindescri", headerName: "Línea", width: 180 },
                        { field: "mardescri", headerName: "Marca", width: 120 },
                        { field: "meddescri", headerName: "Medida", width: 100 },
                        { field: "artpeso", headerName: "Peso", width: 80 },
                        { field: "predescri", headerName: "Presentación", width: 130 },
                        { field: "artserie", headerName: "Serie", width: 70 },
                        { field: "artseriedesp", headerName: "Serie Desp.", width: 100 },
                        { field: "artcodpartida", headerName: "Cód. Partida", width: 120 },
                        { field: "artarancel", headerName: "Desc. Partida", width: 200 },
                        { field: "artporpartida", headerName: "% Partida", width: 100 },
                        { field: "artsincosto", headerName: "Sin Costo", width: 90 },
                        { field: "artcantcergarantia", headerName: "No Series Auto.", width: 130 },
                      ]}
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </StyledRoot>
      </div>
    </ThemeProvider>
  )
}

export default BuscarCatalogodeProductos
