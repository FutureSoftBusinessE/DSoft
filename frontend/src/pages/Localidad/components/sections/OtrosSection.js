import { Divider, Grid, Typography } from "@mui/material"

export default function OtrosSection({ data, change, readOnly, Field, Section, options }) {
  return (
    <Section title="Otros">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Parámetros Varios
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="(Días menos Fecha del Sistema) para evaluar el Cierre de Caja"
          name="clidiascrs"
          value={data.clidiascrs}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Fecha Inicio de Operaciones en los Módulos de FAC/CXC/INV"
          name="locfecinicxc"
          value={data.locfecinicxc}
          onChange={change}
          readOnly={readOnly}
          type="date"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Porcentaje para el Cálculo de Interés por Mora"
          name="locvalcupon"
          value={data.locvalcupon}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Días en que una Deuda pasa al Departamento Legal"
          name="climontocrs"
          value={data.climontocrs}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Parámetros internos para emitir GiftCard
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={8}>
        <Field
          label="Modo de uso GiftCard"
          name="locflagcupon"
          value={data.locflagcupon}
          onChange={change}
          readOnly={readOnly}
          type="radio"
          options={options.giftCardUseOptions}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Valor Mínimo"
          name="valorminimooc"
          value={data.valorminimooc}
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
      <Grid item xs={12} sm={4}>
        <Field
          label="Secuencia de Anticipo"
          name="secantoc"
          value={data.secantoc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Parámetros Internos para usos varios en Cuentas por Cobrar
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Secuencia de Nota/Débito"
          name="seqndref"
          value={data.seqndref}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Secuencia de Nota/Crédito por Monto"
          name="seqncmref"
          value={data.seqncmref}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Secuencia de Cobro para Aplicar N/C"
          name="seqcobref"
          value={data.seqcobref}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Servicio para Nota/Débito"
          name="serndref"
          value={data.serndref}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Servicio por Interés para Nota/Crédito"
          name="serncintref"
          value={data.serncintref}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Transacciones Bancarias para Liquidación
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="TB para Liquidar Caja Chica"
          name="tbliqcaja"
          value={data.tbliqcaja}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="TB para Liquidar Viáticos"
          name="tbliqviatico"
          value={data.tbliqviatico}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Banco para Liquidar Viáticos"
          name="bcoliqviatico"
          value={data.bcoliqviatico}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Field
          label="Bodega por Devolución en Notas de Crédito"
          name="repbodcod"
          value={data.repbodcod}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Tipo de N/C por Garantía para el Proveedor"
          name="tarserncrotdif"
          value={data.tarserncrotdif}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
    </Section>
  )
}
