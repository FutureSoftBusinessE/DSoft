// Boolean fields that come from backend as numeric/text and should be 0 or -1
const BIT_FIELDS = new Set([
  "cliesfuncionario",
  "clienpolitica",
  "cliapliiva",
  "clibloqueo",
  "calificacion",
  "cliivaped",
  "clidemanda",
  "clicastigada",
  "cliparterel",
  "cliconespecial",
])

export const TIPOS_CLIENTE_LABEL_MAPPINGS = {
  clistatus: {
    A: "ACTIVA",
    I: "INACTIVA",
  },
}

const buildReverseMap = (fieldMapping) => {
  const reverse = {}
  Object.entries(fieldMapping).forEach(([rawValue, label]) => {
    if (!(label in reverse)) {
      reverse[label] = rawValue
    }
  })
  return reverse
}

export const getTiposClienteLabelValue = (fieldName, value) => {
  const map = TIPOS_CLIENTE_LABEL_MAPPINGS[fieldName]
  if (!map || value === undefined || value === null) return value

  const mapped = map[String(value)]
  return mapped ?? value
}

export const getTiposClienteRawValue = (fieldName, value) => {
  // Normalize BIT fields: 0 => 0, any non-zero => -1
  if (BIT_FIELDS.has(fieldName)) {
    const numVal = Number.parseFloat(value)
    if (!Number.isNaN(numVal)) {
      return numVal === 0 ? 0 : -1
    }
  }

  const map = TIPOS_CLIENTE_LABEL_MAPPINGS[fieldName]
  if (!map || value === undefined || value === null) return value

  const strValue = String(value)

  if (Object.prototype.hasOwnProperty.call(map, strValue)) {
    return strValue
  }

  const reverseMap = buildReverseMap(map)
  const raw = reverseMap[strValue]
  return raw === undefined ? value : raw
}

export const tiposClienteToDisplayLabels = (record = {}) => {
  const normalized = { ...record }
  Object.keys(TIPOS_CLIENTE_LABEL_MAPPINGS).forEach((field) => {
    if (field in normalized) {
      normalized[field] = getTiposClienteLabelValue(field, normalized[field])
    }
  })
  return normalized
}

// Mapea los descuentos de nombres de BD a nombres del frontend
const mapDescuentosLineas = (lineas = []) => {
  return lineas.map((linea) => ({
    linea: linea.lincodigo || "",
    descripcionLinea: linea.lindescri || "",
    tipo: linea.lintipo || "",
    marca: linea.marcodigo || "",
    descripcionMarca: linea.mardescri || "",
    porcentaje: linea.desporcentaje || "",
    listaPrecios: linea.deslistaprecio ? String(linea.deslistaprecio) : "",
    ciacodigo: linea.ciacodigo || "",
    clicodigo: linea.clicodigo || "",
  }))
}

const mapDescuentosArticulos = (articulos = []) => {
  return articulos.map((articulo) => ({
    articulo: articulo.artcodigo || "",
    descripcion: articulo.artdescri || "",
    porcentaje: articulo.desporcentaje || "",
    listaPrecios: articulo.deslistaprecio ? String(articulo.deslistaprecio) : "",
    invcodigo: articulo.invcodigo || "",
    ciacodigo: articulo.ciacodigo || "",
    clicodigo: articulo.clicodigo || "",
  }))
}

// Mapea agencias de nombres de BD a nombres del frontend
const mapAgenciasFromRaw = (agencias = []) => {
  return agencias.map((agencia) => {
    return {
      codigo: agencia.agencodigo || "",
      descripcion: agencia.agendescri || "",
      direccion: agencia.agendirec || "",
      telPref1: agencia.agentelpref1 || "",
      telefono1: agencia.agentelef1 || "",
      ext1: agencia.agentelext1 || "",
      telPref2: agencia.agentelpref2 || "",
      telefono2: agencia.agentelef2 || "",
      ext2: agencia.agentelext2 || "",
      email: agencia.agenemail || "",
      codigoExterno: agencia.agecodrelext || "",
      region: agencia.regcodigo || "",
      zona: agencia.zoncodigo || "",
      provincia: agencia.procodigo || "",
      ciudad: agencia.ciucodigo || "",
      ciacodigo: agencia.ciacodigo || "",
      clicodigo: agencia.clicodigo || "",
    }
  })
}

