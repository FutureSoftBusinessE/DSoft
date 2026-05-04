import { createContext, useEffect, useState, useMemo } from "react"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import { useLocation } from "react-router-dom"

const GlobalContext = createContext()

const GlobalContextProvider = ({ children }) => {
  const [selectedBco, setSelectedBco] = useState([])
  const location = useLocation()
  const currentPath = location.pathname
  let userMenuData = localStorage.getItem("menuAcciones")
  userMenuData = userMenuData ? JSON.parse(userMenuData) : null

  // 1. Extraer controller de la URL
  const getCurrentOpccontroller = () => {
    const pathParts = currentPath.split("/").filter((part) => part)
    if (pathParts.length >= 3) {
      return decodeURIComponent(pathParts[2]) // El controller es el tercer segmento
    }
    return null
  }
  const currentController = getCurrentOpccontroller()

  // 2. Obtener datos del controller actual - CACHEADO
  const currentControllerData = useMemo(() => {
    if (!currentController || !userMenuData) return null

    const controllerData = userMenuData[currentController]

    // Si existe, agregar metadata útil
    if (controllerData) {
      return {
        data: { ...controllerData }, // Esta info esta guardado en el localstorage que previamente lo trajo la api /menu/get_menu_opciones_acciones y aqui estoy seleccionando el current controller data
        controllerName: currentController,
        hasActions: controllerData.barraAcciones?.length > 0,
        actionCount: controllerData.barraAcciones?.length || 0,
      }
    }

    return null
  }, [currentController, userMenuData])

  // 3. Verificar acceso a un controller
  const hasAccessToController = (controllerName) => {
    return !!userMenuData?.[controllerName]
  }

  // 4. Obtener acciones de un controller
  const getActionsForController = (controllerName) => {
    if (!userMenuData?.[controllerName]) return []
    return userMenuData[controllerName].barraAcciones || []
  }

  // 5. Verificar si puede hacer una acción específica
  const canDoAction = (controllerName, actionCaption) => {
    const actions = getActionsForController(controllerName)
    return actions.some((action) => action.acccaption === actionCaption)
  }

  const myContextData = {
    selectedBco,
    setSelectedBco,
    selectedMenuInfo: currentControllerData,
  }

  return <GlobalContext.Provider value={myContextData}>{children}</GlobalContext.Provider>
}

export { GlobalContext, GlobalContextProvider }
