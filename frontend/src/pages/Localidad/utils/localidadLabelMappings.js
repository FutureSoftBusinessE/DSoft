export const LOCALIDAD_LABEL_MAPPINGS = {
  locstatus: {
    A: "ACTIVA",
    I: "INACTIVA",
    N: "INACTIVA",
  },
  fafaccob: {
    0: "No",
    1: "Sí",
  },
  fadesglobal: {
    0: "No",
    1: "Sí",
  },
  famrecporval: {
    0: "Por Porcentaje",
    1: "Por Valor",
  },
  parfecven: {
    0: "Mismo día de emisión",
    1: "Calendario (30 días por mes)",
  },
  flagapruanti: {
    0: "No",
    1: "Sí",
  },
  presaplicaquin: {
    0: "No",
    1: "Sí",
  },
  presaplicamens: {
    0: "No",
    1: "Sí",
  },
  locflagcupon: {
    0: "Una sola compra",
    1: "Varias compras",
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

  if (Object.prototype.hasOwnProperty.call(map, "1") && Object.prototype.hasOwnProperty.call(map, "0")) {
    return value ? "1" : "0"
  }

  if (Object.prototype.hasOwnProperty.call(map, "S") && Object.prototype.hasOwnProperty.call(map, "N")) {
    return value ? "S" : "N"
  }

  return value
}

export const getLocalidadLabelValue = (fieldName, value) => {
  const map = LOCALIDAD_LABEL_MAPPINGS[fieldName]
  if (!map || value === undefined || value === null) return value

  const normalizedValue = normalizeBooleanForMap(map, value)
  const mapped = map[String(normalizedValue)]
  return mapped ?? value
}

export const getLocalidadRawValue = (fieldName, value) => {
  const map = LOCALIDAD_LABEL_MAPPINGS[fieldName]
  if (!map || value === undefined || value === null) return value

  const normalizedValue = normalizeBooleanForMap(map, value)
  const strValue = String(normalizedValue)

  if (Object.prototype.hasOwnProperty.call(map, strValue)) {
    return /^\d+$/.test(strValue) ? Number(strValue) : strValue
  }

  const reverseMap = buildReverseMap(map)
  const raw = reverseMap[strValue]
  if (raw === undefined) return value

  return /^\d+$/.test(raw) ? Number(raw) : raw
}

export const localidadToDisplayLabels = (record = {}) => {
  const normalized = { ...record }
  Object.keys(LOCALIDAD_LABEL_MAPPINGS).forEach((field) => {
    if (field in normalized) {
      normalized[field] = getLocalidadLabelValue(field, normalized[field])
    }
  })
  return normalized
}

export const localidadToRawValues = (record = {}) => {
  const normalized = { ...record }
  Object.keys(LOCALIDAD_LABEL_MAPPINGS).forEach((field) => {
    if (field in normalized) {
      normalized[field] = getLocalidadRawValue(field, normalized[field])
    }
  })
  return normalized
}
