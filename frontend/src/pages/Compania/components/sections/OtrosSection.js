import { Divider, Grid, Typography } from "@mui/material"

export default function OtrosSection({ data, change, readOnly, errors, Field, Section, options }) {
  return (
    <Section title="Otros">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Varios
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Valida Créditos desde la Matriz"
          name="ciavalidaemp"
          value={data.ciavalidaemp}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Usar/No usar Generación de IAN 13"
          name="generacodian"
          value={data.generacodian}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
          Datos para Módulo de Presupuesto
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Aplica Presupuesto a todos los Módulos"
          name="ciapresupuesto"
          value={data.ciapresupuesto}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Fecha Inicio de Presupuesto"
          name="ciafecinipre"
          value={data.ciafecinipre}
          onChange={change}
          readOnly={readOnly}
          type="date"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
          Para Inventarios/Compras e Importaciones
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Formato de Cantidad"
          name="ciacantfor"
          value={data.ciacantfor}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Formato de Costos"
          name="ciacostfor"
          value={data.ciacostfor}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Código de Entidad otorgado por DINARDAP"
          name="ciavaloradiret"
          value={data.ciavaloradiret}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
          Datos para Cuentas por Cobrar
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Bloqueo Automático de Clientes"
          name="ciacobracupos"
          value={data.ciacobracupos}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Máximo de días para Generar N/C"
          name="ciadiasnc"
          value={data.ciadiasnc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Máximo de días para Cobrar Retenciones"
          name="ciadiasretencion"
          value={data.ciadiasretencion}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Máximo de días para Emitir Retenciones"
          name="ciadiasemitirretencion"
          value={data.ciadiasemitirretencion}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
    </Section>
  )
}
