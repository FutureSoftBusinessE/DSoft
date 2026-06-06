import axios from "axios"
import { errorHandler } from "./errorHandler"

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
  (error) => {
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
