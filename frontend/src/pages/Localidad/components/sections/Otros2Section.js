import { Grid } from "@mui/material"

export default function Otros2Section({ data, change, readOnly, Field, Section }) {
  return (
    <Section title="Otros 2">
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo Nota/Débito"
          name="paramtipond"
          value={data.paramtipond}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo de Nota/Crédito por Devolución"
          name="paramtiponc"
          value={data.paramtiponc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Transacción Ingreso a Inventarios"
          name="paramcoding"
          value={data.paramcoding}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Bodega Ingreso/Egreso"
          name="parambodingegr"
          value={data.parambodingegr}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Sustento Tributario Nota/Débito"
          name="paramstnd"
          value={data.paramstnd}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Sustento Tributario Nota/Crédito"
          name="paramstnc"
          value={data.paramstnc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo de Comprobante Nota/Débito"
          name="paramtcnd"
          value={data.paramtcnd}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo de Comprobante Nota/Crédito"
          name="paramtcnc"
          value={data.paramtcnc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
    </Section>
  )
}
