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

const PlanesServicios = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const { mutateAsync: SaveEliminacionPlanServicio, isPending: isDeletingPlanServicio } = useMutation({
    queryKey: ["isDeletingPlanServicio"],
    fn: async (data) => {
      const response = await api.post("/PlanesServicios/eliminarPlanesServicios", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["PlanesServicios"] })
    },
  })

  const [openModal, setOpenModal] = useState(false)

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
          <b>Planes de Servicios</b>
        </div>

        <CustomBackdrop isLoading={isDeletingPlanServicio} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCreacionPlanesServicios.csv"
            fieldConfigs={{
              invcodigo: { required: true, key: true },
              artcodigo: { required: true, key: true },
              artdescri: { required: true },
              artprecventa1: { required: true },
              artapliiva: { required: true },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/PlanesServicios/validarPlanesServiciosIMP"
            insertEndpoint="/PlanesServicios/insertarPlanesServiciosIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["PlanesServicios"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/PlanesServicios/getAllPlanesServicios"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="PlanesServicios"
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
                  onClick: (row) => {
                    navigate("editar", { state: row.original })
                  },
                },
                {
                  label: eliminarAction?.acccaption,
                  key: eliminarAction?.acccaption,
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (row) => {
                    try {
                      await SaveEliminacionPlanServicio({
                        invcodigo: row.original.invcodigo,
                        artcodigo: row.original.artcodigo,
                      })
                    } catch (err) {
                      console.error("Error eliminando el plan de servicio:", err)
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
                            "Reporte de Planes de Servicios",
                            `Reporte de Planes de Servicios ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Planes de Servicios",
                          `Reporte de Planes de Servicios ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Reporte de Planes de Servicios ${new Date().toLocaleString()}`)
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
                accessorKey: "invcodigo",
                header: "Inventario",
                size: 130,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "artcodigo",
                header: "Código Artículo",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "artdescri",
                header: "Descripción",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "artstatus",
                header: "Estado",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "artapliiva",
                header: "Aplica IVA",
                size: 160,
                Cell: ({ cell }) => <span>{Number(cell.getValue()) !== 0 ? "Sí" : "No"}</span>,
              },
              {
                accessorKey: "artprecventa1",
                header: "Precio",
                size: 120,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  const numValue = parseFloat(value)
                  return <span>${isNaN(numValue) ? "0.00" : numValue.toFixed(2)}</span>
                },
              },
              {
                accessorKey: "artfecisys",
                header: "Fecha de Creación",
                size: 180,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span>
                },
              },
              {
                accessorKey: "artusuisys",
                header: "Creado Por",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "artfecmsys",
                header: "Fecha de Modificación",
                size: 180,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span>
                },
              },
              {
                accessorKey: "artusumsys",
                header: "Modificado Por",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default PlanesServicios
