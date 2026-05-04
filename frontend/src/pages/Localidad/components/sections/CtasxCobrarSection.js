import { Divider, Grid, Typography } from "@mui/material"

export default function CtasxCobrarSection({ data, change, readOnly, Field, Section }) {
  return (
    <Section title="CtasxCobrar">
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Parámetros para Procesos Internos
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={8}>
        <Field
          label="Forma de Pago para Nota de Débito Automática por Cobro con Tarjeta de Crédito"
          name="forpagnd"
          value={data.forpagnd}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Transacción Bancaria para Depósito por Recaudaciones (Cuadre de Cajas)"
          name="tracodingloc"
          value={data.tracodingloc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={8}>
        <Field
          label="Transacción Bancaria para Depósito de Anticipos por Transferencia"
          name="tarrecau"
          value={data.tarrecau}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Field
          label="Transacción de Ingreso a Inventarios por Nota de Crédito por Devolución"
          name="ciasecinvnc"
          value={data.ciasecinvnc}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Servicio para Nota de Débito Generada por Mora"
          name="ttrcodigo"
          value={data.ttrcodigo}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Servicio para Nota de Débito Generada por Cesión de Deuda"
          name="sercesion"
          value={data.sercesion}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Servicio para creación Automática de Tarjeta de Crédito retornada por POS"
          name="sertarpos"
          value={data.sertarpos}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Secuencias por Defecto en Procesos Internos para:
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Cobros Directos por Facturación"
          name="ciaseccobfac"
          value={data.ciaseccobfac}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Anticipo x Aplicación de Cheques PostFechados"
          name="tarsecant"
          value={data.tarsecant}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Cobros por Aplicación de Cheques PostFechados"
          name="tarseccob"
          value={data.tarseccob}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Notas de Crédito Migrada"
          name="secncmig"
          value={data.secncmig}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Nota/Débito Generada por Mora"
          name="seqcodigo"
          value={data.seqcodigo}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Notas de Débito Migrada"
          name="secndmig"
          value={data.secndmig}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="N/D Automática por Cobro con Tarjeta/Crédito"
          name="tarseqnd"
          value={data.tarseqnd}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Nota/Débito Generada por Cesión de Deuda"
          name="seqndref"
          value={data.seqndref}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Secuencias de Documentos Fiscales que conservarán CONTADORES al Generar Secuencias Anuales
        </Typography>
        <Divider sx={{ mt: 0.4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Nota de Débito Fiscal"
          name="ndfcodigo"
          value={data.ndfcodigo}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          label="Nota de Crédito Fiscal"
          name="ncfcodigo"
          value={data.ncfcodigo}
          onChange={change}
          readOnly={readOnly}
        />
      </Grid>
    </Section>
  )
}
