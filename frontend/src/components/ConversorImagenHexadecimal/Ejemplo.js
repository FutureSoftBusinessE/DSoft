// Ejemplo para visualizar el uso del componente

import React from "react"
import HexImage from "./components/HexImage"

function App() {
  const hexString =
    "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C636000000000FFFF03000006000557BF5F830000000049454E44AE426082"

  return (
    <div className="App">
      <h1>Hexadecimal to Image Converter</h1>
      <HexImage hexString={hexString} width="200px" height="200px" />
    </div>
  )
}

export default App
