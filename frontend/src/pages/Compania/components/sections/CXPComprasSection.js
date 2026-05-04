import { Divider, Grid, Typography } from "@mui/material"

export default function CXPComprasSection({ data, change, readOnly, errors, Field, Section, options }) {
  return (
    <Section title="CXP/Compras">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Solicitud de Pago Automático de CXP Facturas
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Facturas"
          name="ciasolautfactcxp"
          value={data.ciasolautfactcxp}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Anticipos/Viáticos/Caja Chica"
          name="ciasolautanticxp"
          value={data.ciasolautanticxp}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Pagos Directos"
          name="ciasolautpagocxp"
          value={data.ciasolautpagocxp}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
          Aprobación de Pago Automático de CXP Facturas
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Facturas"
          name="ciaaproautfactcxp"
          value={data.ciaaproautfactcxp}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Anticipos/Viáticos/Caja Chica"
          name="ciaaproautanticxp"
          value={data.ciaaproautanticxp}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Pagos Directos"
          name="ciaaproautpagocxp"
          value={data.ciaaproautpagocxp}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
          Estados al Crear Órdenes de Compras
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Al Crear OC Locales"
          name="ciaaaoclocal"
          value={data.ciaaaoclocal}
          onChange={change}
          readOnly={readOnly}
          select
          options={options.ocStateOptions}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Al Crear OC de LiqComp Locales"
          name="ciaaaocliqcomloc"
          value={data.ciaaaocliqcomloc}
          onChange={change}
          readOnly={readOnly}
          select
          options={options.ocStateOptions}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Al Crear OC de Importaciones"
          name="ciaaaocimport"
          value={data.ciaaaocimport}
          onChange={change}
          readOnly={readOnly}
          select
          options={options.ocStateOptions}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Al Crear OC de LiqComp Importaciones"
          name="ciaaaocliqcomimp"
          value={data.ciaaaocliqcomimp}
          onChange={change}
          readOnly={readOnly}
          select
          options={options.ocStateOptions}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Al Crear OC de Servicios"
          name="ciaaaocserv"
          value={data.ciaaaocserv}
          onChange={change}
          readOnly={readOnly}
          select
          options={options.ocStateOptions}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Al Crear OC de LiqComp Servicios"
          name="ciaaaocliqcomser"
          value={data.ciaaaocliqcomser}
          onChange={change}
          readOnly={readOnly}
          select
          options={options.ocStateOptions}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Field
          label="Aprobación automática al Crear Órdenes de Compras de Gastos Asociados"
          name="ciaaaocgasta"
          value={data.ciaaaocgasta}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Aprobación automática al Crear Órdenes de Compras PPE"
          name="ciaaaocppe"
          value={data.ciaaaocppe}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
    </Section>
  )
}
