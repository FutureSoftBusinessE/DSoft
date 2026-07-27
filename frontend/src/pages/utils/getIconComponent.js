import * as FcIcons from "react-icons/fc"
import * as FaIcons from "react-icons/fa"
import * as FiIcons from "react-icons/fi"
import * as MdIcons from "react-icons/md"
import * as BiIcons from "react-icons/bi"
import * as AiIcons from "react-icons/ai"
import * as HiIcons from "react-icons/hi"
import * as Io5Icons from "react-icons/io5"
import { Icon } from "@iconify/react"
import React from "react"

// All icons
const Icons = {
  ...FcIcons,
  ...FaIcons,
  ...FiIcons,
  ...MdIcons,
  ...BiIcons,
  ...AiIcons,
  ...HiIcons,
  ...Io5Icons,
}

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
