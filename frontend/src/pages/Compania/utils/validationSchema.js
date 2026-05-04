/**
 * Esquema de validación para Compañía
 * Basado en backend/app/Compania/rutas/crearCompania.py
 */

export const REQUIRED_FIELDS = new Set(["ciacodigo", "ciadescri", "ciadirec", "ciasrirazon"])

export const INTEGER_FIELDS = new Set([
  "ciaanioejer",
  "cianivelescc",
  "cianiveleslin",
  "cianivelespre",
  "cianivelescta",
  "aplitransing",
  "apliserie",
  "codclisec",
  "codprosec",
  "codartsec",
  "ciaactualizaprecios",
  "ciarecsalmen",
  "ciaanioinicon",
  "ciadiasnc",
  "ciavalprecost",
  "ciaambienteelectronica",
  "ciasecuenemple",
  "ciasecuencargo",
  "ciasolautfactcxp",
  "ciaaproautfactcxp",
  "ciasolautanticxp",
  "ciaaproautanticxp",
  "ciasolautpagocxp",
  "ciaaproautpagocxp",
  "ciaaaocimport",
  "ciaaaocserv",
  "ciaaaocgasta",
  "ciaaaoclocal",
  "ciaaaocgastasoc",
  "ciafacitemrep",
  "ciasolautclcxp",
  "ciaaproautclcxp",
  "ciaivaporproducto",
  "ciafacDeVariosLoc",
  "cialistprecdefweb",
  "ciavalidaemp",
  "ciaaaocliqcomloc",
  "ciaaaocliqcomimp",
  "ciaaaocliqcomser",
  "ciaaaocppe",
  "ciacobrapuntos",
  "ciacobracupos",
  "ciacobrafundacion",
  "ciancbeneficiario",
  "ciainmobiliaria",
  "ciancdevcxccia",
  "CiaNivelOrg",
  "cianumvend",
])

export const DECIMAL_FIELDS = new Set([
  "ciaporretiva",
  "ciaporretfuente",
  "ciabasepuntos",
  "ciasecuencliente",
  "ciasecuenproveedor",
  "ciasecuenartventa",
  "ciasecuenarticulo",
  "ciadiasretencion",
  "ciadiasemitirretencion",
])

export const BIT_FIELDS = new Set(["ciapropina", "ciacontabilidad"])

export const DATETIME_FIELDS = new Set([
  "ciafecminacc",
  "ciafecinipre",
  "ciafecresolucion",
  "versionfac",
  "versionpdf",
  "srioffini",
  "sriofffin",
])

const FIELD_MAX_LENGTHS = {
  ciacodigo: 2,
  ciadescri: 200,
  ciadirec: 200,
  ciasrirazon: 200,
  ciaalias: 30,
  ciaruc: 15,
  ciafax: 15,
  ciatelefono1: 15,
  ciatelefono2: 15,
  ciacontador: 35,
  ciagerente: 35,
  ciapresidente: 35,
  ciavigilancia: 35,
  ciaciudad: 30,
  ciapais: 30,
  ciaemail: 70,
  ciaweb: 70,
  ciasrifono: 9,
  ciasrifax: 9,
  ciasriemail: 60,
  ciasriruccontador: 13,
  ciatipoidengerente: 1,
  ciasridirmatriz: 60,
  ciasridocautventas: 2,
  ciasrinotdebventas: 2,
  ciasrinotcreventas: 2,
  ciasriretfueventas: 5,
  ciacodlocmatriz: 2,
  coscodigo: 30,
  cianumresolucion: 10,
  ciafororg: 30,
  ciaforcencos: 30,
  ciaforlin: 30,
  ciaregcont: 10,
  ciastatus: 1,
  ciahelpart: 1,
  ciacantfor: 20,
  ciacostfor: 20,
  ciaforcta: 40,
  ciaforpre: 30,
  ciasecuentarjeta: 7,
  sriagenteretencionnumres: 25,
  ciaetiquetaadiret: 300,
  ciavaloradiret: 300,
  ciactapagolote: 30,
  ciatipoocfaclote: 3,
  ciaivaservicio: 3,
  ciafacelectronica: 50,
  ciapdfelectronica: 50,
  ciaauxcredito: 35,
  ciacedgerente: 10,
  ciausuisys: 10,
  ciausumsys: 10,
}

/**
 * Valida y normaliza un valor entero
 */
export function validateInteger(field, value) {
  if (value === null || value === undefined || value === "") {
    return { valid: true, normalized: null }
  }

  const strVal = String(value).trim()

  // Verificar que sea solo dígitos (con posible signo negativo)
  if (!/^-?\d+$/.test(strVal)) {
    return {
      valid: false,
      error: "Debe ser un número entero",
    }
  }

  try {
    const intVal = parseInt(strVal, 10)
    // SQL Server INT range: -2,147,483,648 to 2,147,483,647
    if (intVal < -2147483648 || intVal > 2147483647) {
      return {
        valid: false,
        error: "Valor fuera de rango",
      }
    }
    return { valid: true, normalized: intVal }
  } catch {
    return {
      valid: false,
      error: "Debe ser un número entero",
    }
  }
}

/**
 * Valida y normaliza un valor decimal
 */
