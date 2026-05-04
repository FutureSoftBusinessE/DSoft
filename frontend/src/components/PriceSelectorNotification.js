import { Button, TextField } from "@mui/material"
import { useEffect, useState } from "react"

const PriceSelectorNotification = ({ retorno, item, precio, currentCantidad, setcurrentCantidad }) => {
  const MIN_CANTIDAD = 1
  const MAX_CANTIDAD = item.maxTotalStockToBuy
  precio = item.cabecera.precio

  useEffect(() => {
    let updatedCart = JSON.parse(localStorage.getItem("cart")) || []
    const existingItemIndex = updatedCart.findIndex((itemN) => itemN.cabecera.codigo === item.cabecera.codigo)

    if (existingItemIndex !== -1) {
      const updatedCartItems = updatedCart.map((item, index) => {
        if (index === existingItemIndex) {
          return {
            cabecera: item.cabecera,
            cuerpo: item.cuerpo,
            totalToBuy: currentCantidad,
            maxTotalStockToBuy: MAX_CANTIDAD,
          }
        }
        return item
      })
      localStorage.setItem("cart", JSON.stringify(updatedCartItems))
      updatedCart = JSON.parse(localStorage.getItem("cart")) || []

      console.log("cambiooo")
      console.log(updatedCart)
      console.log("cambio111")
      retorno(updatedCart)
    }
  }, [currentCantidad])

  const handleInputChange = (event) => {
    let newCantidad = parseInt(event.target.value)
    if (newCantidad < MIN_CANTIDAD) {
      newCantidad = MIN_CANTIDAD
    } else if (newCantidad > MAX_CANTIDAD) {
      newCantidad = MAX_CANTIDAD
    }
    setcurrentCantidad(newCantidad)
  }

  const handleIncrease = () => {
    if (currentCantidad < MAX_CANTIDAD) {
      setcurrentCantidad(currentCantidad + 1)
      let subtotal = localStorage.getItem("subtotal")
      subtotal = Number(subtotal) + Number(precio)
      localStorage.setItem("subtotal", subtotal)
      console.log("Subtotal: ", subtotal)

      let total = localStorage.getItem("total")
      total = subtotal * 1.21
      localStorage.setItem("total", total)
      retorno()
    }
  }

  const handleDecrease = () => {
    if (currentCantidad > MIN_CANTIDAD) {
      setcurrentCantidad(currentCantidad - 1)
      let subtotal = localStorage.getItem("subtotal")
      subtotal = Number(subtotal) - Number(precio)
      localStorage.setItem("subtotal", subtotal)
      console.log("Subtotal: ", subtotal)
      let total = localStorage.getItem("total")
      total = subtotal * 1.21
      localStorage.setItem("total", total)
      retorno()
    }
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Button variant="outlined" onClick={handleDecrease} disabled={currentCantidad <= MIN_CANTIDAD}>
          -
        </Button>
        <TextField
          type="number"
          value={currentCantidad}
          onChange={handleInputChange}
          sx={{ mx: 2, width: "6rem" }}
          inputProps={{
            min: MIN_CANTIDAD,
            max: MAX_CANTIDAD,
            disableIncrement: true,
            disableDecrement: true,
          }}
        />
        <Button variant="outlined" onClick={handleIncrease} disabled={currentCantidad >= MAX_CANTIDAD}>
          +
        </Button>
      </div>
    </>
  )
}

export default PriceSelectorNotification
