import { Grid, Box, Divider, Typography } from "@mui/material"

// These will be provided by parent component with actual values from backend
const getDefaultOptions = (providedOptions) => ({
  identificacion: providedOptions?.tipoIdentificacion || [
    { value: "C", label: "Cédula de Identidad" },
    { value: "F", label: "Consumidor Final" },
    { value: "P", label: "Pasaporte" },
    { value: "R", label: "R.U.C." },
    { value: "O", label: "No Aplica" },
  ],
  tipoDomicilio: providedOptions?.tipoDomicilio || [
    { value: "P", label: "PROPIO" },
    { value: "A", label: "ARRIENDA" },
    { value: "F", label: "FAMILIAR" },
  ],
  envioEstado: providedOptions?.tipoEnvio || [
    { value: "D", label: "Domicilio" },
    { value: "O", label: "Oficina" },
    { value: "C", label: "Casilla" },
    { value: "F", label: "Fax" },
  ],
  estadoCivil: providedOptions?.estadoCivil || [
    { value: "SOLTERO", label: "SOLTERO" },
    { value: "CASADO", label: "CASADO" },
    { value: "UNION LIBRE", label: "UNION LIBRE" },
    { value: "VIUDO", label: "VIUDO" },
    { value: "DIVORCIADO", label: "DIVORCIADO" },
  ],
  diaPago: providedOptions?.diaPago || [
    { value: 1, label: "DOMINGO" },
    { value: 2, label: "LUNES" },
    { value: 3, label: "MARTES" },
    { value: 4, label: "MIERCOLES" },
    { value: 5, label: "JUEVES" },
    { value: 6, label: "VIERNES" },
    { value: 7, label: "SABADO" },
  ],
  origenIngresos: providedOptions?.origenIngresos || [
    { value: "B", label: "EMPLEADO PUBLICO" },
    { value: "V", label: "EMPLEADO PRIVADO" },
    { value: "I", label: "INDEPENDIENTE" },
    { value: "A", label: "AMA DE CASA O ESTUDIANTE" },
    { value: "R", label: "RENTISTA" },
    { value: "H", label: "JUBILADO" },
    { value: "M", label: "REMESAS DEL EXTERIOR" },
  ],
  prefijoTelefono: providedOptions?.prefijoTelefono || [
    { value: "", label: " ---- " },
    { value: "593", label: "+593" },
    { value: "591", label: "+591" },
    { value: "56", label: "+56" },
    { value: "51", label: "+51" },
    { value: "57", label: "+57" },
  ],
  sexo: providedOptions?.sexo || [
    { value: "M", label: "Masculino" },
    { value: "F", label: "Femenino" },
  ],
  persona: providedOptions?.persona || [
    { value: "N", label: "Natural" },
    { value: "J", label: "Jurídica" },
  ],
  tipoCliente: providedOptions?.tipoCliente || [],
  region: providedOptions?.region || [],
  zona: providedOptions?.zona || [],
  provincia: providedOptions?.provincia || [],
  ciudad: providedOptions?.ciudad || [],
  actividad: providedOptions?.actividad || [],
  sector: providedOptions?.sector || [],
  parroquia: providedOptions?.parroquia || [],
  usuario: providedOptions?.usuario || [],
  calificacion: providedOptions?.calificacion || [],
})

