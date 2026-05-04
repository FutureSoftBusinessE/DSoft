export const COMPANIA_LABEL_MAPPINGS = {
  ciastatus: {
    A: "ACTIVA",
    I: "INACTIVA",
    N: "INACTIVA",
  },
  ciaambienteelectronica: {
    0: "Pruebas",
    1: "Producción",
    2: "Producción",
  },
  ciaescontesp: {
    0: "No",
    1: "Sí",
  },
  srimicroempresa: {
    N: "No",
    S: "Sí",
    0: "No",
    1: "Sí",
  },
  sricartera: {
    N: "No",
    S: "Sí",
    0: "No",
    1: "Sí",
  },
  sriguia: {
    N: "No",
    S: "Sí",
    0: "No",
    1: "Sí",
  },
  sriagenteretencion: {
    N: "No",
    S: "Sí",
    0: "No",
    1: "Sí",
  },
  sricorreoffice: {
    N: "No",
    S: "Sí",
    0: "No",
    1: "Sí",
  },
  sricopiacorreo: {
    N: "No",
    S: "Sí",
    0: "No",
    1: "Sí",
  },
  srimensajefactura: {
    N: "No",
    S: "Sí",
    0: "No",
    1: "Sí",
  },
  srissltls: {
    N: "No",
    S: "Sí",
    0: "No",
    1: "Sí",
  },
  ciapropina: {
    0: "No",
    1: "Sí",
  },
  ciacontabilidad: {
    0: "No",
    1: "Sí",
  },
  ciaaaoclocal: {
    0: "ESPERA",
    1: "PENDIENTE",
    2: "APROBADA",
  },
  ciaaaocimport: {
    0: "ESPERA",
    1: "PENDIENTE",
    2: "APROBADA",
  },
  ciaaaocserv: {
    0: "ESPERA",
    1: "PENDIENTE",
    2: "APROBADA",
  },
  ciaaaocliqcomloc: {
    0: "ESPERA",
    1: "PENDIENTE",
    2: "APROBADA",
  },
  ciaaaocliqcomimp: {
    0: "ESPERA",
    1: "PENDIENTE",
    2: "APROBADA",
  },
  ciaaaocliqcomser: {
    0: "ESPERA",
    1: "PENDIENTE",
    2: "APROBADA",
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

const normalizeBooleanForMap = (map, value) => {
  if (typeof value !== "boolean") return value

  // Prefer numeric keys for bit/int-like fields
  if (Object.prototype.hasOwnProperty.call(map, "1") && Object.prototype.hasOwnProperty.call(map, "0")) {
    return value ? "1" : "0"
  }

  // Fallback to S/N style fields
  if (Object.prototype.hasOwnProperty.call(map, "S") && Object.prototype.hasOwnProperty.call(map, "N")) {
    return value ? "S" : "N"
  }

  return value
}

export const getCompaniaLabelValue = (fieldName, value) => {
  const map = COMPANIA_LABEL_MAPPINGS[fieldName]
  if (!map || value === undefined || value === null) return value

  const normalizedValue = normalizeBooleanForMap(map, value)
  const mapped = map[String(normalizedValue)]
  return mapped ?? value
}

export const getCompaniaRawValue = (fieldName, value) => {
  const map = COMPANIA_LABEL_MAPPINGS[fieldName]
  if (!map || value === undefined || value === null) return value

  const normalizedValue = normalizeBooleanForMap(map, value)

  const strValue = String(normalizedValue)

  // If already raw key, keep original value as-is
  if (Object.prototype.hasOwnProperty.call(map, strValue)) {
    return /^\d+$/.test(strValue) ? Number(strValue) : strValue
  }

  const reverseMap = buildReverseMap(map)
  const raw = reverseMap[strValue]
  if (raw === undefined) return value

  // Keep numeric mappings as numbers when possible
  return /^\d+$/.test(raw) ? Number(raw) : raw
}

export const companiaToDisplayLabels = (record = {}) => {
  const normalized = { ...record }
  Object.keys(COMPANIA_LABEL_MAPPINGS).forEach((field) => {
    if (field in normalized) {
      normalized[field] = getCompaniaLabelValue(field, normalized[field])
    }
  })
  return normalized
}

export const companiaToRawValues = (record = {}) => {
  const normalized = { ...record }
  Object.keys(COMPANIA_LABEL_MAPPINGS).forEach((field) => {
    if (field in normalized) {
      normalized[field] = getCompaniaRawValue(field, normalized[field])
    }
  })
  return normalized
}
