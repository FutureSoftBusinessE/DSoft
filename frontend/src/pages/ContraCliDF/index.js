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

const ContraCliDF = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  // Mutación para eliminación/anulación de Contratos
  const { mutateAsync: SaveEliminacionContrato, isPending: isDeletingContrato } = useMutation({
    queryKey: ["isDeletingContraCliDF"],
    fn: async (data) => {
      // Este endpoint deberá cambiar el estado a 'N' en el backend
      const response = await api.post("/ContraCliDF/eliminarContraCliDF", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["ContraCliDF"] })
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "0 30px 30px 30px", fontSize: "25px", textAlign: "center" }}>
          <b>Mantenimiento de Contratos de Clientes</b>
        </div>

        <CustomBackdrop isLoading={isDeletingContrato} />

        <Box sx={StyledRootStyles}>
          {/* Modal de Importación (Estructura base por si deciden implementarlo a futuro) */}
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCargaContratos.csv"
            fieldConfigs={{
              concodcontrato: { required: true, key: true },
              clicodigo: { required: true },
              condescri: { required: true },
              confecinicio: { required: true },
              confecfin: { required: true },
              convalor: { required: true },
            }}
            validateEndpoint="/ContraCliDF/validarContraCliDFIMP"
            insertEndpoint="/ContraCliDF/insertarContraCliDFIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["ContraCliDF"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/ContraCliDF/getAllContraCliDF"
            errorMsgFilterSearch="Error al cargar el listado de contratos"
            queryKeyModal="ContraCliDF"
            perPage={10}
            rowActionsWidthTable={120}
            rowActions={(row) => {
              // Lógica de acciones de fila condicionada por barraAcciones configurada en base de datos
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(a => a.acccaption === "EDITAR")
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(a => a.acccaption === "ELIMINAR" || a.acccaption === "ANULAR")

              const actions = []
              if (editarAction) {
                actions.push({
                  label: editarAction.acccaption,
                  key: "edit",
                  icon: getIconComponent(editarAction.accnameicono, editarAction.acctipoico),
                  // Al dar editar, enviamos la fila actual en el state para recuperar la llave (concodcontrato)
                  onClick: (row) => navigate("editar", { state: row.original }),
                })
              }
              if (eliminarAction) {
                actions.push({
                  label: eliminarAction.acccaption,
                  key: "delete",
                  icon: getIconComponent(eliminarAction.accnameicono, eliminarAction.acctipoico),
                  onClick: async (row) => {
                    // Validamos visualmente antes de mandar a anular
                    if (row.original.constatus === "N") {
                      api.showWarning("El contrato ya se encuentra anulado.");
                      return;
                    }
                    try {
                      await SaveEliminacionContrato({ concodcontrato: row.original.concodcontrato })
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
                        const title = "Maestro de Contratos de Clientes"
                        if (device === "sm") return handleExportDataPdfSMScreen(columns, data, title, title)
                        handleExportDataPdfLGScreen(columns, table.getCoreRowModel().rows, title, title)
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "csv",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ data }) => handleAllExportDataCSV(data, "Contratos_SIAC"),
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
              { accessorKey: "concodcontrato", header: "Nº Contrato", size: 130 },
              { accessorKey: "clicodigo", header: "Cliente", size: 100 },
              { accessorKey: "condescri", header: "Descripción", size: 250 },
              { accessorKey: "confrecuencia", header: "Frecuencia", size: 120 },
              {
                accessorKey: "convalor",
                header: "Valor",
                size: 100,
                Cell: ({ cell }) => <span>${Number(cell.getValue() || 0).toFixed(2)}</span>
              },
              { accessorKey: "confecinicio", header: "F. Inicio", size: 120 },
              { accessorKey: "confecfin", header: "F. Fin", size: 120 },
              {
                accessorKey: "constatus",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => {
                  const status = cell.getValue()
                  if (status === "A") return "ACTIVO"
                  if (status === "I") return "INACTIVO"
                  if (status === "N") return "ANULADO"
                  return status
                }
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default ContraCliDF;