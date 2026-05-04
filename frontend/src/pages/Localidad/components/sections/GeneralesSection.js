import { Divider, Grid, Typography } from "@mui/material"
import CustomFileInput from "../../../../components/CustomFileInput"

export default function GeneralesSection({ data, change, readOnly, errors, Field, Section, options }) {
  return (
    <Section title="Generales">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Datos de la Localidad
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field label="R.U.C." name="ciaruc" value={data.ciaruc} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={8}>
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
        <Field label="Provincia" name="ciaprovincia" value={data.ciaprovincia} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field label="País" name="ciapais" value={data.ciapais} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field label="Email" name="ciaemail" value={data.ciaemail} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={2}>
        <Field label="Teléfono 1" name="ciatelefono1" value={data.ciatelefono1} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={2}>
        <Field label="Teléfono 2" name="ciatelefono2" value={data.ciatelefono2} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={2}>
        <Field label="Fax" name="ciafax" value={data.ciafax} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Unidad de Negocio"
          name="unicodigo"
          value={data.unicodigo}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Servidor BD"
          name="locservidor"
          value={data.locservidor}
          onChange={change}
          readOnly={readOnly}
          select
          options={options.serverOptions}
          error={errors.locservidor}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Parámetros Internos para Procesos de Emisión de Documentos Fiscales
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12}>
        <Field
          label="Nombre del Reporte que Imprime Factura PreImpresa"
          name="fatrainv"
          value={data.fatrainv}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={8}>
        <CustomFileInput
          label="Ruta y Nombre Archivo p12 que contiene la Firma Digital"
          value={data.locpathxml || ""}
          onChange={(value) => change("locpathxml", value)}
          accept=".p12,.pfx,.pem"
          disabled={readOnly}
          error={Boolean(errors?.locpathxml)}
          helperText={errors?.locpathxml || " "}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Clave del Archivo p12"
          name="clavep12"
          value={data.clavep12}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12}>
        <CustomFileInput
          label="Ruta de la Aplicación java SIACFacturacionElectronica.jar"
          value={data.locpathxmldocemitidos || ""}
          onChange={(value) => change("locpathxmldocemitidos", value)}
          disabled={readOnly}
          error={Boolean(errors?.locpathxmldocemitidos)}
          helperText={errors?.locpathxmldocemitidos || " "}
        />
      </Grid>
    </Section>
  )
}
