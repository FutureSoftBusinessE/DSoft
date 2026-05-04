// hooks/useProceso.js
import { useQuery } from "@tanstack/react-query"
import { api } from "../../api"

export default function useProceso(procesocod, options = {}) {
  return useQuery({
    queryKey: ["proceso", procesocod],
    queryFn: async () => {
      const response = await api.post("/ProcesosDeTarea/getProceso", { procesocod })
      return response.data.data
    },
    enabled: !!procesocod,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    ...options,
  })
}
