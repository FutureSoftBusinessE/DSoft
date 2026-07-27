import React from "react"
import * as FcIcons from "react-icons/fc"
import * as FaIcons from "react-icons/fa"
import * as FiIcons from "react-icons/fi"
import * as MdIcons from "react-icons/md"
import * as BiIcons from "react-icons/bi"
import * as AiIcons from "react-icons/ai"
import * as HiIcons from "react-icons/hi"
import * as Io5Icons from "react-icons/io5"
import { Icon } from "@iconify/react"

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

// Función para obtener un icono por defecto seguro
const getSafeIcon = (iconName) => {
  try {
    // Verificar si el icono existe
    if (Icons[iconName]) {
      return Icons[iconName]
    }

    // Intentar con variaciones del nombre
    const variations = [
      iconName,
      `Fc${iconName}`,
      iconName.replace(/^Fc/, ""),
      iconName.toLowerCase(),
      iconName.toUpperCase(),
    ]

    for (const variation of variations) {
      if (Icons[variation]) {
        return Icons[variation]
      }
    }

    // Icono por defecto
    return Icons.FcInfo || null
  } catch (error) {
    console.error("Error al obtener icono:", error)
    return null
  }
}

const getIconComponent = (opc) => {
  if (!opc?.icon) {
    return null
  }

  if (opc?.opcmenu === "iconify") {
    return <Icon icon={opc?.icon} width={30} height={30} />
  }

  // Para react-icons o por defecto
  const IconComponent = getSafeIcon(opc.icon)

  if (IconComponent) {
    return React.createElement(IconComponent, { size: 30 })
  }

  // Si no se encuentra ningún icono, retornar null o un placeholder
  return <span style={{ width: 30, height: 30, display: "inline-block" }}></span>
}

export default getIconComponent
