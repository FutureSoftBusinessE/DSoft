import { Divider, Grid, Typography } from "@mui/material"
import CustomPhotoCam from "../../../../components/CustomPhotoCam"

export default function AdicionalesSection({ data, change, readOnly, errors, Field, Section, options }) {
  return (
    <Section title="Adicionales">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Imágenes de la Compañía
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>

      <Grid item xs={12} sm={6}>
        <CustomPhotoCam
          label="Logo de la Compañía"
          onImage={(img) => {
            change("cialogo", img ? img.base64Hex : null)
          }}
          initialImage={data?.cialogo ? `data:image/jpeg;base64,${data.cialogo}` : null}
          cropAspect={1}
          compressOptions={{
            maxSizeMB: 1,
            maxWidthOrHeight: 500,
            useWebWorker: true,
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <CustomPhotoCam
          label="Sello de Agua"
          onImage={(img) => {
            change("ciaselloagua", img ? img.base64Hex : null)
          }}
          initialImage={data?.ciaselloagua ? `data:image/jpeg;base64,${data.ciaselloagua}` : null}
          cropAspect={1}
          compressOptions={{
            maxSizeMB: 0.5,
            maxWidthOrHeight: 500,
            useWebWorker: true,
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
          Para Ingresar Facturas de Servicios de Proveedores en Lote con Pago por Cruce Contable
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Tipo Orden de Compra"
          name="ciatipoocfaclote"
          value={data.ciatipoocfaclote}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Cuenta Contable"
          name="ciactapagolote"
          value={data.ciactapagolote}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Código IVA Servicios"
          name="ciaivaservicio"
          value={data.ciaivaservicio}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
          Porcentaje de Retención por defecto al Facturar Crédito a Clientes
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field label="IVA" name="ciaporretiva" value={data.ciaporretiva} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="En la Fuente"
          name="ciaporretfuente"
          value={data.ciaporretfuente}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
          Parámetros para el proceso de Emisión de Documentos Electrónicos
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Imprime Cartera en RIDE Factura?"
          name="sricartera"
          value={data.sricartera}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
          checkedValue="S"
          uncheckedValue="N"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Envía copia de correo al remitente?"
          name="sricopiacorreo"
          value={data.sricopiacorreo}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
          checkedValue="S"
          uncheckedValue="N"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Imprime mensaje fijo en RIDE Factura?"
          name="srimensajefactura"
          value={data.srimensajefactura}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
          checkedValue="S"
          uncheckedValue="N"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Envía correo Microsoft 365"
          name="sricorreoffice"
          value={data.sricorreoffice}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
          checkedValue="S"
          uncheckedValue="N"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Imprime Empaques en RIDE Guía de Remisión"
          name="sriguia"
          value={data.sriguia}
          onChange={change}
          readOnly={readOnly}
          type="checkbox"
          checkedValue="S"
          uncheckedValue="N"
        />
      </Grid>
    </Section>
  )
}
