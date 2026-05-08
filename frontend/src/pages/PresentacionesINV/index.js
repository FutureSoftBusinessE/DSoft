import { useContext, useState } from "react"
import Header from "../../layouts/Header"
import { createTheme, ThemeProvider } from "@mui/material/styles"
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

const PresentacionesINV = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  // Mutación para eliminación de Presentaciones
  const { mutateAsync: SaveEliminacionPresentacion, isPending: isDeletingPresentacion } = useMutation({
    queryKey: ["isDeletingPresentacionINV"],
    fn: async (data) => {
      const response = await api.post("/PresentacionesINV/eliminarPresentacionesINV", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["PresentacionesINV"] })
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Mantenimiento de Presentaciones de Inventario</b>
        </div>

        <CustomBackdrop isLoading={isDeletingPresentacion} />

        <Box sx={StyledRootStyles}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="Plantilla_Presentaciones_INV.csv"
            fieldConfigs={{
              precodigo: { required: true, key: true },
              predescri: { required: true },
              prestatus: { required: false },
            }}
            validateEndpoint="/PresentacionesINV/validarPresentacionesINVIMP"
            insertEndpoint="/PresentacionesINV/insertarPresentacionesINVIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["PresentacionesINV"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/PresentacionesINV/getAllPresentacionesINV"
            errorMsgFilterSearch="Error al cargar presentaciones"
            queryKeyModal="PresentacionesINV"
            perPage={10}
            rowActions={(row) => {
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
                  onClick: async (row) => { try { await SaveEliminacionPresentacion(row.original) } catch (e) {} },
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
                        const title = "Presentaciones de Inventario"
                        if (device === "sm") return handleExportDataPdfSMScreen(columns, data, title, title)
                        handleExportDataPdfLGScreen(columns, table.getCoreRowModel().rows, title, title)
                      }
                    },
                    {
                      label: "Exportar CSV", key: "csv",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ data }) => handleAllExportDataCSV(data, "Presentaciones_INV")
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
              { accessorKey: "precodigo", header: "Código", size: 100 },
              { accessorKey: "predescri", header: "Descripción", size: 300 },
              { accessorKey: "prestatus", header: "Estado", size: 120, Cell: ({ cell }) => <span>{cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"}</span> },
              { accessorKey: "prefecisys", header: "Fecha Creación", size: 180, Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span> },
              { accessorKey: "preusuisys", header: "Usuario", size: 150 },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default PresentacionesINV