export function validateDecimal(field, value) {
  if (value === null || value === undefined || value === "") {
    return { valid: true, normalized: null }
  }

  const strVal = String(value).trim()

  // Verificar que sea un número válido (incluye decimales y notación científica)
  if (!/^-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(strVal)) {
    return {
      valid: false,
      error: "Debe ser un número decimal",
    }
  }

  try {
    const decimalVal = parseFloat(strVal)
    if (isNaN(decimalVal)) {
      return {
        valid: false,
        error: "Debe ser un número decimal",
      }
    }
    return { valid: true, normalized: decimalVal }
  } catch {
    return {
      valid: false,
      error: "Debe ser un número decimal",
    }
  }
}

/**
 * Valida y normaliza un valor bit (booleano)
 */
export function validateBit(field, value) {
  if (value === null || value === undefined || value === "") {
    return { valid: true, normalized: 0 }
  }

  if (typeof value === "boolean") {
    return { valid: true, normalized: value ? -1 : 0 }
  }

  if (typeof value === "number") {
    return { valid: true, normalized: value === 0 ? 0 : -1 }
  }

  if (typeof value === "string") {
    const upper = value.toUpperCase().trim()
    const numericValue = Number.parseFloat(value)
    if (!Number.isNaN(numericValue)) {
      return { valid: true, normalized: numericValue === 0 ? 0 : -1 }
    }
    if (["1", "TRUE", "YES", "S", "SI"].includes(upper)) {
      return { valid: true, normalized: -1 }
    }
    if (["0", "FALSE", "NO", "N"].includes(upper)) {
      return { valid: true, normalized: 0 }
    }
  }

  return {
    valid: false,
    error: "Debe ser sí/no (S/N)",
  }
}

/**
 * Valida y normaliza una fecha ISO (YYYY-MM-DD)
 */
export function validateDate(field, value) {
  if (value === null || value === undefined || value === "") {
    return { valid: true, normalized: null }
  }

  // Si es Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return { valid: false, error: "Fecha inválida" }
    }
    return {
      valid: true,
      normalized: value.toISOString().split("T")[0],
    }
  }

  // Si es string
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) {
      return { valid: true, normalized: null }
    }

    // Validar formato ISO YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) {
      const [, year, month, day] = isoMatch
      const monthNum = parseInt(month, 10)
      const dayNum = parseInt(day, 10)

      if (monthNum < 1 || monthNum > 12) {
        return { valid: false, error: "Mes inválido" }
      }
      if (dayNum < 1 || dayNum > 31) {
        return { valid: false, error: "Día inválido" }
      }

      return { valid: true, normalized: `${year}-${month}-${day}` }
    }

    // Intentar parsear como Date
    try {
      const date = new Date(trimmed)
      if (isNaN(date.getTime())) {
        return {
          valid: false,
          error: "Formato de fecha inválido (usa YYYY-MM-DD)",
        }
      }
      return {
        valid: true,
        normalized: date.toISOString().split("T")[0],
      }
    } catch {
      return {
        valid: false,
        error: "Formato de fecha inválido (usa YYYY-MM-DD)",
      }
    }
  }

  return {
    valid: false,
    error: `Tipo de dato inválido para fecha`,
  }
}

/**
 * Valida y normaliza un string
 */
export function validateString(field, value) {
  if (value === null || value === undefined) {
    return { valid: true, normalized: null }
  }

  if (value === "") {
    return { valid: true, normalized: "" }
  }

  const strVal = String(value).trim()
  const maxLen = FIELD_MAX_LENGTHS[field]

  if (maxLen && strVal.length > maxLen) {
    return {
      valid: false,
      error: `Máximo ${maxLen} caracteres (tienes ${strVal.length})`,
    }
  }

  return { valid: true, normalized: strVal }
}

// Campos de email que requieren validación
export const EMAIL_FIELDS = new Set(["ciaemail", "ciasriemail"])

/**
 * Valida formato de email
 */
export function validateEmail(field, value) {
  if (value === null || value === undefined || value === "") {
    return { valid: true, normalized: null }
  }

  const strVal = String(value).trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(strVal)) {
    return { valid: false, error: "Formato de email inválido" }
  }

  const maxLen = FIELD_MAX_LENGTHS[field]
  if (maxLen && strVal.length > maxLen) {
    return {
      valid: false,
      error: `Máximo ${maxLen} caracteres (tienes ${strVal.length})`,
    }
  }

  return { valid: true, normalized: strVal }
}

/**
 * Valida todos los campos del formulario
 * Retorna { isValid: boolean, errors: { field: error } }
 */
export function validateFormData(formData, labelToFieldMap = {}) {
  const errors = {}
  const normalized = {}

  for (const [field, value] of Object.entries(formData)) {
    let validation

    if (EMAIL_FIELDS.has(field)) {
      validation = validateEmail(field, value)
    } else if (INTEGER_FIELDS.has(field)) {
      validation = validateInteger(field, value)
    } else if (DECIMAL_FIELDS.has(field)) {
      validation = validateDecimal(field, value)
    } else if (BIT_FIELDS.has(field)) {
      validation = validateBit(field, value)
    } else if (DATETIME_FIELDS.has(field)) {
      validation = validateDate(field, value)
    } else if (FIELD_MAX_LENGTHS[field]) {
      validation = validateString(field, value)
    } else {
      // Campo no validado
      validation = { valid: true, normalized: value }
    }

    if (!validation.valid) {
      errors[field] = validation.error
    } else {
      normalized[field] = validation.normalized
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalized,
  }
}
