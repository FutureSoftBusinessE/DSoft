export const INTEGER_FIELDS = new Set([
  "clidiascrs", // Credit days
  "cliprefac", // Preferred list
  "clidiascrd", // Credit days debit
  "clidiapago", // Payment day
  "clidiasrecibefac1", // Invoice receive days 1
  "clidiaentregafac", // Invoice delivery days
  "clicuotaven", // Pending quotas count
  "cliconespecial", // Special contract
])

export const DECIMAL_FIELDS = new Set([
  "climontocrs", // Credit mount
  "clisalaplis", // Salary applicable
  "climontocrd", // Credit amount debit
  "clisalaplid", // Salary applicable debit
  "cliactivos", // Assets
  "clipasivos", // Liabilities
  "cliingresos", // Income
  "cliegresos", // Expenses
  "clipatrimonioneto", // Net worth
])

export const BIT_FIELDS = new Set([
  "cliesfuncionario",
  "clienpolitica",
  "cliapliiva", // Apply IVA
  "clibloqueo", // Blocked
  "calificacion", // Qualification
  "cliivaped", // IVA requested
  "clidemanda", // Lawsuit
  "clicastigada", // Punished
  "cliparterel", // Related party
])

export const DATETIME_FIELDS = new Set([
  "clifecisys",
  "clihorisys",
  "clifecmsys",
  "clihormsys",
  "clifecnac",
  "fecenvioxml",
  "clihorapagodesde",
  "clihorapagohasta",
])

export const STRING_FIELDS = new Set([
  "cliaccion",
  "ciacodigo",
  "clicodigo",
  "clinombre",
  "cliaparta",
  "cliruc",
  "clidirec",
  "clirepres",
  "clitelef1",
  "clitelef2",
  "clifax",
  "clistatus",
  "zoncodigo",
  "regcodigo",
  "procodigo",
  "cliestciv",
  "tipcodigo",
  "cliobserva",
  "cliemail",
  "calificacion",
  "website",
  "clidirec2",
  "ciucodigo",
  "usrcodigo",
  "clirucmatriz",
  "clinommatriz",
  "cliintersec",
  "clinumestable",
  "tarenviosta",
  "clirucrepres",
  "cliidentifica",
  "cliidenrep",
  "activicodigo",
  "sectorcodigo",
  "cliestisys",
  "cliestmsys",
  "clitelpref1",
  "clitelext1",
  "clisexo",
  "clipersona",
  "cliorigening",
  "parrocodigo",
  "clifonorepres",
  "clidirecrepres",
  "cliemailrepres",
  "apocodigo",
  "clinombrecon",
  "clidireccon",
  "cliprofesioncon",
  "clifonocon",
  "cliemailcon",
  "activicodigocon",
  "cliinstitfuncionario",
  "clipartidopolitico",
  "clifondosorigen",
  "clifondosdestino",
  "clicontactonombre",
  "clicontactoemail",
  "clifonolabora",
  "clicertvotacion",
  "cliidencon",
  "clitelext2",
  "clitelpref2",
  "cliruccon",
])

const FIELD_MAX_LENGTHS = {
  cliaccion: 6,
  ciacodigo: 2,
  clicodigo: 6,
  clinombre: 200,
  cliaparta: 40,
  cliruc: 15,
  clidirec: 200,
  clirepres: 60,
  clitelef1: 15,
  clitelef2: 15,
  clifax: 15,
  clistatus: 1,
  zoncodigo: 3,
  regcodigo: 3,
  procodigo: 3,
  cliestciv: 15,
  tipcodigo: 3,
  cliobserva: 4500,
  cliemail: 100,
  calificacion: 1,
  website: 100,
  clidirec2: 150,
  ciucodigo: 3,
  usrcodigo: 10,
  clirucmatriz: 15,
  clinommatriz: 200,
  cliintersec: 60,
  clinumestable: 10,
  tarenviosta: 1,
  clirucrepres: 15,
  cliidentifica: 1,
  cliidenrep: 1,
  activicodigo: 3,
  sectorcodigo: 3,
  cliestisys: 40,
  cliestmsys: 40,
  clitelpref1: 5,
  clitelext1: 5,
  clisexo: 1,
  clipersona: 1,
  cliorigening: 1,
  parrocodigo: 6,
  clifonorepres: 15,
  clidirecrepres: 100,
  cliemailrepres: 100,
  apocodigo: 255,
  clinombrecon: 60,
  clidireccon: 100,
  cliprofesioncon: 40,
  clifonocon: 15,
  cliemailcon: 100,
  activicodigocon: 3,
  cliinstitfuncionario: 100,
  clipartidopolitico: 100,
  clifondosorigen: 100,
  clifondosdestino: 100,
  clicontactonombre: 200,
  clicontactoemail: 100,
  clifonolabora: 15,
  clicertvotacion: 20,
  cliidencon: 1,
  clitelext2: 5,
  clitelpref2: 5,
  cliruccon: 15,
}

export const REQUIRED_FIELDS = new Set(["ciacodigo", "clicodigo", "clinombre", "clidirec"])

// Mapeo de nombres técnicos a nombres legibles para mensajes de error
export const FIELD_LABELS = {
  ciacodigo: "Código de Compañía",
  clicodigo: "Código de Cliente",
  clinombre: "Nombre del Cliente",
  clidirec: "Dirección del Cliente",
  cliemail: "Email",
  ciucodigo: "Ciudad",
  regional: "Regional",
  provincia: "Provincia",
  parroquia: "Parroquia",
}

