import { useQuery as useReactQuery, useMutation as useReactMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./client"
import { errorHandler } from "./errorHandler"
import { notificationService } from "./notificationService"

// ========== useQuery ==========
export const useQuery = (options) => {
  const {
    queryKey,
    url,
    params = {},
    config = {},
    showError = "auto",
    errorDisplayType = null,
    retry = null,
    onSuccess = null,
    onError = null,
    onSettled = null,
    ...queryOptions
  } = options

  return useReactQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      // eslint-disable-next-line no-useless-catch
      try {
        const response = await api.get(url, { params, ...config })
        const responseData = response.data

        // Formato nuevo: { success: true, data: ..., metadata: ... }
        if (responseData.success === true) {
          return {
            data: responseData.data,
            metadata: responseData.metadata || {},
            message: responseData.message,
          }
        }

        // Formato viejo convertido
        return {
          data: responseData.data,
          metadata: {},
          message: null,
        }
      } catch (error) {
        throw error
      }
    },

    // Configuración de reintento
    retry:
      retry !== null
        ? retry
        : (failureCount, error) => {
            if (errorHandler.shouldRetry(error)) {
              return failureCount < 2
            }
            return false
          },

    // Configuración por defecto para nuevo código
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,

    // Callbacks
    onSuccess: (result) => {
      if (onSuccess) {
        onSuccess(result.data, result.metadata, result.message)
      }
    },

    onError: (error) => {
      const apiError = errorHandler.normalizeError(error)

      // Mostrar error si está configurado
      if (showError !== false) {
        const displayType = errorDisplayType || (showError === "auto" ? apiError.displayAs : showError)

        if (displayType !== "inline") {
          notificationService.showError(apiError)
        }
      }

      // Callback personalizado
      if (onError) {
        onError(apiError)
      }
    },

    onSettled: (data, error) => {
      if (onSettled) {
        const resultData = data?.data || null
        onSettled(resultData, error)
      }
    },

    ...queryOptions,
  })
}

// Helpers para queries
useQuery.byId = (resource, id, options = {}) => {
  return useQuery({
    queryKey: [resource, id],
    url: `/${resource}/${id}`,
    ...options,
  })
}

useQuery.list = (resource, params = {}, options = {}) => {
  return useQuery({
    queryKey: [resource, "list", params],
    url: `/${resource}`,
    params,
    ...options,
  })
}

// ========== useMutation ==========
export const useMutation = (options) => {
  const {
    fn,
    showSuccess = "auto",
    successMessage = null,
    showError = "auto",
    optimisticUpdate = null,
    onSuccess: userOnSuccess,
    onError: userOnError,
    onSettled: userOnSettled,
    ...mutationOptions
  } = options

  const queryClient = useQueryClient()

  return useReactMutation({
    mutationFn: async (variables) => {
      // eslint-disable-next-line no-useless-catch
      try {
        const response = await fn(variables)
        const responseData = response.data

        let data, message

        if (responseData.success === true) {
          data = responseData.data
          message = responseData.message || responseData.metadata?.message
        } else {
          data = responseData.data
          message = null
        }

        return { data, message }
      } catch (error) {
        throw error
      }
    },

    // Optimistic updates
    ...(optimisticUpdate && {
      onMutate: async (variables) => {
        if (!optimisticUpdate.queryKey) return

        await queryClient.cancelQueries({ queryKey: optimisticUpdate.queryKey })

        const previousData = queryClient.getQueryData(optimisticUpdate.queryKey)

        if (optimisticUpdate.updateFn) {
          queryClient.setQueryData(optimisticUpdate.queryKey, (old) => optimisticUpdate.updateFn(old, variables))
        }

        return { previousData }
      },

      // eslint-disable-next-line n/handle-callback-err
      onError: (error, variables, context) => {
        if (context?.previousData && optimisticUpdate.queryKey) {
          queryClient.setQueryData(optimisticUpdate.queryKey, context.previousData)
        }
      },

      onSettled: () => {
        if (optimisticUpdate.queryKey) {
          queryClient.invalidateQueries({ queryKey: optimisticUpdate.queryKey })
        }
      },
    }),

    // Callbacks
    onSuccess: (result, variables, context) => {
      const { data, message } = result

      // Mostrar éxito si está configurado
      if (showSuccess !== "none" && showSuccess !== "callback") {
        const finalMessage = successMessage || message || "Operación exitosa"

        if (showSuccess === "toast" || showSuccess === "auto") {
          notificationService.showSuccess(finalMessage)
        } else if (showSuccess === "modal") {
          notificationService.showSuccess(finalMessage, "modal")
        }
      }

      // Callback del usuario
      if (userOnSuccess) {
        userOnSuccess(data, variables, context, message)
      }
    },

    onError: (error, variables, context) => {
      const apiError = errorHandler.normalizeError(error)

      // Mostrar error si está configurado
      if (showError !== false) {
        const displayType = showError === "auto" ? apiError.displayAs : showError

        if (displayType !== "inline") {
          notificationService.showError(apiError)
        }
      }

      // Callback del usuario
      if (userOnError) {
        userOnError(apiError, variables, context)
      }
    },

    onSettled: (data, error, variables, context) => {
      if (userOnSettled) {
        userOnSettled(data?.data, error, variables, context)
      }
    },

    ...mutationOptions,
  })
}

// Helpers para mutaciones
useMutation.create = (resource, options = {}) => {
  return useMutation({
    fn: (data) => api.post(`/${resource}`, data),
    showSuccess: "toast",
    successMessage: `${resource} creado exitosamente`,
    ...options,
  })
}

useMutation.update = (resource, options = {}) => {
  return useMutation({
    fn: ({ id, ...data }) => api.put(`/${resource}/${id}`, data),
    showSuccess: "toast",
    successMessage: `${resource} actualizado exitosamente`,
    ...options,
  })
}

useMutation.delete = (resource, options = {}) => {
  return useMutation({
    fn: (id) => api.delete(`/${resource}/${id}`),
    showSuccess: "toast",
    successMessage: `${resource} eliminado exitosamente`,
    ...options,
  })
}

// ========== useApi (helper combinado) ==========
export const useApi = {
  // Para queries
  query: useQuery,
  mutation: useMutation,

  // Para recursos REST
  resource: (resourceName) => ({
    // Queries
    get: (id, options) => useQuery.byId(resourceName, id, options),
    list: (params, options) => useQuery.list(resourceName, params, options),

    // Mutations
    create: (options) => useMutation.create(resourceName, options),
    update: (options) => useMutation.update(resourceName, options),
    delete: (options) => useMutation.delete(resourceName, options),
  }),
}
