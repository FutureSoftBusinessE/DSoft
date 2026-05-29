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

const PuntosEmisionSri = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  // Mutación para eliminación de Puntos de Emisión (Cajas)
  const { mutateAsync: SaveEliminacionPuntoEmision, isPending: isDeletingPuntoEmision } = useMutation({
    queryKey: ["isDeletingPuntoEmisionSri"],
    fn: async (data) => {
      const response = await api.post("/PuntosEmisionSri/eliminarPuntosEmisionSri", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["PuntosEmisionSri"] })
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
            textAlign: "center",
          }}
        >
          <b>Mantenimiento de Puntos de Emisión SRI (Cajas)</b>
        </div>

        <CustomBackdrop isLoading={isDeletingPuntoEmision} />

        <Box sx={StyledRootStyles}>
          {/* Modal de Importación Masiva */}
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCargaPuntosEmision.csv"
            fieldConfigs={{
              cjacodigo: { required: true, key: true },
              cjadescri: { required: true },
              loccodigo: { required: true },
              sripreauto: { required: true },
              sriautnumero: { required: true },
              sriserie01: { required: true },
              sriserie02: { required: true },
            }}
            validateEndpoint="/PuntosEmisionSri/validarPuntosEmisionSriIMP"
            insertEndpoint="/PuntosEmisionSri/insertarPuntosEmisionSriIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["PuntosEmisionSri"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/PuntosEmisionSri/getAllPuntosEmisionSri"
            errorMsgFilterSearch="Error al cargar el listado de puntos de emisión"
            queryKeyModal="PuntosEmisionSri"
            perPage={10}
            rowActionsWidthTable={120}
            rowActions={(row) => {
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "EDITAR")
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "ELIMINAR")

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
                      // Enviamos la llave primaria principal (cjacodigo) para eliminar en cascada
                      await SaveEliminacionPuntoEmision({ cjacodigo: row.original.cjacodigo })
                    } catch (err) {}
                  },
                })
              }
              return actions
            }}
            topToolbarCustomActions={({ table, device }) => {
              const acciones = selectedMenuInfo?.data?.barraAcciones || []
              const toolbarActions = []

              const crearAction = acciones.find((a) => a.acccaption === "CREAR")
              if (crearAction) {
                toolbarActions.push({
                  label: crearAction.acccaption,
                  key: "crearBtn",
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
                        const title = "Reporte de Puntos de Emisión SRI"
                        if (device === "sm") return handleExportDataPdfSMScreen(columns, data, title, title)
                        handleExportDataPdfLGScreen(columns, table.getCoreRowModel().rows, title, title)
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "csv",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ data }) => handleAllExportDataCSV(data, "Puntos_Emision_SRI"),
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
              { accessorKey: "cjacodigo", header: "Código", size: 100 },
              { accessorKey: "cjadescri", header: "Descripción", size: 250 },
              { accessorKey: "loccodigo", header: "Localidad", size: 100 },
              {
                accessorKey: "cjastatus",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => {
                  const status = cell.getValue()
                  if (status === "A") return "ACTIVO"
                  if (status === "I") return "INACTIVO"
                  return status
                },
              },
              {
                accessorKey: "sripreauto",
                header: "Tipo",
                size: 130,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  if (val === "E") return "ELECTRÓNICA"
                  if (val === "P") return "PREIMPRESA"
                  if (val === "A") return "AUTOIMPRESORES"
                  return val || "-"
                },
              },
              { accessorKey: "sriautnumero", header: "Nº Autorización", size: 150 },
              { accessorKey: "sriserie01", header: "Establecimiento", size: 130 },
              { accessorKey: "sriserie02", header: "Punto Emisión", size: 130 },
              {
                accessorKey: "cjafecisys",
                header: "F. Creación",
                size: 130,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              { accessorKey: "cjausuisys", header: "Usuario", size: 100 },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default PuntosEmisionSri
