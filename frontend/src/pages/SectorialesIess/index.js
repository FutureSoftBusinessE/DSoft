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

// CORRECCIÓN: StyledRoot ahora es un objeto plano para evitar recursión en el prop 'sx'
const StyledRootStyles = {
  display: "flex",
  flexDirection: "column",
  marginTop: "64px", // Equivalente a theme.spacing(8)
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

const SectorialesIess = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const { mutateAsync: SaveEliminacionSectorialIess, isPending: isDeletingSectorialIess } = useMutation({
    queryKey: ["isDeletingSectorialIess"],
    fn: async (data) => {
      const response = await api.post("/SectorialesIess/eliminarSectorialesIess", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["SectorialesIess"] })
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
          <b>Mantenimiento de Sectoriales del IESS</b>
        </div>

        <CustomBackdrop isLoading={isDeletingSectorialIess} />

        {/* Uso correcto del objeto de estilos en el prop sx */}
        <Box sx={StyledRootStyles}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCargaSectorialesIess.csv"
            fieldConfigs={{
              seccodigo: { required: true, key: true },
              secanio: { required: true, key: true },
              seccargo: { required: true },
              secestruc: { required: false },
              secdetalle: { required: false },
              secsalario: { required: true },
              secstatus: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/SectorialesIess/validarSectorialesIessIMP"
            insertEndpoint="/SectorialesIess/insertarSectorialesIessIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["SectorialesIess"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/SectorialesIess/getAllSectorialesIess"
            errorMsgFilterSearch="Error al cargar registros sectoriales"
            queryKeyModal="SectorialesIess"
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
                      await SaveEliminacionSectorialIess(row.original)
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
                        const title = "Reporte de Salarios Sectoriales IESS"
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
                      onClick: ({ data }) =>
                        handleAllExportDataCSV(data, `Sectoriales IESS ${new Date().toLocaleString()}`),
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
              { accessorKey: "seccodigo", header: "Código IESS", size: 140 },
              { accessorKey: "secanio", header: "Año", size: 100 },
              { accessorKey: "seccargo", header: "Cargo o Actividad", size: 250 },
              { accessorKey: "secestruc", header: "Estructura", size: 120 },
              {
                accessorKey: "secsalario",
                header: "Salario Mínimo",
                size: 130,
                Cell: ({ cell }) => (
                  <span>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cell.getValue())}
                  </span>
                ),
              },
              {
                accessorKey: "secstatus",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => <span>{cell.getValue() === "A" ? "ACTIVO" : "INACTIVO"}</span>,
              },
              {
                accessorKey: "secfecisys",
                header: "Fecha Creación",
                size: 180,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              { accessorKey: "secusuisys", header: "Usuario Creador", size: 150 },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default SectorialesIess