export function validateInteger(_field, value) {
  if (value === null || value === undefined || value === "") {
    return { valid: true, normalized: 0 } // Empty integer field = 0
  }

  const intVal = Number.parseInt(value, 10)
  if (Number.isNaN(intVal)) {
    return {
      valid: false,
      error: "Debe ser un número entero",
    }
  }

  if (intVal < -2147483648 || intVal > 2147483647) {
    return {
      valid: false,
      error: "Valor fuera de rango",
    }
  }

  return { valid: true, normalized: intVal }
}

export function validateDecimal(_field, value) {
  if (value === null || value === undefined || value === "") {
    return { valid: true, normalized: 0 } // Empty decimal field = 0
  }

  const decimalVal = Number.parseFloat(value)
  if (Number.isNaN(decimalVal)) {
    return {
      valid: false,
      error: "Debe ser un número decimal",
    }
  }

  return { valid: true, normalized: decimalVal }
}

export function validateBit(_field, value) {
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

    // Handle numeric strings like "0.00", "1.00", etc.
    const numVal = Number.parseFloat(value)
    if (!Number.isNaN(numVal)) {
      return { valid: true, normalized: numVal === 0 ? 0 : -1 }
    }

    // Handle text values
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

export function validateDate(_field, value) {
  if (value === null || value === undefined || value === "") {
    return { valid: true, normalized: null } // Empty date is allowed
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return { valid: false, error: "Fecha inválida" }
    }
    return { valid: true, normalized: value.toISOString().split("T")[0] }
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return { valid: true, normalized: null }

    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) {
      const [, year, month, day] = isoMatch
      const testDate = new Date(Number(year), Number(month) - 1, Number(day))
      if (Number.isNaN(testDate.getTime())) {
        return { valid: false, error: "Fecha inválida" }
      }
      return { valid: true, normalized: `${year}-${month}-${day}` }
    }

    const date = new Date(trimmed)
    if (Number.isNaN(date.getTime())) {
      return { valid: false, error: "Formato de fecha inválido (usa YYYY-MM-DD)" }
    }
    return { valid: true, normalized: date.toISOString().split("T")[0] }
  }

  return { valid: false, error: "Formato de fecha inválido (usa YYYY-MM-DD)" }
}

export function validateString(field, value) {
  if (value === null || value === undefined) {
    return { valid: true, normalized: "" }
  }

  const stringValue = String(value)
  const maxLength = FIELD_MAX_LENGTHS[field]

  if (maxLength && stringValue.length > maxLength) {
    return {
      valid: false,
      error: `Máximo ${maxLength} caracteres (tienes ${stringValue.length})`,
    }
  }

  return { valid: true, normalized: stringValue }
}

export const validateFormData = (formData = {}, selectOptions = {}) => {
  const errors = {}
  const normalized = { ...formData }

  // PASO 1: Validar SOLO los campos requeridos (deben estar no vacíos)
  REQUIRED_FIELDS.forEach((field) => {
    const value = normalized[field]
    if (value === null || value === undefined || String(value).trim() === "") {
      const label = FIELD_LABELS[field] || field
      errors[field] = `${label} es requerido`
    }
  })

  // PASO 2: Validar tipos SOLO si el campo tiene valor Y no hay error ya
  // Un campo vacío es permitido (excepto los requeridos validados arriba)
  Object.keys(normalized).forEach((field) => {
    const value = normalized[field]

    // Saltar si ya tiene error
    if (errors[field]) return

    // Saltar si el valor es vacío (permitido para campos no requeridos)
    if (value === null || value === undefined || value === "") {
      normalized[field] = value
      return
    }

    // Solo validar tipo si tenemos valor
    let result = { valid: true, normalized: value }

    if (INTEGER_FIELDS.has(field)) {
      result = validateInteger(field, value)
    } else if (DECIMAL_FIELDS.has(field)) {
      result = validateDecimal(field, value)
    } else if (BIT_FIELDS.has(field)) {
      result = validateBit(field, value)
    } else if (DATETIME_FIELDS.has(field)) {
      result = validateDate(field, value)
    } else if (STRING_FIELDS.has(field) || FIELD_MAX_LENGTHS[field]) {
      result = validateString(field, value)
    }

    if (!result.valid) {
      errors[field] = result.error
      return
    }

    normalized[field] = result.normalized
  })

  // PASO 3: Validar email SOLO si tiene valor
  if (normalized.cliemail && String(normalized.cliemail).trim()) {
    // Permitir múltiples emails separados por punto y coma ';'
    const raw = String(normalized.cliemail)
    const parts = raw
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalid = parts.find((p) => !emailRegex.test(p))
    if (invalid) {
      errors.cliemail = `Email inválido: ${invalid}`
    }
  }

  // PASO 4: Validar agencias (si existen) contra las opciones de región
  try {
    const regionOptions = Array.isArray(selectOptions?.region) ? selectOptions.region : []
    const validRegions = new Set(regionOptions.map((r) => String(r.value)))

    const agencias = normalized.agencias || []
    if (Array.isArray(agencias) && agencias.length > 0) {
      const agenciasErrors = []
      for (let i = 0; i < agencias.length; i++) {
        const ag = agencias[i] || {}
        const regcodigo = String(ag.regcodigo || ag.region || "").trim()
        if (!regcodigo) {
          agenciasErrors.push(`Agencia ${i + 1}: región (regcodigo) es requerida`)
        } else if (validRegions.size > 0 && !validRegions.has(regcodigo)) {
          agenciasErrors.push(`Agencia ${i + 1}: región "${regcodigo}" no pertenece a la compañía`)
        }
      }
      if (agenciasErrors.length > 0) {
        errors.agencias = agenciasErrors.join(" | ")
      }
    }
  } catch (e) {
    console.error("validateFormData: error validating agencias", e)
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalized,
  }
}
