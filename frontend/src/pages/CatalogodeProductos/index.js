import React, { useContext, useState } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box, Chip } from "@mui/material"
import BackIcon from "../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import { GlobalContext } from "../../contexts/GlobalContext"
import { useMutation, api } from "../../api"
import getIconComponent from "../utils/getIconComponent"
import CustomBackdrop from "../../components/CustomBackdrop"
import { useQueryClient } from "@tanstack/react-query"
import {
  handleExportDataPdfLGScreen,
  handleExportDataPdfSMScreen,
  handleAllExportDataCSV,
} from "../utils/reactTableActions/exportToolbarActions"
import ModalImportCSV from "../../components/CustomCSVImportButton"
import Swal from "sweetalert2"

// Estilos base estandarizados
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

const CatalogodeProductosIndex = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  // Mutación para eliminar el registro usando llave compuesta
  const { mutateAsync: SaveEliminacionProducto, isPending: isDeletingProducto } = useMutation({
    queryKey: ["isDeletingProducto"],
    fn: async (data) => {
      // Data contiene invcodigo y artcodigo
      const response = await api.post("/CatalogodeProductos/eliminarCatalogodeProductos", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["CatalogodeProductos"] })
    },
  })

  // Función para manejar el modal de confirmación antes de eliminar
  const handleDelete = async (row) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar Artículo?",
      html: `<p>¿Está seguro que desea eliminar el artículo <strong>${row.original.artcodigo} - ${row.original.artdescri}</strong> del inventario <strong>${row.original.invcodigo}</strong>?</p>
             <p style="font-size: 0.9em; color: #666;">Esta acción no se puede deshacer y fallará si el artículo tiene transacciones asociadas.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#196C87",
      reverseButtons: true,
    })

    if (confirmacion.isConfirmed) {
      try {
        await SaveEliminacionProducto({
          invcodigo: row.original.invcodigo,
          artcodigo: row.original.artcodigo,
        })
      } catch (err) {
        console.error("Error eliminando el Artículo:", err)
      }
    }
  }

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
          <b>Catálogo de Productos (Artículos o Servicios Inventariados)</b>
        </div>

        <CustomBackdrop isLoading={isDeletingProducto} />

        <Box className={StyledRoot}>
          {/* MODAL DE IMPORTACIÓN CSV */}
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="Plantilla_CatalogodeProductos.csv"
            fieldConfigs={{
              invcodigo: { required: true, key: true },
              artcodigo: { required: true, key: true },
              artdescri: { required: true },
              lincodigo: { required: true },
              marcodigo: { required: true },
              medcodigo: { required: true },
              precodigo: { required: true },
              artstatus: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/CatalogodeProductos/validarCatalogodeProductosIMP"
            insertEndpoint="/CatalogodeProductos/insertarCatalogodeProductosIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["CatalogodeProductos"] })}
          />

          {/* GRILLA PRINCIPAL */}
          <CustomConditionalActionsTableServer
            endpoint="/CatalogodeProductos/getAllCatalogodeProductos"
            errorMsgFilterSearch="Error al cargar datos del Catálogo de Productos"
            queryKeyModal="CatalogodeProductos"
            perPage={10}
            rowActionsWidthTable={180}
            rowActions={(row) => {
              const buscarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "BUSCAR",
              )
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "EDITAR",
              )
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "ELIMINAR",
              )

              const actions = []

              if (buscarAction) {
                actions.push({
                  label: "Buscar",
                  key: "BUSCAR",
                  icon: getIconComponent(buscarAction?.accnameicono, buscarAction?.acctipoico),
                  onClick: () => navigate("buscar", { state: row.original }), // CORRECCIÓN AQUÍ
                })
              }

              if (editarAction) {
                actions.push({
                  label: "Editar",
                  key: "EDITAR",
                  icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                  onClick: () => navigate("editar", { state: row.original }), // CORRECCIÓN AQUÍ
                })
              }

              if (eliminarAction) {
                actions.push({
                  label: "Eliminar",
                  key: "ELIMINAR",
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: () => handleDelete(row), // CORRECCIÓN AQUÍ
                })
              }

              return actions
            }}
            topToolbarCustomActions={({ table, device }) => {
              const crearAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action.acccaption === "CREAR")
              const exportarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === "EXPORTAR",
              )
              const importarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === "IMPORTAR",
              )

              const toolbarActions = []
              if (crearAction) {
                toolbarActions.push({
                  label: crearAction?.acccaption,
                  key: crearAction?.acccaption,
                  icon: getIconComponent(crearAction?.accnameicono, crearAction?.acctipoico),
                  onClick: () => navigate("crear"),
                })
              }
              if (exportarAction) {
                toolbarActions.push({
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
                        const title = "Reporte de Productos"
                        if (device === "sm") {
                          return handleExportDataPdfSMScreen(
                            columns,
                            data,
                            title,
                            `${title} ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          title,
                          `${title} ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) =>
                        handleAllExportDataCSV(data, `Grupos_Productos_${new Date().toLocaleString()}`),
                    },
                  ],
                })
              }
              if (importarAction) {
                toolbarActions.push({
                  label: importarAction?.acccaption || "Importar",
                  key: "importarBtn",
                  icon: getIconComponent(
                    importarAction?.accnameicono || "UploadFile",
                    importarAction?.acctipoico || "MaterialIcons",
                  ),
                  onClick: () => setOpenModal(true),
                })
              }
              return toolbarActions
            }}
            columnsTable={[
              {
                accessorKey: "invcodigo",
                header: "Inv.",
                size: 80,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "artcodigo",
                header: "Código Artículo",
                size: 130,
                Cell: ({ cell }) => <strong>{cell.getValue()}</strong>,
              },
              {
                accessorKey: "artdescri",
                header: "Descripción",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "stock_total",
                header: "Stock Total",
                size: 110,
                Cell: ({ cell }) => {
                  const val = cell.getValue() || 0
                  return (
                    <Chip
                      label={parseFloat(val).toFixed(2)}
                      color={val > 0 ? "success" : "default"}
                      size="small"
                      variant="outlined"
                    />
                  )
                },
              },
              {
                accessorKey: "artprecventa1",
                header: "P.V.P. (Lista 1)",
                size: 120,
                Cell: ({ cell }) => {
                  const val = cell.getValue() || 0
                  return <span>$ {parseFloat(val).toFixed(2)}</span>
                },
              },
              {
                accessorKey: "artnumparte",
                header: "N° Entrada / Parte",
                size: 140,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "lindescri",
                header: "Línea",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "mardescri",
                header: "Marca",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "artstatus",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => {
                  const valor = cell.getValue()
                  let etiqueta = "INACTIVO"
                  let color = "error"
                  if (valor === "A") {
                    etiqueta = "ACTIVO"
                    color = "success"
                  } else if (valor === "P") {
                    etiqueta = "POTENCIAL"
                    color = "warning"
                  }
                  return <Chip label={etiqueta} color={color} size="small" />
                },
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CatalogodeProductosIndex
