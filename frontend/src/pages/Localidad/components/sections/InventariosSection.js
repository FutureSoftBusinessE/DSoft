import { Divider, Grid, Typography } from "@mui/material"

export default function InventariosSection({ data, change, readOnly, Field, Section }) {
  return (
    <Section title="Inventarios">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Garantías
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field label="Inventario" name="painvcodgar" value={data.painvcodgar} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field label="Bodega" name="pabodcodgar" value={data.pabodcodgar} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo de Ingreso Cliente"
          name="pacodinggar"
          value={data.pacodinggar}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo Egreso Devolución ó Canje Cliente"
          name="pacodegrgar"
          value={data.pacodegrgar}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo Egreso Devolución al Proveedor"
          name="pacodingdev"
          value={data.pacodingdev}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo Ingreso Devolución al Proveedor"
          name="pacodegrpro"
          value={data.pacodegrpro}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Parámetros de CXC que usa el Módulo de Garantías
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Secuencia de Nota/Crédito por Monto"
          name="seqcodigondm"
          value={data.seqcodigondm}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Servicio de NC Proveedor/NC Cliente"
          name="seqcodigonc"
          value={data.seqcodigonc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Servicio de NO NC Proveedor/NC Cliente"
          name="seqcesion"
          value={data.seqcesion}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Servicio de Costo NC cliente"
          name="sercodigo"
          value={data.sercodigo}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Caja para Nota/Crédito por Monto"
          name="cjacodigonc"
          value={data.cjacodigonc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Guías de Remisión
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Número Máximo de Líneas"
          name="guianumlin"
          value={data.guianumlin}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Transferencias Internas
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo de Ingreso"
          name="tracodproing"
          value={data.tracodproing}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo de Egreso"
          name="tracodproegr"
          value={data.tracodproegr}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Transformación
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo de Ingreso"
          name="invtrapresing"
          value={data.invtrapresing}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo de Egreso"
          name="invtrapresegr"
          value={data.invtrapresegr}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Transacción de Préstamos
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field label="Tipo de Ingreso" name="tipoingoc" value={data.tipoingoc} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field label="Tipo de Egreso" name="tipoegroc" value={data.tipoegroc} onChange={change} readOnly={readOnly} />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Transferencia de Otras Localidades
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field label="Tipo de Ingreso" name="traingped" value={data.traingped} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field label="Tipo de Egreso" name="traegrped" value={data.traegrped} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Días de Vencimiento"
          name="tardiasventrans"
          value={data.tardiasventrans}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Talleres
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo de Egreso a Producción"
          name="pacodegprest"
          value={data.pacodegprest}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo Ingreso de Unidad de Negocio"
          name="pacodingre"
          value={data.pacodingre}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
    </Section>
  )
}
