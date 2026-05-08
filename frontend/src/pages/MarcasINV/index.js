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
    primary: {
      main: "#196C87",
    },
    secondary: {
      main: "#196C87",
    },
  },
})

const MarcasINV = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  // Mutación para eliminación de Marcas
  const { mutateAsync: SaveEliminacionMarca, isPending: isDeletingMarca } = useMutation({
    queryKey: ["isDeletingMarcaINV"],
    fn: async (data) => {
      const response = await api.post("/MarcasINV/eliminarMarcasINV", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["MarcasINV"] })
    },
  })

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
          <b>Mantenimiento de Marcas de Inventario</b>
        </div>

        <CustomBackdrop isLoading={isDeletingMarca} />

        <Box sx={StyledRootStyles}>
          {/* Modal para importación masiva de Marcas desde CSV */}
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="Plantilla_Marcas_INV.csv"
            fieldConfigs={{
              marcodigo: { required: true, key: true },
              mardescri: { required: true },
              marstatus: { required: false },
            }}
            maxFileSize={5 * 1024 * 1024}
            validateEndpoint="/MarcasINV/validarMarcasINVIMP"
            insertEndpoint="/MarcasINV/insertarMarcasINVIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["MarcasINV"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/MarcasINV/getAllMarcasINV"
            errorMsgFilterSearch="Error al cargar las marcas de inventario"
            queryKeyModal="MarcasINV"
            perPage={10}
            rowActionsWidthTable={120}
            rowActions={(row) => {
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "EDITAR",
              )
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "ELIMINAR",
              )

              const actions = []
              if (editarAction) {
                actions.push({
                  label: editarAction?.acccaption,
                  key: editarAction?.acccaption,
                  icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                  onClick: (row) => navigate("editar", { state: row.original }),
                })
              }
              if (eliminarAction) {
                actions.push({
                  label: eliminarAction?.acccaption,
                  key: eliminarAction?.acccaption,
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (row) => {
                    try {
                      await SaveEliminacionMarca(row.original)
                    } catch (err) {}
                  },
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
                        const title = "Reporte de Marcas de Inventario"
                        if (device === "sm") {
                          return handleExportDataPdfSMScreen(columns, data, title, `${title} ${new Date().toLocaleString()}`)
                        }
                        handleExportDataPdfLGScreen(columns, table.getCoreRowModel().rows, title, `${title} ${new Date().toLocaleString()}`)
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => handleAllExportDataCSV(data, `Marcas INV ${new Date().toLocaleString()}`),
                    },
                  ],
                })
              }
              if (importarAction) {
                toolbarActions.push({
                  label: importarAction?.acccaption || "Importar",
                  key: "importarBtn",
                  icon: getIconComponent(importarAction?.accnameicono || "UploadFile", importarAction?.acctipoico || "MaterialIcons"),
                  onClick: () => setOpenModal(true),
                })
              }
              return toolbarActions
            }}
            columnsTable={[
              { accessorKey: "marcodigo", header: "Código", size: 120 },
              { accessorKey: "mardescri", header: "Descripción", size: 300 },
              {
                accessorKey: "marstatus",
                header: "Estado",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"}</span>,
              },
              {
                accessorKey: "marfecisys",
                header: "Fecha Creación",
                size: 180,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              { accessorKey: "marusuisys", header: "Usuario Creador", size: 150 },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default MarcasINV