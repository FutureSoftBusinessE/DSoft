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

// Estilos base para el contenedor de la grilla conforme al estándar SIAC
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

const VendedoresDF = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  // Mutación para eliminación de Vendedores siguiendo el estándar de integridad referencial
  const { mutateAsync: SaveEliminacionVendedor, isPending: isDeletingVendedor } = useMutation({
    queryKey: ["isDeletingVendedorDF"],
    fn: async (data) => {
      const response = await api.post("/VendedoresDF/eliminarVendedoresDF", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["VendedoresDF"] })
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Mantenimiento de Vendedores</b>
        </div>

        <CustomBackdrop isLoading={isDeletingVendedor} />

        <Box sx={StyledRootStyles}>
          {/* Modal de Importación configurado para las 5 columnas requeridas */}
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCargaVendedores.csv"
            fieldConfigs={{
              vencodigo: { required: true, key: true },
              vennombre: { required: true },
              vendireccion: { required: false },
              ventelefono: { required: false },
              venstatus: { required: false },
            }}
            validateEndpoint="/VendedoresDF/validarVendedoresDFIMP"
            insertEndpoint="/VendedoresDF/insertarVendedoresDFIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["VendedoresDF"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/VendedoresDF/getAllVendedoresDF"
            errorMsgFilterSearch="Error al cargar el listado de vendedores"
            queryKeyModal="VendedoresDF"
            perPage={10}
            rowActionsWidthTable={120}
            rowActions={(row) => {
              // Lógica de acciones de fila condicionada por barraAcciones
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(a => a.acccaption === "EDITAR")
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(a => a.acccaption === "ELIMINAR")

              const actions = []
              if (editarAction) {
                actions.push({
                  label: editarAction.acccaption,
                  key: "edit",
                  icon: getIconComponent(editarAction.accnameicono, editarAction.acctipoico),
                  onClick: (row) => navigate("editar", { state: row.original }),
                })
              }
              if (eliminarAction) {
                actions.push({
                  label: eliminarAction.acccaption,
                  key: "delete",
                  icon: getIconComponent(eliminarAction.accnameicono, eliminarAction.acctipoico),
                  onClick: async (row) => {
                    try {
                      await SaveEliminacionVendedor(row.original)
                    } catch (err) {}
                  },
                })
              }
              return actions
            }}
            topToolbarCustomActions={({ table, device }) => {
              // Lógica de TopToolbar dinámica basada en configuración de base de datos
              const acciones = selectedMenuInfo?.data?.barraAcciones || []
              const toolbarActions = []

              const crearAction = acciones.find(a => a.acccaption === "CREAR")
              if (crearAction) {
                toolbarActions.push({
                  label: crearAction.acccaption,
                  key: "crearBtn",
                  icon: getIconComponent(crearAction.accnameicono, crearAction.acctipoico),
                  onClick: () => navigate("crear"),
                })
              }

              const exportarAction = acciones.find(a => a.acccaption === "EXPORTAR")
              if (exportarAction) {
                toolbarActions.push({
                  type: "dropdown",
                  label: exportarAction.acccaption,
                  key: "exportDropdown",
                  icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                  actions: [
                    {
                      label: "Exportar PDF",
                      key: "pdf",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ columns, data }) => {
                        const title = "Maestro de Vendedores"
                        if (device === "sm") return handleExportDataPdfSMScreen(columns, data, title, title)
                        handleExportDataPdfLGScreen(columns, table.getCoreRowModel().rows, title, title)
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "csv",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ data }) => handleAllExportDataCSV(data, "Vendedores_SIAC"),
                    },
                  ],
                })
              }

              const importarAction = acciones.find(a => a.acccaption === "IMPORTAR")
              if (importarAction) {
                toolbarActions.push({
                  label: importarAction.acccaption,
                  key: "importBtn",
                  icon: getIconComponent(importarAction.accnameicono || "UploadFile", importarAction.acctipoico || "MaterialIcons"),
                  onClick: () => setOpenModal(true),
                })
              }
              return toolbarActions
            }}
            columnsTable={[
              { accessorKey: "vencodigo", header: "Código", size: 100 },
              { accessorKey: "vennombre", header: "Nombre del Vendedor", size: 250 },
              { accessorKey: "vendireccion", header: "Dirección", size: 250 },
              { accessorKey: "ventelefono", header: "Teléfono", size: 150 },
              {
                accessorKey: "venstatus",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => <span>{cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default VendedoresDF;