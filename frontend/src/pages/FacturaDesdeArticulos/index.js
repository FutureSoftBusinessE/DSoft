/* eslint-disable camelcase */
import React, { useContext, useState } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box } from "@mui/material"

import BackIcon from "../../components/BackIcon"

import { useNavigate } from "react-router-dom"

import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import normalFormatDate from "../utils/date/DDMMYYYFormatDate"
import {
  handleExportDataPdfLGScreen,
  handleExportDataPdfSMScreen,
  handleAllExportDataCSV,
} from "../utils/reactTableActions/exportToolbarActions"
import { GlobalContext } from "../../contexts/GlobalContext"
import CustomBackdrop from "../../components/CustomBackdrop"
import Swal from "sweetalert2"
import getIconComponent from "../utils/getIconComponent"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "../../api"

const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(8),
  flexGrow: 1,
  padding: "0 16px",
  height: "100vh",
}))

const theme = createTheme({
  palette: {
    primary: {
      main: "#196C87",
    },
    secondary: {
      main: "#196C87",
    },
  },
})

const ACCIONES = {
  CREAR: "CREAR",
  BUSCAR: "BUSCAR",
  EDITAR: "EDITAR",
  ELIMINAR: "ELIMINAR",
  EXPORTAR: "EXPORTAR",
  IMPORTAR: "IMPORTAR",
  FACTURAR: "FACTURAR",
  AUTORIZAR: "AUTORIZAR",
  RIDE: "RIDE",
}

