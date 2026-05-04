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
import { getTiposClienteLabelValue } from "./utils/tiposClienteLabelMappings"

const ACCIONES = {
  CREAR: "CREAR",
  BUSCAR: "BUSCAR",
  EDITAR: "EDITAR",
  ELIMINAR: "ELIMINAR",
  EXPORTAR: "EXPORTAR",
  IMPORTAR: "IMPORTAR",
  EJECUTAR: "EJECUTAR",
}

const MAIN_GENERALES_COLUMNS = [
  { accessorKey: "clicodigo", header: "Código", size: 110 },
  { accessorKey: "clinombre", header: "Nombre", size: 240 },
  {
    accessorKey: "clistatus",
    header: "Estado",
    size: 120,
    Cell: ({ cell }) => <span>{getTiposClienteLabelValue("clistatus", cell.getValue())}</span>,
  },
  { accessorKey: "cliidentifica", header: "Tipo Identificación", size: 180 },
  { accessorKey: "cliruc", header: "No Identificación", size: 180 },
  { accessorKey: "clitipodomicilio", header: "Tipo Domicilio", size: 160 },
  { accessorKey: "clitiempodomicilio", header: "Tiempo Domicilio", size: 160 },
  { accessorKey: "cliubicacionrapido", header: "Ref. Rápida", size: 220 },
  { accessorKey: "clidirec", header: "Dirección", size: 260 },
  { accessorKey: "activicodigo", header: "Actividad R.U.C.", size: 200 },
  { accessorKey: "clitelpref1", header: "Pref Tel 1", size: 200 },
  { accessorKey: "clitelef1", header: "Teléfono 1", size: 140 },
  { accessorKey: "clitelext1", header: "Ext 1", size: 90 },
  { accessorKey: "clitelpref2", header: "Pref Tel 2", size: 110 },
  { accessorKey: "clitelef2", header: "Teléfono 2", size: 140 },
  { accessorKey: "clitelext2", header: "Ext 2", size: 90 },
  { accessorKey: "clifax", header: "Fax", size: 130 },
  { accessorKey: "clifonolabora", header: "Celular", size: 140 },
  { accessorKey: "cliprofesion", header: "Profesión", size: 180 },
  { accessorKey: "cliaparta", header: "Apartado Postal", size: 160 },
  { accessorKey: "cliemail", header: "Email", size: 220 },
  { accessorKey: "website", header: "Web Site", size: 200 },
  { accessorKey: "tipcodigo", header: "Tipo Cliente", size: 160 },
  {
    accessorKey: "clifecnac",
    header: "Fecha Nacimiento",
    size: 180,
    Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
  },
  { accessorKey: "clisexo", header: "Sexo", size: 100 },
  { accessorKey: "clipersona", header: "Persona", size: 140 },
  {
    accessorKey: "clifecisys",
    header: "Fec. Creación",
    size: 150,
    Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
  },
  {
    accessorKey: "clihorisys",
    header: "Hor. Creación",
    size: 150,
    Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
  },
  { accessorKey: "cliusuisys", header: "Usr. Creación", size: 180 },
  {
    accessorKey: "clifecmsys",
    header: "Fec. Modificación",
    size: 180,
    Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
  },
  {
    accessorKey: "clihormsys",
    header: "Hor. Modificación",
    size: 180,
    Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
  },
  { accessorKey: "cliusumsys", header: "Usr. Modificación", size: 180 },
  { accessorKey: "cliestisys", header: "Est. Creación", size: 180 },
  { accessorKey: "cliestmsys", header: "Est. Modificación", size: 180 },
]

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

