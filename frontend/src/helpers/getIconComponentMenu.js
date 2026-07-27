import React from "react"
import * as FcIcons from "react-icons/fc"
import * as FaIcons from "react-icons/fa"
import { Icon } from "@iconify/react"

// All icons FcShop
const Icons = {
  ...FcIcons,
  ...FaIcons,
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
