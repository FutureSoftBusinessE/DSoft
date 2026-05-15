// app/FacturaDesdeArticulos/components/ProductCard.jsx

import React, { useState } from "react"
import { Card, CardMedia, CardContent, Typography, Box, TextField, Button, IconButton } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"

const ProductCard = ({ producto, onAgregar }) => {
  const [cantidad, setCantidad] = useState(1)

  const handleIncrement = () => {
    setCantidad((prev) => prev + 1)
  }

  const handleDecrement = () => {
    setCantidad((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const handleCantidadChange = (e) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value >= 1) {
      setCantidad(value)
    } else if (e.target.value === "") {
      setCantidad("")
    }
  }

  const handleBlur = () => {
    if (cantidad === "" || cantidad < 1) {
      setCantidad(1)
    }
  }

  const handleAgregar = () => {
    const cantidadFinal = cantidad === "" ? 1 : cantidad
    onAgregar(producto, cantidadFinal)
    setCantidad(1) // Resetear cantidad después de agregar
  }

  const precioConDescuento = producto.precioUnitario * (1 - (producto.descuentoPorcentaje || 0) / 100)

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      {producto.descuentoPorcentaje > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: "error.main",
            color: "white",
            padding: "2px 8px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "bold",
            zIndex: 1,
          }}
        >
          -{producto.descuentoPorcentaje}%
        </Box>
      )}

      {producto.imagen ? (
        <CardMedia
          component="img"
          height="140"
          image={`data:image/jpeg;base64,${producto.imagen}`}
          alt={producto.artdescri}
          sx={{ objectFit: "contain", p: 1, backgroundColor: "#f5f5f5" }}
        />
      ) : (
        <Box
          sx={{
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Sin imagen
          </Typography>
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap title={producto.artdescri}>
          {producto.artdescri}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontSize="12px">
          Código: {producto.artcodigo}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontSize="12px">
          Stock: {producto.artcantactual}
        </Typography>
        <Box sx={{ mt: 1 }}>
          {producto.descuentoPorcentaje > 0 ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                ${producto.precioUnitario.toFixed(2)}
              </Typography>
              <Typography variant="h6" color="primary">
                ${precioConDescuento.toFixed(2)}
              </Typography>
            </>
          ) : (
            <Typography variant="h6" color="primary">
              ${producto.precioUnitario.toFixed(2)}
            </Typography>
          )}
        </Box>
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <IconButton
            onClick={handleDecrement}
            size="small"
            disabled={!producto.esServicio && producto.artcantactual <= 0}
          >
            <RemoveIcon />
          </IconButton>
          <TextField
            size="small"
            value={cantidad}
            onChange={handleCantidadChange}
            onBlur={handleBlur}
            inputProps={{ style: { textAlign: "center", width: 50 } }}
            disabled={!producto.esServicio && producto.artcantactual <= 0}
            sx={{ mx: 1 }}
          />
          <IconButton
            onClick={handleIncrement}
            size="small"
            disabled={!producto.esServicio && producto.artcantactual <= 0}
          >
            <AddIcon />
          </IconButton>
        </Box>
        <Button
          fullWidth
          variant="contained"
          onClick={handleAgregar}
          disabled={!producto.esServicio && producto.artcantactual <= 0}
        >
          Agregar
        </Button>
      </Box>
    </Card>
  )
}

export default ProductCard
