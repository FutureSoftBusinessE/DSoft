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

const Parroquia = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const { mutateAsync: SaveEliminacionParroquia, isPending: isDeletingParroquia } = useMutation({
    queryKey: ["isDeletingParroquia"],
    fn: async (data) => {
      const response = await api.post("/Parroquia/eliminarParroquia", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["Parroquia"] })
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
          <b>Parroquias</b>
        </div>

        <CustomBackdrop isLoading={isDeletingParroquia} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCreacionParroquia.csv"
            fieldConfigs={{
              parrocodigo: { required: true, key: true },
              parrodescri: { required: true },
              parrostatus: { required: false },
              parrofecsys: { required: false },
              parrohorsys: { required: false },
              parroususys: { required: false },
              parroestsys: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/Parroquia/validarParroquiaIMP"
            insertEndpoint="/Parroquia/insertarParroquiaIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["Parroquia"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/Parroquia/getAllParroquia"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="Parroquia"
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
                      await SaveEliminacionParroquia(r.original)
                    } catch (err) {
                      console.error("Error eliminando la parroquia:", err)
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
                            "Reporte de Parroquias",
                            `Reporte de Parroquias ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Parroquias",
                          `Reporte de Parroquias ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Reporte de Parroquias ${new Date().toLocaleString()}`)
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
                accessorKey: "parrocodigo",
                header: "Código",
                size: 130,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "parrodescri",
                header: "Descripción",
                size: 280,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "parrostatus",
                header: "Estado",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "parrofecsys",
                header: "Fecha de Creación",
                size: 220,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span>
                },
              },
              {
                accessorKey: "parrohorsys",
                header: "Hora de Creación",
                size: 200,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatHour(value)}</span>
                },
              },
              {
                accessorKey: "parroususys",
                header: "Creado Por",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "parroestsys",
                header: "Estado",
                size: 220,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default Parroquia
