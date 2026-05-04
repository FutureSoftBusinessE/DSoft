import { Divider, Grid, Typography } from "@mui/material"

export default function FacturacionSection({ data, change, readOnly, Field, Section, options }) {
  return (
    <Section title="Facturación">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Parámetros para Facturar
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Recargo Global por Servicio"
          name="fafaccob"
          value={data.fafaccob}
          onChange={change}
          readOnly={readOnly}
          type="radio"
          options={options.yesNoRadioOptions}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field label="Valor" name="famporser" value={data.famporser} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Modo"
          name="famrecporval"
          value={data.famrecporval}
          onChange={change}
          readOnly={readOnly}
          select
          options={options.recargoModeOptions}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Descuento Global"
          name="fadesglobal"
          value={data.fadesglobal}
          onChange={change}
          readOnly={readOnly}
          type="radio"
          options={options.yesNoRadioOptions}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Parámetros para la Emisión de Pedidos
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Inventario de Ventas"
          name="invcodpro"
          value={data.invcodpro}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Número de Items por Pedido"
          name="fanumlin"
          value={data.fanumlin}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Días de Vencimiento"
          name="diasvenoc"
          value={data.diasvenoc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Fecha de Vencimiento de Dividendos
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={8}>
        <Field
          label="Vencimiento"
          name="parfecven"
          value={data.parfecven}
          onChange={change}
          readOnly={readOnly}
          select
          options={options.vencimientoDividendoOptions}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Días de Vencimiento"
          name="pardiasven"
          value={data.pardiasven}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Transacciones de Inventarios
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo de Egreso al Generar una Factura"
          name="pacodegre"
          value={data.pacodegre}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Tipo de Ingreso al Anular una Factura"
          name="fatraanu"
          value={data.fatraanu}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Valores x defecto al crear Cliente en Facturación
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field label="Tipo Cliente" name="tipcodigo" value={data.tipcodigo} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field label="Región" name="regcodigo" value={data.regcodigo} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Act.Económica"
          name="activicodigo"
          value={data.activicodigo}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field label="Zona" name="zoncodigo" value={data.zoncodigo} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field label="Sector" name="sectorcodigo" value={data.sectorcodigo} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field label="Provincia" name="ciaprovincia" value={data.ciaprovincia} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field label="Vendedor" name="clivendedor" value={data.clivendedor} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field label="Cantón" name="parrocodigo" value={data.parrocodigo} onChange={change} readOnly={readOnly} />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Varios
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Código del Servicio de Transporte al Facturar"
          name="sercodigotransporte"
          value={data.sercodigotransporte}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Parámetros para envío de email con Documentos Electrónicos
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field label="Smtp" name="emailsmtp" value={data.emailsmtp} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={2}>
        <Field label="Puerto" name="emailmascara" value={data.emailmascara} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field label="email Salida" name="emailsalida" value={data.emailsalida} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field label="clave email" name="emailtema" value={data.emailtema} onChange={change} readOnly={readOnly} />
      </Grid>
      <Grid item xs={12} sm={8}>
        <Field
          label="Asunto email"
          name="emailsubject"
          value={data.emailsubject}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12}>
        <Field
          label="Mensaje adicional en el email"
          name="emailmensaje"
          value={data.emailmensaje}
          onChange={change}
          readOnly={readOnly}
          multiline
          rows={3}
        />
      </Grid>
    </Section>
  )
}
