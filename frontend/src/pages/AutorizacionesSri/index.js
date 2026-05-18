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

const AutorizacionesSri = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  // Mutación para eliminación de Autorizaciones (Usa Llave Compuesta)
  const { mutateAsync: SaveEliminacionAutorizacion, isPending: isDeletingAutorizacion } = useMutation({
    queryKey: ["isDeletingAutorizacionSri"],
    fn: async (data) => {
      const response = await api.post("/AutorizacionesSri/eliminarAutorizacionesSri", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["AutorizacionesSri"] })
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <BackIcon />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "0 30px 30px 30px", fontSize: "25px" }}>
          <b>Ingreso de Números de Autorizaciones del SRI</b>
        </div>

        <CustomBackdrop isLoading={isDeletingAutorizacion} />

        <Box sx={StyledRootStyles}>
          {/* Modal de Importación Masiva configurado para la tabla siacsrinumero */}
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCargaAutorizaciones.csv"
            fieldConfigs={{
              sripreauto: { required: true, key: true },
              sriautnumero: { required: true, key: true },
              sritramite: { required: false },
              sriautfecemi: { required: true },
              sriautfecven: { required: true },
            }}
            validateEndpoint="/AutorizacionesSri/validarAutorizacionesSriIMP"
            insertEndpoint="/AutorizacionesSri/insertarAutorizacionesSriIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["AutorizacionesSri"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/AutorizacionesSri/getAllAutorizacionesSri"
            errorMsgFilterSearch="Error al cargar las autorizaciones del SRI"
            queryKeyModal="AutorizacionesSri"
            perPage={10}
            rowActionsWidthTable={120}
            rowActions={(row) => {
              // Lógica de acciones de fila basada en permisos del menú
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
                      // Se envía la llave primaria compuesta para eliminar
                      await SaveEliminacionAutorizacion({
                        sripreauto: row.original.sripreauto,
                        sriautnumero: row.original.sriautnumero
                      })
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
                        const title = "Reporte de Autorizaciones SRI"
                        if (device === "sm") return handleExportDataPdfSMScreen(columns, data, title, title)
                        handleExportDataPdfLGScreen(columns, table.getCoreRowModel().rows, title, title)
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "csv",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ data }) => handleAllExportDataCSV(data, "Autorizaciones_SRI"),
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
              { 
                accessorKey: "sripreauto", 
                header: "Tipo", 
                size: 130,
                Cell: ({ cell }) => {
                  const tipo = cell.getValue();
                  if (tipo === "E") return "ELECTRÓNICA";
                  if (tipo === "P") return "PREIMPRESA";
                  if (tipo === "A") return "AUTOIMPRESORES";
                  return tipo;
                }
              },
              { accessorKey: "sriautnumero", header: "Nº Autorización", size: 160 },
              { 
                accessorKey: "sritramite", 
                header: "Tipo Trámite", 
                size: 200,
                Cell: ({ cell }) => {
                  const tramite = Number(cell.getValue());
                  if (tramite === 6) return "6 - Solicitud de Autorización";
                  if (tramite === 7) return "7 - Cambio de Software";
                  if (tramite === 8) return "8 - Renovación";
                  if (tramite === 9) return "9 - Baja";
                  return tramite || "-";
                }
              },
              {
                accessorKey: "sriautfecemi",
                header: "Válido Desde",
                size: 130,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              {
                accessorKey: "sriautfecven",
                header: "Caduca En",
                size: 130,
                Cell: ({ cell }) => {
                  // Validación visual para la caducidad infinita de comprobantes electrónicos
                  const dateStr = cell.getValue();
                  if (dateStr && dateStr.includes("2100")) return "Sin Caducidad";
                  return normalFormatDate(dateStr);
                },
              },
              {
                accessorKey: "srifecisys",
                header: "F. Creación",
                size: 130,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              { accessorKey: "sriusuisys", header: "Usuario", size: 100 },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default AutorizacionesSri