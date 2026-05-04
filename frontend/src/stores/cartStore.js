import { create } from "zustand"
import { persist } from "zustand/middleware"

// El carrito es un proceso bloqueante,
// significa que si se tiene abierto una proforma en el carrito
// a su vez la pagina dashboard/Proforma/:id tendra lo mismo que cotenga el carrito
// Simempre carrito y pagina dashboard/Proforma/:id seran las mismas

// El idProforma de este estado cart store determinara si se tiene un proforma en curso o no
// Null siginifica que no se esta trabajando con ninguna
// y si tiene un valor idProforma significa que hay una proforma con la que se esta trabajando

// {
//   "cart": [
//     {
//       "codigo": String,
//       "descripcion": String,
//       "precio": String,
//       "medida":String ,
//       "marca": String,
//       "presentacion": String,
//       "linea": String,
//       "cantidad": String,
//       "artapliiva": Number,
//       "sysiva": Number,
//       "bodegas"?: [
//         {
//           "bodcodigo": String,
//           "bodega": String,
//           "localidad": String,
//           "cantidad_bodega": String
//         }
//       ],
//       "priceIVA": 6.515999999999999,
//       "price": 54.3,
//       "totalToBuy": 6,
//       "maxTotalStockToBuy": 28,
//       "totalPrice": 325.79999999999995,
//       "totalIVA": 39.096,
//       "totalPriceWithIVA": 364.89599999999996
//     }hay alguna proforma activa
//   ],
//   "idProforma"?: String,
// }

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      // idProforma: null,
      // cabecera: {},
      // existsActiveProforma: false, // Si esta false significa que no se esta trabajando con ninga profrorma, y si tiene un valor significa que hay un proforma abierta con la que se esta trabajando

      // enableProformaProcess: () => {
      //   set({ existsActiveProforma: true });
      // },
      // disableProformaProcess: () => {
      //   set({ existsActiveProforma: false });
      // },

      // setCart: (upadtedCart) => {
      //   set({ cart: upadtedCart });
      // },

      // setCabeceraCart: (updatedCabecera) => {
      //   set({ cabecera: updatedCabecera });
      // },

      // setIdProformaCart: (updatedIdProforma) => {
      //   set({ idProforma: updatedIdProforma });
      // },
      setAllCart: (newCart) => {
        set({ cart: newCart })
      },
      clearUseCartStoreStorage: () => {
        set({ cart: [] })
        console.log("elimanandoooo")
        localStorage.removeItem("cart")
      },

      add: (product) => {
        const { cart } = get()
        const updatedCart = updateCart(product, cart)
        set({ cart: updatedCart })
      },

      remove: (idProduct) => {
        const { cart } = get()
        const updatedCart = removeCart(idProduct, cart)
        set({ cart: updatedCart })
      },

      increaseQuantity: (idProduct) => {
        const { cart } = get()
        const updatedCart = modifyQuantity(idProduct, cart, "+")
        set({ cart: updatedCart })
      },
      decreaseQuantity: (idProduct) => {
        const { cart } = get()
        const updatedCart = modifyQuantity(idProduct, cart, "-")
        set({ cart: updatedCart })
      },

      setSpecificQuantity: (idProduct, quantity) => {
        const { cart } = get()
        const updatedCart = setQuantity(idProduct, cart, quantity)
        set({ cart: updatedCart })
      },

      getTotalsPrices: () => {
        const { cart } = get()
        const subTotal = cart.reduce((partialSum, value) => partialSum + value.totalPrice, 0)
        const IVA = cart.reduce((partialSum, value) => partialSum + value.totalIVA, 0)
        const total = cart.reduce((partialSum, value) => partialSum + value.totalPriceWithIVA, 0)

        const subtotalNeto = cart.reduce((partialSum, value) => partialSum + value?.totalPriceWithDescuento ?? 0, 0)

        const descuentoTotal = cart.reduce((partialSum, value) => partialSum + value?.descuentoTotal ?? 0, 0)

        return {
          subTotal,
          IVA,
          total,
          subtotalNeto,
          descuentoTotal,
        }
      },
    }),
    {
      name: "cart",
    },
  ),
)

