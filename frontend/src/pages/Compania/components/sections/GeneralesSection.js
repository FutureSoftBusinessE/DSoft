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
      <Grid item xs={12} sm={4}>
        <Field
          label="Es Contribuyente Especial?"
          name="ciaescontesp"
          value={data.ciaescontesp}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="No. Resolución"
          name="cianumresolucion"
          value={data.cianumresolucion}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Fecha Resolución"
          name="ciafecresolucion"
          value={data.ciafecresolucion}
          onChange={change}
          readOnly={readOnly}
          type="date"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
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
      <Grid item xs={12} sm={4}>
        <Field
          label="No. Resolución"
          name="sriagenteretencionnumres"
          value={data.sriagenteretencionnumres}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Es RIMPE?"
          name="srimicroempresa"
          value={data.srimicroempresa}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
          checkedValue="S"
          uncheckedValue="N"
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
