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

// Hook para obtener los datos de la Guía de Remisión a visualizar
function useGetGuiaRemisionBuscar(datos) {
  return useQuery({
    queryKey: ["guiaRemisionBuscarDF", datos?.guinumero],
    queryFn: async () => {
      const response = await fetchwrapper("/GuiadeRemisionDF/getGuiaBuscar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guinumero: datos?.guinumero,
        }),
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Error al cargar datos")
      }
      return result.data.data
    },
    refetchOnWindowFocus: false,
    enabled: !!datos?.guinumero,
  })
}

const BuscarGuiaRemisionDF = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const datosBusqueda = location.state // Contiene row.original del listado

  const { data, isLoading } = useGetGuiaRemisionBuscar(datosBusqueda)

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

  if (!data || !data.cabecera) {
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

  const { cabecera, detalles = [] } = data

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
          <b>Guía de Remisión: {cabecera.guinumero}</b>
        </div>

        <Box className={StyledRoot}>
          {/* INFORMACION DEL TRASLADO */}
          <CustomFieldsetAccordion title="Información del Traslado" expanded={true} onToggle={() => {}}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable label="Número Guía" value={cabecera.guinumero} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable label="Factura Origen" value={cabecera.facnumfac || "S/N"} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable
                  label="Fecha Inicio Traslado"
                  value={cabecera.guifecha ? dayjs(cabecera.guifecha).format("DD/MM/YYYY") : ""}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable
                  label="Fecha Fin Traslado"
                  value={cabecera.guifecfintrans ? dayjs(cabecera.guifecfintrans).format("DD/MM/YYYY") : ""}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable label="Transportista" value={cabecera.transportista || ""} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable label="RUC Transportista" value={cabecera.transruc || ""} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable label="Placa Vehículo" value={cabecera.guiplacafinal || "S/N"} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable label="Motivo SRI" value={cabecera.Motivo || "VENTA"} />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable
                  label="Estado"
                  value={cabecera.guistatus === "A" ? "ACTIVO" : cabecera.guistatus}
                />
              </Grid>

              {/* Autorización SRI (editable para permitir copia del número largo) */}
              {cabecera.sriautnumero && (
                <Grid item xs={12} sm={12} md={9}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nº Autorización SRI"
                    value={cabecera.sriautnumero}
                    InputProps={{
                      readOnly: true,
                      sx: { backgroundColor: "#f0f0f0", cursor: "text", color: "green", fontWeight: "bold" },
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
            </Grid>
          </CustomFieldsetAccordion>

          <br />

          {/* INFORMACION DEL DESTINATARIO */}
          <CustomFieldsetAccordion title="Destinatario & Ruta" expanded={true} onToggle={() => {}}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <CustomTextFieldReadable label="Destinatario" value={cabecera.clinombre || "CONSUMIDOR FINAL"} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable label="RUC / CI" value={cabecera.cliruc || "9999999999999"} />
              </Grid>
              <Grid item xs={12}>
                <CustomTextFieldReadable label="Dirección de Entrega" value={cabecera.direccion_entrega || "S/N"} />
              </Grid>
            </Grid>
          </CustomFieldsetAccordion>

          <br />

          {/* ARTICULOS TRANSPORTADOS */}
          <CustomFieldsetAccordion title="Artículos a Transportar" expanded={true} onToggle={() => {}}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell width="60px" align="center">
                      #
                    </TableCell>
                    <TableCell width="150px">Código</TableCell>
                    <TableCell>Descripción del Artículo</TableCell>
                    <TableCell width="150px" align="center">
                      Cantidad
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles.map((det, index) => (
                    <TableRow key={index}>
                      <TableCell align="center">{det.guisecuencia}</TableCell>
                      <TableCell>{det.artcodigo}</TableCell>
                      <TableCell>{det.artdescri}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        {parseFloat(det.cantidad || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {detalles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No hay artículos registrados en esta guía.
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

export default BuscarGuiaRemisionDF
