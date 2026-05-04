import { useContext, useState } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box } from "@mui/material"
import BackIcon from "../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import normalFormatDate from "../utils/date/DDMMYYYFormatDate"
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

// Importamos iconos de Material UI para usarlos como respaldo (Fallbacks)
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import PrintIcon from "@mui/icons-material/Print"
import DeleteIcon from "@mui/icons-material/Delete"
import FileDownloadIcon from "@mui/icons-material/FileDownload"
import FileUploadIcon from "@mui/icons-material/FileUpload"

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

const Cargos = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const { mutateAsync: SaveEliminacionCargo, isPending: isDeletingCargo } = useMutation({
    queryKey: ["isDeletingCargo"],
    fn: async (data) => {
      const response = await api.post("/api/cargos/eliminarCargo", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["Cargos"] })
    },
  })

  const handleImprimir = (row) => {
    const cargo = row.original
    const ventana = window.open("", "_blank")
    ventana.document.write(`
      <html>
        <head>
          <title>Ficha de Cargo</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f5f5f5; width: 30%; }
          </style>
        </head>
        <body>
          <h2>FICHA TÉCNICA DEL CARGO</h2>
          <table>
            <tr><th>Código de Cargo</th><td><strong>${cargo.cargocodigo}</strong></td></tr>
            <tr><th>Descripción</th><td>${cargo.cargodescri}</td></tr>
            <tr><th>Sueldo Base</th><td>$ ${parseFloat(cargo.carsueldo).toFixed(2)}</td></tr>
            <tr><th>Estado</th><td>${cargo.cargostatus === "A" ? "Activo" : "Inactivo"}</td></tr>
          </table>
          <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
        </body>
      </html>
    `)
    ventana.document.close()
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
          <b>Gestión de Cargos</b>
        </div>

        <CustomBackdrop isLoading={isDeletingCargo} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCreacionCargos.csv"
            fieldConfigs={{
              cargocodigo: { required: true, key: true },
              cargodescri: { required: true },
              carsueldo: { required: false },
              carrepresen: { required: false },
              cargostatus: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/api/cargos/validarCargosIMP"
            insertEndpoint="/api/cargos/insertarCargosIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["Cargos"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/api/cargos/getAllCargos"
            errorMsgFilterSearch="Error al cargar los datos de Cargos"
            queryKeyModal="Cargos"
            perPage={10}
            rowActionsWidthTable={150}
            rowActions={(row) => {
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "EDITAR",
              )
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "ELIMINAR",
              )
              const imprimirAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "IMPRIMIR",
              )

              const actions = [
                {
                  label: editarAction?.acccaption || "Editar",
                  key: editarAction?.acccaption || "EDITAR",
                  // FALLBACK: Si no hay icono en BD, dibuja el EditIcon de MaterialUI
                  icon: editarAction?.accnameicono ? (
                    getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico)
                  ) : (
                    <EditIcon />
                  ),
                  onClick: (row) => {
                    navigate("editar", { state: row.original })
                  },
                },
                {
                  label: imprimirAction?.acccaption || "Imprimir",
                  key: imprimirAction?.acccaption || "IMPRIMIR",
                  icon: imprimirAction?.accnameicono ? (
                    getIconComponent(imprimirAction?.accnameicono, imprimirAction?.acctipoico)
                  ) : (
                    <PrintIcon />
                  ),
                  onClick: (row) => {
                    handleImprimir(row)
                  },
                },
                {
                  label: eliminarAction?.acccaption || "Eliminar",
                  key: eliminarAction?.acccaption || "ELIMINAR",
                  icon: eliminarAction?.accnameicono ? (
                    getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico)
                  ) : (
                    <DeleteIcon />
                  ),
                  onClick: async (row) => {
                    if (window.confirm(`¿Seguro que desea eliminar el cargo ${row.original.cargodescri}?`)) {
                      try {
                        await SaveEliminacionCargo(row.original)
                      } catch (err) {
                        console.error("Error eliminando el cargo:", err)
                      }
                    }
                  },
                },
              ]

              return actions
            }}
            topToolbarCustomActions={({ table, device }) => {
              const crearAction = selectedMenuInfo?.data?.barraAcciones?.find((action) => action.acccaption === "CREAR")
              const exportarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === "EXPORTAR",
              )
              const toolbarActions = [
                {
                  label: crearAction?.acccaption || "Crear",
                  key: crearAction?.acccaption || "CREAR",
                  // FALLBACK para la barra superior
                  icon: crearAction?.accnameicono ? (
                    getIconComponent(crearAction?.accnameicono, crearAction?.acctipoico)
                  ) : (
                    <AddIcon />
                  ),
                  onClick: () => {
                    navigate("crear")
                  },
                },
                {
                  type: "dropdown",
                  label: exportarAction?.acccaption || "Exportar",
                  key: "exportarDropdown",
                  icon: exportarAction?.accnameicono ? (
                    getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico)
                  ) : (
                    <FileDownloadIcon />
                  ),
                  actions: [
                    {
                      label: "Exportar PDF",
                      key: "exportarPDF",
                      icon: exportarAction?.accnameicono ? (
                        getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico)
                      ) : (
                        <FileDownloadIcon />
                      ),
                      onClick: ({ columns, data }) => {
                        if (device === "sm") {
                          return handleExportDataPdfSMScreen(
                            columns,
                            data,
                            "Reporte de Cargos",
                            `Reporte de Cargos ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Cargos",
                          `Reporte de Cargos ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: exportarAction?.accnameicono ? (
                        getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico)
                      ) : (
                        <FileDownloadIcon />
                      ),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Reporte de Cargos ${new Date().toLocaleString()}`)
                      },
                    },
                  ],
                },
                {
                  label: "Importar",
                  key: "importarDropdown",
                  icon: exportarAction?.accnameicono ? (
                    getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico)
                  ) : (
                    <FileUploadIcon />
                  ),
                  onClick: () => {
                    setOpenModal(true)
                  },
                },
              ]
              return toolbarActions
            }}
            columnsTable={[
              {
                accessorKey: "cargocodigo",
                header: "Código",
                size: 150,
                Cell: ({ cell }) => <b>{cell.getValue()}</b>,
              },
              {
                accessorKey: "cargodescri",
                header: "Descripción del Cargo",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "carsueldo",
                header: "Sueldo Base",
                size: 150,
                Cell: ({ cell }) => <span>$ {parseFloat(cell.getValue() || 0).toFixed(2)}</span>,
              },
              {
                accessorKey: "carrepresen",
                header: "Representación",
                size: 150,
                Cell: ({ cell }) => <span>$ {parseFloat(cell.getValue() || 0).toFixed(2)}</span>,
              },
              {
                accessorKey: "cargostatus",
                header: "Estado",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default Cargos
