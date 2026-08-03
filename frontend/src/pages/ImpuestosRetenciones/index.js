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
import ModalReplicarImpuesto from "./components/ModalReplicarImpuesto"

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

const getTipoLabel = (value) => {
  if (String(value) === "I") return "Impuesto"
  if (String(value) === "R") return "Retención"
  return "-"
}

const getEsIvaLabel = (value) => {
  const text = String(value ?? "")
  if (text === "0") return "Otro"
  if (text === "1") return "I.V.A."
  if (text === "2") return "I.C.E."
  return "-"
}

const getAplicaLabel = (value) => {
  if (String(value) === "F") return "Fuente (Subtotal)"
  if (String(value) === "I") return "Valor I.V.A."
  return "-"
}

const getBienSerLabel = (value) => {
  if (String(value) === "B") return "Bienes"
  if (String(value) === "S") return "Servicios"
  if (String(value) === "G") return "Gastos"
  return "-"
}

const getEstadoLabel = (value) => {
  if (String(value) === "A") return "Activo"
  if (String(value) === "I") return "Inactivo"
  return "-"
}

const ImpuestosRetenciones = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [openModal, setOpenModal] = useState(false)

  const [openModalReplica, setOpenModalReplica] = useState(false)
  const [impuestoSeleccionado, setImpuestoSeleccionado] = useState(null)

  const { mutateAsync: SaveEliminacionImpuestoRetencion, isPending: isDeletingImpuestoRetencion } = useMutation({
    queryKey: ["isDeletingImpuestoRetencion"],
    fn: async (data) => {
      const response = await api.post("/ImpuestosRetenciones/eliminarImpuestosRetenciones", data)
      return response.data
    },
    showError: "modal",
    showSuccess: "toast",
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["ImpuestosRetenciones"] })
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
          <b>Impuestos y Retenciones</b>
        </div>

        <CustomBackdrop isLoading={isDeletingImpuestoRetencion} />

        <Box className={StyledRoot}>
          <ModalImportCSV
            open={openModal}
            onClose={() => setOpenModal(false)}
            templateFileName="PlantillaCreacionImpuestosRetenciones.csv"
            fieldConfigs={{
              impid: { required: true, key: true },
              impdescri: { required: true },
              impctanor: { required: false },
              impporcent: { required: false },
              impesiva: { required: false },
              impaplica: { required: false },
              impstatus: { required: false },
              impretimp: { required: false },
              codSRI: { required: false },
              desSRI: { required: false },
              impbienser: { required: false },
            }}
            maxFileSize={10 * 1024 * 1024}
            validateEndpoint="/ImpuestosRetenciones/validarImpuestosRetencionesIMP"
            insertEndpoint="/ImpuestosRetenciones/insertarImpuestosRetencionesIMP"
            onImportComplete={() => qc.invalidateQueries({ queryKey: ["ImpuestosRetenciones"] })}
          />

          {/* Modal de replicacion */}
          <ModalReplicarImpuesto
            open={openModalReplica}
            onClose={() => {
              setOpenModalReplica(false)
              setImpuestoSeleccionado(null)
            }}
            impuestoOrigen={impuestoSeleccionado}
            onReplicaCompleta={() => {
              qc.invalidateQueries({ queryKey: ["ImpuestosRetenciones"] })
            }}
          />

          <CustomConditionalActionsTableServer
            endpoint="/ImpuestosRetenciones/getAllImpuestosRetenciones"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="ImpuestosRetenciones"
            perPage={10}
            rowActionsWidthTable={180}
            rowActions={(row) => {
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "EDITAR",
              )
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "ELIMINAR",
              )
              const replicarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "REPLICAR",
              )

              return [
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
                      await SaveEliminacionImpuestoRetencion(r.original)
                    } catch (err) {
                      console.error("Error eliminando impuesto/retención:", err)
                    }
                  },
                },
                {
                  label: replicarAction?.acccaption,
                  key: replicarAction?.acccaption,
                  icon: getIconComponent(replicarAction?.accnameicono, replicarAction?.acctipoico),
                  onClick: (r) => {
                    setImpuestoSeleccionado(r.original)
                    setOpenModalReplica(true)
                  },
                },
              ]
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
                        const title = "Reporte de Impuestos y Retenciones"
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
                      onClick: ({ data }) => handleAllExportDataCSV(data, `Imp y Ret ${new Date().toLocaleString()}`),
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
              {
                accessorKey: "impid",
                header: "Código",
                size: 130,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "impretimp",
                header: "Tipo",
                size: 120,
                Cell: ({ cell }) => <span>{getTipoLabel(cell.getValue())}</span>,
              },
              {
                accessorKey: "impdescri",
                header: "Descripción",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "impctanor",
                header: "Cuenta",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
              },
              {
                accessorKey: "pctanomcta",
                header: "Nombre Cuenta",
                size: 220,
                Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
              },
              {
                accessorKey: "impporcent",
                header: "%",
                size: 90,
                Cell: ({ cell }) => <span>{cell.getValue() ?? 0}</span>,
              },
              {
                accessorKey: "impesiva",
                header: "Tipo Impuesto",
                size: 140,
                Cell: ({ cell }) => <span>{getEsIvaLabel(cell.getValue())}</span>,
              },
              {
                accessorKey: "impaplica",
                header: "Cálculo Aplica",
                size: 170,
                Cell: ({ cell }) => <span>{getAplicaLabel(cell.getValue())}</span>,
              },
              {
                accessorKey: "impbienser",
                header: "Aplica a",
                size: 140,
                Cell: ({ cell }) => <span>{getBienSerLabel(cell.getValue())}</span>,
              },
              {
                accessorKey: "codSRI",
                header: "Código SRI",
                size: 140,
                Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
              },
              {
                accessorKey: "desSRI",
                header: "Concepto SRI",
                size: 220,
                Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
              },
              {
                accessorKey: "impstatus",
                header: "Estado",
                size: 120,
                Cell: ({ cell }) => <span>{getEstadoLabel(cell.getValue())}</span>,
              },
              {
                accessorKey: "impfecisys",
                header: "Fecha Creación",
                size: 170,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              {
                accessorKey: "imphorisys",
                header: "Hora Creación",
                size: 160,
                Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
              },
              {
                accessorKey: "impusuisys",
                header: "Creado Por",
                size: 160,
                Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
              },
              {
                accessorKey: "impfecmsys",
                header: "Fecha Modificación",
                size: 190,
                Cell: ({ cell }) => <span>{normalFormatDate(cell.getValue())}</span>,
              },
              {
                accessorKey: "imphormsys",
                header: "Hora Modificación",
                size: 180,
                Cell: ({ cell }) => <span>{normalFormatHour(cell.getValue())}</span>,
              },
              {
                accessorKey: "impusumsys",
                header: "Modificado Por",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default ImpuestosRetenciones
