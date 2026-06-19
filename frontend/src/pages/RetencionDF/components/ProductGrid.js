// app/FacturaDesdeArticulos/components/ProductGrid.jsx

import React from "react"
import { Grid, Typography, Box } from "@mui/material"
import ProductCard from "./ProductCard"

const ProductGrid = ({ productos, setProductosAgregados }) => {
  const handleAgregarProducto = (producto, cantidad) => {
    setProductosAgregados((prev) => {
      const existe = prev.find((p) => p.artcodigo === producto.artcodigo)
      if (existe) {
        return prev.map((p) =>
          p.artcodigo === producto.artcodigo ? { ...p, cantidadPedido: p.cantidadPedido + cantidad } : p,
        )
      }
      return [...prev, { ...producto, cantidadPedido: cantidad }]
    })
  }

  if (productos.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No hay productos disponibles
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      {productos.map((producto) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={producto.artcodigo}>
          <ProductCard producto={producto} onAgregar={handleAgregarProducto} />
        </Grid>
      ))}
    </Grid>
  )
}

export default ProductGrid
