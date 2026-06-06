import React from "react"
import Header from "../../../layouts/Header"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import { useQuery } from "@tanstack/react-query"
import { ThemeProvider, styled, createTheme } from "@mui/material/styles"
import {
  CircularProgress,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  TextField,
} from "@mui/material"
import CustomBackdrop from "../../../components/CustomBackdrop"
import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"
import CustomTextFieldReadable from "../../../components/CustomTextFieldReadable"
import BackIcon from "../../../components/BackIcon"
import { useNavigate, useLocation } from "react-router-dom"
import dayjs from "dayjs"

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

// Hook para obtener los datos de la Nota de Débito a visualizar
function useGetNotaDebitoBuscar(datos) {
  return useQuery({
    queryKey: ["notaDebitoBuscarDF", datos?.facnumfac],
    queryFn: async () => {
      const response = await fetchwrapper("/NotaDebitoDF/getNotaDebitoBuscar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facnumfac: datos?.facnumfac,
        }),
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Error al cargar datos")
      }
      return result.data.data
    },
    refetchOnWindowFocus: false,
    enabled: !!datos?.facnumfac,
  })
}

const BuscarNotaDebitoDF = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const datosBusqueda = location.state // Contiene row.original del listado

  const { data, isLoading } = useGetNotaDebitoBuscar(datosBusqueda)

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CustomBackdrop isLoading={true} />
        <Header />
        <div className="main main-app p-3 p-lg-4" style={{ textAlign: "center", paddingTop: "50px" }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Cargando información...
          </Typography>
        </div>
      </ThemeProvider>
    )
  }

  if (!data) {
    return (
      <ThemeProvider theme={theme}>
        <Header />
        <div className="main main-app p-3 p-lg-4">
          <BackIcon />
          <Typography variant="h6" sx={{ textAlign: "center", mt: 4 }}>
            No se encontró información del documento.
          </Typography>
        </div>
      </ThemeProvider>
    )
  }

  // Se extraen los datos (soportando 'productos' o 'motivos' según devuelva el backend)
  const { cabecera = {}, cliente = {}, formaPago = {}, vendedor = {} } = data || {}
  const motivos = data?.motivos || data?.productos || data?.servicios || []

  return (
    <ThemeProvider theme={theme}>
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
          <b>Nota de Débito: {cabecera.facnumfac}</b>
        </div>

        <Box className={StyledRoot}>
          {/* Informacion General */}
          <CustomFieldsetAccordion title="Información General" expanded={true} onToggle={() => {}}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable label="Número Nota de Débito" value={cabecera.facnumfac} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable label="Factura Modificada" value={cabecera.facnumref || "N/A"} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable
                  label="Fecha Emisión"
                  value={cabecera.facfecemi ? dayjs(cabecera.facfecemi).format("DD/MM/YYYY") : ""}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable
                  label="Fecha Vencimiento"
                  value={cabecera.facfecven ? dayjs(cabecera.facfecven).format("DD/MM/YYYY") : ""}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable label="Forma de Pago" value={formaPago?.fordescri || ""} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable label="Vendedor" value={vendedor?.vennombre || ""} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable
                  label="Estado"
                  value={cabecera.facstatus === "A" ? "ACTIVO" : cabecera.facstatus}
                />
              </Grid>

              {/* Autorización SRI con readOnly en lugar de disabled para permitir copiar, y con md={6} para que se vean los 49 dígitos */}
              {cabecera.sriautnumero && (
                <Grid item xs={12} sm={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nº Autorización SRI"
                    value={cabecera.sriautnumero}
                    InputProps={{
                      readOnly: true,
                      sx: { backgroundColor: "#f0f0f0", cursor: "text" },
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <CustomTextFieldReadable label="Observación" value={cabecera.facdetalle || ""} />
              </Grid>
            </Grid>
          </CustomFieldsetAccordion>

          <br />

          {/* Informacion Cliente */}
          <CustomFieldsetAccordion title="Información Cliente" expanded={true} onToggle={() => {}}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable label="Código" value={cliente?.clicodigo || ""} />
              </Grid>
              <Grid item xs={12} sm={8}>
                <CustomTextFieldReadable label="Nombre" value={cliente?.clinombre || ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextFieldReadable label="RUC/CI" value={cliente?.cliruc || ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextFieldReadable label="Teléfono" value={cliente?.clitelef1 || ""} />
              </Grid>
              <Grid item xs={12}>
                <CustomTextFieldReadable label="Dirección" value={cliente?.clidirec || ""} />
              </Grid>
            </Grid>
          </CustomFieldsetAccordion>

          <br />

          {/* Totales */}
          <CustomFieldsetAccordion title="Totales" expanded={true} onToggle={() => {}}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable
                  label="Subtotal"
                  value={`$${parseFloat(cabecera.facsubtot || 0).toFixed(2)}`}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable label="IVA" value={`$${parseFloat(cabecera.faciva || 0).toFixed(2)}`} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable label="Total" value={`$${parseFloat(cabecera.factotal || 0).toFixed(2)}`} />
              </Grid>
            </Grid>
          </CustomFieldsetAccordion>

          <br />

          {/* Motivos (Reemplaza a Productos en Notas de Débito) */}
          <CustomFieldsetAccordion title="Motivos (Servicios)" expanded={true} onToggle={() => {}}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Motivo (Razón)</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Valor Unit.</TableCell>
                    <TableCell align="right">% Desc.</TableCell>
                    <TableCell align="right">% IVA</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {motivos.map((motivo, index) => (
                    <TableRow key={index}>
                      <TableCell>{motivo.secuencia}</TableCell>
                      <TableCell>{motivo.sercodigo || motivo.artcodigo}</TableCell>
                      <TableCell>{motivo.serdescri || motivo.artdescri}</TableCell>
                      <TableCell align="right">{motivo.cantidad}</TableCell>
                      <TableCell align="right">${parseFloat(motivo.precioUnitario || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{motivo.descuento}%</TableCell>
                      <TableCell align="right">{motivo.iva}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        ${parseFloat(motivo.total || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {motivos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No hay motivos registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CustomFieldsetAccordion>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default BuscarNotaDebitoDF