const GeneralesSection = ({ data, change, readOnly, errors, Field, Section, options, selectOptions = {} }) => {
  const opts = getDefaultOptions(selectOptions)

  return (
    <Section title="Generales">
      {/* Primera fila: Tipo Identificación / No Identificación / Estado / Nombre */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={2}>
          <Field
            label="Tipo Identificación"
            name="cliidentifica"
            value={data.cliidentifica}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.identificacion}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field label="Nº de Identificación" name="cliruc" value={data.cliruc} onChange={change} readOnly={readOnly} />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Estado"
            name="clistatus"
            value={data.clistatus}
            onChange={change}
            readOnly={readOnly || (data && data.cliaccion === "INSERT")}
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <Field label="Nombre" name="clinombre" value={data.clinombre} onChange={change} readOnly={readOnly} />
        </Grid>

        {/* Campos de domicilio y referencias */}
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" gap={2}>
            <Field
              label="Tipo de Domicilio"
              name="clitipodomicilio"
              value={data.clitipodomicilio}
              onChange={change}
              readOnly={readOnly}
              select
              options={opts.tipoDomicilio}
            />
            <Field
              label="Tiempo"
              name="clitiempodomicilio"
              value={data.clitiempodomicilio}
              onChange={change}
              readOnly={readOnly}
            />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Field
            label="Referencia rápido Ubicación"
            name="cliubicacionrapido"
            value={data.cliubicacionrapido}
            onChange={change}
            readOnly={readOnly}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <Field
            label="Dirección Domicilio"
            name="clidirec"
            value={data.clidirec}
            onChange={change}
            readOnly={readOnly}
            multiline
            rows={3}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Field
            label="Actividad R.U.C."
            name="activicodigo"
            value={data.activicodigo}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.actividad}
          />
        </Grid>

        {/* Teléfonos, Ext, Fax, Celular */}
        <Grid item xs={12} sm={2}>
          <Field
            label="Pref Tel 1"
            name="clitelpref1"
            value={data.clitelpref1}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.prefijoTelefono}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Nº de Teléfono1"
            name="clitelef1"
            value={data.clitelef1}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Ext"
            name="clitelext1"
            value={data.clitelext1}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.prefijoTelefono}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field label="Fax" name="clifax" value={data.clifax} onChange={change} readOnly={readOnly} />
        </Grid>

        <Grid item xs={12} sm={2}>
          <Field
            label="Pref Tel 2"
            name="clitelpref2"
            value={data.clitelpref2}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.prefijoTelefono}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Nº de Teléfono2"
            name="clitelef2"
            value={data.clitelef2}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Ext"
            name="clitelext2"
            value={data.clitelext2}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.prefijoTelefono}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Celular"
            name="clifonolabora"
            value={data.clifonolabora}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Field
            label="Apartado Postal"
            name="cliaparta"
            value={data.cliaparta}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Profesión"
            name="cliprofesion"
            value={data.cliprofesion}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Email"
            name="cliemail"
            value={data.cliemail}
            onChange={change}
            readOnly={readOnly}
            helperText="Múltiples emails separados por punto y coma (;)"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Field label="Web Site" name="website" value={data.website} onChange={change} readOnly={readOnly} />
        </Grid>

        <Grid item xs={12} sm={3}>
          <Field
            label="Tipo de Cliente"
            name="tipcodigo"
            value={data.tipcodigo}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.tipoCliente}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Fecha de Constitución ó Nacimiento"
            name="clifecnac"
            value={data.clifecnac}
            onChange={change}
            readOnly={readOnly}
            type="date"
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <Field
            label="Estado Civil"
            name="cliestciv"
            value={data.cliestciv}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.estadoCivil}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Sexo"
            name="clisexo"
            value={data.clisexo}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.sexo}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Field
            label="Persona"
            name="clipersona"
            value={data.clipersona}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.persona}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Field
            label="Origen de Ingresos"
            name="cliorigening"
            value={data.cliorigening}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.origenIngresos}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Field
            label="Día de Pago"
            name="clidiapago"
            value={data.clidiapago}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.diaPago}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Field
            label="Calificación"
            name="calificacion"
            value={data.calificacion}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.calificacion}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider />
          <Typography variant="subtitle2" color="primary">
            Datos del Representante Legal
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Field
            label="Representante Legal"
            name="clirepres"
            value={data.clirepres}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Tipo de Identificación"
            name="cliidenrep"
            value={data.cliidenrep}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.identificacion}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Nº de Identificación"
            name="clirucrepres"
            value={data.clirucrepres}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Field
            label="Agradeceré enviar mi estado de cuenta a"
            name="tarenviosta"
            value={data.tarenviosta}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.envioEstado}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Parte Relacionada"
            name="cliparterel"
            value={data.cliparterel}
            onChange={change}
            readOnly={readOnly}
            select
            options={[
              { value: 1, label: "SI" },
              { value: 0, label: "NO" },
            ]}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Contribuyente Especial"
            name="cliconespecial"
            value={data.cliconespecial}
            onChange={change}
            readOnly={readOnly}
            type="checkbox"
          />
        </Grid>

        <Grid item xs={12}>
          <Divider />
          <Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>
            Datos de Contacto de Emergencia / Cónyuge
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Field label="Nombre" name="clinombrecon" value={data.clinombrecon} onChange={change} readOnly={readOnly} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Tipo de Identificación"
            name="cliidencon"
            value={data.cliidencon}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.identificacion}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Nº de Identificación"
            name="cliruccon"
            value={data.cliruccon}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>

        <Grid item xs={12}>
          <Field
            label="Dirección"
            name="clidireccon"
            value={data.clidireccon}
            onChange={change}
            readOnly={readOnly}
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Field
            label="Profesión"
            name="cliprofesioncon"
            value={data.cliprofesioncon}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field label="Teléfono" name="clifonocon" value={data.clifonocon} onChange={change} readOnly={readOnly} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field label="Email" name="cliemailcon" value={data.cliemailcon} onChange={change} readOnly={readOnly} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Field
            label="Actividad"
            name="activicodigocon"
            value={data.activicodigocon}
            onChange={change}
            readOnly={readOnly}
            select
            options={opts.actividad}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field
            label="Institución (Si es funcionario público)"
            name="cliinstitfuncionario"
            value={data.cliinstitfuncionario}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Field
            label="Contacto Nombre"
            name="clicontactonombre"
            value={data.clicontactonombre}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field
            label="Contacto Email"
            name="clicontactoemail"
            value={data.clicontactoemail}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Field
            label="Teléfono que no labora"
            name="clifonolabora"
            value={data.clifonolabora}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field
            label="En Política"
            name="clienpolitica"
            value={data.clienpolitica}
            onChange={change}
            readOnly={readOnly}
            type="checkbox"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Field
            label="Partido Político"
            name="clipartidopolitico"
            value={data.clipartidopolitico}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field
            label="Fondo de Origen"
            name="clifondosorigen"
            value={data.clifondosorigen}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>

        <Grid item xs={12}>
          <Field
            label="Fondo de Destino"
            name="clifondosdestino"
            value={data.clifondosdestino}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
      </Grid>
    </Section>
  )
}

export default GeneralesSection
