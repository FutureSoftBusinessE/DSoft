import { useContext, useState } from "react"
import Header from "../../layouts/Header"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { Box } from "@mui/material"
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

const StyledRootStyles = {
  display: "flex",
  flexDirection: "column",
  marginTop: "64px",
  flexGrow: 1,
  padding: "0 16px",
  height: "100vh",
}

const theme = createTheme({
  palette: {
    primary: { main: "#196C87" },
    secondary: { main: "#196C87" },
  },
})

const CreacionClienteDF = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const { mutateAsync: SaveEliminacionCliente, isPending: isDeletingCliente } = useMutation({
    queryKey: ["isDeletingClienteDF"],
    fn: async (data) => {
      const response = await api.post("/CreacionClienteDF/eliminarCreacionClienteDF", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["CreacionClienteDF"] })
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Mantenimiento de Clientes</b>
        </div>

        <CustomBackdrop isLoading={isDeletingCliente} />

        <Box sx={StyledRootStyles}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="Plantilla_Creacion_Clientes.csv"
            fieldConfigs={{
              cliidentifica: { required: true },
              cliruc: { required: true, key: true },
              clinombre: { required: true },
              clidirec: { required: true },
              cliemail: { required: false },
              clitelef1: { required: false },
              cliintersec: { required: false },
              clistatus: { required: false },
            }}
            validateEndpoint="/CreacionClienteDF/validarCreacionClienteDFIMP"
            insertEndpoint="/CreacionClienteDF/insertarCreacionClienteDFIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["CreacionClienteDF"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/CreacionClienteDF/getAllCreacionClienteDF"
            errorMsgFilterSearch="Error al cargar el listado de clientes"
            queryKeyModal="CreacionClienteDF"
            perPage={10}
            rowActions={(row) => {
              // Búsqueda de permisos para acciones de fila
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(a => a.acccaption === "EDITAR")
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(a => a.acccaption === "ELIMINAR")
              const actions = []
              if (editarAction) {
                actions.push({
                  label: editarAction.acccaption, key: "edit",
                  icon: getIconComponent(editarAction.accnameicono, editarAction.acctipoico),
                  onClick: (row) => navigate("editar", { state: row.original }),
                })
              }
              if (eliminarAction) {
                actions.push({
                  label: eliminarAction.acccaption, key: "delete",
                  icon: getIconComponent(eliminarAction.accnameicono, eliminarAction.acctipoico),
                  onClick: async (row) => { try { await SaveEliminacionCliente(row.original) } catch (e) {} },
                })
              }
              return actions
            }}
            topToolbarCustomActions={({ table, device }) => {
              const acciones = selectedMenuInfo?.data?.barraAcciones || []
              const toolbarActions = []

              // Botón CREAR
              const crearAction = acciones.find(a => a.acccaption === "CREAR")
              if (crearAction) {
                toolbarActions.push({
                  label: crearAction.acccaption, key: "crear",
                  icon: getIconComponent(crearAction.accnameicono, crearAction.acctipoico),
                  onClick: () => navigate("crear"),
                })
              }

              // Botón EXPORTAR
              const exportarAction = acciones.find(a => a.acccaption === "EXPORTAR")
              if (exportarAction) {
                toolbarActions.push({
                  type: "dropdown", label: exportarAction.acccaption, key: "export",
                  icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                  actions: [
                    {
                      label: "Exportar PDF", key: "pdf",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ columns, data }) => {
                        const title = "Maestro de Clientes"
                        if (device === "sm") return handleExportDataPdfSMScreen(columns, data, title, title)
                        handleExportDataPdfLGScreen(columns, table.getCoreRowModel().rows, title, title)
                      }
                    },
                    {
                      label: "Exportar CSV", key: "csv",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ data }) => handleAllExportDataCSV(data, "Clientes_SIAC")
                    }
                  ]
                })
              }

              // Botón IMPORTAR
              const importarAction = acciones.find(a => a.acccaption === "IMPORTAR")
              if (importarAction) {
                toolbarActions.push({
                  label: importarAction.acccaption, key: "import",
                  icon: getIconComponent(importarAction.accnameicono || "UploadFile", importarAction.acctipoico || "MaterialIcons"),
                  onClick: () => setOpenModal(true),
                })
              }

              return toolbarActions
            }}
            columnsTable={[
              { 
                accessorKey: "cliidentifica", 
                header: "Tipo Identificación", 
                size: 150,
                Cell: ({ cell }) => {
                  const val = String(cell.getValue() || "").trim().toUpperCase();
                  if (val === "C") return "CÉDULA";
                  if (val === "R") return "RUC";
                  if (val === "P") return "PASAPORTE";
                  return "OTROS";
                }
              },
              { accessorKey: "cliruc", header: "Cédula o Ruc", size: 130 },
              { accessorKey: "clinombre", header: "Nombre del Cliente", size: 250 },
              { accessorKey: "clidirec", header: "Dirección del Cliente", size: 250 },
              { accessorKey: "cliemail", header: "Email", size: 200 },
              { accessorKey: "clitelef1", header: "Teléfono", size: 120 },
              { accessorKey: "cliintersec", header: "Celular", size: 120 },
              { 
                accessorKey: "clistatus", 
                header: "Estado", 
                size: 100, 
                Cell: ({ cell }) => <span>{cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"}</span> 
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CreacionClienteDF;