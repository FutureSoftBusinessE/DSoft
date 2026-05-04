import { createContext, useEffect, useState } from "react"
import { Outlet } from "react-router-dom"

const LoginContext = createContext()
const LoginContextProvider = ({ children }) => {
  const [userExists, setUserExists] = useState({})

  const [companySelected, setCompanySelected] = useState({})
  const [locationSelected, setLocationSelected] = useState({})

  const [menuItems, setMenuItems] = useState([])

  const [menuRequest, setMenuRequest] = useState({})
  const [subLevelsMain, setSubLevelsMain] = useState([])
  const [nameLastPage, setNameLastPage] = useState("")

  useEffect(() => {
    setMenuRequest({
      user: "­v}xg",
      seleccion: companySelected,
      localidad: locationSelected,
    })
  }, [userExists, companySelected, locationSelected])
  const myContextData = {
    userExists,
    setUserExists,
    companySelected,
    setCompanySelected,
    locationSelected,
    setLocationSelected,
    menuItems,
    setMenuItems,
    menuRequest,
    subLevelsMain,
    setSubLevelsMain,
    nameLastPage,
    setNameLastPage,
  }
  return <LoginContext.Provider value={myContextData}>{children}</LoginContext.Provider>
}

const LoginContextLayout = () => {
  return (
    <LoginContextProvider>
      <Outlet />
    </LoginContextProvider>
  )
}

export { LoginContextLayout, LoginContext, LoginContextProvider }