// Mapea agencias de nombres del frontend a nombres de BD
const mapAgenciasToRaw = (agencias = []) => {
  return agencias.map((agencia) => ({
    agencodigo: agencia.agencodigo || agencia.codigo || "",
    agendescri: agencia.agendescri || agencia.descripcion || "",
    agendirec: agencia.agendirec || agencia.direccion || "",
    agentelpref1: agencia.agentelpref1 || agencia.telPref1 || "",
    agentelef1: agencia.agentelef1 || agencia.telefono1 || "",
    agentelext1: agencia.agentelext1 || agencia.ext1 || "",
    agentelpref2: agencia.agentelpref2 || agencia.telPref2 || "",
    agentelef2: agencia.agentelef2 || agencia.telefono2 || "",
    agentelext2: agencia.agentelext2 || agencia.ext2 || "",
    agenemail: agencia.agenemail || agencia.email || "",
    agecodrelext: agencia.agecodrelext || agencia.codigoExterno || "",
    regcodigo: agencia.regcodigo || agencia.region || "",
    zoncodigo: agencia.zoncodigo || agencia.zona || "",
    procodigo: agencia.procodigo || agencia.provincia || "",
    ciucodigo: agencia.ciucodigo || agencia.ciudad || "",
    ciacodigo: agencia.ciacodigo || "",
    clicodigo: agencia.clicodigo || "",
  }))
}

// Mapea contactos de nombres de BD a nombres del frontend
const mapContactosFromRaw = (contactos = []) => {
  return contactos.map((contacto) => ({
    agencodigo: contacto.agencodigo || "",
    contacto: contacto.condescri || "",
    cargo: contacto.concargo || "",
    telPref1: contacto.contelpref1 || "",
    telefono1: contacto.contelef1 || "",
    ext1: contacto.contelext1 || "",
    telPref2: contacto.contelpref2 || "",
    telefono2: contacto.contelef2 || "",
    ext2: contacto.contelext2 || "",
    celular: contacto.concelular || "",
    email: contacto.conemail || "",
    area: contacto.areadescri || "",
    comentario: contacto.concomenta || "",
    valViaje: contacto.convalviaje || "",
    externo: contacto.concodrelext || "",
    ciacodigo: contacto.ciacodigo || "",
    clicodigo: contacto.clicodigo || "",
  }))
}

// Mapea contactos de nombres del frontend a nombres de BD
const mapContactosToRaw = (contactos = []) => {
  return contactos.map((contacto) => ({
    agencodigo: contacto.agencodigo || "",
    condescri: contacto.condescri || contacto.contacto || "",
    concargo: contacto.concargo || contacto.cargo || "",
    contelpref1: contacto.contelpref1 || contacto.telPref1 || "",
    contelef1: contacto.contelef1 || contacto.telefono1 || "",
    contelext1: contacto.contelext1 || contacto.ext1 || "",
    contelpref2: contacto.contelpref2 || contacto.telPref2 || "",
    contelef2: contacto.contelef2 || contacto.telefono2 || "",
    contelext2: contacto.contelext2 || contacto.ext2 || "",
    concelular: contacto.concelular || contacto.celular || "",
    conemail: contacto.conemail || contacto.email || "",
    areadescri: contacto.areadescri || contacto.area || "",
    concomenta: contacto.concomenta || contacto.comentario || "",
    concodrelext: contacto.concodrelext || contacto.externo || "",
    convalviaje: contacto.convalviaje ?? contacto.valViaje ?? 0,
    ciacodigo: contacto.ciacodigo || "",
    clicodigo: contacto.clicodigo || "",
  }))
}

const mapVendedores = (vendedores = []) => {
  return vendedores.map((vendedor) => ({
    codigo: vendedor.codigo || vendedor.vencodigo || "",
    nombre: vendedor.nombre || vendedor.vennombre || "",
    codLocalidad: vendedor.codLocalidad || vendedor.loccodigo || "",
    descLocalidad: vendedor.descLocalidad || vendedor.locdescri || "",
    local: vendedor.codLocalidad || vendedor.loccodigo || "",
  }))
}

