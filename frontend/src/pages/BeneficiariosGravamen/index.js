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
      main: "#196C87", // Cambia el color secundario a verde azulado
    },
  },
})

const BeneficiariosGravamen = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const { mutateAsync: SaveEliminacionBeneficiarioGravamen, isPending: isDeletingBeneficiarioGravamen } = useMutation({
    queryKey: ["isDeletingBeneficiarioGravamen"],
    fn: async (data) => {
      const response = await api.post("/BeneficiariosGravamen/eliminarBeneficiarioGravamen", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["BeneficiariosGravamen"] })
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
          <b>Beneficiarios de Gravamen</b>
        </div>

        <CustomBackdrop isLoading={isDeletingBeneficiarioGravamen} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCreacionBeneficiariosGravamen.csv"
            fieldConfigs={{
              benegravamen: { required: true, key: true },
              benegrafecisys: { required: false },
              benegrausuisys: { required: false },
              benegraestisys: { required: false },
              benegrafecmsys: { required: false },
              benegrausumsys: { required: false },
              benegraestmsys: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024} // 10MB
            validateEndpoint="/BeneficiariosGravamen/validarBeneficiariosGravamenIMP"
            insertEndpoint="/BeneficiariosGravamen/insertarBeneficiariosGravamenIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["BeneficiariosGravamen"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/BeneficiariosGravamen/getAllBeneficiariosGravamen"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="BeneficiariosGravamen"
            perPage={10}
            rowActionsWidthTable={120}
            rowActions={(row) => {
              // Buscar todas las acciones necesarias
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
                      await SaveEliminacionBeneficiarioGravamen(row.original)
                    } catch (err) {
                      console.error("Error eliminando el beneficiario de gravamen:", err)
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
                            "Reporte de Beneficiarios de Gravamen",
                            `Reporte de Beneficiarios de Gravamen ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Beneficiarios de Gravamen",
                          `Reporte de Beneficiarios de Gravamen ${new Date().toLocaleString()}`,
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
                          `Reporte de Beneficiarios de Gravamen ${new Date().toLocaleString()}`,
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
                accessorKey: "benegravamen",
                header: "Beneficiario de gravamen",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "benegrafecisys",
                header: "Fecha de Creación",
                size: 250,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span> // Formatear la fecha
                },
              },
              {
                accessorKey: "benegrausuisys",
                header: "Creado Por",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "benegraestisys",
                header: "Estado Creación",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "benegrafecmsys",
                header: "Fecha de Modificación",
                size: 250,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span> // Formatear la fecha
                },
              },
              {
                accessorKey: "benegrausumsys",
                header: "Modificado Por",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "benegraestmsys",
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

export default BeneficiariosGravamen
