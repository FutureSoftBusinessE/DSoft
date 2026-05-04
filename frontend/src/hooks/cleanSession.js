import { useNavigate } from "react-router-dom"

const useCleanSession = () => {
  const navigate = useNavigate()

  const cleanSession = () => {
    // Limpiar todos los almacenamientos web
    localStorage.clear()
    sessionStorage.clear()

    // Redirigir a home y forzar recarga
    navigate("/", { replace: true })
  }

  return cleanSession
}

export default useCleanSession