const mapReferencias = (referencias = []) => {
  return referencias.map((referencia) => ({
    tipoCuenta: referencia.tipoCuenta || referencia.bcotipo || "",
    banco: referencia.descripcion || referencia.banco || "",
    codigo: referencia.codigo || referencia.bcocodigo || "",
    descripcion: referencia.descripcion || "",
    numero: referencia.numero || referencia.bconumcta || "",
    calificacion: referencia.calificacion || referencia.boccalifi || "",
    fechaApertura: referencia.fechaApertura || referencia.bcofecape || "",
  }))
}

const mapHistorial = (historial = []) => {
  return historial.map((item) => ({
    secuencia: item.obssecuen || item.secuencia || "",
    usuario: item.obsusuisys || item.usuario || "",
    fecha: item.obsfecisys || item.fecha || "",
    hora: item.obshorisys || item.hora || "",
    estacion: item.obsestisys || item.estacion || "",
    observacion: item.obsobserva || item.observacion || "",
    fechaRaw: item.obsfecisys || item.fechaRaw || "",
    horaRaw: item.obshorisys || item.horaRaw || "",
  }))
}

const mapAuditLog = (auditLog = []) => {
  return auditLog.map((item) => ({
    accion: item.cliaccion || item.accion || "",
    usuario: item.cliusumsys || item.usuario || "",
    fecha: item.clifecmsys || item.fecha || "",
    hora: item.clihormsys || item.hora || "",
    codigoCliente: item.clicodigo || item.codigoCliente || "",
    nombreCliente: item.clinombre || item.nombreCliente || "",
    tipoIdentificacion: item.cliidentifica || item.tipoIdentificacion || "",
    numeroIdentificacion: item.cliruc || item.numeroIdentificacion || "",
    diasCredito: item.clidiascrs || item.diasCredito || "",
    montoCredito: item.climontocrs || item.montoCredito || "",
  }))
}

export const tiposClienteToRawValues = (record = {}) => {
  const normalized = { ...record }
  Object.keys(TIPOS_CLIENTE_LABEL_MAPPINGS).forEach((field) => {
    if (field in normalized) {
      normalized[field] = getTiposClienteRawValue(field, normalized[field])
    }
  })

  // Mapea descuentos si existen
  if (normalized.descuentosLineas && Array.isArray(normalized.descuentosLineas)) {
    normalized.descuentosLineas = mapDescuentosLineas(normalized.descuentosLineas)
  }
  if (normalized.descuentosArticulos && Array.isArray(normalized.descuentosArticulos)) {
    normalized.descuentosArticulos = mapDescuentosArticulos(normalized.descuentosArticulos)
  }

  // Mapea agencias y contactos si existen (frontend -> DB)
  if (normalized.agencias && Array.isArray(normalized.agencias)) {
    normalized.agencias = mapAgenciasToRaw(normalized.agencias)
  }
  if (normalized.contactos && Array.isArray(normalized.contactos)) {
    normalized.contactos = mapContactosToRaw(normalized.contactos)
  }
  if (normalized.vendedores && Array.isArray(normalized.vendedores)) {
    normalized.vendedores = mapVendedores(normalized.vendedores)
  }
  if (normalized.refBancarias && Array.isArray(normalized.refBancarias)) {
    normalized.refBancarias = mapReferencias(normalized.refBancarias)
  }
  if (normalized.historial && Array.isArray(normalized.historial)) {
    normalized.historial = mapHistorial(normalized.historial)
  }
  if (normalized.auditLog && Array.isArray(normalized.auditLog)) {
    normalized.auditLog = mapAuditLog(normalized.auditLog)
  }

  return normalized
}

export const tiposClienteFromRawValues = (record = {}) => {
  const normalized = { ...record }

  if (normalized.agencias && Array.isArray(normalized.agencias)) {
    normalized.agencias = mapAgenciasFromRaw(normalized.agencias)
  }

  if (normalized.contactos && Array.isArray(normalized.contactos)) {
    normalized.contactos = mapContactosFromRaw(normalized.contactos)
  }

  return normalized
}
