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

// Estilos base para el contenedor de la grilla
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

const TransportistasDF = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  // Mutación para eliminación de Transportistas siguiendo el estándar SIAC
  const { mutateAsync: SaveEliminacionTransportista, isPending: isDeletingTransportista } = useMutation({
    queryKey: ["isDeletingTransportistaDF"],
    fn: async (data) => {
      const response = await api.post("/TransportistasDF/eliminarTransportistasDF", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["TransportistasDF"] })
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
          <b>Mantenimiento de Transportistas</b>
        </div>

        <CustomBackdrop isLoading={isDeletingTransportista} />

        <Box sx={StyledRootStyles}>
          {/* Modal de Importación Masiva configurado para la tabla inbtranspor */}
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCargaTransportistas.csv"
            fieldConfigs={{
              transcodigo: { required: true, key: true },
              transdescri: { required: true },
              transruc: { required: true },
              transdirec: { required: true },
              transtipo: { required: false },
              transstatus: { required: false },
              transplaca: { required: false },
            }}
            validateEndpoint="/TransportistasDF/validarTransportistasDFIMP"
            insertEndpoint="/TransportistasDF/insertarTransportistasDFIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["TransportistasDF"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/TransportistasDF/getAllTransportistasDF"
            errorMsgFilterSearch="Error al cargar transportistas"
            queryKeyModal="TransportistasDF"
            perPage={10}
            rowActionsWidthTable={120}
            rowActions={(row) => {
              // Lógica de acciones de fila basada en permisos del menú
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "EDITAR")
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "ELIMINAR")

              const actions = []
              if (editarAction) {
                actions.push({
                  label: editarAction.acccaption,
                  key: editarAction.acccaption,
                  icon: getIconComponent(editarAction.accnameicono, editarAction.acctipoico),
                  onClick: (row) => navigate("editar", { state: row.original }),
                })
              }
              if (eliminarAction) {
                actions.push({
                  label: eliminarAction.acccaption,
                  key: eliminarAction.acccaption,
                  icon: getIconComponent(eliminarAction.accnameicono, eliminarAction.acctipoico),
                  onClick: async (row) => {
                    try {
                      await SaveEliminacionTransportista(row.original)
                    } catch (err) {}
                  },
                })
              }
              return actions
            }}
            topToolbarCustomActions={({ table, device }) => {
              // Lógica de TopToolbar dinámica
              const acciones = selectedMenuInfo?.data?.barraAcciones || []
              const toolbarActions = []

              const crearAction = acciones.find((a) => a.acccaption === "CREAR")
              if (crearAction) {
                toolbarActions.push({
                  label: crearAction.acccaption,
                  key: crearAction.acccaption,
                  icon: getIconComponent(crearAction.accnameicono, crearAction.acctipoico),
                  onClick: () => navigate("crear"),
                })
              }

              const exportarAction = acciones.find((a) => a.acccaption === "EXPORTAR")
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
                        const title = "Reporte de Transportistas"
                        if (device === "sm") return handleExportDataPdfSMScreen(columns, data, title, title)
                        handleExportDataPdfLGScreen(columns, table.getCoreRowModel().rows, title, title)
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "csv",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ data }) => handleAllExportDataCSV(data, "Transportistas"),
                    },
                  ],
                })
              }

              const importarAction = acciones.find((a) => a.acccaption === "IMPORTAR")
              if (importarAction) {
                toolbarActions.push({
                  label: importarAction.acccaption,
                  key: "importBtn",
                  icon: getIconComponent(
                    importarAction.accnameicono || "UploadFile",
                    importarAction.acctipoico || "MaterialIcons",
                  ),
                  onClick: () => setOpenModal(true),
                })
              }
              return toolbarActions
            }}
            columnsTable={[
              { accessorKey: "transcodigo", header: "Código", size: 100 },
              { accessorKey: "transdescri", header: "Nombre / Descripción", size: 250 },
              { accessorKey: "transruc", header: "Cédula / R.U.C.", size: 150 },
              {
                accessorKey: "transtipo",
                header: "Tipo",
                size: 130,
                Cell: ({ cell }) => <span>{cell.getValue() === "L" ? "LOCAL" : "INTERNACIONAL"}</span>,
              },
              { accessorKey: "transplaca", header: "Placa Sugerida", size: 130 },
              {
                accessorKey: "transstatus",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => <span>{cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"}</span>,
              },
              {
                accessorKey: "transfecisys",
                header: "Fecha Creación",
                size: 180,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              { accessorKey: "transusuisys", header: "Usuario", size: 120 },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default TransportistasDF
