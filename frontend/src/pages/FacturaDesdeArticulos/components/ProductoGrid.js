import React, { useState } from "react"
import {
  Grid,
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Pagination,
} from "@mui/material"
import { Carousel } from "primereact/carousel"
import CloseIcon from "@mui/icons-material/Close"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import CustomTooltip from "../../../components/ToolTip"

const ProductGrid = ({ productos, setProductosAgregados }) => {
  const [openProduct, setOpenProduct] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState({})
  const [page, setPage] = useState(1)
  const itemsPerPage = 6 // Cantidad de productos por página

  // Calcular el índice inicial y final de los productos que se van a mostrar
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const productosPaginados = productos.slice(startIndex, endIndex)

  const handlePageChange = (event, value) => {
    setPage(value)
  }

  const handleOpenProduct = (producto) => {
    setSelectedProduct(producto)
    setCantidadSeleccionada((prev) => ({
      ...prev,
      [producto.artcodigo]: 1, // Restablece la cantidad seleccionada a 1 cuando se abre el modal
    }))
    setOpenProduct(true)
  }

  const handleCloseProduct = () => {
    setOpenProduct(false)
    setSelectedProduct(null)
  }

  const itemTemplate = (imagen) => (
    <img
      src={`data:image/jpeg;base64,${imagen}`}
      alt="Producto"
      style={{
        width: "100%",
        height: "300px",
        objectFit: "cover",
        borderRadius: "8px",
      }}
    />
  )

  const handleIncrement = () => {
    if (cantidadSeleccionada[selectedProduct.artcodigo] < selectedProduct.artcantactual) {
      setCantidadSeleccionada((prev) => ({
        ...prev,
        [selectedProduct.artcodigo]: prev[selectedProduct.artcodigo] + 1,
      }))
    } else {
      alert("La cantidad no puede exceder el stock disponible.")
    }
  }

  const handleDecrement = () => {
    if (cantidadSeleccionada[selectedProduct.artcodigo] > 1) {
      setCantidadSeleccionada((prev) => ({
        ...prev,
        [selectedProduct.artcodigo]: prev[selectedProduct.artcodigo] - 1,
      }))
    }
  }

  const handleAgregarProducto = (producto) => {
    const cantidad = cantidadSeleccionada[producto.artcodigo]
    setProductosAgregados((prevProductos) => {
      const productoExistente = prevProductos.find((p) => p.artcodigo === producto.artcodigo)
      if (productoExistente) {
        // Si el producto ya está en el pedido, actualiza su cantidadPedido
        return prevProductos.map((p) =>
          p.artcodigo === producto.artcodigo ? { ...p, cantidadPedido: p.cantidadPedido + cantidad } : p,
        )
      }
      // Si el producto no está en el pedido, añádelo con cantidadPedido
      return [...prevProductos, { ...producto, cantidadPedido: cantidad }]
    })
    handleCloseProduct() // Cierra el modal después de agregar el producto
  }

  return (
    <div>
      <Grid item xs={12} sm={10} md={8} lg={6}>
        <Box></Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
            height: "100%",
            overflowY: "auto",
          }}
        >
          {productosPaginados.map((producto) => (
            <Card
              key={producto.id}
              sx={{ maxWidth: 345, padding: 2, borderRadius: 2, boxShadow: 2 }}
              onClick={() => handleOpenProduct(producto)}
            >
              <CardMedia
                component="img"
                height="140"
                image={`data:image/jpeg;base64,${producto.imagen}`}
                alt={producto.nombre}
              />
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight="bold">
                    Código: {producto.artcodigo}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${parseFloat(producto.artprecventa1).toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="subtitle1" component="div">
                  <strong>Descripción:</strong> {producto.artdescri}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Marca:</strong> {producto.mardescri} <br />
                  <strong>Medida:</strong> {producto.meddescri} <br />
                  <strong>Presentación:</strong> {producto.predescri} <br />
                  <strong>Línea:</strong> {producto.lindescri} <br />
                  <strong style={{ color: parseFloat(producto.artcantactual) > 0 ? "inherit" : "red" }}>
                    Cantidad: {parseFloat(producto.artcantactual).toFixed(2)}
                  </strong>
                </Typography>
                <CustomTooltip title={parseFloat(producto.artcantactual) === 0 ? "Este producto tiene stock 0" : ""}>
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                      disabled={parseFloat(producto.artcantactual) === 0}
                    >
                      Añadir al pedido
                    </Button>
                  </span>
                </CustomTooltip>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Grid>

      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination
          count={Math.ceil(productos.length / itemsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {selectedProduct && (
        <Dialog open={openProduct} onClose={handleCloseProduct} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Información del producto</Typography>
            <IconButton onClick={handleCloseProduct}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box display="flex" gap={2}>
              <Box width="50%">
                <Carousel
                  value={selectedProduct.imagenes}
                  numVisible={1}
                  numScroll={1}
                  circular
                  autoplayInterval={3000}
                  itemTemplate={itemTemplate}
                />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {selectedProduct.artdescri}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {selectedProduct.artdescri}
                </Typography>
                <Typography variant="h5" color="primary" mt={2}>
                  ${parseFloat(selectedProduct.artprecventa1).toFixed(2)}
                </Typography>
                <Box mt={2}>
                  <Typography variant="body2">
                    <strong>Código:</strong> {selectedProduct.artcodigo}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Marca:</strong> {selectedProduct.mardescri}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Medida:</strong> {selectedProduct.meddescri}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Presentación:</strong> {selectedProduct.predescri}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Línea:</strong> {selectedProduct.lindescri}
                  </Typography>
                  <Typography variant="body2">
                    <strong>IVA:</strong> {selectedProduct.sysiva}%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Stock total:</strong> {selectedProduct.artcantactual}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="center" mt={3} mb={1}>
              <IconButton onClick={handleDecrement} color="primary">
                <RemoveIcon />
              </IconButton>
              <TextField
                value={cantidadSeleccionada[selectedProduct.artcodigo] || 1}
                size="small"
                sx={{ width: "50px", textAlign: "center", mx: 1 }}
                inputProps={{ readOnly: true }}
              />
              <IconButton onClick={handleIncrement} color="primary">
                <AddIcon />
              </IconButton>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseProduct} color="secondary">
              Cancelar
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleAgregarProducto(selectedProduct)}>
              Agregar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  )
}

export default ProductGrid
