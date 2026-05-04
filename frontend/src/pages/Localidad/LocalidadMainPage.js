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
import { getLocalidadLabelValue } from "./utils/localidadLabelMappings"

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

const Localidad = () => {
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

  const { mutateAsync: SaveEliminacionLocalidad, isPending: isDeletingLocalidad } = useMutation({
    queryKey: ["isDeletingLocalidad"],
    fn: async (data) => {
      const response = await api.post("/Localidad/eliminarLocalidad", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["Localidad"] })
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
          <b>Localidades</b>
        </div>

        <CustomBackdrop isLoading={isDeletingLocalidad} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCreacionLocalidad.csv"
            fieldConfigs={{
              ciacodigo: { required: true, key: true },
              loccodigo: { required: true, key: true },
              locdescri: { required: true },
              locstatus: { required: true },
              ciadirec: { required: true },
              locservidor: { required: true },
              locfecisys: { required: false },
              lochorisys: { required: false },
              locusuisys: { required: false },
              locfecmsys: { required: false },
              lochormsys: { required: false },
              locusumsys: { required: false },
              ttrcodigo: { required: false },
              seqcodigo: { required: false },
              sercesion: { required: false },
              factippag: { required: false },
              secndmig: { required: false },
              secncmig: { required: false },
              ndfcodigo: { required: false },
              ciaruc: { required: false },
              ciaciudad: { required: false },
              ciapais: { required: false },
              ciatelefono1: { required: false },
              ciatelefono2: { required: false },
              ciafax: { required: false },
              ciaemail: { required: false },
              ciaseccobfac: { required: false },
              ciaseccobdoc: { required: false },
              ciasecinvnc: { required: false },
              fafaccob: { required: false },
              fadesglobal: { required: false },
              fatrainv: { required: false },
              fasumadesc: { required: false },
              fanumlin: { required: false },
              fatraanu: { required: false },
              famimpser: { required: false },
              famporser: { required: false },
              famrecporval: { required: false },
              fampor1: { required: false },
              tipcodigo: { required: false },
              forpagnd: { required: false },
              vencodigo: { required: false },
              zoncodigo: { required: false },
              ncfcodigo: { required: false },
              repbodcod: { required: false },
              seqantdocgar: { required: false },
              cablin1: { required: false },
              cablin2: { required: false },
              cablin3: { required: false },
              cablin4: { required: false },
              pielin1: { required: false },
              pielin2: { required: false },
              pielin3: { required: false },
              pielin4: { required: false },
              parfecven: { required: false },
              pardiasven: { required: false },
              unicodigo: { required: false },
              procodigo: { required: false },
              regcodigo: { required: false },
              bodcodpro: { required: false },
              invcodpro: { required: false },
              pacodingre: { required: false },
              pacodegre: { required: false },
              pacodingdev: { required: false },
              pacodegprest: { required: false },
              pacodinggar: { required: false },
              pacodegrgar: { required: false },
              pacodegrpro: { required: false },
              painvcodgar: { required: false },
              pabodcodgar: { required: false },
              seqcodigonc: { required: false },
              sercodigo: { required: false },
              tracodproing: { required: false },
              tracodproegr: { required: false },
              seqcodigondm: { required: false },
              sercodigondm: { required: false },
              invemiped: { required: false },
              forpagun: { required: false },
              cencosun: { required: false },
              tipordcom: { required: false },
              tipclipro: { required: false },
              probodcod: { required: false },
              propormano: { required: false },
              proporrepuesto: { required: false },
              tipordcomser: { required: false },
              seqndref: { required: false },
              seqncmref: { required: false },
              seqcobref: { required: false },
              serndref: { required: false },
              serncintref: { required: false },
              serncref: { required: false },
              paramcod1: { required: false },
              paramcod2: { required: false },
              paramcod3: { required: false },
              paramcod4: { required: false },
              paramcod5: { required: false },
              paramcod6: { required: false },
              paramval1: { required: false },
              paramval2: { required: false },
              paramval3: { required: false },
              paramval4: { required: false },
              paramval5: { required: false },
              paramval6: { required: false },
              tracodingloc: { required: false },
              locfecinicxc: { required: false },
              clicodingprod: { required: false },
              procodingprod: { required: false },
              flagapruanti: { required: false },
              feccorpedveh: { required: false },
              seqcesion: { required: false },
              ciaprovincia: { required: false },
              tarseqnd: { required: false },
              tarforpag: { required: false },
              tarser00: { required: false },
              tarrecau: { required: false },
              tarser01: { required: false },
              tarser02: { required: false },
              tarser03: { required: false },
              tarser04: { required: false },
              tarseqndint: { required: false },
              tarserint: { required: false },
              tarforpagint: { required: false },
              tarsecncrotdif: { required: false },
              tarserncrotdif: { required: false },
              tartiponccom: { required: false },
              tarsecncpuntos: { required: false },
              tarserncpuntos: { required: false },
              tarvalcomigen: { required: false },
              tarcanapligen: { required: false },
              tarvalcomiart: { required: false },
              tarcanapliart: { required: false },
              tarsecant: { required: false },
              tarseccob: { required: false },
              cjacodigonc: { required: false },
              tardiasventrans: { required: false },
              emailsmtp: { required: false },
              emailmascara: { required: false },
              emailsalida: { required: false },
              emailtema: { required: false },
              emailmensaje: { required: false },
              locpathxml: { required: false },
              prescodigo: { required: false },
              presaplicaquin: { required: false },
              presaplicamens: { required: false },
              prestipcliempl: { required: false },
              presseccobro: { required: false },
              pressecncmon: { required: false },
              presserncmon: { required: false },
              sertarpos: { required: false },
              tipoingoc: { required: false },
              tipoegroc: { required: false },
              diasvenoc: { required: false },
              secantoc: { required: false },
              valorminimooc: { required: false },
              guianumlin: { required: false },
              locpathxmldocemitidos: { required: false },
              locpathxmldocanulados: { required: false },
              ciucodigo: { required: false },
              activicodigo: { required: false },
              sectorcodigo: { required: false },
              clivendedor: { required: false },
              tbliqcaja: { required: false },
              tbliqviatico: { required: false },
              traegrped: { required: false },
              traingped: { required: false },
              bcoliqviatico: { required: false },
              notapedido1: { required: false },
              notapedido2: { required: false },
              notaoc: { required: false },
              invtrapresegr: { required: false },
              invtrapresing: { required: false },
              sercodigotransporte: { required: false },
              notacertificado: { required: false },
              clavep12: { required: false },
              paramcoding: { required: false },
              paramtipond: { required: false },
              paramtiponc: { required: false },
              paramstnd: { required: false },
              paramstnc: { required: false },
              paramtcnd: { required: false },
              paramtcnc: { required: false },
              parambodingegr: { required: false },
              ctaivapagadobien: { required: false },
              ctaivapagadoserv: { required: false },
              emailsubject: { required: false },
              caducidadp12: { required: false },
              locflagcupon: { required: false },
              locvalcupon: { required: false },
              locfecinicupon: { required: false },
              locfecfincupon: { required: false },
              parrocodigo: { required: false },
              clidiascrs: { required: false },
              climontocrs: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/Localidad/validarLocalidadIMP"
            insertEndpoint="/Localidad/insertarLocalidadIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["Localidad"] })}
          />

          <CustomConditionalActionsTableServer
            endpoint="/Localidad/getAllLocalidad"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="Localidad"
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
                      await SaveEliminacionLocalidad(row.original)
                    } catch (err) {
                      console.error("Error eliminando la localidad:", err)
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
                            "Reporte de Localidades",
                            `Reporte de Localidades ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de Localidades",
                          `Reporte de Localidades ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ data }) => {
                        if (!canExecute) return
                        handleAllExportDataCSV(data, `Reporte de Localidades ${new Date().toLocaleString()}`)
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
                header: "Compañía",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "loccodigo",
                header: "Código",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "locdescri",
                header: "Razón Social",
                size: 260,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "locstatus",
                header: "Estado",
                size: 130,
                Cell: ({ cell }) => <span>{getLocalidadLabelValue("locstatus", cell.getValue())}</span>,
              },
              {
                accessorKey: "ciaruc",
                header: "RUC",
                size: 160,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciadirec",
                header: "Dirección",
                size: 280,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciaciudad",
                header: "Ciudad",
                size: 160,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciaprovincia",
                header: "Provincia",
                size: 160,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciapais",
                header: "País",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "unicodigo",
                header: "Unidad Negocio",
                size: 170,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciatelefono1",
                header: "Teléfono 1",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciatelefono2",
                header: "Teléfono 2",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciafax",
                header: "Fax",
                size: 140,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "ciaemail",
                header: "Email",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "locservidor",
                header: "Servidor",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "fatrainv",
                header: "Reporte Factura",
                size: 170,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "notacertificado",
                header: "Nota Certificado",
                size: 280,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "locpathxml",
                header: "Ruta p12",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "locusuisys",
                header: "Creado por",
                size: 160,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "locfecisys",
                header: "Fecha Creación",
                size: 180,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              {
                accessorKey: "lochorisys",
                header: "Hora Creación",
                size: 170,
                Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
              },
              {
                accessorKey: "locusumsys",
                header: "Modificado por",
                size: 170,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "locfecmsys",
                header: "Fecha Modificación",
                size: 190,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              {
                accessorKey: "lochormsys",
                header: "Hora Modificación",
                size: 180,
                Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default Localidad
