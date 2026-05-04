import { Divider, Grid, Typography } from "@mui/material"

export default function TicketsRolesSection({ data, change, readOnly, Field, Section }) {
  return (
    <Section title="Tickets/Roles">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Parámetros de Impresión en Tickets
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12}>
        <Field label="Cabecera 1" name="cablin1" value={data.cablin1} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12}>
        <Field label="Cabecera 2" name="cablin2" value={data.cablin2} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12}>
        <Field label="Cabecera 3" name="cablin3" value={data.cablin3} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12}>
        <Field label="Cabecera 4" name="cablin4" value={data.cablin4} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12}>
        <Field label="Pie 1" name="pielin1" value={data.pielin1} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12}>
        <Field label="Pie 2" name="pielin2" value={data.pielin2} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12}>
        <Field label="Pie 3" name="pielin3" value={data.pielin3} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12}>
        <Field label="Pie 4" name="pielin4" value={data.pielin4} onChange={change} readOnly={readOnly} />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Para Generación/Aplicación del Préstamo por Compras a Crédito de empleados en la Compañía
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Código del Préstamo"
          name="prescodigo"
          value={data.prescodigo}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Tipo de Cliente"
          name="prestipcliempl"
          value={data.prestipcliempl}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Cálculo Quincenal"
          name="presaplicaquin"
          value={data.presaplicaquin}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Cálculo Mensual"
          name="presaplicamens"
          value={data.presaplicamens}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Secuencia de Cobro"
          name="presseccobro"
          value={data.presseccobro}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Caja asignada al Cobro"
          name="ciaseccobdoc"
          value={data.ciaseccobdoc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
    </Section>
  )
}
