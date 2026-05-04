import { Grid } from "@mui/material"

export default function Notas1Section({ data, change, readOnly, Field, Section }) {
  return (
    <Section title="Notas 1">
      <Grid item xs={12}>
        <Field
          label="Notas para Imprimir en el Pedido (Máximo 1,000 caracteres por Nota) <Enter> para separar Líneas - Nota 1"
          name="notapedido1"
          value={data.notapedido1}
          onChange={change}
          readOnly={readOnly}
          multiline
          rows={4}
        />
      </Grid>
      <Grid item xs={12}>
        <Field
          label="Notas para Imprimir en el Pedido (Máximo 1,000 caracteres por Nota) <Enter> para separar Líneas - Nota 2"
          name="notapedido2"
          value={data.notapedido2}
          onChange={change}
          readOnly={readOnly}
          multiline
          rows={4}
        />
      </Grid>
      <Grid item xs={12}>
        <Field
          label="Nota para Imprimir en la Orden de Compra de Proveedores (Máximo 1,000 caracteres) <Enter> para separar Líneas"
          name="notaoc"
          value={data.notaoc}
          onChange={change}
          readOnly={readOnly}
          multiline
          rows={4}
        />
      </Grid>
    </Section>
  )
}
