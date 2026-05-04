import { Navigate, Outlet } from "react-router-dom"
import fetchwrapper from "../../services/interceptors/fetchwrapper"
import { useEffect, useState } from "react"
import useCleanSession from "../../hooks/cleanSession"

const ProtectedRoutes = () => {
  const [isLoading, setisLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const cleanSession = useCleanSession()

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      alert("Necesitas iniciar sesión de nuevo")
      setIsAuthenticated(false)
      cleanSession()
    }
    if (localStorage.getItem("accessToken")) {
      const testToken = async () => {
        try {
          const options = {
            method: "POST",
            body: {},
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }

          const response = await fetchwrapper("/login/test_token", options)
          if (!response.ok) {
            throw new Error("Error")
          }
          setIsAuthenticated(true)
        } catch (err) {
          alert("Usuario no autenticado")
          setIsAuthenticated(false)
          cleanSession()
        }
      }

      testToken()
    }
  }, [])

  return isAuthenticated && <Outlet />
}

export default ProtectedRoutes

// Detect when a user logs out in a duplicate tab so close the session in all tabs
window.addEventListener("click", () => {
  const currentPath = window.location.pathname
  const pathParams = currentPath.split("/")
  const lastParam = pathParams[pathParams.length - 1]

  if (lastParam !== "login" && lastParam !== "loginInner") {
    if (!localStorage.getItem("accessToken")) {
      alert("Necesitas iniciar sesión de nuevo")
      localStorage.clear()
      window.location.assign("/")
    }
  }
})
