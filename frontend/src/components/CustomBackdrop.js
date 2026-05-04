import React from "react"
import ReactDOM from "react-dom"
import { CircularProgress, Backdrop } from "@mui/material"

const CustomBackdrop = ({ isLoading, zIndex = 0 }) => {
  return ReactDOM.createPortal(
    <Backdrop
      sx={{
        color: "#fff",
        zIndex: zIndex || ((theme) => theme.zIndex.drawer + 1),
      }}
      open={isLoading}
    >
      <CircularProgress color="inherit" />
    </Backdrop>,
    document.body, // Aquí se indica que el componente se renderiza en el body
  )
}

export default CustomBackdrop
