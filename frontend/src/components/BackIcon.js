import { useEffect, useState } from "react"
import BackIco from "../assets/iconos/Regresar.ico"
import { styled } from "@mui/material/styles"

// STYLES
const StyledBackIcon = styled("div")(({ theme }) => ({
  marginTop: "25px",
  marginBottom: "25px",
  alignItems: "center",
  cursor: "pointer",
}))

const BackIcon = ({ returnUrl = "" }) => {
  const [currentURL, setCurrentURL] = useState("")

  useEffect(() => {
    const currentUrl = window.location.href
    setCurrentURL(currentUrl)
    console.log("URL actual:", currentUrl)

    return () => {
      const urlRestante = window.location.pathname
      if (urlRestante === "/home") {
        document.body.classList.add("sidebar-show")
      }
    }
  }, [currentURL])

  const goBack = () => {
    // si le paso ruta redirige a esa, sino va una opción atrás por defecto
    if (returnUrl) {
      window.location.href = returnUrl
    } else {
      window.history.back()
    }
  }

  return (
    <StyledBackIcon onClick={goBack}>
      <img src={BackIco} style={{ width: "40px", marginRight: "8px" }} alt="regresar" />
      Regresar
    </StyledBackIcon>
  )
}

export default BackIcon
