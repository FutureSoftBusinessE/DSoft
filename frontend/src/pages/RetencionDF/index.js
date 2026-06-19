/* eslint-disable camelcase */
import React, { useContext, useState } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box } from "@mui/material"
import BackIcon from "../../components/BackIcon"
import { useNavigate } from "react-router-dom"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import normalFormatDate from "../utils/date/DDMMYYYFormatDate"
import {
  handleExportDataPdfLGScreen,
  handleExportDataPdfSMScreen,
  handleAllExportDataCSV,
} from "../utils/reactTableActions/exportToolbarActions"
import { GlobalContext } from "../../contexts/GlobalContext"
import CustomBackdrop from "../../components/CustomBackdrop"
import Swal from "sweetalert2"
import getIconComponent from "../utils/getIconComponent"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "../../api"

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

// Mapeo exacto de las acciones dinámicas de la BD
const ACCIONES = {
  CREAR: "CREAR",
  BUSCAR: "BUSCAR",
  EDITAR: "",
  ELIMINAR: "",
  EXPORTAR: "EXPORTAR",
  IMPORTAR: "IMPORTAR",
  FACTURAR: "FACTURAR",
  AUTORIZAR: "AUTORIZAR",
  RIDE: "RIDE",
}

const RetencionDF = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { selectedMenuInfo } = useContext(GlobalContext)
  const [isLoading, setIsLoading] = useState(false)

  // ACCIÓN: AUTORIZAR SRI
  const handleAutorizar = async (row) => {
    const { retid } = row.original

    Swal.fire({
      title: "¿Autorizar Retención?",
      text: `¿Está seguro que desea enviar el comprobante de retención ${retid} al SRI?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#196C87",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, autorizar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true)
        try {
          const response = await api.post("/RetencionDF/autorizarSRI", { retid })
          if (response.data.success) {
            Swal.fire("¡Autorizado!", `La Retención ${retid} fue autorizada con éxito.`, "success")
            queryClient.invalidateQueries(["listarRetencionDF"])
          } else {
            Swal.fire("Error SRI", response.data.message || "No se pudo autorizar el documento", "error")
          }
        } catch (error) {
          Swal.fire("Error de conexión", "Ocurrió un error al intentar comunicarse con el SRI.", "error")
        } finally {
          setIsLoading(false)
        }
      }
    })
  }

  // ACCIÓN: RIDE (Descarga PDF Real)
  const generateRIDE = async (row) => {
    const { retid } = row.original

    Swal.fire({
      title: "Generando RIDE...",
      text: "Por favor espere mientras se descarga el documento",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    })

    try {
      const response = await api.post("/RetencionDF/descargarRIDE", { retid })
      if (response.data.success && response.data.ridePDF) {
        const linkSource = `data:application/pdf;base64,${response.data.ridePDF}`
        const downloadLink = document.createElement("a")
        const fileName = `Retencion_${response.data.claveAcceso || retid}.pdf`

        downloadLink.href = linkSource
        downloadLink.download = fileName
        downloadLink.click()

        Swal.close()
      } else {
        Swal.fire("Error", response.data.message || "El PDF no está disponible", "error")
      }
    } catch (error) {
      Swal.fire("Error de conexión", "Ocurrió un problema al descargar el RIDE.", "error")
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CustomBackdrop isLoading={isLoading} />
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
          <b>Gestión de Comprobantes de Retención Electrónicos</b>
        </div>
        <Box className={StyledRoot}>
          <CustomConditionalActionsTableServer
            endpoint="/RetencionDF/listar"
            errorMsgFilterSearch="Error al cargar las Retenciones"
            queryKeyModal="listarRetencionDF"
            perPage={10}
            rowActionsWidthTable={200}
            idSearchField="retid" // Identificador único de fila para Retenciones
            // ==========================================
            // LÓGICA DE BOTONES POR FILA (ROW ACTIONS)
            // ==========================================
            rowActions={(row) => {
              const buscarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === ACCIONES.BUSCAR,
              )
              const autorizarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === ACCIONES.AUTORIZAR,
              )
              const rideAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === ACCIONES.RIDE,
              )

              const actions = []

              if (buscarAction) {
                actions.push({
                  label: buscarAction?.acccaption,
                  key: buscarAction?.acccaption,
                  icon: getIconComponent(buscarAction?.accnameicono, buscarAction?.acctipoico),
                  onClick: (row) => {
                    navigate(`buscar`, { state: row.original })
                  },
                })
              }

              const isAuthorized = row.original.sriautnumero && row.original.sriautnumero.length > 30

              // Autorizar si no tiene número de autorización y su estado es "A"
              if (autorizarAction && !isAuthorized && row.original.retid && row.original.retstatus === "A") {
                actions.push({
                  label: autorizarAction?.acccaption,
                  key: autorizarAction?.acccaption,
                  icon: getIconComponent(autorizarAction?.accnameicono, autorizarAction?.acctipoico),
                  onClick: (row) => handleAutorizar(row),
                })
              }

              // RIDE solo si ya está autorizado
              if (rideAction && isAuthorized && row.original.retid) {
                actions.push({
                  label: rideAction?.acccaption,
                  key: rideAction?.acccaption,
                  icon: getIconComponent(rideAction?.accnameicono, rideAction?.acctipoico),
                  onClick: (row) => generateRIDE(row),
                })
              }

              return actions
            }}
            // ==========================================
            // LÓGICA DE BARRA SUPERIOR (TOP TOOLBAR)
            // ==========================================
            topToolbarCustomActions={({ table, device }) => {
              const crearAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === ACCIONES.CREAR,
              )
              const exportarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === ACCIONES.EXPORTAR,
              )

              const toolbarActions = []

              if (crearAction) {
                toolbarActions.push({
                  label: crearAction?.acccaption,
                  key: crearAction?.acccaption,
                  icon: getIconComponent(crearAction?.accnameicono, crearAction?.acctipoico),
                  onClick: () => {
                    navigate("crear")
                  },
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
                        if (device === "sm") {
                          return handleExportDataPdfSMScreen(
                            columns,
                            data,
                            "Listado de Retenciones",
                            `Retenciones ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Listado de Retenciones",
                          `Retenciones ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Retenciones ${new Date().toLocaleString()}`)
                      },
                    },
                  ],
                })
              }
              return toolbarActions
            }}
            // ==========================================
            // COLUMNAS DE LA TABLA
            // ==========================================
            columnsTable={[
              {
                accessorKey: "retid",
                header: "Nº Retención",
                size: 150,
                Cell: ({ cell }) => <strong>{cell.getValue()}</strong>,
              },
              {
                accessorKey: "retnombre",
                header: "Proveedor",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "retfecemi",
                header: "Fecha Emisión",
                size: 150,
                Cell: ({ cell }) => {
                  const cellValue = cell.getValue()
                  return normalFormatDate(cellValue)
                },
              },
              {
                accessorKey: "rettotal",
                header: "Total Retenido",
                size: 120,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return (
                    <span style={{ fontWeight: "bold", color: "#196C87" }}>${parseFloat(value || 0).toFixed(2)}</span>
                  )
                },
              },
              {
                accessorKey: "retstatus",
                header: "Estado Doc.",
                size: 150,
                Cell: ({ cell }) => {
                  const status = cell.getValue()
                  return (
                    <span style={{ color: status === "A" ? "green" : "inherit", fontWeight: "bold" }}>
                      {status === "A" ? "ACTIVO" : status}
                    </span>
                  )
                },
              },
              {
                accessorKey: "sriautnumero",
                header: "N° Autorización",
                size: 400,
                Cell: ({ cell }) => <span>{cell.getValue() || "Pendiente"}</span>,
              },
              {
                accessorKey: "retusuisys",
                header: "Usuario Sistema",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default RetencionDF
