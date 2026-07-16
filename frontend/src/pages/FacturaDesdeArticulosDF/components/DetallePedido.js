import React from "react"
import { Box, Typography, List, Divider, Button, IconButton, TextField } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import DeleteIcon from "@mui/icons-material/Delete"

const DetallePedido = ({ productosAgregados, setProductosAgregados, onRealizarPedido, onchangeDetalleAdicional }) => {
  // Calcular totales
  const calcularTotales = () => {
    let subtotal = 0
    let descuentoTotal = 0
    let ivaTotal = 0

    productosAgregados.forEach((producto) => {
      const cantidad = producto.cantidadPedido
      const precioUnitario = producto.precioUnitario
      const descuentoPorcentaje = producto.descuentoPorcentaje || 0
      const ivaPorcentaje = producto.ivaPorcentaje || 0

      const subtotalProducto = precioUnitario * cantidad
      const descuentoProducto = subtotalProducto * (descuentoPorcentaje / 100)
      const subtotalConDescuento = subtotalProducto - descuentoProducto
      const ivaProducto = subtotalConDescuento * (ivaPorcentaje / 100)

      subtotal += subtotalProducto
      descuentoTotal += descuentoProducto
      ivaTotal += ivaProducto
    })

    const total = subtotal - descuentoTotal + ivaTotal

    return { subtotal, descuentoTotal, ivaTotal, total }
  }

  const { subtotal, descuentoTotal, ivaTotal, total } = calcularTotales()

  const handleIncrement = (artcodigo) => {
    setProductosAgregados((prev) =>
      prev.map((producto) =>
        producto.artcodigo === artcodigo ? { ...producto, cantidadPedido: producto.cantidadPedido + 1 } : producto,
      ),
    )
  }

  const handleDecrement = (artcodigo) => {
    setProductosAgregados((prev) =>
      prev.map((producto) =>
        producto.artcodigo === artcodigo && producto.cantidadPedido > 1
          ? { ...producto, cantidadPedido: producto.cantidadPedido - 1 }
          : producto,
      ),
    )
  }

  const handleCantidadChange = (artcodigo, value) => {
    const nuevaCantidad = parseInt(value)
    if (!isNaN(nuevaCantidad) && nuevaCantidad >= 1) {
      setProductosAgregados((prev) =>
        prev.map((producto) =>
          producto.artcodigo === artcodigo ? { ...producto, cantidadPedido: nuevaCantidad } : producto,
        ),
      )
    }
  }

  const handleRemove = (artcodigo) => {
    setProductosAgregados((prev) => prev.filter((producto) => producto.artcodigo !== artcodigo))
  }

  if (productosAgregados.length === 0) {
    return (
      <Box
        sx={{
          padding: "20px",
          backgroundColor: "#f4f4f4",
          borderRadius: "8px",
          height: "100%",
          textAlign: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Detalles del Pedido
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No hay productos agregados
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ padding: "20px", backgroundColor: "#f4f4f4", borderRadius: "8px", height: "100%", overflow: "auto" }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Detalles del Pedido
      </Typography>

      <List>
        {productosAgregados.map((producto, index) => {
          const subtotalProducto = producto.precioUnitario * producto.cantidadPedido
          const descuentoProducto = subtotalProducto * ((producto.descuentoPorcentaje || 0) / 100)
          const ivaProducto = (subtotalProducto - descuentoProducto) * ((producto.ivaPorcentaje || 0) / 100)
          const totalProducto = subtotalProducto - descuentoProducto + ivaProducto

          return (
            <Box
              key={producto.artcodigo}
              mb={2}
              sx={{
                padding: "10px",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                border: "1px solid #ddd",
              }}
            >
              <Typography variant="body1" fontWeight="bold">
                {producto.artdescri}
              </Typography>
              <Typography variant="body2" color="textSecondary" fontSize="12px">
                Código: {producto.artcodigo}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Precio unitario: ${producto.precioUnitario.toFixed(2)}
              </Typography>
              {producto.descuentoPorcentaje > 0 && (
                <Typography variant="body2" color="error" fontSize="12px">
                  Descuento: {producto.descuentoPorcentaje}%
                </Typography>
              )}
              <Typography variant="body2" color="textSecondary" fontSize="12px">
                IVA: {producto.ivaPorcentaje}%
              </Typography>

              <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                <Box display="flex" alignItems="center">
                  <IconButton onClick={() => handleDecrement(producto.artcodigo)} size="small">
                    <RemoveIcon />
                  </IconButton>
                  <TextField
                    size="small"
                    value={producto.cantidadPedido}
                    onChange={(e) => handleCantidadChange(producto.artcodigo, e.target.value)}
                    inputProps={{ style: { textAlign: "center", width: 50 } }}
                    sx={{ mx: 1 }}
                  />
                  <IconButton onClick={() => handleIncrement(producto.artcodigo)} size="small">
                    <AddIcon />
                  </IconButton>
                  <IconButton onClick={() => handleRemove(producto.artcodigo)} size="small" sx={{ ml: 1 }}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  ${totalProducto.toFixed(2)}
                </Typography>
              </Box>

              {/* NUEVO: Campo opcional para detalle adicional */}
              <TextField
                fullWidth
                size="small"
                placeholder="Detalle adicional (opcional)"
                value={producto.peddetalleadicional || ""}
                onChange={(e) => {
                  if (onchangeDetalleAdicional) {
                    onchangeDetalleAdicional(index, e.target.value)
                  }
                }}
                sx={{ mt: 1 }}
                inputProps={{ maxLength: 300 }}
              />
            </Box>
          )
        })}
      </List>

      <Divider sx={{ my: 2 }} />

      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="body1">Subtotal</Typography>
        <Typography variant="body1" fontWeight="bold">
          ${subtotal.toFixed(2)}
        </Typography>
      </Box>

      {descuentoTotal > 0 && (
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body1" color="error">
            Descuento
          </Typography>
          <Typography variant="body1" color="error" fontWeight="bold">
            -${descuentoTotal.toFixed(2)}
          </Typography>
        </Box>
      )}

      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="body1">IVA</Typography>
        <Typography variant="body1" fontWeight="bold">
          ${ivaTotal.toFixed(2)}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          TOTAL
        </Typography>
        <Typography variant="h6" fontWeight="bold" color="primary">
          ${total.toFixed(2)}
        </Typography>
      </Box>

      <Button variant="contained" color="primary" fullWidth onClick={onRealizarPedido}>
        Realizar Pedido
      </Button>
    </Box>
  )
}

export default DetallePedido