function updateCart(product, cart) {
  const existingItemIndex = cart.findIndex((item) => item.codigo === product.codigo)

  // If item exist in cart
  if (existingItemIndex !== -1) {
    const updatedCart = cart.map((item, index) => {
      if (index === existingItemIndex) {
        return product
      }
      return item
    })
    return updatedCart
  } else {
    const upadatedCart = [...cart]
    upadatedCart.push(product)
    return upadatedCart
  }
}

// eslint-disable-next-line no-unused-vars
function removeCart1(idProduct, cart) {
  const existingItemIndex = cart.findIndex((item) => item.codigo === idProduct)
  cart.splice(existingItemIndex, 1)
  return cart
}
function removeCart(idProduct, cart) {
  const updatedCart = cart.filter((item) => item.codigo !== idProduct)
  return updatedCart
}

function modifyQuantity(idProduct, cart, operation) {
  if (operation === "+") {
    const updatedCart = cart.map((item) => {
      if (item.codigo === idProduct) {
        const newTotalToBuy = parseFloat((item.totalToBuy + 0.1).toFixed(2))

        const newTotalPrice = newTotalToBuy * item.price // SUBOTAL
        const newTotalIVA = newTotalToBuy * item.priceIVA // IVA
        const newTotalPriceWithIVA = newTotalPrice + newTotalIVA // TOTAL

        return {
          ...item,
          totalToBuy: newTotalToBuy,
          totalPrice: newTotalPrice,
          totalIVA: newTotalIVA,
          totalPriceWithIVA: newTotalPriceWithIVA,
        }
      }
      return item
    })

    return updatedCart
  }

  if (operation === "-") {
    const updatedCart = cart.map((item) => {
      if (item.codigo === idProduct) {
        const newTotalToBuy = parseFloat((item.totalToBuy - 0.1).toFixed(2))

        const newTotalPrice = newTotalToBuy * item.price // SUBOTAL
        const newTotalIVA = newTotalToBuy * item.priceIVA // IVA
        const newTotalPriceWithIVA = newTotalPrice + newTotalIVA // TOTAL

        return {
          ...item,
          totalToBuy: newTotalToBuy,
          totalPrice: newTotalPrice,
          totalIVA: newTotalIVA,
          totalPriceWithIVA: newTotalPriceWithIVA,
        }
      }
      return item
    })

    return updatedCart
  }

  return cart
}

export function setQuantity(idProduct, cart, quantity) {
  const updatedCart = cart.map((item) => {
    if (item.codigo === idProduct) {
      const newTotalToBuy = quantity

      const newTotalPrice = newTotalToBuy * item.price // SUBOTAL
      const newTotalIVA = newTotalToBuy * item.priceIVA // IVA
      const newTotalPriceWithIVA = newTotalPrice + newTotalIVA // TOTAL

      // Logica de descuento, recordar que el descuento solo se carga cuando ya es esta en la pagina de la proforma y no cuando se selecciona un producto en filtros o qr
      const porcentajeDescuento = item?.porcentajeDescuento ?? 0
      const descuentoUnitario = item.price * (porcentajeDescuento / 100)
      const descuentoTotal = newTotalToBuy * descuentoUnitario
      const descuentoTotalIVA = descuentoTotal + newTotalIVA
      const totalPriceWithDescuento = newTotalPrice - descuentoTotal
      const totalPriceWithIVADesc = totalPriceWithDescuento * (1 + item.sysiva / 100) // Subtotal Neto

      console.log(
        porcentajeDescuento,
        descuentoUnitario,
        descuentoTotal,
        descuentoTotalIVA,
        totalPriceWithDescuento,
        totalPriceWithIVADesc,
        "aquiiiiipppp",
      )

      return {
        ...item,
        totalToBuy: newTotalToBuy,
        totalPrice: newTotalPrice,
        totalIVA: newTotalIVA,
        totalPriceWithIVA: newTotalPriceWithIVA,
        descuentoTotalIVA,
        totalPriceWithIVADesc,
      }
    }
    return item
  })

  return updatedCart
}
