import axios from "axios"
import { errorHandler } from "./errorHandler"
import Swal from "sweetalert2"
import { clearSession } from "../services/session/clearSession"

// Si está vacío (solo pasa en desarrollo), usa el hostname. Esto lo hago para que se pueda probar en celular en desarrollo
const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000`

// Cliente Axios configurado
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para requests
apiClient.interceptors.request.use(
  (config) => {
    // Añadir token de autenticación
    const token = localStorage.getItem("accessToken")
    if (token) {
      try {
        const parsedToken = JSON.parse(token)
        config.headers.Authorization = `Bearer ${parsedToken}`
      } catch (e) {
        console.warn("Token inválido")
        localStorage.removeItem("accessToken")
      }
    }

    // Log en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log(`➡️ ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      })
    }

    return config
  },
  (error) => Promise.reject(error),
)

// Interceptor para responses
apiClient.interceptors.response.use(
  (response) => {
    const backendData = response.data

    // Normalizar respuesta a formato común
    if (backendData && typeof backendData === "object") {
      if ("success" in backendData) {
        // Ya está en formato nuevo
        return response
      } else {
        // Convertir formato viejo a nuevo
        return {
          ...response,
          data: {
            success: true,
            data: backendData,
            metadata: {},
          },
        }
      }
    }

    // Para otros tipos de respuesta
    return {
      ...response,
      data: {
        success: true,
        data: backendData,
        metadata: {},
      },
    }
  },
  async (error) => {
    // Log en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.error("❌ API Error:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
      })
    }

    // Normalizar error
    const normalizedError = errorHandler.normalizeError(error)

    // Limpiar token si es error de autenticación
    if (normalizedError.code === "AUTHENTICATION_ERROR") {
      localStorage.removeItem("accessToken")
    }

    // Si el código de estado es 401 (sesión inválida/expirada/reemplazada)
    if (normalizedError.status === 401) {
      const mensaje = normalizedError.message || "Tu sesión ya no es válida. Vuelve a iniciar sesión."

      // Evita mostrar la alerta múltiples veces si varias peticiones fallan a la vez
      if (!window.__sessionAlertShown) {
        window.__sessionAlertShown = true

        Swal.fire({
          icon: "warning",
          title: "Sesión cerrada",
          text: mensaje,
          confirmButtonText: "Aceptar",
          allowOutsideClick: false,
          allowEscapeKey: false,
          timer: 6000,
          timerProgressBar: true,
        }).then(() => {
          // Limpia almacenamiento y redirige a /login
          clearSession()
        })
      }

      // Marca el error como ya manejado para que notificationService no lo duplique
      normalizedError.__sessionHandled = true
    }

    return Promise.reject(normalizedError)
  },
)

// Métodos principales
export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),

  // Para upload de archivos
  upload: (url, formData, onProgress) => {
    return apiClient.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress,
    })
  },
}

export default api
