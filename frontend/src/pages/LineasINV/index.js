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

// Objeto plano para evitar recursión de estilos (Maximum call stack)
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

const LineasINV = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  // Mutación para eliminar un Grupo/Línea
  const { mutateAsync: SaveEliminacionLineaINV, isPending: isDeletingLineaINV } = useMutation({
    queryKey: ["isDeletingLineaINV"],
    fn: async (data) => {
      const response = await api.post("/LineasINV/eliminarLineasINV", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["LineasINV"] })
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
          <b>Mantenimiento de Grupos de Planes / Productos</b>
        </div>

        <CustomBackdrop isLoading={isDeletingLineaINV} />

        <Box sx={StyledRootStyles}>
          {/* MODAL DE IMPORTACIÓN CSV */}
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCargaGruposProductos.csv"
            fieldConfigs={{
              lincodigo: { required: true, key: true }, // Ej: 020706
              lindescri: { required: true },            // Ej: MARIANO 2
              lintipo: { required: true },              // M o T
              linstatus: { required: true },            // A o I    
              // Nota: linnivel, linlindes (padre) y lincodigo1 no se piden porque el backend los calcula automáticamente
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/LineasINV/validarLineasINVIMP"
            insertEndpoint="/LineasINV/insertarLineasINVIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["LineasINV"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/LineasINV/getAllLineasINV"
            errorMsgFilterSearch="Error al cargar los grupos/líneas"
            queryKeyModal="LineasINV"
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
                      await SaveEliminacionLineaINV(row.original)
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
                        const title = "Reporte de Grupos y Líneas de Inventario"
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
                      onClick: ({ data }) => handleAllExportDataCSV(data, `Grupos_Productos_${new Date().toLocaleString()}`),
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
              { accessorKey: "lincodigo", header: "Código Grupo", size: 140 },
              { accessorKey: "lindescri", header: "Descripción", size: 300 },
              { accessorKey: "linlindes", header: "Padre", size: 120, Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span> },
              { accessorKey: "linnivel", header: "Nivel", size: 80 },
              {
                accessorKey: "lintipo",
                header: "Tipo",
                size: 140,
                Cell: ({ cell }) => <span>{cell.getValue() === "M" ? "MAYOR (Padre)" : "TRANSACCIONAL"}</span>,
              },
              {
                accessorKey: "linstatus",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => <span>{cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"}</span>,
              },
              {
                accessorKey: "linfecisys",
                header: "Fecha Creación",
                size: 180,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              { accessorKey: "linusuisys", header: "Usuario Creador", size: 130 },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default LineasINV