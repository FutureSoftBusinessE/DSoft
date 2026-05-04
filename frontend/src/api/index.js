// Punto de entrada único para el nuevo sistema
export { default as api } from "./client"
export { useQuery, useMutation, useApi } from "./hooks"
export { ERROR_CODES, ERROR_DISPLAY_TYPES, APIError, errorHandler } from "./errorHandler"
export { notificationService, showSuccess, showError, showWarning } from "./notificationService"
