import { Divider, Grid, Typography } from "@mui/material"

export default function ContablesSection({ data, change, readOnly, errors, Field, Section, options }) {
  return (
    <Section title="Contables">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Datos Contables
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Año del Período Vigente"
          name="ciaanioejer"
          value={data.ciaanioejer}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Año de Inicio de la Contabilidad"
          name="ciaanioinicon"
          value={data.ciaanioinicon}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Fecha Mínimo Acceso"
          name="ciafecminacc"
          value={data.ciafecminacc}
          onChange={change}
          readOnly={readOnly}
          type="date"
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Comprobante de Cierre Anual"
          name="ciarecsalmen"
          value={data.ciarecsalmen}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
          Niveles y Formatos
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Niveles - Plan de Cuentas"
          name="cianivelescta"
          value={data.cianivelescta}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={9}>
        <Field
          label="Formato - Plan de Cuentas"
          name="ciaforcta"
          value={data.ciaforcta}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Niveles - Centros de Costo"
          name="cianivelescc"
          value={data.cianivelescc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={9}>
        <Field
          label="Formato - Centros de Costo"
          name="ciaforcencos"
          value={data.ciaforcencos}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Niveles - Líneas de Inventario"
          name="cianiveleslin"
          value={data.cianiveleslin}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={9}>
        <Field
          label="Formato - Líneas de Inventario"
          name="ciaforlin"
          value={data.ciaforlin}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Niveles - Partidas Presupuestarias"
          name="cianivelespre"
          value={data.cianivelespre}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={9}>
        <Field
          label="Formato - Partidas Presupuestarias"
          name="ciaforpre"
          value={data.ciaforpre}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Niveles - Orgánico Empresa"
          name="CiaNivelOrg"
          value={data.CiaNivelOrg}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={9}>
        <Field
          label="Formato - Orgánico Empresa"
          name="ciafororg"
          value={data.ciafororg}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Nota: El formato usa como delimitador de niveles un guión y debe coincidir con los niveles especificados.
        </Typography>
      </Grid>
    </Section>
  )
}
