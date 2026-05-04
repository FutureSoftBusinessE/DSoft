import { useContext, useState } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box } from "@mui/material"
import BackIcon from "../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import normalFormatDate from "../utils/date/DDMMYYYFormatDate"
import normalFormatHour from "../utils/date/HHMMSSFormatHour"
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

const IntegradoresVentas = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const { mutateAsync: SaveEliminacionIntegradoresVentas, isPending: isDeletingIntegradoresVentas } = useMutation({
    queryKey: ["isDeletingIntegradoresVentas"],
    fn: async (data) => {
      const response = await api.post("/Integradora/eliminarIntegradora", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["IntegradoresVentas"] })
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
          <b>Integradores Ventas</b>
        </div>

        <CustomBackdrop isLoading={isDeletingIntegradoresVentas} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCreacionIntegradoresVentas.csv"
            fieldConfigs={{
              integracodigo: { required: true, key: true },
              integradescri: { required: true },
              integradirecc: { required: true },
              integrafono: { required: false },
              integrastatus: { required: false },
              integrafecisys: { required: false },
              integrahorisys: { required: false },
              integrausuisys: { required: false },
              integraestisys: { required: false },
              integrafecmsys: { required: false },
              integrahormsys: { required: false },
              integrausumsys: { required: false },
              integraestmsys: { required: false },
              integraruc: { required: true },
              integraidentifica: { required: true },
              integratipo: { required: false },
              sectorcodigo: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/Integradora/validarIntegradoraIMP"
            insertEndpoint="/Integradora/insertarIntegradoraIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["IntegradoresVentas"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/Integradora/getAllIntegradora"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="IntegradoresVentas"
            perPage={10}
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
                  label: editarAction?.acccaption,
                  key: editarAction?.acccaption,
                  icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                  onClick: (r) => {
                    navigate("editar", { state: r.original })
                  },
                },
                {
                  label: eliminarAction?.acccaption,
                  key: eliminarAction?.acccaption,
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (r) => {
                    try {
                      await SaveEliminacionIntegradoresVentas(r.original)
                    } catch (err) {
                      console.error("Error eliminando integradora:", err)
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

              const toolbarActions = [
                {
                  label: crearAction?.acccaption,
                  key: crearAction?.acccaption,
                  icon: getIconComponent(crearAction?.accnameicono, crearAction?.acctipoico),
                  onClick: () => {
                    navigate("crear")
                  },
                },
                {
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
                        if (device === "sm") {
                          return handleExportDataPdfSMScreen(
                            columns,
                            data,
                            "Reporte de Integradoras",
                            `Reporte de Integradoras ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Integradoras",
                          `Reporte de Integradoras ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Reporte de Integradoras ${new Date().toLocaleString()}`)
                      },
                    },
                  ],
                },
                {
                  label: "importar",
                  key: "importarDropdown",
                  icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                  onClick: () => {
                    setOpenModal(true)
                  },
                },
              ]
              return toolbarActions
            }}
            columnsTable={[
              {
                accessorKey: "integracodigo",
                header: "Código",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "integradescri",
                header: "Descripción",
                size: 260,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "integradirecc",
                header: "Dirección",
                size: 260,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "integrafono",
                header: "Teléfono",
                size: 160,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "integrastatus",
                header: "Estado",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "integraruc",
                header: "RUC",
                size: 160,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "integraidentifica",
                header: "Identificación",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "integratipo",
                header: "Tipo",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "sectorcodigo",
                header: "Sector Código",
                size: 140,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "integrafecisys",
                header: "Fecha Creación",
                size: 180,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              {
                accessorKey: "integrahorisys",
                header: "Hora Creación",
                size: 170,
                Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
              },
              {
                accessorKey: "integrausuisys",
                header: "Creado Por",
                size: 170,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "integraestisys",
                header: "Estado Creación",
                size: 240,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "integrafecmsys",
                header: "Fecha Modificación",
                size: 200,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              {
                accessorKey: "integrahormsys",
                header: "Hora Modificación",
                size: 190,
                Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
              },
              {
                accessorKey: "integrausumsys",
                header: "Modificado Por",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "integraestmsys",
                header: "Estado Modificación",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default IntegradoresVentas
