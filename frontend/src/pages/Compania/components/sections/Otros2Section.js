import { Divider, Grid, Typography } from "@mui/material"

export default function Otros2Section({ data, change, readOnly, errors, Field, Section, options }) {
  return (
    <Section title="Otros 2">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Parámetros de Otros 2
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Aplica Facturación Electrónica ?"
          name="ciafacelectronica"
          value={data.ciafacelectronica}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
          checkedValue="S"
          uncheckedValue="N"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Ambiente"
          name="ciaambienteelectronica"
          value={data.ciaambienteelectronica}
          onChange={change}
          readOnly={readOnly}
          type="radio"
          options={options.ambienteFeOptions}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Aplica SERIES ?"
          name="apliserie"
          value={data.apliserie}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Aplica Secuencia Automática para el Código del Cliente ?"
          name="codclisec"
          value={data.codclisec}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Aplica Secuencia Automática para el Código del Proveedor ?"
          name="codprosec"
          value={data.codprosec}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Aplica Secuencia Automática Código del Artículo ?"
          name="codartsec"
          value={data.codartsec}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Muestra en Consultas de Precios el IVA incluido? (Precio + IVA)"
          name="ciaivaporproducto"
          value={data.ciaivaporproducto}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Esta Compañía copia información al CREAR registros desde la Compañía Principal?"
          name="ciafacDeVariosLoc"
          value={data.ciafacDeVariosLoc}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Transferencia del Ingreso por Compras a otra Localidad"
          name="aplitransing"
          value={data.aplitransing}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Actualiza Listas de Precios al Cerrar la Importación"
          name="ciaactualizaprecios"
          value={data.ciaactualizaprecios}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Validar si el Precio es menor al Costo del Artículo en Facturación"
          name="ciavalprecost"
          value={data.ciavalprecost}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="No Repetir Items en Pedidos/Facturas"
          name="ciafacitemrep"
          value={data.ciafacitemrep}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Usar/No usar Más de un Vendedor al Facturar"
          name="cianumvend"
          value={data.cianumvend}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
    </Section>
  )
}
