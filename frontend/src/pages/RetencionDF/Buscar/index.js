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
    primary: { main: "#196C87" },
    secondary: { main: "#196C87" },
  },
})

// Hook para obtener los datos de la Retención a visualizar
function useGetRetencionBuscar(datos) {
  return useQuery({
    queryKey: ["retencionBuscarDF", datos?.retid],
    queryFn: async () => {
      const response = await fetchwrapper("/RetencionDF/getRetencionBuscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retid: datos?.retid }),
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Error al cargar datos")
      }
      return result.data.data
    },
    refetchOnWindowFocus: false,
    enabled: !!datos?.retid,
  })
}

const BuscarRetencionDF = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const datosBusqueda = location.state // Contiene row.original del listado

  const { data, isLoading } = useGetRetencionBuscar(datosBusqueda)

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

  const { cabecera = {}, proveedor = {}, detalles = [] } = data || {}

  const totalRetenido = parseFloat(cabecera.retvalfuente || 0) + parseFloat(cabecera.retvaliva || 0)

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
          <b>Comprobante de Retención: {cabecera.retid}</b>
        </div>

        <Box className={StyledRoot}>
          {/* Informacion General */}
          <CustomFieldsetAccordion title="Información General" expanded={true} onToggle={() => {}}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <CustomTextFieldReadable label="N° Comprobante" value={cabecera.retid} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <CustomTextFieldReadable
                  label="Fecha Emisión"
                  value={cabecera.retfecemi ? dayjs(cabecera.retfecemi).format("DD/MM/YYYY") : ""}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <CustomTextFieldReadable label="Estado" value={cabecera.retstatus === "A" ? "ACTIVO" : "ANULADO"} />
              </Grid>

              {cabecera.sriautnumero && (
                <Grid item xs={12} sm={12} md={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nº Autorización SRI"
                    value={cabecera.sriautnumero}
                    InputProps={{
                      readOnly: true,
                      sx: { backgroundColor: "#f0f0f0", cursor: "text", fontWeight: "bold" },
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
            </Grid>
          </CustomFieldsetAccordion>

          <br />

          {/* Informacion Sujeto Retenido (Proveedor) */}
          <CustomFieldsetAccordion title="Sujeto Retenido (Proveedor)" expanded={true} onToggle={() => {}}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable label="RUC / CI" value={proveedor?.retruc || ""} />
              </Grid>
              <Grid item xs={12} sm={8}>
                <CustomTextFieldReadable label="Razón Social" value={proveedor?.retnombre || ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextFieldReadable label="Correo Electrónico" value={proveedor?.proemail || "S/N"} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextFieldReadable label="Dirección" value={proveedor?.retdirec || "S/N"} />
              </Grid>
            </Grid>
          </CustomFieldsetAccordion>

          <br />

          {/* Totales */}
          <CustomFieldsetAccordion title="Resumen de Totales" expanded={true} onToggle={() => {}}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable
                  label="Total Retención RENTA"
                  value={`$${parseFloat(cabecera.retvalfuente || 0).toFixed(2)}`}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable
                  label="Total Retención IVA"
                  value={`$${parseFloat(cabecera.retvaliva || 0).toFixed(2)}`}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable label="TOTAL RETENIDO" value={`$${totalRetenido.toFixed(2)}`} />
              </Grid>
            </Grid>
          </CustomFieldsetAccordion>

          <br />

          {/* Detalles */}
          <CustomFieldsetAccordion title="Detalle de Impuestos Retenidos" expanded={true} onToggle={() => {}}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Documento Sustento</TableCell>
                    <TableCell>Concepto SRI</TableCell>
                    <TableCell align="center">Tipo</TableCell>
                    <TableCell align="right">Base Imponible</TableCell>
                    <TableCell align="right">% Retención</TableCell>
                    <TableCell align="right">Valor Retenido</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles.map((detalle, index) => (
                    <TableRow key={index}>
                      <TableCell>{detalle.secuencia}</TableCell>
                      <TableCell>{detalle.docSustento}</TableCell>
                      <TableCell>{detalle.concepto}</TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={detalle.tipo === "RENTA" ? "primary" : "secondary"}
                        >
                          {detalle.tipo}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">${parseFloat(detalle.baseImponible || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{parseFloat(detalle.porcentaje || 0).toFixed(2)}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: "error.main" }}>
                        ${parseFloat(detalle.valorRetenido || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {detalles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No hay detalles de impuestos registrados.
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

export default BuscarRetencionDF
