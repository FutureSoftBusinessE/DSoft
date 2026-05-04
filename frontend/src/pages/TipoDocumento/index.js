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

const TipoDocumento = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const { mutateAsync: SaveEliminacionTipoDocumento, isPending: isDeletingTipoDocumento } = useMutation({
    queryKey: ["isDeletingTipoDocumento"],
    fn: async (data) => {
      const response = await api.post("/TipoDocumento/eliminarTipoDocumento", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["TipoDocumento"] })
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
          <b>Tipos de Documento</b>
        </div>

        <CustomBackdrop isLoading={isDeletingTipoDocumento} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCreacionTipoDocumento.csv"
            fieldConfigs={{
              tipdoccodigo: { required: true, key: true },
              tipdocdescri: { required: true },
              tipdocstatus: { required: false },
              tipdocfechorisys: { required: false },
              tipdocusuisys: { required: false },
              tipdocestisys: { required: false },
              tipdocfechormsys: { required: false },
              tipdocusumsys: { required: false },
              tipdocestmsys: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/TipoDocumento/validarTipoDocumentoIMP"
            insertEndpoint="/TipoDocumento/insertarTipoDocumentoIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["TipoDocumento"] })}
          />
          <CustomConditionalActionsTableServer
            endpoint="/TipoDocumento/getAllTipoDocumento"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="TipoDocumento"
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
                      await SaveEliminacionTipoDocumento(row.original)
                    } catch (err) {
                      console.error("Error eliminando el tipo de documento:", err)
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
                            "Reporte de Tipos de Documento",
                            `Reporte de Tipos de Documento ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Tipos de Documento",
                          `Reporte de Tipos de Documento ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Reporte de Tipos de Documento ${new Date().toLocaleString()}`)
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
                accessorKey: "tipdoccodigo",
                header: "Código",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "tipdocdescri",
                header: "Descripción",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "tipdocstatus",
                header: "Estado",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "tipdocfechorisys",
                header: "Fecha de Creación",
                size: 250,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span>
                },
              },
              {
                accessorKey: "tipdocusuisys",
                header: "Creado Por",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "tipdocestisys",
                header: "Estado Creación",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "tipdocfechormsys",
                header: "Fecha de Modificación",
                size: 250,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span>
                },
              },
              {
                accessorKey: "tipdocusumsys",
                header: "Modificado Por",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "tipdocestmsys",
                header: "Estado Modificación",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default TipoDocumento
