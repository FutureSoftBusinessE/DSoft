import * as Icons from "react-icons/fc"
import { Icon } from "@iconify/react"
import React from "react"

const DEFAULT_NOT_EXISTS_ICON = (
  <span
    style={{
      display: "inline-block",
      width: 30,
      height: 30,
      backgroundColor: "#ccc",
      borderRadius: 4,
    }}
  />
)

const getIconComponent = (nameIcon, library) => {
  if (!nameIcon || !library) {
    return DEFAULT_NOT_EXISTS_ICON
  }

  try {
    switch (library) {
      case "iconify":
        // Validar que Icon esté disponible
        if (typeof Icon === "undefined") {
          throw new Error("Librería Iconify no disponible")
        }
        return <Icon icon={nameIcon} width={30} height={30} />

      case "react-icons":
        // Validar que Icons y el icono específico existan
        if (typeof Icons === "undefined") {
          throw new Error("Librería react-icons no disponible")
        }
        if (!Icons[nameIcon]) {
          throw new Error(`Icono "${nameIcon}" no encontrado en react-icons`)
        }
        return React.createElement(Icons[nameIcon], { size: 30 })

      default:
        return DEFAULT_NOT_EXISTS_ICON
    }
  } catch (error) {
    console.error("Error crítico al renderizar icono:", error)
    return DEFAULT_NOT_EXISTS_ICON
  }
}

export default getIconComponent
