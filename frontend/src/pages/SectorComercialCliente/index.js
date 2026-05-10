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

const SectorComercialCliente = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const { mutateAsync: SaveEliminacionSectorComercialCliente, isPending: isDeletingSectorComercialCliente } =
    useMutation({
      queryKey: ["isDeletingSectorComercialCliente"],
      fn: async (data) => {
        const response = await api.post("/SectorComercialCliente/eliminarSectorComercialCliente", data)
        return response.data
      },
      showError: "modal",
      showSuccess: "toast",
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: ["SectorComercialCliente"] })
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
          <b>Actividad Comercial del Cliente</b>
        </div>

        <CustomBackdrop isLoading={isDeletingSectorComercialCliente} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCreacionSectorComercialCliente.csv"
            fieldConfigs={{
              activicodigo: { required: true, key: true },
              actividescri: { required: true },
              activistatus: { required: false },
              activifecisys: { required: false },
              activihorisys: { required: false },
              activiusuisys: { required: false },
              activiestisys: { required: false },
              activifecmsys: { required: false },
              activihormsys: { required: false },
              activiusumsys: { required: false },
              activiestmsys: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/SectorComercialCliente/validarSectorComercialClienteIMP"
            insertEndpoint="/SectorComercialCliente/insertarSectorComercialClienteIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["SectorComercialCliente"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/SectorComercialCliente/getAllSectorComercialCliente"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="SectorComercialCliente"
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
                      await SaveEliminacionSectorComercialCliente(r.original)
                    } catch (err) {
                      console.error("Error eliminando el sector comercial cliente:", err)
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
                            "Reporte de Actividad Comercial del Cliente",
                            `Reporte de Actividad Comercial del Cliente ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Actividad Comercial del Cliente",
                          `Reporte de Actividad Comercial del Cliente ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(
                          data,
                          `Reporte de Actividad Comercial del Cliente ${new Date().toLocaleString()}`,
                        )
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
                accessorKey: "activicodigo",
                header: "Código",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "actividescri",
                header: "Descripción",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "activistatus",
                header: "Estado",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "activifecisys",
                header: "Fecha Creación",
                size: 180,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              {
                accessorKey: "activihorisys",
                header: "Hora Creación",
                size: 170,
                Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
              },
              {
                accessorKey: "activiusuisys",
                header: "Creado Por",
                size: 170,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "activiestisys",
                header: "Estado Creación",
                size: 240,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "activifecmsys",
                header: "Fecha Modificación",
                size: 200,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              {
                accessorKey: "activihormsys",
                header: "Hora Modificación",
                size: 190,
                Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
              },
              {
                accessorKey: "activiusumsys",
                header: "Modificado Por",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "activiestmsys",
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

export default SectorComercialCliente
