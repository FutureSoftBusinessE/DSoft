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
}

const FacturaDesdeArticulos = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { selectedMenuInfo } = useContext(GlobalContext)

  return (
    <ThemeProvider theme={theme}>
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
            rowActionsWidthTable={180}
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

              const actions = [
                {
                  label: buscarAction?.acccaption,
                  key: buscarAction?.acccaption,
                  icon: getIconComponent(buscarAction?.accnameicono, buscarAction?.acctipoico),
                  onClick: (row) => {
                    navigate(`buscar`, { state: row.original })
                  },
                },
                {
                  label: editarAction?.acccaption,
                  key: editarAction?.acccaption,
                  icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                  onClick: (row) => {
                    navigate("editar", { state: row.original })
                  },
                },
                {
                  label: eliminarAction?.acccaption,
                  key: eliminarAction?.acccaption,
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (row) => {
                    const result = await Swal.fire({
                      title: "¿Está seguro que quiere eliminar esta factura?",
                      text: `Factura: ${row.original.pednumped}`,
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Sí, eliminar",
                      cancelButtonText: "Cancelar",
                      confirmButtonColor: "#d33",
                    })

                    if (result.isConfirmed) {
                      try {
                        await api.post("/FacturaDesdeArticulos/deleteFactura", {
                          ciacodigo: row.original.ciacodigo,
                          pednumped: row.original.pednumped,
                          loccodigo: row.original.loccodigo,
                        })

                        await Swal.fire({
                          title: "¡Eliminado!",
                          text: "La factura ha sido eliminada correctamente.",
                          icon: "success",
                          confirmButtonText: "Aceptar",
                          confirmButtonColor: "#196C87",
                        })

                        queryClient.invalidateQueries({ queryKey: ["getAllFacturas"] })
                      } catch (error) {
                        console.error("Error al eliminar:", error)
                        Swal.fire({
                          title: "Error",
                          text: error.response?.data?.message || "No se pudo eliminar la factura",
                          icon: "error",
                          confirmButtonText: "Aceptar",
                        })
                      }
                    }
                  },
                },
              ]

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
                    // Aquí va la lógica para importar facturas
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
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value === "A" ? "Activo" : value === "I" ? "Inactivo" : value}</span>
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
