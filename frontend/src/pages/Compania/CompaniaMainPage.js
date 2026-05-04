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
import { getCompaniaLabelValue } from "./utils/companiaLabelMappings"

const ACCIONES = {
  CREAR: "CREAR",
  BUSCAR: "BUSCAR",
  EDITAR: "EDITAR",
  ELIMINAR: "ELIMINAR",
  EXPORTAR: "EXPORTAR",
  IMPORTAR: "IMPORTAR",
  EJECUTAR: "EJECUTAR",
}

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

const Compania = () => {
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

  const { mutateAsync: SaveEliminacionCompania, isPending: isDeletingCompania } = useMutation({
    queryKey: ["isDeletingCompania"],
    fn: async (data) => {
      const response = await api.post("/Compania/eliminarCompania", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["Compania"] })
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
          <b>Compañías</b>
        </div>

        <CustomBackdrop isLoading={isDeletingCompania} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCreacionCompania.csv"
            fieldConfigs={{
              ciacodigo: { required: true, key: true },
              ciadescri: { required: true },
              ciadirec: { required: true },
              ciasrirazon: { required: true },
              ciaanioejer: { required: false },
              ciaauxcredito: { required: false },
              ciacontador: { required: false },
              ciaalias: { required: false },
              ciaruc: { required: false },
              ciafax: { required: false },
              ciafecminacc: { required: false },
              ciaforcencos: { required: false },
              ciaforlin: { required: false },
              ciagerente: { required: false },
              cianivelescc: { required: false },
              cianiveleslin: { required: false },
              ciapresidente: { required: false },
              ciarecsalmen: { required: false },
              ciaregcont: { required: false },
              ciastatus: { required: false },
              ciatelefono1: { required: false },
              ciatelefono2: { required: false },
              ciavigilancia: { required: false },
              ciaciudad: { required: false },
              ciapais: { required: false },
              ciaescontesp: { required: false },
              ciaemail: { required: false },
              ciaweb: { required: false },
              ciaanioinicon: { required: false },
              ciaforpre: { required: false },
              cianivelespre: { required: false },
              ciadiasnc: { required: false },
              ciacedgerente: { required: false },
              ciahelpart: { required: false },
              ciacantfor: { required: false },
              ciacostfor: { required: false },
              ciavehele: { required: false },
              ciapresupuesto: { required: false },
              ciafecinipre: { required: false },
              ciaforcta: { required: false },
              cianivelescta: { required: false },
              ciasrifono: { required: false },
              ciasrifax: { required: false },
              ciasriemail: { required: false },
              ciasriruccontador: { required: false },
              ciatipoidengerente: { required: false },
              ciasridirmatriz: { required: false },
              ciasridocautventas: { required: false },
              ciasrinotdebventas: { required: false },
              ciasrinotcreventas: { required: false },
              ciasriretfueventas: { required: false },
              ciacodlocmatriz: { required: false },
              generacodian: { required: false },
              coscodigo: { required: false },
              aplitransing: { required: false },
              apliserie: { required: false },
              codclisec: { required: false },
              codprosec: { required: false },
              ciasecuencliente: { required: false },
              ciasecuenproveedor: { required: false },
              ciasecuentarjeta: { required: false },
              codartsec: { required: false },
              ciasecuenartventa: { required: false },
              ciasecuenarticulo: { required: false },
              ciaactualizaprecios: { required: false },
              cianumresolucion: { required: false },
              ciafecresolucion: { required: false },
              CiaNivelOrg: { required: false },
              ciafororg: { required: false },
              cianumvend: { required: false },
              ciasolautfactcxp: { required: false },
              ciaaproautfactcxp: { required: false },
              ciasolautanticxp: { required: false },
              ciaaproautanticxp: { required: false },
              ciasolautpagocxp: { required: false },
              ciaaproautpagocxp: { required: false },
              ciaaaocimport: { required: false },
              ciaaaocserv: { required: false },
              ciaaaocgasta: { required: false },
              ciaaaoclocal: { required: false },
              ciaaaocgastasoc: { required: false },
              ciafacitemrep: { required: false },
              ciasecuenemple: { required: false },
              ciasecuencargo: { required: false },
              ciavalprecost: { required: false },
              ciaporretiva: { required: false },
              ciaporretfuente: { required: false },
              ciactapagolote: { required: false },
              ciatipoocfaclote: { required: false },
              ciaivaservicio: { required: false },
              ciafacelectronica: { required: false },
              versionfac: { required: false },
              ciapdfelectronica: { required: false },
              versionpdf: { required: false },
              ciaambienteelectronica: { required: false },
              srimicroempresa: { required: false },
              sricartera: { required: false },
              sriguia: { required: false },
              sriagenteretencion: { required: false },
              sriagenteretencionnumres: { required: false },
              sricorreoffice: { required: false },
              sricopiacorreo: { required: false },
              srimensajefactura: { required: false },
              srissltls: { required: false },
              srioffini: { required: false },
              sriofffin: { required: false },
              ciaaaocliqcomloc: { required: false },
              ciaaaocliqcomimp: { required: false },
              ciaaaocliqcomser: { required: false },
              ciaaaocppe: { required: false },
              ciacobrapuntos: { required: false },
              ciacobracupos: { required: false },
              ciacobrafundacion: { required: false },
              ciancbeneficiario: { required: false },
              ciainmobiliaria: { required: false },
              ciancdevcxccia: { required: false },
              ciadiasretencion: { required: false },
              ciadiasemitirretencion: { required: false },
              ciapropina: { required: false },
              ciacontabilidad: { required: false },
              ciaetiquetaadiret: { required: false },
              ciavaloradiret: { required: false },
              ciasolautclcxp: { required: false },
              ciaaproautclcxp: { required: false },
              ciaivaporproducto: { required: false },
              ciafacDeVariosLoc: { required: false },
              cialistprecdefweb: { required: false },
              ciavalidaemp: { required: false },
              ciabasepuntos: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/Compania/validarCompaniaIMP"
            insertEndpoint="/Compania/insertarCompaniaIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["Compania"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/Compania/getAllCompania"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="Compania"
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
                  onClick: (row) => {
                    if (!canExecute) return
                    navigate("buscar", { state: row.original })
                  },
                })
              }

              if (editarAction) {
                actions.push({
                  label: editarAction.acccaption,
                  key: editarAction.acccaption,
                  icon: getIconComponent(editarAction.accnameicono, editarAction.acctipoico),
                  onClick: (row) => {
                    if (!canExecute) return
                    navigate("editar", { state: row.original })
                  },
                })
              }

              if (eliminarAction) {
                actions.push({
                  label: eliminarAction.acccaption,
                  key: eliminarAction.acccaption,
                  icon: getIconComponent(eliminarAction.accnameicono, eliminarAction.acctipoico),
                  onClick: async (row) => {
                    if (!canExecute) return
                    try {
                      await SaveEliminacionCompania(row.original)
                    } catch (err) {
                      console.error("Error eliminando la compañía:", err)
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
                            "Reporte de Compañías",
                            `Reporte de Compañías ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Compañías",
                          `Reporte de Compañías ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ data }) => {
                        if (!canExecute) return
                        handleAllExportDataCSV(data, `Reporte de Compañías ${new Date().toLocaleString()}`)
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
            columnsTable={[
              {
                accessorKey: "ciacodigo",
                header: "Código",
                size: 140,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciadescri",
                header: "Descripción",
                size: 280,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciastatus",
                header: "Estado",
                size: 140,
                Cell: ({ cell }) => <span>{getCompaniaLabelValue("ciastatus", cell.getValue())}</span>,
              },
              {
                accessorKey: "ciaruc",
                header: "RUC",
                size: 160,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciatelefono1",
                header: "Teléfono 1",
                size: 160,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciatelefono2",
                header: "Teléfono 2",
                size: 160,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciafax",
                header: "Fax",
                size: 140,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciaalias",
                header: "Alias",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciadirec",
                header: "Dirección",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciaciudad",
                header: "Ciudad",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciapais",
                header: "País",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciaemail",
                header: "Email",
                size: 280,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciaweb",
                header: "Página Web",
                size: 280,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciaescontesp",
                header: "Es Contribuyente Especial",
                size: 240,
                Cell: ({ cell }) => <span>{getCompaniaLabelValue("ciaescontesp", cell.getValue())}</span>,
              },
              {
                accessorKey: "cianumresolucion",
                header: "Número Resolución",
                size: 220,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciafecresolucion",
                header: "Fecha Resolución",
                size: 200,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span>
                },
              },
              {
                accessorKey: "sriagenteretencion",
                header: "Agente Retención",
                size: 200,
                Cell: ({ cell }) => <span>{getCompaniaLabelValue("sriagenteretencion", cell.getValue())}</span>,
              },
              {
                accessorKey: "sriagenteretencionnumres",
                header: "Número Res. Agente",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "srimicroempresa",
                header: "Microempresa",
                size: 160,
                Cell: ({ cell }) => <span>{getCompaniaLabelValue("srimicroempresa", cell.getValue())}</span>,
              },
              {
                accessorKey: "ciasrirazon",
                header: "Razón Social SRI",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "cialogo",
                header: "Logo",
                size: 140,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return value ? (
                    <img
                      src={`data:image/png;base64,${value}`}
                      alt="Logo"
                      style={{ maxWidth: "80px", maxHeight: "40px" }}
                    />
                  ) : (
                    <span>N/A</span>
                  )
                },
              },
              {
                accessorKey: "ciaselloagua",
                header: "Sello de Agua",
                size: 160,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return value ? (
                    <img
                      src={`data:image/png;base64,${value}`}
                      alt="Sello"
                      style={{ maxWidth: "80px", maxHeight: "40px" }}
                    />
                  ) : (
                    <span>N/A</span>
                  )
                },
              },
              {
                accessorKey: "ciausuisys",
                header: "Creado Por",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciafecisys",
                header: "Fecha Creación",
                size: 200,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span>
                },
              },
              {
                accessorKey: "ciahorisys",
                header: "Hora Creación",
                size: 190,
                Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
              },
              {
                accessorKey: "ciausumsys",
                header: "Modificado Por",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciafecmsys",
                header: "Fecha Modificación",
                size: 210,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span>
                },
              },
              {
                accessorKey: "ciahormsys",
                header: "Hora Modificación",
                size: 200,
                Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default Compania
