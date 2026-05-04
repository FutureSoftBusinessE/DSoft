// Este funcion sirve para estbalecer un formato comun de la proforma
// ya que la proforma se esta usando en dos sitios a la vez
// (en el carrito y en la pagina proforma). Y este formato
// es el que se va guardar en el estado global cart (cartStore)

// Es casi lo mismo que se hace en la funcion pushToCart

// el parametro cart debe ser el detalle que llega  del getProforma api
import math from "../../pages/utils/math"

const formatItemCart = (cart) => {
  const price = math.number(cart.precio) // value of each product unit
  const priceIVA = price * (cart.sysiva / 100) // value iva of each product unit

  const totalIVA = priceIVA * cart.pedcantidad

  const totalPrice = price * cart.pedcantidad

  const totalPriceWithIVA = totalPrice + totalIVA // Subtotal Bruto

  let porcentajeDescuentoEsNulo = false
  porcentajeDescuentoEsNulo = cart?.porcentajeDescuento == null

  // Logica de descuento, recordar que el descuento solo se carga cuando ya es esta en la pagina de la proforma y no cuando se selecciona un producto en filtros o qr
  const porcentajeDescuento = cart?.porcentajeDescuento ?? 0
  const descuentoUnitario = price * (porcentajeDescuento / 100)
  const descuentoTotal = cart.pedcantidad * descuentoUnitario
  const descuentoTotalIVA = descuentoTotal + totalIVA
  const totalPriceWithDescuento = totalPrice - descuentoTotal
  const totalPriceWithIVADesc = totalPrice - descuentoTotal // Subtotal Neto

  const cartFormatted = {
    ...cart,
    priceIVA, // value iva of each product unit (dont change)
    price, // value of each product unit (dont change)
    totalToBuy: cart.pedcantidad,
    maxTotalStockToBuy: Infinity,
    totalPrice, // Subtotal
    totalIVA, // IVA
    totalPriceWithIVA, // total = totalPrice + totalIVA
    porcentajeDescuento: porcentajeDescuentoEsNulo ? null : porcentajeDescuento,
    descuentoUnitario,
    descuentoTotal,
    descuentoTotalIVA,
    totalPriceWithDescuento,
    totalPriceWithIVADesc,
  }

  return cartFormatted
}

export default formatItemCart
