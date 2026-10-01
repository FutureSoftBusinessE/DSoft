import { Divider, Grid, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { api } from "../../../../api"

export default function GeneralesSection({ data, change, readOnly, errors, Field, Section, options }) {
  const { data: tiposCompania } = useQuery({
    queryKey: ["tiposCompania"],
    queryFn: async () => {
      const response = await api.post("/Compania/getTiposCompania", {})
      return response?.data?.data?.data || []
    },
  })

  const tipoCompaniaOptions = [
    { value: "", label: "Seleccione..." },
    ...(tiposCompania?.map((tipo) => ({
      value: tipo.tpcodigo,
      label: tipo.tpdescripcion,
    })) || []),
  ]

  // Manejar selección de régimen (solo uno activo)
  const handleRegimenChange = (name, value) => {
    // Al marcar un régimen, desmarcar los otros dos
    if (value === -1 || value === true || value === 1) {
      const otrosRegimenes = ["ciaregimenemprendedores", "ciaregimenpopular", "ciaregimengeneral"].filter(
        (field) => field !== name,
      )

      otrosRegimenes.forEach((field) => {
        change(field, 0)
      })
    }
    change(name, value)
  }

  return (
    <Section title="Generales">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Datos de la Empresa
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field label="Alias" name="ciaalias" value={data.ciaalias} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Tipo Compañía"
          name="ciatipocompania"
          value={data.ciatipocompania || ""}
          onChange={change}
          readOnly={readOnly}
          select
          options={tipoCompaniaOptions}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Dirección"
          name="ciadirec"
          value={data.ciadirec}
          onChange={change}
          readOnly={readOnly}
          error={errors.ciadirec}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field label="Ciudad" name="ciaciudad" value={data.ciaciudad} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field label="País" name="ciapais" value={data.ciapais} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Email"
          name="ciaemail"
          value={data.ciaemail}
          onChange={change}
          readOnly={readOnly}
          error={errors.ciaemail}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field label="Página Web" name="ciaweb" value={data.ciaweb} onChange={change} readOnly={readOnly} />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Información S.R.I. de la Compañía
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>

      {/* ── BANDERA: Es Contribuyente Especial ── */}
      <Grid item xs={12} sm={3}>
        <Field
          label="Es Contribuyente Especial?"
          name="ciaescontesp"
          value={data.ciaescontesp}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
          checkedValue={-1}
          uncheckedValue={0}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="No. Resolución Contribuyente Especial"
          name="cianumresolucion"
          value={data.cianumresolucion}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Fecha Resolución Contribuyente Especial"
          name="ciafecresolucion"
          value={data.ciafecresolucion}
          onChange={change}
          readOnly={readOnly}
          type="date"
        />
      </Grid>

      {/* ── BANDERA: Es Agente de Retención ── */}
      <Grid item xs={12} sm={3}>
        <Field
          label="Es Agente de Retención?"
          name="sriagenteretencion"
          value={data.sriagenteretencion}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
          checkedValue="S"
          uncheckedValue="N"
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="No. Resolución Agente de Retención"
          name="sriagenteretencionnumres"
          value={data.sriagenteretencionnumres}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Fecha Resolución Agente de Retención"
          name="sriagenteretencionfecres"
          value={data.sriagenteretencionfecres}
          onChange={change}
          readOnly={readOnly}
          type="date"
        />
      </Grid>

      {/* ── BANDERA: Llevar Contabilidad ── */}
      <Grid item xs={12} sm={3}>
        <Field
          label="Llevar Contabilidad?"
          name="ciacontabilidad"
          value={data.ciacontabilidad}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
          checkedValue={-1}
          uncheckedValue={0}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="No. Resolución Llevar Contabilidad"
          name="ciacontabilidadnumres"
          value={data.ciacontabilidadnumres}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Fecha Resolución Llevar Contabilidad"
          name="ciacontabilidadfecres"
          value={data.ciacontabilidadfecres}
          onChange={change}
          readOnly={readOnly}
          type="date"
        />
      </Grid>

      {/* ── REPRESENTANTE LEGAL (no es bandera) ── */}
      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Representante Legal
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Nombre Representante Legal"
          name="ciagerente"
          value={data.ciagerente}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Cédula Representante Legal"
          name="ciacedgerente"
          value={data.ciacedgerente}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      {/* ── PRESIDENTE (no es bandera) ── */}
      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Presidente
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Nombre Presidente"
          name="ciapresidente"
          value={data.ciapresidente}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Cédula Presidente"
          name="ciacedpresidente"
          value={data.ciacedpresidente}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      {/* ── CONTADOR (no es bandera, 3 campos) ── */}
      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Contador
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Nombre Contador"
          name="ciacontador"
          value={data.ciacontador}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Cédula/RUC Contador"
          name="ciasriruccontador"
          value={data.ciasriruccontador}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Licencia Contador"
          name="ciaregcont"
          value={data.ciaregcont}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      {/* ── RÉGIMEN TRIBUTARIO ── */}
      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Régimen Tributario
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="RIMPE Emprendedores"
          name="ciaregimenemprendedores"
          value={data.ciaregimenemprendedores}
          onChange={handleRegimenChange}
          readOnly={readOnly}
          type="checkbox"
          checkedValue={-1}
          uncheckedValue={0}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="RIMPE Popular"
          name="ciaregimenpopular"
          value={data.ciaregimenpopular}
          onChange={handleRegimenChange}
          readOnly={readOnly}
          type="checkbox"
          checkedValue={-1}
          uncheckedValue={0}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Régimen General"
          name="ciaregimengeneral"
          value={data.ciaregimengeneral}
          onChange={handleRegimenChange}
          readOnly={readOnly}
          type="checkbox"
          checkedValue={-1}
          uncheckedValue={0}
        />
      </Grid>

      <Grid item xs={12}>
        <Field
          label="Identificación del Contribuyente para el ATS"
          name="ciasrirazon"
          value={data.ciasrirazon}
          onChange={change}
          readOnly={readOnly}
          error={errors.ciasrirazon}
        />
      </Grid>
    </Section>
  )
}
