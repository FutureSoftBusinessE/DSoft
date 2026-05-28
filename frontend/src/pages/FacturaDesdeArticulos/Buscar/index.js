// app/FacturaDesdeArticulos/BuscarFacturaDesdeArticulos.jsx
import React, { useState, useEffect } from "react"
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
  Divider,
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

function useGetProformaFacturaBuscar(datos) {
  return useQuery({
    queryKey: ["proformaFacturaBuscar", datos?.pednumped],
    queryFn: async () => {
      const response = await fetchwrapper("/FacturaDesdeArticulos/getProformaFacturaBuscar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pednumped: datos?.pednumped,
          pedstatus: datos?.pedstatus,
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
    enabled: !!datos?.pednumped,
  })
}

const BuscarFacturaDesdeArticulos = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const datosBusqueda = location.state

  const { data, isLoading } = useGetProformaFacturaBuscar(datosBusqueda)

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CustomBackdrop isLoading={true} />
        <Header />
        <div className="main main-app p-3 p-lg-4" style={{ textAlign: "center", paddingTop: "50px" }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Cargando informacion...
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
            No se encontro informacion
          </Typography>
        </div>
      </ThemeProvider>
    )
  }

  const { tipo, cabecera, cliente, formaPago, vendedor, productos } = data

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
          <b>
            {tipo === "PROFORMA" ? "Proforma" : "Factura"}:{" "}
            {tipo === "PROFORMA" ? cabecera.pednumped : cabecera.facnumfac}
          </b>
        </div>

        <Box className={StyledRoot}>
          {/* Informacion General */}
          <CustomFieldsetAccordion title="Informacion General" expanded={true} onToggle={() => {}}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable
                  label={tipo === "PROFORMA" ? "Numero Proforma" : "Numero Factura"}
                  value={tipo === "PROFORMA" ? cabecera.pednumped : cabecera.facnumfac}
                />
              </Grid>
              {tipo === "FACTURA" && (
                <Grid item xs={12} sm={6} md={3}>
                  <CustomTextFieldReadable label="Proforma Original" value={cabecera.pednumped || ""} />
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable
                  label="Fecha Emision"
                  value={
                    tipo === "PROFORMA"
                      ? dayjs(cabecera.pedfecemi).format("DD/MM/YYYY")
                      : dayjs(cabecera.facfecemi).format("DD/MM/YYYY")
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextFieldReadable
                  label="Fecha Vencimiento"
                  value={
                    tipo === "PROFORMA"
                      ? dayjs(cabecera.pedfecven).format("DD/MM/YYYY")
                      : dayjs(cabecera.facfecven).format("DD/MM/YYYY")
                  }
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
                  value={tipo === "PROFORMA" ? cabecera.pedstatus : cabecera.facstatus}
                />
              </Grid>
              {tipo === "FACTURA" && cabecera.sriautnumero && (
                <Grid item xs={12} sm={6} md={3}>
                  <CustomTextFieldReadable label="N Autorizacion SRI" value={cabecera.sriautnumero} />
                </Grid>
              )}
              <Grid item xs={12}>
                <CustomTextFieldReadable label="Observacion" value={cabecera.peddetalle || cabecera.facdetalle || ""} />
              </Grid>
            </Grid>
          </CustomFieldsetAccordion>

          <br />

          {/* Informacion Cliente */}
          <CustomFieldsetAccordion title="Informacion Cliente" expanded={true} onToggle={() => {}}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable label="Codigo" value={cliente?.clicodigo || ""} />
              </Grid>
              <Grid item xs={12} sm={8}>
                <CustomTextFieldReadable label="Nombre" value={cliente?.clinombre || ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextFieldReadable label="RUC/CI" value={cliente?.cliruc || ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextFieldReadable label="Telefono" value={cliente?.clitelef1 || ""} />
              </Grid>
              <Grid item xs={12}>
                <CustomTextFieldReadable label="Direccion" value={cliente?.clidirec || ""} />
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
                  value={`$${tipo === "PROFORMA" ? cabecera.pedsubtot : cabecera.facsubtot}`}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable
                  label="IVA"
                  value={`$${tipo === "PROFORMA" ? cabecera.pediva : cabecera.faciva}`}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextFieldReadable
                  label="Total"
                  value={`$${tipo === "PROFORMA" ? cabecera.pedtotal : cabecera.factotal}`}
                />
              </Grid>
            </Grid>
          </CustomFieldsetAccordion>

          <br />

          {/* Productos */}
          <CustomFieldsetAccordion title="Productos" expanded={true} onToggle={() => {}}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Codigo</TableCell>
                    <TableCell>Descripcion</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">P. Unitario</TableCell>
                    <TableCell align="right">Descuento %</TableCell>
                    <TableCell align="right">IVA %</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productos.map((prod, index) => (
                    <TableRow key={index}>
                      <TableCell>{prod.secuencia}</TableCell>
                      <TableCell>{prod.artcodigo}</TableCell>
                      <TableCell>{prod.artdescri}</TableCell>
                      <TableCell align="right">{prod.cantidad}</TableCell>
                      <TableCell align="right">${prod.precioUnitario}</TableCell>
                      <TableCell align="right">{prod.descuento}%</TableCell>
                      <TableCell align="right">{prod.iva}%</TableCell>
                      <TableCell align="right">${prod.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CustomFieldsetAccordion>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default BuscarFacturaDesdeArticulos
