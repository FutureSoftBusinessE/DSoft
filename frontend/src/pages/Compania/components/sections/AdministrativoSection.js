import { Divider, Grid, Typography } from "@mui/material"

export default function AdministrativoSection({ data, change, readOnly, errors, Field, Section, options }) {
  return (
    <Section title="Administrativo">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Autoridades de la Empresa
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Field
          label="Presidente"
          name="ciapresidente"
          value={data.ciapresidente}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Representante Legal"
          name="ciagerente"
          value={data.ciagerente}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Identific. Repres. Legal"
          name="ciacedgerente"
          value={data.ciacedgerente}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo Identificación"
          name="ciatipoidengerente"
          value={data.ciatipoidengerente}
          onChange={change}
          readOnly={readOnly}
          select
          options={options.idTypeOptions}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field label="Auditor" name="ciavigilancia" value={data.ciavigilancia} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field label="Contador" name="ciacontador" value={data.ciacontador} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Registro del Contador"
          name="ciaregcont"
          value={data.ciaregcont}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="R.U.C. Contador"
          name="ciasriruccontador"
          value={data.ciasriruccontador}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Auxiliar de Crédito"
          name="ciaauxcredito"
          value={data.ciaauxcredito}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
          Localidad Matriz
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Localidad Matriz"
          name="ciacodlocmatriz"
          value={data.ciacodlocmatriz}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Centro/Costo x Defecto"
          name="coscodigo"
          value={data.coscodigo}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
    </Section>
  )
}
