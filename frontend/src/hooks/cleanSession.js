import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"

const useCleanSession = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const cleanSession = () => {
    // Limpiar todos los almacenamientos web
    localStorage.clear()
    sessionStorage.clear()
    // LIMPIAR TODO EL CACHÉ DE REACT QUERY
    queryClient.clear() // Limpia todo el caché
    queryClient.removeQueries() // Remueve todas las queries activas
    queryClient.invalidateQueries() // Invalida todas las queries

    // Redirigir a home y forzar recarga
    navigate("/", { replace: true })
  }

  return cleanSession
}

export default useCleanSession
