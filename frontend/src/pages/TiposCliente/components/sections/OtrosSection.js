import { Grid, Box, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper } from "@mui/material"

const OtrosSection = ({ data = {}, change, readOnly, Field, Section, selectOptions = {} }) => {
  const audit = Array.isArray(data.auditLog) ? data.auditLog : []

  return (
    <Section title="Otros">
      {/* Datos del Cónyuge */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Field
            label="Tipo/Identificación"
            name="cliidencon"
            value={data.cliidencon}
            onChange={change}
            readOnly={readOnly}
            select
            options={
              selectOptions?.tipoIdentificacion || [
                { value: "C", label: "Cédula de Identidad" },
                { value: "F", label: "Consumidor Final" },
                { value: "P", label: "Pasaporte" },
                { value: "R", label: "R.U.C." },
                { value: "O", label: "No Aplica" },
              ]
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field
            label="Nº de Identificación"
            name="cliruccon"
            value={data.cliruccon}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>

        <Grid item xs={12}>
          <Field label="Nombre" name="clinombrecon" value={data.clinombrecon} onChange={change} readOnly={readOnly} />
        </Grid>

        <Grid item xs={12}>
          <Field label="Dirección" name="clidireccon" value={data.clidireccon} onChange={change} readOnly={readOnly} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Field
            label="Profesión"
            name="cliprofesioncon"
            value={data.cliprofesioncon}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
      </Grid>

      {/* Observaciones */}
      <Grid item xs={12} style={{ marginTop: 12 }}>
        <Field
          label="Observaciones"
          name="cliobserva"
          value={data.cliobserva}
          onChange={change}
          readOnly={readOnly}
          multiline
          rows={8}
        />
      </Grid>

      {/* Auditoría de Modificaciones */}
      <Box mt={2} />
      <Grid item xs={12}>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Acción</TableCell>
                <TableCell>Usuario Modificó</TableCell>
                <TableCell>Fecha Modificó</TableCell>
                <TableCell>Hora Modificó</TableCell>
                <TableCell>Código Cliente</TableCell>
                <TableCell>Nombre del Cliente</TableCell>
                <TableCell>Tipo de Identificación</TableCell>
                <TableCell>Número de Identificación</TableCell>
                <TableCell>Días de Crédito</TableCell>
                <TableCell>Monto del Crédito</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {audit.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No hay registros de auditoría
                  </TableCell>
                </TableRow>
              ) : (
                audit.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{r.accion || r.cliaccion || ""}</TableCell>
                    <TableCell>{r.usuario || r.cliusumsys || ""}</TableCell>
                    <TableCell>{r.fecha || r.clifecmsys || ""}</TableCell>
                    <TableCell>{r.hora || r.clihormsys || ""}</TableCell>
                    <TableCell>{r.codigoCliente || r.clicodigo || ""}</TableCell>
                    <TableCell>{r.nombreCliente || r.clinombre || ""}</TableCell>
                    <TableCell>{r.tipoIdentificacion || r.cliidentifica || ""}</TableCell>
                    <TableCell>{r.numeroIdentificacion || r.cliruc || ""}</TableCell>
                    <TableCell>{r.diasCredito ?? r.clidiascrs ?? ""}</TableCell>
                    <TableCell>{r.montoCredito ?? r.climontocrs ?? ""}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Section>
  )
}

export default OtrosSection