const TiposCliente = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const actionList = selectedMenuInfo?.data?.barraAcciones || []
  const hasPermission = (permissionCodeOrCaption) =>
    actionList.some(
      (action) => action?.acccaption === permissionCodeOrCaption || action?.acccodigo === permissionCodeOrCaption,
    )
  const getAction = (caption) => actionList.find((action) => action?.acccaption === caption)
  const canExecute = hasPermission(ACCIONES.EJECUTAR)

  const { mutateAsync: SaveEliminacionTiposCliente, isPending: isDeletingTiposCliente } = useMutation({
    queryKey: ["isDeletingTiposCliente"],
    fn: async (data) => {
      const response = await api.post("/TiposCliente/eliminarTiposCliente", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["TiposCliente"] })
    },
  })

  const navigateWithRow = (path, rowData) => {
    const safeRow = rowData || {}
    let fallbackCiaCodigo = ""

    try {
      const jwt = JSON.parse(localStorage.getItem("jwt") || "{}")
      fallbackCiaCodigo = jwt?.compania?.ciacodigo || jwt?.seleccion?.compania?.ciacodigo || ""
    } catch {
      fallbackCiaCodigo = ""
    }

    const rowWithCompany = {
      ...safeRow,
      ciacodigo: safeRow?.ciacodigo || fallbackCiaCodigo || "",
    }

    try {
      sessionStorage.setItem("tiposCliente.selectedRow", JSON.stringify(rowWithCompany))
    } catch {
      // noop
    }

    navigate(path, { state: rowWithCompany })
  }

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
          <b>Tipos de Cliente</b>
        </div>

        <CustomBackdrop isLoading={isDeletingTiposCliente} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCreacionTiposCliente.csv"
            fieldConfigs={{
              cliaccion: { required: true },
              ciacodigo: { required: true, key: true },
              clicodigo: { required: true, key: true },
              clinombre: { required: true },
              clidirec: { required: true },
              clistatus: { required: true },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/TiposCliente/validarTiposClienteIMP"
            insertEndpoint="/TiposCliente/insertarTiposClienteIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["TiposCliente"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/TiposCliente/getAllTiposCliente"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="TiposCliente"
            perPage={10}
            rowActionsWidthTable={180}
            rowActions={(row) => {
              const buscarAction = getAction(ACCIONES.BUSCAR)
              const editarAction = getAction(ACCIONES.EDITAR)
              const eliminarAction = getAction(ACCIONES.ELIMINAR)

              const actions = []

              if (buscarAction) {
                actions.push({
                  label: buscarAction.acccaption,
                  key: buscarAction.acccaption,
                  icon: getIconComponent(buscarAction.accnameicono, buscarAction.acctipoico),
                  onClick: (r) => {
                    if (!canExecute) return
                    navigateWithRow("buscar", r.original)
                  },
                })
              }

              if (editarAction) {
                actions.push({
                  label: editarAction.acccaption,
                  key: editarAction.acccaption,
                  icon: getIconComponent(editarAction.accnameicono, editarAction.acctipoico),
                  onClick: (r) => {
                    if (!canExecute) return
                    navigateWithRow("editar", r.original)
                  },
                })
              }

              if (eliminarAction) {
                actions.push({
                  label: eliminarAction.acccaption,
                  key: eliminarAction.acccaption,
                  icon: getIconComponent(eliminarAction.accnameicono, eliminarAction.acctipoico),
                  onClick: async (r) => {
                    if (!canExecute) return
                    try {
                      await SaveEliminacionTiposCliente(r.original)
                    } catch (err) {
                      console.error("Error eliminando el tipo de cliente:", err)
                    }
                  },
                })
              }

              return actions
            }}
            topToolbarCustomActions={({ table, device }) => {
              const crearAction = getAction(ACCIONES.CREAR)
              const exportarAction = getAction(ACCIONES.EXPORTAR)
              const importarAction = getAction(ACCIONES.IMPORTAR)
              const toolbarActions = []

              if (crearAction) {
                toolbarActions.push({
                  label: crearAction.acccaption,
                  key: crearAction.acccaption,
                  icon: getIconComponent(crearAction.accnameicono, crearAction.acctipoico),
                  onClick: () => {
                    if (!canExecute) return
                    navigate("crear")
                  },
                })
              }

              if (exportarAction) {
                toolbarActions.push({
                  type: "dropdown",
                  label: exportarAction.acccaption,
                  key: "exportarDropdown",
                  icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                  actions: [
                    {
                      label: "Exportar PDF",
                      key: "exportarPDF",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ columns, data }) => {
                        if (!canExecute) return
                        if (device === "sm") {
                          return handleExportDataPdfSMScreen(
                            columns,
                            data,
                            "Reporte de Tipos de Cliente",
                            `Reporte de Tipos de Cliente ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Tipos de Cliente",
                          `Reporte de Tipos de Cliente ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ data }) => {
                        if (!canExecute) return
                        handleAllExportDataCSV(data, `Reporte de Tipos de Cliente ${new Date().toLocaleString()}`)
                      },
                    },
                  ],
                })
              }

              if (importarAction) {
                toolbarActions.push({
                  label: importarAction.acccaption,
                  key: "importarDropdown",
                  icon: getIconComponent(importarAction.accnameicono, importarAction.acctipoico),
                  onClick: () => {
                    if (!canExecute) return
                    setOpenModal(true)
                  },
                })
              }

              return toolbarActions
            }}
            columnsTable={MAIN_GENERALES_COLUMNS}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default TiposCliente
