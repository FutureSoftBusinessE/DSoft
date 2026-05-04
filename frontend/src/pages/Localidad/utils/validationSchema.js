/**
 * Esquema de validación para Localidad
 * Basado en backend/app/Localidad/rutas/crearLocalidad.py
 */

export const REQUIRED_FIELDS = new Set(["ciacodigo", "loccodigo", "locdescri", "locstatus", "ciadirec", "locservidor"])

export const INTEGER_FIELDS = new Set([
  "fafaccob",
  "fadesglobal",
  "fanumlin",
  "famimpser",
  "famrecporval",
  "parfecven",
  "flagapruanti",
  "tarcanapligen",
  "tarcanapliart",
  "tardiasventrans",
  "presaplicaquin",
  "presaplicamens",
  "diasvenoc",
  "guianumlin",
  "locflagcupon",
  "clidiascrs",
])

export const DECIMAL_FIELDS = new Set([
  "famporser",
  "fampor1",
  "pardiasven",
  "propormano",
  "proporrepuesto",
  "paramval1",
  "paramval2",
  "paramval3",
  "paramval4",
  "paramval5",
  "paramval6",
  "tarvalcomigen",
  "tarvalcomiart",
  "valorminimooc",
  "locvalcupon",
  "climontocrs",
])

export const DATETIME_FIELDS = new Set([
  "locfecisys",
  "lochorisys",
  "locfecmsys",
  "lochormsys",
  "locfecinicxc",
  "feccorpedveh",
  "caducidadp12",
  "locfecinicupon",
  "locfecfincupon",
])

const DECIMAL_DEFINITIONS = {
  famporser: { precision: 18, scale: 2 },
  fampor1: { precision: 18, scale: 2 },
  pardiasven: { precision: 6, scale: 2 },
  propormano: { precision: 6, scale: 2 },
  proporrepuesto: { precision: 6, scale: 2 },
  paramval1: { precision: 16, scale: 2 },
  paramval2: { precision: 16, scale: 2 },
  paramval3: { precision: 16, scale: 2 },
  paramval4: { precision: 16, scale: 2 },
  paramval5: { precision: 16, scale: 2 },
  paramval6: { precision: 16, scale: 2 },
  tarvalcomigen: { precision: 12, scale: 2 },
  tarvalcomiart: { precision: 12, scale: 2 },
  valorminimooc: { precision: 18, scale: 2 },
  locvalcupon: { precision: 12, scale: 2 },
  climontocrs: { precision: 18, scale: 2 },
}

const FIELD_MAX_LENGTHS = {
  ciacodigo: 2,
  loccodigo: 2,
  locdescri: 200,
  locstatus: 1,
  locusuisys: 10,
  locusumsys: 10,
  ttrcodigo: 3,
  seqcodigo: 3,
  sercesion: 3,
  factippag: 3,
  secndmig: 3,
  secncmig: 3,
  ndfcodigo: 3,
  ciaruc: 15,
  ciadirec: 200,
  ciaciudad: 30,
  ciapais: 30,
  ciatelefono1: 15,
  ciatelefono2: 15,
  ciafax: 15,
  ciaemail: 70,
  ciaseccobfac: 3,
  ciaseccobdoc: 3,
  ciasecinvnc: 3,
  fatrainv: 3,
  fasumadesc: 1,
  fatraanu: 3,
  tipcodigo: 3,
  forpagnd: 3,
  vencodigo: 3,
  zoncodigo: 3,
  ncfcodigo: 3,
  repbodcod: 3,
  seqantdocgar: 3,
  cablin1: 80,
  cablin2: 80,
  cablin3: 80,
  cablin4: 80,
  pielin1: 80,
  pielin2: 80,
  pielin3: 80,
  pielin4: 80,
  unicodigo: 3,
  procodigo: 3,
  regcodigo: 3,
  bodcodpro: 3,
  invcodpro: 2,
  pacodingre: 3,
  pacodegre: 3,
  pacodingdev: 3,
  pacodegprest: 3,
  pacodinggar: 3,
  pacodegrgar: 3,
  pacodegrpro: 3,
  painvcodgar: 2,
  pabodcodgar: 3,
  seqcodigonc: 3,
  sercodigo: 3,
  tracodproing: 3,
  tracodproegr: 3,
  seqcodigondm: 3,
  sercodigondm: 3,
  invemiped: 2,
  forpagun: 3,
  cencosun: 30,
  tipordcom: 3,
  tipclipro: 3,
  probodcod: 3,
  tipordcomser: 3,
  seqndref: 3,
  seqncmref: 3,
  seqcobref: 3,
  serndref: 3,
  serncintref: 3,
  serncref: 3,
  paramcod1: 3,
  paramcod2: 3,
  paramcod3: 3,
  paramcod4: 3,
  paramcod5: 3,
  paramcod6: 3,
  tracodingloc: 3,
  clicodingprod: 6,
  procodingprod: 6,
  seqcesion: 3,
  ciaprovincia: 30,
  tarseqnd: 3,
  tarforpag: 3,
  tarser00: 3,
  tarrecau: 3,
  tarser01: 3,
  tarser02: 3,
  tarser03: 3,
  tarser04: 3,
  tarseqndint: 3,
  tarserint: 3,
  tarforpagint: 3,
  tarsecncrotdif: 3,
  tarserncrotdif: 3,
  tartiponccom: 3,
  tarsecncpuntos: 3,
  tarserncpuntos: 3,
  tarsecant: 3,
  tarseccob: 3,
  cjacodigonc: 3,
  emailsmtp: 100,
  emailmascara: 50,
  emailsalida: 100,
  emailtema: 50,
  locpathxml: 255,
  prescodigo: 3,
  prestipcliempl: 3,
  presseccobro: 3,
  pressecncmon: 3,
  presserncmon: 3,
  sertarpos: 3,
  tipoingoc: 3,
  tipoegroc: 3,
  secantoc: 3,
  locservidor: 1,
  locpathxmldocemitidos: 255,
  locpathxmldocanulados: 255,
  ciucodigo: 3,
  activicodigo: 3,
  sectorcodigo: 3,
  clivendedor: 3,
  tbliqcaja: 3,
  tbliqviatico: 3,
  traegrped: 3,
  traingped: 3,
  bcoliqviatico: 3,
  notapedido1: 1000,
  notapedido2: 1000,
  notaoc: 1000,
  invtrapresegr: 3,
  invtrapresing: 3,
  sercodigotransporte: 15,
  notacertificado: 1000,
  clavep12: 60,
  paramcoding: 3,
  paramtipond: 3,
  paramtiponc: 3,
  paramstnd: 2,
  paramstnc: 2,
  paramtcnd: 6,
  paramtcnc: 6,
  parambodingegr: 3,
  ctaivapagadobien: 30,
  ctaivapagadoserv: 30,
  emailsubject: 100,
  parrocodigo: 6,
}

