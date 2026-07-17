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

// Helper para parsear la fecha y hora ignorando el desfase GMT
const formatDateTime = (val) => {
  if (!val) return "—"
  const cleanVal = String(val).replace(" GMT", "")
  const d = new Date(cleanVal)
  if (isNaN(d.getTime())) return val

  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mins = String(d.getMinutes()).padStart(2, "0")

  return `${dd}/${mm}/${yyyy} ${hh}:${mins}`
}

const ExcepcionesdeIVA = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const { mutateAsync: SaveEliminacionExcepcion, isPending: isDeletingExcepcion } = useMutation({
    queryKey: ["isDeletingExcepcionIVA"],
    fn: async (data) => {
      const response = await api.post("/ExcepcionesdeIVA/eliminarExcepcionesdeIVA", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["ExcepcionesdeIVA"] })
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
          <b>Gestión de Excepciones de IVA</b>
        </div>

        <CustomBackdrop isLoading={isDeletingExcepcion} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="Plantilla_ExcepcionesIVA.csv"
            fieldConfigs={{
              ivetipocompania: { required: true, key: true },
              ivefecinicio: { required: true, key: true },
              ivefectermino: { required: true },
              iveporcentajeactual: { required: false },
              iveporcentajeresolucion: { required: false },
              ivenumresolucion: { required: false },
              ivemotivo: { required: false },
              ivestatus: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/ExcepcionesdeIVA/validarExcepcionesdeIVAIMP"
            insertEndpoint="/ExcepcionesdeIVA/insertarExcepcionesdeIVAIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["ExcepcionesdeIVA"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/ExcepcionesdeIVA/getAllExcepcionesdeIVA"
            errorMsgFilterSearch="Error al cargar datos de Excepciones de IVA"
            queryKeyModal="ExcepcionesdeIVA"
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
                      await SaveEliminacionExcepcion({
                        ivetipocompania: row.original.ivetipocompania,
                        ivefecinicio: row.original.ivefecinicio,
                      })
                    } catch (err) {
                      console.error("Error eliminando la Excepción:", err)
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
                  label: crearAction?.acccaption || "Crear",
                  key: crearAction?.acccaption || "CREAR",
                  icon: getIconComponent(crearAction?.accnameicono, crearAction?.acctipoico),
                  onClick: () => {
                    navigate("crear")
                  },
                },
                {
                  type: "dropdown",
                  label: exportarAction?.acccaption || "Exportar",
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
                            "Reporte de Excepciones de IVA",
                            `Reporte_Excepciones_IVA_${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Excepciones de IVA",
                          `Reporte_Excepciones_IVA_${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Reporte_Excepciones_IVA_${new Date().toLocaleString()}`)
                      },
                    },
                  ],
                },
                {
                  label: "Importar",
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
                accessorKey: "ivetipocompania",
                header: "Tipo Compañía",
                size: 130,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ivefecinicio",
                header: "Fecha Inicio",
                size: 150,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{formatDateTime(value)}</span>
                },
              },
              {
                accessorKey: "ivefectermino",
                header: "Fecha Término",
                size: 150,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{formatDateTime(value)}</span>
                },
              },
              {
                accessorKey: "iveporcentajeactual",
                header: "% Actual",
                size: 100,
                Cell: ({ cell }) => <span>{cell.getValue()}%</span>,
              },
              {
                accessorKey: "iveporcentajeresolucion",
                header: "% Resolución",
                size: 130,
                Cell: ({ cell }) => <span>{cell.getValue()}%</span>,
              },
              {
                accessorKey: "ivenumresolucion",
                header: "Resolución SRI",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue() || "—"}</span>,
              },
              {
                accessorKey: "ivemotivo",
                header: "Motivo / Descripción",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue() || "—"}</span>,
              },
              {
                accessorKey: "ivestatus",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => {
                  const valor = cell.getValue()
                  return <span>{valor === "A" ? "ACTIVO" : "INACTIVO"}</span>
                },
              },
              {
                accessorKey: "ivefecisys",
                header: "Fecha de Creación",
                size: 160,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value ? normalFormatDate(value) : "—"}</span>
                },
              },
              {
                accessorKey: "iveusuisys",
                header: "Creado Por",
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

export default ExcepcionesdeIVA
