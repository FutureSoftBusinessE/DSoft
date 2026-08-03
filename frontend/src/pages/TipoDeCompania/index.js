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

const TipoDeCompania = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const { mutateAsync: SaveEliminacionTipoDeCompania, isPending: isDeletingTipo } = useMutation({
    queryKey: ["isDeletingTipoDeCompania"],
    fn: async (data) => {
      // Llamada a la API de eliminación (recibe tpcodigo en el data)
      const response = await api.post("/TipoDeCompania/eliminarTipoDeCompania", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["TipoDeCompania"] })
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
          <b>Gestión de Tipos de Compañía</b>
        </div>

        <CustomBackdrop isLoading={isDeletingTipo} />

        <Box className={StyledRoot}>
          {/* MODAL DE IMPORTACIÓN CSV */}
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="Plantilla_TiposDeCompania.csv"
            fieldConfigs={{
              tpcodigo: { required: true, key: true }, // Llave primaria
              tpdescripcion: { required: true },
              tpobservacion: { required: false },
              tpstatus: { required: false }, // Opcional, el backend asume 'A' por defecto
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/TipoDeCompania/validarTipoDeCompaniaIMP"
            insertEndpoint="/TipoDeCompania/insertarTipoDeCompaniaIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["TipoDeCompania"] })}
          />

          {/* GRILLA PRINCIPAL */}
          <CustomConditionalActionsTableServer
            endpoint="/TipoDeCompania/getAllTipoDeCompania"
            errorMsgFilterSearch="Error al cargar datos de Tipos de Compañía"
            queryKeyModal="TipoDeCompania"
            perPage={15}
            rowActionsWidthTable={120}
            rowActions={(row) => {
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "EDITAR",
              )
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "ELIMINAR",
              )

              const actions = [
                {
                  label: editarAction?.acccaption || "Editar",
                  key: editarAction?.acccaption || "EDITAR",
                  icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                  onClick: (row) => {
                    navigate("editar", { state: row.original })
                  },
                },
                {
                  label: eliminarAction?.acccaption || "Eliminar",
                  key: eliminarAction?.acccaption || "ELIMINAR",
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (row) => {
                    try {
                      // Solo enviamos la llave primaria necesaria para eliminar
                      await SaveEliminacionTipoDeCompania({ tpcodigo: row.original.tpcodigo })
                    } catch (err) {
                      console.error("Error eliminando el Tipo de Compañía:", err)
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
                        const title = "Reporte de Tipos de Compañias segun el SRI"
                        if (device === "sm") {
                          return handleExportDataPdfSMScreen(
                            columns,
                            data,
                            title,
                            `${title} ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          title,
                          `${title} ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => handleAllExportDataCSV(data, `TipComSRI ${new Date().toLocaleString()}`),
                    },
                  ],
                })
              }
              if (importarAction) {
                toolbarActions.push({
                  label: importarAction?.acccaption || "Importar",
                  key: "importarBtn",
                  icon: getIconComponent(
                    importarAction?.accnameicono || "UploadFile",
                    importarAction?.acctipoico || "MaterialIcons",
                  ),
                  onClick: () => setOpenModal(true),
                })
              }
              return toolbarActions
            }}
            columnsTable={[
              {
                accessorKey: "tpcodigo",
                header: "Cód. Tipo",
                size: 100,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "tpdescripcion",
                header: "Descripción",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "tpobservacion",
                header: "Observación",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue() || "—"}</span>,
              },
              {
                accessorKey: "tpstatus",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => {
                  const valor = cell.getValue()
                  return <span>{valor === "A" ? "ACTIVO" : "INACTIVO"}</span>
                },
              },
              {
                accessorKey: "tpfecisys",
                header: "Fecha de Creación",
                size: 160,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value ? normalFormatDate(value) : "—"}</span>
                },
              },
              {
                accessorKey: "tpusuisys",
                header: "Creado Por",
                size: 130,
                Cell: ({ cell }) => <span>{cell.getValue() || "—"}</span>,
              },
              {
                accessorKey: "tpfecmsys",
                header: "Fecha de Mod.",
                size: 160,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value ? normalFormatDate(value) : "—"}</span>
                },
              },
              {
                accessorKey: "tpusumsys",
                header: "Modificado Por",
                size: 130,
                Cell: ({ cell }) => <span>{cell.getValue() || "—"}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default TipoDeCompania
