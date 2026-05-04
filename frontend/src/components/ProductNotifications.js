import { Badge, Grid, IconButton, List, ListItem, ListItemText, Popover, CircularProgress } from "@mui/material"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"
import CloseIcon from "@mui/icons-material/Close"
import { Link, json, useNavigate } from "react-router-dom"
import { useCartStore } from "../stores/cartStore"

import * as React from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import Modal from "@mui/material/Modal"
import ProductInnerNotification from "./ProductInnerNotification"
import { useState } from "react"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import truncateNumber from "../pages/utils/math/truncate"
import math from "../pages/utils/math"
import CustomBackdrop from "../components/CustomBackdrop"

import { useMutation } from "@tanstack/react-query"
import { useQuery, showError, errorHandler, notificationService } from "../api"

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  heigth: "90vh",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  overflow: "scroll",
}

export default function Cart({ type = "default", handleProductsProfoma }) {
  const [anchorEl, setAnchorEl] = React.useState(null)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? "cart-popover" : undefined

  // -------------NUEVOOOOOOOOOO
  // const [open, setOpen] = React.useState(false);
  // const handleOpen = () => setOpen(true);
  // const handleClose = () => setOpen(false);

  const [isLoading, setIsLoading] = useState(false)
  const [loadFails, setLoadFails] = useState(false)
  const navigate = useNavigate()
  const [showSelectionModal, setShowSelectionModal] = useState(false)

  const {
    data: infoPermisosProforma = {},
    isLoading: isLoadingInfoPermisosProforma,
    refetch: refetchInfoPermisosProforma,
    isRefetching: isRefetchInfoPermisosProforma,
  } = useQuery({
    queryKey: ["isLoadinginfoPermisosProforma"],
    url: "/proformas/getInfoPermisosProforma",
    enabled: false,
  })

  const formatCartProductsProforma = (cart, cabeceraProforma) => {
    const user = localStorage.getItem("cliciausu")
    const newDetalleProforma = cart.map((item) => {
      const newDetalle = {
        artcodigo: item.cabecera.codigo,
        artdescri: item.cabecera.descripcion,
        pedcantidad: item.totalToBuy,
        pedprecio: Number(item.cabecera.precio),
        pediva: 12,
        pedvaldesc: 0,
        pedvalor: truncateNumber(item.totalToBuy * item.cabecera.precio),
        // pedvaltot: truncateNumber(
        //   item.totalToBuy * item.cabecera.cantidad +
        //     item.totalToBuy * item.cabecera.cantidad * 0.12
        pedvalsubtot: truncateNumber(item.totalToBuy * item.cabecera.precio),
        pedivaliva: truncateNumber(item.totalToBuy * item.cabecera.precio * 0.12),
        pedvaltot: truncateNumber(item.totalToBuy * item.cabecera.precio * 1.12),
        user,
        pedusuisys: user,
        pednumped: cabeceraProforma.numPed,
        pedstatus: "P",
      }
      return newDetalle
    })

    console.log(newDetalleProforma, "hereeeeeeee***")
    // setDetalleProforma(newDetalleProforma);
    return newDetalleProforma
  }

  // //--------------------------------------------------------------

  //                     NEW !!!!!!
  // //--------------------------------------------------------------

  const { cart, getTotalsPrices, clearUseCartStoreStorage } = useCartStore()
  // const [isLoadingProforma, setIsLoadingProforma] = useState(false);

  // call UPDATE hook
  const { mutateAsync: createProforma, isPending: isCreatingProforma } = useCreateProforma()

  // UPDATE hook (put Proforma in api)
  function useCreateProforma() {
    return useMutation({
      mutationFn: async (proforma) => {
        // send api update request here
        const options = {
          method: "POST",
          body: JSON.stringify({
            ...proforma,
          }),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }

        let response = await fetchwrapper("/proformas/createProforma", options)
        response = await response.json()

        return response.numPed
      },
    })
  }
  const handleCreateProforma = async () => {
    const detalle = cart

    // Generate cabecera
    /* const totalProductsWithoutIVA = cart.reduce(
      (partialSum, value) => (value.sysiva === 0 ? partialSum + 1 : partialSum),
      0
    );
    const totalProductsWithIVA = cart.length - totalProductsWithoutIVA;

    const { subTotal, IVA, total } = getTotalsPrices();

    const cabecera = {
      pedtivacer: totalProductsWithoutIVA,
      pedtivapor: totalProductsWithIVA,
      pedsubtot: math.round(subTotal, 2),
      pediva: math.round(IVA, 2),
      pedtotal: math.round(total, 2),
    };

    const proforma = {
      cabecera,
      detalle,
    }; */

    // 09/02/2025: Al momento de crear la proforma, se tiene que verficar que el usuario sea vendedor
    // y ademas que tenga la posibilidad de elegir si quiere hacer una proforma como siempre se ha hecho en web
    // o si quiere hacer un pedido web en el caso que tenga permiso para hacer las dos
    // y si solo tiene la opcion de hacer una de las dos entonces va directo a la ruta que corresponde
    try {
      const data = await refetchInfoPermisosProforma()

      if (data?.isError) {
        throw data?.error
      }

      // Los datos YA están en refetchResult.data (formateados por tu hook)
      const permisosData = data.data

      // Acceder a la estructura { data, metadata, message }
      if (!permisosData?.data) {
        throw new Error("No se recibieron datos de permisos")
      }

      const { pedidossiac, pedidosweb } = permisosData.data

      handleClose()

      // Caso 1: Ambos habilitados
      if (pedidossiac && pedidosweb) {
        setShowSelectionModal(true)
        return
      }

      // Caso 2: Solo SIAC habilitado
      if (pedidossiac && !pedidosweb) {
        navigate(`/home/dashboard/Proformas / EmisionProforma`)
        return
      }

      // Caso 3: Solo Web habilitado
      if (!pedidossiac && pedidosweb) {
        navigate(`/home/dashboard/EmisionPedidoWeb`)
        return
      }

      // Caso 4: Ninguno habilitado
      alert("No tiene permisos para crear proformas ni pedidos web")

      // const idProforma = await createProforma(proforma);
      // clearUseCartStoreStorage()
      // Update store cart
      // setIdProformaCart(idProforma);
      // // setCabeceraCart({})
      // enableProformaProcess();

      // alert(`Proforma ${idProforma} creada con exito`);
    } catch (error) {
      try {
        const apiError = errorHandler.normalizeError(error)
        notificationService.showError(apiError)
      } catch {
        alert("No se pudo crear la proforma")
      }
    }
  }

  const [totalPrices, setTotalPrices] = useState({
    subTotal: 0,
    IVA: 0,
    total: 0,
    subtotalNeto: 0,
  })

  React.useEffect(() => {
    const { subTotal, IVA, total, subtotalNeto } = getTotalsPrices()
    setTotalPrices({
      subTotal,
      IVA,
      total,
      subtotalNeto,
    })
  }, [cart, cart.length])

  return (
    <React.Fragment>
      <CustomBackdrop
        isLoading={isCreatingProforma || isLoadingInfoPermisosProforma || isRefetchInfoPermisosProforma}
      />

      <div>
        <Button aria-describedby={id} onClick={handleClick}>
          <Badge badgeContent={cart.length} color="primary">
            <ShoppingCartIcon style={{ color: "#114B5E" }} />
          </Badge>
        </Button>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          PaperProps={{
            style: { width: "70%" },
          }}
        >
          <Grid container sx={{ marginTop: "1rem", marginBottom: "1rem" }}>
            {cart.length === 0 ? (
              <Box sx={{ margin: "1.5rem" }}>No items</Box>
            ) : (
              <>
                {cart.map((item, index) => (
                  <>
                    <Grid item xs={12} key={item.codigo}>
                      <ProductInnerNotification
                        product={item}
                        MIN_CANTIDAD={1}
                        // MAX_CANTIDAD={item.maxTotalStockToBuy}
                        MAX_CANTIDAD={Infinity}
                      />
                      <hr />
                    </Grid>
                  </>
                ))}
                <Grid item xs={12} sx={{ textAlign: "center", marginBottom: "10px" }}>
                  <strong>Subtotal:</strong> ${math.round(totalPrices.subTotal, 2)}
                  <br />
                  <strong>IVA:</strong> {math.round(totalPrices.IVA, 2)}
                  <br />
                  <strong>Total:</strong> ${math.round(totalPrices.total, 2)}
                  <br />
                </Grid>
              </>
            )}
          </Grid>

          {isCreatingProforma ? (
            <CircularProgress size={24} />
          ) : (
            <>
              {type === "default" && (
                <>
                  {cart.length !== 0 ? (
                    <Button
                      variant="contained"
                      style={{ backgroundColor: "#196C87", color: "white" }}
                      sx={{ width: "100%", margin: "0 auto", display: "block" }}
                      onClick={handleCreateProforma}
                      // disabled={!isCreatingProforma}
                    >
                      Siguiente
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      style={{ backgroundColor: "gray", color: "white" }}
                      sx={{ width: "100%", margin: "0 auto", display: "block" }}
                      onClick={() => navigate(`/home/dashboard/Creacion de Catalogos/Filtros`)}
                      disabled={true}
                    >
                      Agregue productos proformar
                    </Button>
                  )}
                </>
              )}
              {/* ---El tipo modal solo se usa cuando se esta en la pagina de profoma/pedidos y el default es usado globalmente */}
              {type === "modal" && (
                <>
                  {cart.length !== 0 ? (
                    <Button
                      variant="contained"
                      style={{ backgroundColor: "#196C87", color: "white" }}
                      sx={{ width: "100%", margin: "0 auto", display: "block" }}
                      onClick={() => handleProductsProfoma()}
                      // disabled={!isCreatingProforma}
                    >
                      Añadir productos a la proforma
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      style={{ backgroundColor: "gray", color: "white" }}
                      sx={{ width: "100%", margin: "0 auto", display: "block" }}
                      onClick={() => navigate(`/home/dashboard/Creacion de Catalogos/Filtros`)}
                      disabled={true}
                    >
                      Agregue productos a la proforma
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </Popover>
      </div>
      {showSelectionModal && (
        <Modal open={showSelectionModal} onClose={() => setShowSelectionModal(false)}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 350,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 24,
              p: 3,
              textAlign: "center",
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: "#333", fontWeight: 500 }}>
              ¿Qué desea crear?
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowSelectionModal(false)
                  navigate(`/home/dashboard/Proformas / EmisionProforma`)
                }}
                sx={{
                  flex: 1,
                  borderColor: "#1976d2",
                  color: "#1976d2",
                  "&:hover": {
                    borderColor: "#1565c0",
                    backgroundColor: "rgba(25, 118, 210, 0.04)",
                  },
                }}
              >
                Proforma
              </Button>

              <Button
                variant="outlined"
                onClick={() => {
                  setShowSelectionModal(false)
                  navigate(`/home/dashboard/EmisionPedidoWeb`)
                }}
                sx={{
                  flex: 1,
                  borderColor: "#2e7d32",
                  color: "#2e7d32",
                  "&:hover": {
                    borderColor: "#1b5e20",
                    backgroundColor: "rgba(46, 125, 50, 0.04)",
                  },
                }}
              >
                Pedido Web
              </Button>
            </Box>

            <Button
              fullWidth
              variant="text"
              onClick={() => setShowSelectionModal(false)}
              sx={{
                mt: 3,
                color: "#666",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              Cancelar
            </Button>
          </Box>
        </Modal>
      )}
    </React.Fragment>
  )
}
