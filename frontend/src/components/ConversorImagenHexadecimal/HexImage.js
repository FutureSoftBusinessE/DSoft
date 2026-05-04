import React, { useEffect, useState } from "react"
import PropTypes from "prop-types"
import { hexToBase64, base64ToBlob } from "../../components/Utilidades"
import "./Hex.css"

function HexImage({ hexString, width = "200px", height = "200px" }) {
  const [imageUrl, setImageUrl] = useState(null)

  useEffect(() => {
    if (hexString) {
      // Convierte la cadena hexadecimal a Base64
      const base64String = hexToBase64(hexString)

      // Convierte la cadena Base64 a un Blob
      const blob = base64ToBlob(base64String)

      // Crea un URL de objeto para el Blob
      const url = URL.createObjectURL(blob)
      setImageUrl(url)

      // Limpia el URL del objeto cuando el componente se desmonta
      return () => URL.revokeObjectURL(url)
    }
  }, [hexString])

  return (
    <div className="hex-image-container">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Hexadecimal Image"
          style={{
            width,
            height,
            objectFit: "contain",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}

HexImage.propTypes = {
  hexString: PropTypes.string.isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
}

export default HexImage
