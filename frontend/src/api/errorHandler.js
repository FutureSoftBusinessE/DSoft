// Códigos de error estandarizados
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  CONFLICT_ERROR: "CONFLICT_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  INTERNAL_SERVER_ERROR_DEBUG: "INTERNAL_SERVER_ERROR_DEBUG",
}

// Cómo mostrar cada tipo de error
export const ERROR_DISPLAY_TYPES = {
  TOAST: "toast",
  MODAL: "modal",
  INLINE: "inline",
  SILENT: "silent",
}

// Mapeo automático de error → cómo mostrarlo
const ERROR_DISPLAY_MAP = {
  [ERROR_CODES.VALIDATION_ERROR]: ERROR_DISPLAY_TYPES.MODAL,
  [ERROR_CODES.AUTHENTICATION_ERROR]: ERROR_DISPLAY_TYPES.MODAL,
  [ERROR_CODES.AUTHORIZATION_ERROR]: ERROR_DISPLAY_TYPES.MODAL,
  [ERROR_CODES.NOT_FOUND_ERROR]: ERROR_DISPLAY_TYPES.MODAL,
  [ERROR_CODES.CONFLICT_ERROR]: ERROR_DISPLAY_TYPES.MODAL,
  [ERROR_CODES.RATE_LIMIT_ERROR]: ERROR_DISPLAY_TYPES.MODAL,
  [ERROR_CODES.NETWORK_ERROR]: ERROR_DISPLAY_TYPES.MODAL,
  [ERROR_CODES.TIMEOUT_ERROR]: ERROR_DISPLAY_TYPES.MODAL,
  [ERROR_CODES.INTERNAL_ERROR]: ERROR_DISPLAY_TYPES.MODAL,
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: ERROR_DISPLAY_TYPES.MODAL,
  [ERROR_CODES.INTERNAL_SERVER_ERROR_DEBUG]: ERROR_DISPLAY_TYPES.MODAL,
}

// Clase de error unificada
export class APIError extends Error {
  constructor(message, code = ERROR_CODES.UNKNOWN_ERROR, status = 500, details = null, requestId = null) {
    super(message)
    this.name = "APIError"
    this.code = code
    this.status = status
    this.details = details
    this.requestId = requestId
    this.displayAs = ERROR_DISPLAY_MAP[code] || ERROR_DISPLAY_TYPES.TOAST
  }

  static fromAxiosError(axiosError) {
    // Error de timeout
    if (axiosError.code === "ECONNABORTED") {
      return new APIError("La solicitud está tardando demasiado. Intenta nuevamente.", ERROR_CODES.TIMEOUT_ERROR, 408)
    }

    // Error de red
    if (!axiosError.response) {
      // Detecta si es realmente internet o backend
      const mensaje = navigator.onLine
        ? "El servidor no responde. Puede estar caído o en mantenimiento."
        : "Sin conexión a internet. Verifica tu red."

      return new APIError(mensaje, ERROR_CODES.NETWORK_ERROR, 0)
    }

    const { status, data, headers } = axiosError.response

    // EXTRAER REQUEST_ID DE LA RESPUESTA
    let requestId = null
    requestId =
      data?.metadata?.request_id ||
      data?.error?.metadata?.request_id ||
      // También de headers (por si acaso)
      headers?.["x-request-id"] ||
      headers?.["X-Request-ID"] ||
      null

    // Formato nuevo: { success: false, error: { ... } }
    if (data?.success === false && data?.error) {
      const { code, message, details } = data.error
      return new APIError(
        message || "Error del servidor",
        code || ERROR_CODES.INTERNAL_ERROR,
        status,
        details,
        requestId,
      )
    }

    // Formato viejo: { error: { msg, ... } }
    if (data?.error) {
      const { msg, code, ...rest } = data.error
      return new APIError(msg || "Error del servidor", code || ERROR_CODES.INTERNAL_ERROR, status, rest, null)
    }

    // Error genérico
    return new APIError(data?.message || `Error ${status}`, ERROR_CODES.INTERNAL_ERROR, status, data, null)
  }
}

// Handler principal
export const errorHandler = {
  normalizeError(error) {
    // Si ya es APIError
    if (error instanceof APIError) return error

    // Error de Axios
    if (error.isAxiosError) {
      return APIError.fromAxiosError(error)
    }

    // Error genérico
    return new APIError(error?.message || "Error desconocido", ERROR_CODES.UNKNOWN_ERROR, error?.status || 500, error)
  },

  getDisplayType(error) {
    if (error instanceof APIError) {
      return error.displayAs
    }
    return ERROR_DISPLAY_TYPES.TOAST
  },

  shouldRetry(error) {
    if (!(error instanceof APIError)) return false

    const noRetryCodes = [
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_CODES.AUTHENTICATION_ERROR,
      ERROR_CODES.AUTHORIZATION_ERROR,
      ERROR_CODES.CONFLICT_ERROR,
    ]

    return !noRetryCodes.includes(error.code)
  },
}
