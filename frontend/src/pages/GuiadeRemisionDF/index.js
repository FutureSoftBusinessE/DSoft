/* eslint-disable camelcase */
import React, { useContext, useState } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box, Chip } from "@mui/material"

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

const ACCIONES = {
  CREAR: "CREAR",
  BUSCAR: "BUSCAR",
  EDITAR: "EDITAR",
  ELIMINAR: "ELIMINAR",
  EXPORTAR: "EXPORTAR",
  AUTORIZAR: "AUTORIZAR",
  RIDE: "RIDE",
}

const GuiaRemisionList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * AUTORIZAR GUÍA DE REMISIÓN AL SRI
   */
  const handleAutorizar = async (row) => {
    try {
      const result = await Swal.fire({
        title: "¿Desea autorizar esta Guía de Remisión?",
        html: `
        <p>Guía: <strong>${row.original.guinumero}</strong></p>
        <p>Cliente: <strong>${row.original.clinombre}</strong></p>
        <p>Transportista: <strong>${row.original.transportista || "N/A"}</strong></p>
        <br/>
        <p style="color: #2196f3;">Se generará el XML y se enviará al SRI</p>
      `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, autorizar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#196C87",
        cancelButtonColor: "#d33",
      })

      if (!result.isConfirmed) return

      setIsLoading(true)
      Swal.fire({
        title: "Enviando Guía al SRI...",
        text: "Firmando, validando y enviando a autorización",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      const response = await api.post("/GuiadeRemisionDF/autorizarSRI", {
        guinumero: row.original.guinumero,
      })

      const data = response.data
      setIsLoading(false)

      if (data.success) {
        await Swal.fire({
          icon: "success",
          title: "¡Guía Autorizada Exitosamente!",
          html: `
          <p>Guía: <strong>${row.original.guinumero}</strong></p>
          <p>N° Autorización: <strong>${data.numero_autorizacion}</strong></p>
        `,
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#196C87",
        })
      } else {
        await Swal.fire({
          icon: "warning",
          title: "Error en SRI",
          html: `
          <p>Guía: <strong>${row.original.guinumero}</strong></p>
          <p>Mensaje: <strong>${data.message || "Sin mensaje"}</strong></p>
        `,
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#196C87",
        })
      }
    } catch (error) {
      setIsLoading(false)
      console.error("Error en autorización:", error)
      const errorMessage = error.response?.data?.message || error.message || "Error desconocido"
      await Swal.fire({
        icon: "error",
        title: "Error interno al autorizar",
        text: errorMessage,
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#d33",
      })
    } finally {
      queryClient.invalidateQueries({ queryKey: ["listarGuiasRemision"] })
    }
  }

  /**
   * DESCARGAR RIDE
   */
  const handleGenerateRIDE = async (row) => {
    try {
      setIsLoading(true)
      Swal.fire({
        title: "Generando RIDE...",
        text: "Por favor espere",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      const response = await api.post("/GuiadeRemisionDF/descargarRIDE", {
        guinumero: row.original.guinumero,
      })

      const data = response.data

      if (data.success && data.ridePDF) {
        const pdfBase64 = data.ridePDF
        const byteString = atob(pdfBase64)
        const byteArray = new Uint8Array(byteString.length)
        for (let i = 0; i < byteString.length; i++) {
          byteArray[i] = byteString.charCodeAt(i)
        }
        const blob = new Blob([byteArray], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${data.claveAcceso || row.original.guinumero}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setIsLoading(false)
        Swal.fire({
          icon: "success",
          title: "RIDE Descargado",
          text: "El documento se ha descargado correctamente.",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#196C87",
        })
      } else {
        throw new Error(data.message || "PDF no encontrado en la base de datos.")
      }
    } catch (error) {
      setIsLoading(false)
      Swal.fire({
        icon: "error",
        title: "Error al generar RIDE",
        text: error.response?.data?.message || error.message || "Error desconocido",
      })
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
          <b>Listado de Guías de Remisión</b>
        </div>

        <Box className={StyledRoot}>
          <CustomConditionalActionsTableServer
            endpoint="/GuiadeRemisionDF/listar"
            errorMsgFilterSearch="Error al cargar datos"
            queryKeyModal="listarGuiasRemision"
            perPage={10}
            rowActionsWidthTable={250}
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
                  label: buscarAction.acccaption,
                  key: buscarAction.acccaption,
                  icon: getIconComponent(buscarAction.accnameicono, buscarAction.acctipoico),
                  onClick: (row) => {
                    navigate(`buscar`, { state: row.original })
                  },
                })
              }

              // Mostrar Autorizar solo si no tiene sriautnumero
              if (autorizarAction && !row.original.sriautnumero) {
                actions.push({
                  label: autorizarAction.acccaption,
                  key: autorizarAction.acccaption,
                  icon: getIconComponent(autorizarAction.accnameicono, autorizarAction.acctipoico),
                  onClick: (row) => handleAutorizar(row),
                })
              }

              // Mostrar RIDE solo si ya está autorizado
              if (rideAction && row.original.sriautnumero) {
                actions.push({
                  label: rideAction.acccaption,
                  key: rideAction.acccaption,
                  icon: getIconComponent(rideAction.accnameicono, rideAction.acctipoico),
                  onClick: (row) => handleGenerateRIDE(row),
                })
              }

              return actions
            }}
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
                  label: crearAction.acccaption,
                  key: crearAction.acccaption,
                  icon: getIconComponent(crearAction.accnameicono, crearAction.acctipoico),
                  onClick: () => navigate("crear"),
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
                        if (device === "sm") {
                          return handleExportDataPdfSMScreen(
                            columns,
                            data,
                            "Listado de Guías",
                            `Listado de Guías ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Listado de Guías",
                          `Listado de Guías ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction.accnameicono, exportarAction.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Listado de Guías ${new Date().toLocaleString()}`)
                      },
                    },
                  ],
                })
              }
              return toolbarActions
            }}
            columnsTable={[
              {
                accessorKey: "guinumero",
                header: "N° Guía",
                size: 180,
                Cell: ({ cell }) => <b>{cell.getValue()}</b>,
              },
              {
                accessorKey: "facnumfac",
                header: "N° Factura",
                size: 180,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  return val ? <span>{val}</span> : <span style={{ color: "gray" }}>S/N</span>
                },
              },
              {
                accessorKey: "clinombre",
                header: "Destinatario",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue() || "CONSUMIDOR FINAL"}</span>,
              },
              {
                accessorKey: "transportista",
                header: "Transportista",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "guifecha",
                header: "Fecha Inicio",
                size: 150,
                Cell: ({ cell }) => normalFormatDate(cell.getValue()),
              },
              {
                accessorKey: "guifecfintrans",
                header: "Fecha Fin",
                size: 150,
                Cell: ({ cell }) => normalFormatDate(cell.getValue()),
              },
              {
                accessorKey: "guistatus",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  return (
                    <Chip
                      label={val === "A" ? "Activo" : val}
                      color={val === "A" ? "success" : "default"}
                      size="small"
                    />
                  )
                },
              },
              {
                accessorKey: "sriautnumero",
                header: "N° Autorización SRI",
                size: 350,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  if (!val) return <Chip label="No Autorizado" color="warning" size="small" />
                  return <span style={{ fontSize: "12px", color: "green" }}>{val}</span>
                },
              },
              {
                accessorKey: "guiusuisys",
                header: "Usuario",
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

export default GuiaRemisionList