const FacturaDesdeArticulos = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Función para llamar a facturarProforma (PASO 1: Crear factura + Obtener payload)
   */
  const handleFacturar = async (row) => {
    try {
      // Confirmación con SweetAlert2
      const result = await Swal.fire({
        title: "¿Está seguro que desea facturar esta proforma?",
        html: `
          <p>Proforma: <strong>${row.original.pednumped}</strong></p>
          <p>Cliente: <strong>${row.original.clinombre}</strong></p>
          <p>Total: <strong>$${parseFloat(row.original.pedtotal || 0).toFixed(2)}</strong></p>
          <br/>
          <p style="color: #ff9800; font-weight: bold;">⚠️ Esta acción no se puede deshacer</p>
          <p>Se creará la factura y se enviará al SRI</p>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, facturar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#196C87",
        cancelButtonColor: "#d33",
      })

      if (!result.isConfirmed) return

      // Mostrar loading
      setIsLoading(true)
      Swal.fire({
        title: "Creando factura...",
        text: "Por favor espere mientras se procesa",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      // PASO 1: Llamar a facturarProforma para crear la factura
      const responseFacturar = await api.post("/FacturaDesdeArticulos/facturarProforma", {
        pednumped: row.original.pednumped,
        loccodigo: row.original.loccodigo,
        ciacodigo: row.original.ciacodigo,
      })

      const dataFacturar = responseFacturar.data

      if (!dataFacturar.data.success) {
        throw new Error(dataFacturar.data.message || "Error al crear la factura")
      }

      // PASO 2: Llamar a emisionFactura con el payload recibido
      Swal.update({
        title: "Enviando factura al SRI...",
        text: "Firmando, validando y enviando a recepción",
      })

      const responseEmision = await api.post(
        "/IntegracionFacturacionElectronica/emisionFactura",
        dataFacturar.data.payload_sri,
      )

      const dataEmision = responseEmision.data.data

      // PASO 3: Mostrar resultado
      setIsLoading(false)

      if (dataEmision.estado_sri === "AUTORIZADO") {
        await Swal.fire({
          icon: "success",
          title: "¡Factura creada y autorizada!",
          html: `
            <p>Factura: <strong>${dataFacturar.data.facnumfac}</strong></p>
            <p>Clave de acceso: <strong>${dataEmision.clave_acceso}</strong></p>
            <p>N° Autorización: <strong>${dataEmision.numero_autorizacion}</strong></p>
            <p>Estado SRI: <strong style="color: green;">${dataEmision.estado_sri}</strong></p>
          `,
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#196C87",
        })
      } else if (dataEmision.estado_sri === "NO AUTORIZADO" || dataEmision.estado_sri === "RECHAZADA") {
        await Swal.fire({
          icon: "warning",
          title: "Factura creada pero NO autorizada",
          html: `
            <p>Factura: <strong>${dataFacturar.data.facnumfac}</strong></p>
            <p>Estado SRI: <strong style="color: orange;">${dataEmision.estado_sri}</strong></p>
            <br/>
            <p style="color: #ff9800;">La factura fue creada pero el SRI no la autorizó.</p>
            <p>Puede intentar autorizar nuevamente más tarde.</p>
          `,
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#196C87",
        })
      } else {
        // Error en el proceso SRI pero factura creada
        await Swal.fire({
          icon: "info",
          title: "Factura creada con error en SRI",
          html: `
            <p>Factura: <strong>${dataFacturar.data.facnumfac}</strong></p>
            <p>Error: <strong>${dataEmision.msg || "Error desconocido"}</strong></p>
            <br/>
            <p style="color: #2196f3;">La factura fue creada pero hubo un error en el proceso SRI.</p>
            <p>Puede intentar autorizar nuevamente.</p>
          `,
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#196C87",
        })
      }
    } catch (error) {
      setIsLoading(false)
      console.error("Error en facturación:", error)

      const errorMessage = error.message || "Error desconocido"
      const errorDetails = error?.details || null

      await Swal.fire({
        icon: "error",
        title: "Error en el proceso de facturación",
        html: `
      <p><strong>${errorMessage}</strong></p>
      ${errorDetails ? `<br/><pre style="text-align: left; font-size: 11px; max-height: 250px; overflow-y: auto; background: #f5f5f5; padding: 10px; border-radius: 5px;">${JSON.stringify(errorDetails, null, 2)}</pre>` : ""}
    `,
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#d33",
      })
    } finally {
      setIsLoading(false)
      // Refrescar tabla
      queryClient.invalidateQueries({ queryKey: ["getAllFacturas"] })
    }
  }

  /**
   * Función para llamar a emisionFactura (AUTORIZAR factura ya creada)
   */
  /**
   * Función para AUTORIZAR factura ya creada
   */
  const handleAutorizar = async (row) => {
    try {
      // Verificar que tenga número de factura
      if (!row.original.facnumfac) {
        await Swal.fire({
          icon: "warning",
          title: "Factura no encontrada",
          text: "Esta proforma aún no tiene una factura creada. Primero debe FACTURAR.",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#196C87",
        })
        return
      }

      // Confirmación
      const result = await Swal.fire({
        title: "¿Desea autorizar esta factura en el SRI?",
        html: `
        <p>Factura: <strong>${row.original.facnumfac}</strong></p>
        <p>Proforma: <strong>${row.original.pednumped}</strong></p>
        <p>Cliente: <strong>${row.original.clinombre}</strong></p>
        <p>Total: <strong>$${parseFloat(row.original.pedtotal || 0).toFixed(2)}</strong></p>
        <br/>
        <p style="color: #2196f3;">Se recuperará el payload y se enviará al SRI</p>
      `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, autorizar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#196C87",
        cancelButtonColor: "#d33",
      })

      if (!result.isConfirmed) return

      // Mostrar loading
      setIsLoading(true)
      Swal.fire({
        title: "Recuperando datos de la factura...",
        text: "Por favor espere",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      // PASO 1: Recuperar payload desde la BD
      const responseRecuperar = await api.post("/FacturaDesdeArticulos/recuperarPayloadFactura", {
        facnumfac: row.original.facnumfac,
        loccodigo: row.original.loccodigo,
        ciacodigo: row.original.ciacodigo,
      })

      const dataRecuperar = responseRecuperar.data

      if (!dataRecuperar.data?.success) {
        throw new Error(dataRecuperar.data?.message || "Error al recuperar datos de la factura")
      }

      // PASO 2: Enviar a autorizar al SRI
      Swal.update({
        title: "Enviando factura al SRI...",
        text: "Firmando, validando y enviando a autorización",
      })

      const responseEmision = await api.post(
        "/IntegracionFacturacionElectronica/emisionFactura",
        dataRecuperar.data.payload_sri,
      )

      const dataEmision = responseEmision.data.data

      // PASO 3: Mostrar resultado
      setIsLoading(false)

      if (dataEmision.estado_sri === "AUTORIZADO") {
        await Swal.fire({
          icon: "success",
          title: "¡Factura autorizada exitosamente!",
          html: `
          <p>Factura: <strong>${row.original.facnumfac}</strong></p>
          <p>Clave de acceso: <strong>${dataEmision.clave_acceso}</strong></p>
          <p>N° Autorización: <strong>${dataEmision.numero_autorizacion}</strong></p>
          <p>Estado SRI: <strong style="color: green;">${dataEmision.estado_sri}</strong></p>
        `,
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#196C87",
        })
      } else {
        await Swal.fire({
          icon: "warning",
          title: "Factura NO autorizada",
          html: `
          <p>Factura: <strong>${row.original.facnumfac}</strong></p>
          <p>Estado SRI: <strong style="color: orange;">${dataEmision.estado_sri || "ERROR"}</strong></p>
          <p>Mensaje: <strong>${dataEmision.msg || "Sin mensaje"}</strong></p>
          <br/>
          <p style="color: #ff9800;">Puede intentar autorizar nuevamente más tarde.</p>
        `,
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#196C87",
        })
      }

      // Refrescar tabla
      queryClient.invalidateQueries({ queryKey: ["getAllFacturas"] })
    } catch (error) {
      setIsLoading(false)
      console.error("Error en autorización:", error)

      const errorMessage = error.message || "Error desconocido"
      const errorDetails = error?.details || null

      await Swal.fire({
        icon: "error",
        title: "Error al autorizar factura",
        html: `
      <p><strong>${errorMessage}</strong></p>
      ${errorDetails ? `<br/><pre style="text-align: left; font-size: 11px; max-height: 250px; overflow-y: auto; background: #f5f5f5; padding: 10px; border-radius: 5px;">${JSON.stringify(errorDetails, null, 2)}</pre>` : ""}
    `,
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#d33",
      })
    } finally {
      setIsLoading(false)
      // Refrescar tabla
      queryClient.invalidateQueries({ queryKey: ["getAllFacturas"] })
    }
  }

  const generateRIDE = async (row) => {
    try {
      setIsLoading(true)
      Swal.fire({
        title: "Generando RIDE...",
        text: "Por favor espere",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      const response = await api.post("/IntegracionFacturacionElectronica/emisionFactura", {
        ciacodigo: row.original.ciacodigo,
        facnumfac: row.original.facnumfac,
        loccodigo: row.original.loccodigo,
        tipo_proceso: "1", // ✅ "2" = Solo RIDE
      })

      const data = response.data.data
      const pdfBase64 = data.ridePDF

      // Convertir base64 a Blob
      const byteString = atob(pdfBase64)
      const byteArray = new Uint8Array(byteString.length)
      for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([byteArray], { type: "application/pdf" })

      // Crear enlace de descarga
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = data.claveAcceso
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setIsLoading(false)
      Swal.fire({
        icon: "success",
        title: "RIDE generado",
        text: "El PDF se ha descargado correctamente",
        confirmButtonText: "Aceptar",
      })
    } catch (error) {
      setIsLoading(false)
      Swal.fire({
        icon: "error",
        title: "Error al generar RIDE",
        text: error.message || "Error desconocido",
      })
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CustomBackdrop isLoading={isLoading} />
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 30px 30px 30px",
            fontSize: "25px",
          }}
        >
          <b>Listado de Facturas</b>
        </div>

        <Box className={StyledRoot}>
          <CustomConditionalActionsTableServer
            endpoint="/FacturaDesdeArticulos/getAllFacturas"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="getAllFacturas"
            perPage={10}
            rowActionsWidthTable={350}
            rowActions={(row) => {
              const buscarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === ACCIONES.BUSCAR,
              )
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === ACCIONES.EDITAR,
              )
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === ACCIONES.ELIMINAR,
              )
              const facturarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === ACCIONES.FACTURAR,
              )
              const autorizarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === ACCIONES.AUTORIZAR,
              )

              const rideAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === ACCIONES.RIDE,
              )

              const actions = [
                {
                  label: buscarAction?.acccaption,
                  key: buscarAction?.acccaption,
                  icon: getIconComponent(buscarAction?.accnameicono, buscarAction?.acctipoico),
                  onClick: (row) => {
                    navigate(`buscar`, { state: row.original })
                  },
                },
              ]

              // Botón EDITAR (solo si la proforma está pendiente 'P')
              if (editarAction && row.original.pedstatus === "P") {
                actions.push({
                  label: editarAction?.acccaption,
                  key: editarAction?.acccaption,
                  icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                  onClick: (row) => {
                    navigate("editar", { state: row.original })
                  },
                })
              }

              // Botón FACTURAR (solo si la proforma está pendiente 'P')
              if (facturarAction && row.original.pedstatus === "P") {
                actions.push({
                  label: facturarAction?.acccaption,
                  key: facturarAction?.acccaption,
                  icon: getIconComponent(facturarAction?.accnameicono, facturarAction?.acctipoico),
                  onClick: (row) => handleFacturar(row),
                })
              }

              // Botón AUTORIZAR (solo si la factura no esta autorizada y ya tiene numero de factura asignado)
              if (autorizarAction && row.original.sri_status !== "A" && row.original.facnumfac) {
                actions.push({
                  label: autorizarAction?.acccaption,
                  key: autorizarAction?.acccaption,
                  icon: getIconComponent(autorizarAction?.accnameicono, autorizarAction?.acctipoico),
                  onClick: (row) => handleAutorizar(row),
                })
              }

              // Botón ELIMINAR (solo si la proforma está pendiente 'P')
              if (eliminarAction && row.original.pedstatus === "P") {
                actions.push({
                  label: eliminarAction?.acccaption,
                  key: eliminarAction?.acccaption,
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (row) => {
                    const result = await Swal.fire({
                      title: "¿Está seguro que quiere eliminar esta proforma?",
                      text: `Proforma: ${row.original.pednumped}`,
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Sí, eliminar",
                      cancelButtonText: "Cancelar",
                      confirmButtonColor: "#d33",
                    })

                    if (result.isConfirmed) {
                      try {
                        await api.post("/FacturaDesdeArticulos/deleteProforma", {
                          ciacodigo: row.original.ciacodigo,
                          pednumped: row.original.pednumped,
                          loccodigo: row.original.loccodigo,
                        })

                        await Swal.fire({
                          title: "¡Eliminado!",
                          text: "La proforma ha sido eliminada correctamente.",
                          icon: "success",
                          confirmButtonText: "Aceptar",
                          confirmButtonColor: "#196C87",
                        })

                        queryClient.invalidateQueries({ queryKey: ["getAllFacturas"] })
                      } catch (error) {
                        console.error("Error al eliminar:", error)
                        Swal.fire({
                          title: "Error",
                          text: error.response?.data?.message || "No se pudo eliminar la proforma",
                          icon: "error",
                          confirmButtonText: "Aceptar",
                        })
                      }
                    }
                  },
                })
              }

              // Botón RIDE (solo si la factura tiene estatus del sri 'A')
              if (rideAction && row.original.sri_status === "A" && row.original.facnumfac) {
                actions.push({
                  label: rideAction?.acccaption,
                  key: rideAction?.acccaption,
                  icon: getIconComponent(rideAction?.accnameicono, rideAction?.acctipoico),
                  onClick: (row) => generateRIDE(row),
                })
              }

              return actions
            }}
            topToolbarCustomActions={({ table, device }) => {
              const crearAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === ACCIONES.CREAR,
              )
              const exportarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === ACCIONES.EXPORTAR,
              )
              const importarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === ACCIONES.IMPORTAR,
              )
              const toolbarActions = [
                {
                  label: crearAction?.acccaption,
                  key: crearAction?.acccaption,
                  icon: getIconComponent(crearAction?.accnameicono, crearAction?.acctipoico),
                  onClick: () => {
                    navigate("crear")
                  },
                },
                {
                  label: importarAction?.acccaption,
                  key: importarAction?.acccaption,
                  icon: getIconComponent(importarAction?.accnameicono, importarAction?.acctipoico),
                  onClick: () => {
                    Swal.fire({
                      title: "Importar Facturas",
                      text: "Funcionalidad de importación en desarrollo",
                      icon: "info",
                      confirmButtonText: "Aceptar",
                      confirmButtonColor: "#196C87",
                    })
                  },
                },
                {
                  type: "dropdown",
                  label: exportarAction?.acccaption,
                  key: "exportarDropdown",
                  icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                  actions: [
                    {
                      label: "Exportar PDF",
                      key: "exportarPDF",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ columns, data }) => {
                        if (device === "sm") {
                          return handleExportDataPdfSMScreen(
                            columns,
                            data,
                            "Listado de Facturas",
                            `Listado de Facturas ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Listado de Facturas",
                          `Listado de Facturas ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Listado de Facturas ${new Date().toLocaleString()}`)
                      },
                    },
                  ],
                },
              ]
              return toolbarActions
            }}
            columnsTable={[
              {
                accessorKey: "pednumped",
                header: "Número Proforma",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "facnumfac",
                header: "N° Factura",
                size: 200,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return value
                },
              },
              {
                accessorKey: "loccodigo",
                header: "Localidad",
                size: 100,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "vencodigo",
                header: "Vendedor",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "clinombre",
                header: "Cliente",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "pedfecemi",
                header: "Fecha Emisión",
                size: 150,
                Cell: ({ cell }) => {
                  const cellValue = cell.getValue()
                  return normalFormatDate(cellValue)
                },
              },
              {
                accessorKey: "pedfecven",
                header: "Fecha Vencimiento",
                size: 150,
                Cell: ({ cell }) => {
                  const cellValue = cell.getValue()
                  return normalFormatDate(cellValue)
                },
              },
              {
                accessorKey: "pedsubtot",
                header: "Subtotal",
                size: 120,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>${parseFloat(value || 0).toFixed(2)}</span>
                },
              },
              {
                accessorKey: "pediva",
                header: "IVA",
                size: 100,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>${parseFloat(value || 0).toFixed(2)}</span>
                },
              },
              {
                accessorKey: "pedtotal",
                header: "Total",
                size: 120,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>${parseFloat(value || 0).toFixed(2)}</span>
                },
              },
              {
                accessorKey: "pedstatus",
                header: "Estado Profrorma",
                size: 200,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value}</span>
                },
              },
              {
                accessorKey: "sriautnumero",
                header: "N° Autorización",
                size: 450,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value}</span>
                },
              },
              {
                accessorKey: "sri_status",
                header: "Estado SRI",
                size: 200,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return value
                },
              },
              {
                accessorKey: "peddetalle",
                header: "Comentario",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "pedfecisys",
                header: "Fecha Sistema",
                size: 150,
                Cell: ({ cell }) => {
                  const cellValue = cell.getValue()
                  return normalFormatDate(cellValue)
                },
              },
              {
                accessorKey: "pedusuisys",
                header: "Usuario Sistema",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "pedestisys",
                header: "Estado Sistema",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default FacturaDesdeArticulos
