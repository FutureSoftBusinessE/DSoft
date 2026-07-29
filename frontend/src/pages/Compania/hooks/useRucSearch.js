// hooks/useRucSearch.js
import { useCallback } from "react"
import { useMutation, api } from "../../../api"

export const useRucSearch = () => {
  const { mutateAsync: searchRuc, isPending: isSearching } = useMutation({
    queryKey: ["searchRuc"],
    fn: async (rucNumber) => {
      return await api.get(`/ConsultaDeRuc/getInfoRucSRI/${rucNumber}`)
    },
    showError: false,
    showSuccess: false,
  })

  const searchRucAndFill = useCallback(
    async (rucNumber) => {
      if (!rucNumber || rucNumber.trim().length !== 13) {
        return {
          success: false,
          error: "El RUC debe tener 13 dígitos",
        }
      }

      try {
        const response = await searchRuc(rucNumber.trim())
        const data = response?.data || response

        if (data && data.numeroRuc) {
          const mappedData = {
            ciadescri: data.razonSocial || "",
            ciadirec: data.direccionMatriz || data.direccion || "",
            ciaciudad: data.ciudad || "",
          }

          return {
            success: true,
            data: mappedData,
            rawData: data,
          }
        } else {
          return {
            success: false,
            error: "No se encontraron datos para este RUC",
          }
        }
      } catch (error) {
        return {
          success: false,
          error: "No se pudo consultar el SRI. Puede llenar los datos manualmente.",
        }
      }
    },
    [searchRuc],
  )

  return {
    isSearching,
    searchRucAndFill,
  }
}
