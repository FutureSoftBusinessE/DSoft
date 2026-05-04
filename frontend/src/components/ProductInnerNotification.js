import { Grid, IconButton, ListItemText, Button, TextField } from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import { useEffect, useState } from "react"
import { useCartStore } from "../stores/cartStore"
import math from "../pages/utils/math"

const ProductInnerNotification = ({ product, MIN_CANTIDAD, MAX_CANTIDAD }) => {
  const { remove, increaseQuantity, decreaseQuantity, setSpecificQuantity } = useCartStore()

  const [totalToBuyManaged, setTotalToBuyManaged] = useState(product.totalToBuy.toString())

  useEffect(() => {
    setTotalToBuyManaged(product.totalToBuy.toString())
  }, [product.totalToBuy])

  const handleDelete = (idProdudct) => {
    remove(idProdudct)
  }

  const handleInputChange = (event, idProdudct) => {
    const value = event.target.value

    // Validar y permitir solo números con hasta dos decimales
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setTotalToBuyManaged(value)
    }
  }

  const handleBlur = (idProdudct) => {
    let value = parseFloat(totalToBuyManaged)

    // Asegurarse de que el valor esté dentro de los límites y redondeado a dos decimales
    if (!isNaN(value)) {
      value = Math.round(value * 100) / 100

      if (value < MIN_CANTIDAD) {
        value = MIN_CANTIDAD
      } else if (value > MAX_CANTIDAD) {
        value = MAX_CANTIDAD
      }

      setTotalToBuyManaged(value.toString())
      setSpecificQuantity(idProdudct, value)
    } else {
      setTotalToBuyManaged(MIN_CANTIDAD.toString())
      setSpecificQuantity(idProdudct, MIN_CANTIDAD)
    }
  }

  const handleIncrease = (idProdudct) => {
    let newQuantity = parseFloat(product.totalToBuy) + 0.1
    if (newQuantity > MAX_CANTIDAD) {
      newQuantity = MAX_CANTIDAD
    }
    setSpecificQuantity(idProdudct, parseFloat(newQuantity.toFixed(2)))
  }

  const handleDecrease = (idProdudct) => {
    let newQuantity = parseFloat(product.totalToBuy) - 0.1
    if (newQuantity < MIN_CANTIDAD) {
      newQuantity = MIN_CANTIDAD
    }
    setSpecificQuantity(idProdudct, parseFloat(newQuantity.toFixed(2)))
  }

  return (
    <>
      <Grid item xs={12} sx={{ textAlign: "center" }}>
        <Grid container direction="column" alignItems="stretch">
          <Grid item xs={1} sx={{ alignSelf: "flex-end" }}>
            <IconButton onClick={() => handleDelete(product.codigo)} style={{ color: "#e8330c" }}>
              <DeleteIcon />
            </IconButton>
          </Grid>
          <Grid item xs={6} sm={4}>
            <ListItemText
              primary={product.descripcion}
              secondary={`$${math.round(product.price, 2)} x ${product.totalToBuy} unidades`}
            />
          </Grid>
          <Grid item xs={5}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <Button
                style={{ backgroundColor: "#3c90ab", color: "white" }}
                onClick={() => handleDecrease(product.codigo)}
                disabled={parseFloat(product.totalToBuy) <= MIN_CANTIDAD}
              >
                -
              </Button>
              <TextField
                type="text"
                value={totalToBuyManaged}
                onChange={(e) => handleInputChange(e, product.codigo)}
                onBlur={() => handleBlur(product.codigo)}
                sx={{ mx: 2, width: "6rem" }}
                inputProps={{
                  min: MIN_CANTIDAD,
                  max: MAX_CANTIDAD,
                  disableIncrement: true,
                  disableDecrement: true,
                  step: "0.01",
                }}
              />
              <Button
                style={{ backgroundColor: "#3c90ab", color: "white" }}
                onClick={() => handleIncrease(product.codigo)}
                disabled={parseFloat(product.totalToBuy) >= MAX_CANTIDAD}
              >
                +
              </Button>
            </div>

            <ListItemText secondary={`$${math.round(product.totalPrice, 2)}`} />
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default ProductInnerNotification
