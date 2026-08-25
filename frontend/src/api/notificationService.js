import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"

// Hacerlo global (opcional)
window.Swal = Swal
// Sistema simple de notificaciones
class NotificationService {
  constructor() {
    this.useSwal = typeof Swal !== "undefined"
  }

  // Mostrar toast
  showToast(message, type = "info", options = {}) {
    const { duration = 4000, position = "top-right" } = options

    // Si tienes SweetAlert2 instalado
    if (this.useSwal) {
      const Toast = Swal.mixin({
        toast: true,
        position,
        showConfirmButton: false,
        timer: duration,
        timerProgressBar: true,
        didOpen: (toast) => {
          // FORZAR z-index en TODOS los elementos de SweetAlert2
          const swalContainer = document.querySelector(".swal2-container")
          if (swalContainer) {
            swalContainer.style.zIndex = "999999"
            swalContainer.style.position = "fixed"
          }
        },
      })

      Toast.fire({
        icon: type,
        title: message,
      })
      return
    }

    // Fallback a console en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log(`[${type.toUpperCase()}] ${message}`)
    }
  }

  // Mostrar modal
  showModal(title, message, type = "warning", options = {}) {
    const {
      confirmText = "Aceptar",
      cancelText = "Cancelar",
      showCancel = false,
      onConfirm = () => {},
      onCancel = () => {},
    } = options

    if (this.useSwal) {
      return Swal.fire({
        title,
        text: message,
        icon: type,
        confirmButtonText: confirmText,
        showCancelButton: showCancel,
        cancelButtonText: cancelText,
        didOpen: (toast) => {
          // FORZAR z-index en TODOS los elementos de SweetAlert2
          const swalContainer = document.querySelector(".swal2-container")
          if (swalContainer) {
            swalContainer.style.zIndex = "999999"
            swalContainer.style.position = "fixed"
          }
        },
      }).then((result) => {
        if (result.isConfirmed) {
          onConfirm()
        } else {
          onCancel()
        }
      })
    }

    // Fallback
    const userConfirmed = window.confirm(`${title}\n\n${message}`)
    if (userConfirmed) {
      onConfirm()
    } else {
      onCancel()
    }
  }

  // Mostrar error
  showError(error, context = {}) {
    const apiError = error

    switch (apiError.displayAs) {
      case "toast":
        return this.showErrorToast(apiError)

      case "modal":
        return this.showErrorModal(apiError)

      case "inline":
        return apiError // Se maneja en el formulario

      case "silent":
        console.error("Error silencioso:", apiError)
        return apiError

      default:
        return this.showErrorToast(apiError)
    }
  }

  showErrorToast(error) {
    const iconMap = {
      VALIDATION_ERROR: "warning",
      NETWORK_ERROR: "error",
      TIMEOUT_ERROR: "error",
      RATE_LIMIT_ERROR: "warning",
      default: "error",
    }

    let message = error.message
    if (error.requestId && error.requestId !== "unknown") {
      message = `${error.message}\n\n🔍 ID de error: ${error.requestId}`
    }

    this.showToast(message, iconMap[error.code] || iconMap.default, { duration: 4000 })

    return error
  }

  showErrorModal(error) {
    console.log("error devvv", Object(error))
    let title =
      error?.code === "INTERNAL_SERVER_ERROR_DEBUG"
        ? "Error del sistema detallado solo para el developer"
        : "Error" || "Error"
    let message = error.message
    let icon = "error"
    // Extraer details si existen
    const errorDetails = error.details || error.metadata?.details

    if (error.requestId && error.requestId !== "unknown") {
      message += `\n\n🔍 ID de error: ${error.requestId}`

      // Para errores internos, dar instrucciones de soporte
      if (error.code === "INTERNAL_ERROR" || error.status >= 500) {
        message += "\n\nPor favor, proporciona este ID al equipo de soporte."
      }
    }

    // AÑADIR DETAILS SI EXISTEN (solo esto es nuevo)
    if (errorDetails) {
      message += "\n\n📋 Detalles:"

      if (typeof errorDetails === "object") {
        // Si es un objeto, formatearlo bonito
        if (errorDetails.field_errors) {
          // Caso especial: errores de validación de campos
          message += "\n\nErrores de validación:"
          errorDetails.field_errors.forEach((err) => {
            message += `\n• ${err.field}: ${err.error}`
          })
        } else {
          // Otros objetos
          Object.entries(errorDetails).forEach(([key, value]) => {
            message += `\n• ${key}: ${JSON.stringify(value)}`
          })
        }
      } else {
        // Si es string u otro tipo
        message += `\n${errorDetails}`
      }
    }

    switch (error.code) {
      case "AUTHENTICATION_ERROR":
        title = "Sesión expirada"
        message = "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
        if (error.requestId) {
          message += `\n\n🔍 ID de error: ${error.requestId}`
        }
        icon = "warning"
        break

      case "AUTHORIZATION_ERROR":
        title = "Acceso denegado"
        message = "No tienes permisos para realizar esta acción."
        if (error.requestId) {
          message += `\n\n🔍 ID de error: ${error.requestId}`
        }
        break

      case "INTERNAL_ERROR":
        title = "Error del sistema"
        if (error.requestId) {
          message += `\n\n🔍 ID de error: ${error.requestId}\nPor favor, proporciona este ID al equipo de soporte.`
        } else {
          message += " Por favor, contacta con soporte."
        }
        break
    }

    return this.showModal(title, message, icon)
  }

  // Función SOLO para APIs nuevas con request_id
  copyRequestIdToClipboard(requestId) {
    if (!requestId || requestId === "unknown") return

    navigator.clipboard
      .writeText(requestId)
      .then(() => {
        this.showToast(`✅ ID copiado: ${requestId}`, "success", { duration: 2000 })
      })
      .catch(() => {
        // Fallback
        const textArea = document.createElement("textarea")
        textArea.value = requestId
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        this.showToast(`✅ ID copiado: ${requestId}`, "success", { duration: 2000 })
      })
  }

  showErrorWithRequestId(error, options = {}) {
    const title =
      error?.code === "INTERNAL_SERVER_ERROR_DEBUG"
        ? "Error del sistema detallado solo para el developer"
        : "Error" || "Error"
    // Si no es una API nueva, usar la función normal
    if (!error.requestId || error.requestId === "unknown") {
      return this.showErrorModal(error)
    }

    // mostrar con request_id destacado
    const { showCopyButton = true } = options

    // Extraer details si existen
    const errorDetails = error.details || error.metadata?.details

    if (this.useSwal) {
      // Construir contenido con details si existen
      let htmlContent = `
      <div style="text-align: left;">
        <p style="margin-bottom: 12px; font-size: 14px;">${error.message}</p>
        <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 15px 0;">
          <strong>🔍 ID de error para soporte:</strong><br>
          <code style="font-family: monospace; font-size: 14px;">${error.requestId}</code>
        </div>
    `

      // AÑADIR DETAILS SI EXISTEN
      if (errorDetails) {
        htmlContent += `
        <div style="margin: 15px 0;">
          <strong>📋 Detalles adicionales:</strong><br>
          <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 10px; margin-top: 5px; max-height: 150px; overflow-y: auto; font-size: 12px;">
      `

        if (typeof errorDetails === "object") {
          if (errorDetails.field_errors) {
            // Caso especial: errores de validación
            htmlContent += "<strong>Errores de validación:</strong><br>"
            errorDetails.field_errors.forEach((err) => {
              htmlContent += `• ${err.field}: ${err.error}<br>`
            })
          } else {
            // Otros objetos
            Object.entries(errorDetails).forEach(([key, value]) => {
              htmlContent += `<strong>${key}:</strong> ${JSON.stringify(value)}<br>`
            })
          }
        } else {
          htmlContent += errorDetails
        }

        htmlContent += `
          </div>
        </div>
      `
      }

      htmlContent += `
        <p style="font-size: 13px; color: #666; margin-top: 10px;">
          Por favor, guarda este ID y proporciónalo al equipo de soporte si el problema persiste.
        </p>
      </div>
    `

      return Swal.fire({
        title,
        html: htmlContent,
        icon: "error",
        showCancelButton: showCopyButton,
        confirmButtonText: "Entendido",
        cancelButtonText: "📋 Copiar ID",
        focusConfirm: false,
        width: "500px",
        didOpen: (toast) => {
          // FORZAR z-index en TODOS los elementos de SweetAlert2
          const swalContainer = document.querySelector(".swal2-container")
          if (swalContainer) {
            swalContainer.style.zIndex = "999999"
            swalContainer.style.position = "fixed"
          }
        },
      }).then((result) => {
        if (result.dismiss === "cancel") {
          this.copyRequestIdToClipboard(error.requestId)
        }
      })
    }

    // Fallback - usar showErrorModal que ya incluye details
    return this.showErrorModal(error)
  }

  // Mostrar éxito
  showSuccess(message, displayAs = "toast", options = {}) {
    switch (displayAs) {
      case "toast":
        return this.showToast(message, "success", options)

      case "modal":
        return this.showModal("Éxito", message, "success", options)

      default:
        return this.showToast(message, "success", options)
    }
  }

  showWarning(message, displayAs = "toast", options = {}) {
    switch (displayAs) {
      case "toast":
        return this.showToast(message, "warning", options)

      case "modal":
        return this.showModal("Advertencia", message, "warning", options)

      default:
        return this.showToast(message, "warning", options)
    }
  }

  showInfo(message, displayAs = "toast", options = {}) {
    return this.showToast(message, "info", options)
  }
}

// Singleton
export const notificationService = new NotificationService()

// Funciones rápidas
export const showSuccess = (message, options) => notificationService.showSuccess(message, "toast", options)

export const showError = (error, context) => notificationService.showError(error, context)

export const showWarning = (message, options) => notificationService.showWarning(message, "toast", options)
