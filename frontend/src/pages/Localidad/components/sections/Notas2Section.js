import { Grid } from "@mui/material"

export default function Notas2Section({ data, change, readOnly, Field, Section }) {
  return (
    <Section title="Notas 2">
      <Grid item xs={12}>
        <Field
          label="Nota para Imprimir en el Certificado de Garantía (Máximo 1,000 caracteres) <Enter> para separar Líneas"
          name="notacertificado"
          value={data.notacertificado}
          onChange={change}
          readOnly={readOnly}
          multiline
          rows={6}
        />
      </Grid>
    </Section>
  )
}