const validateInteger = (value) => {
  if (value === null || value === undefined || value === "") return { valid: true, normalized: null }
  if (typeof value === "string" && !value.trim()) return { valid: true, normalized: null }

  const intValue = Number.parseInt(value, 10)
  if (Number.isNaN(intValue)) {
    return { valid: false, error: "Debe ser un número entero" }
  }

  if (intValue < -2147483648 || intValue > 2147483647) {
    return { valid: false, error: "Valor fuera de rango" }
  }

  return { valid: true, normalized: intValue }
}

const validateDecimal = (field, value) => {
  if (value === null || value === undefined || value === "") return { valid: true, normalized: null }
  if (typeof value === "string" && !value.trim()) return { valid: true, normalized: null }

  const numeric = Number.parseFloat(value)
  if (Number.isNaN(numeric)) {
    return { valid: false, error: "Debe ser un número decimal" }
  }

  const def = DECIMAL_DEFINITIONS[field]
  if (def) {
    const [integerPart = "", decimalPart = ""] = String(value).replace(/^-/, "").split(".")
    if (decimalPart.length > def.scale) {
      return { valid: false, error: "Formato decimal inválido" }
    }
    if (integerPart.length > def.precision - def.scale) {
      return { valid: false, error: "Formato decimal inválido" }
    }
  }

  return { valid: true, normalized: numeric }
}

const validateDate = (value) => {
  if (value === null || value === undefined || value === "") return { valid: true, normalized: null }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return { valid: false, error: "Fecha inválida" }
    return { valid: true, normalized: value.toISOString().split("T")[0] }
  }

  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) {
    return {
      valid: false,
      error: "Formato de fecha inválido (usa YYYY-MM-DD)",
    }
  }

  return { valid: true, normalized: parsed.toISOString().split("T")[0] }
}

const validateString = (field, value) => {
  if (value === null || value === undefined) return { valid: true, normalized: null }
  const normalized = String(value).trim()
  const maxLength = FIELD_MAX_LENGTHS[field]

  if (maxLength && normalized.length > maxLength) {
    return {
      valid: false,
      error: `Máximo ${maxLength} caracteres (tienes ${normalized.length})`,
    }
  }

  return { valid: true, normalized }
}

// Campos de email que requieren validación
const EMAIL_FIELDS = new Set(["ciaemail", "emailsmtp", "emailsalida"])

const validateEmail = (field, value) => {
  if (value === null || value === undefined || value === "") return { valid: true, normalized: null }
  const strVal = String(value).trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(strVal)) {
    return { valid: false, error: "Formato de email inválido" }
  }

  const maxLength = FIELD_MAX_LENGTHS[field]
  if (maxLength && strVal.length > maxLength) {
    return { valid: false, error: `Máximo ${maxLength} caracteres (tienes ${strVal.length})` }
  }

  return { valid: true, normalized: strVal }
}

export const validateFormData = (formData = {}) => {
  const errors = {}
  const normalized = { ...formData }

  Object.entries(formData).forEach(([field, value]) => {
    let validation = { valid: true, normalized: value }

    if (EMAIL_FIELDS.has(field)) {
      validation = validateEmail(field, value)
    } else if (INTEGER_FIELDS.has(field)) {
      validation = validateInteger(value)
    } else if (DECIMAL_FIELDS.has(field)) {
      validation = validateDecimal(field, value)
    } else if (DATETIME_FIELDS.has(field)) {
      validation = validateDate(value)
    } else {
      validation = validateString(field, value)
    }

    if (!validation.valid) {
      errors[field] = validation.error
    } else {
      normalized[field] = validation.normalized
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalized,
  }
}
