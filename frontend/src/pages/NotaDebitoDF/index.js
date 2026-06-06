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

const NotaDebitoDF = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { setCompanySessionMsg, selectedMenuInfo } = useContext(GlobalContext)
  const [isLoading, setIsLoading] = useState(false)

  // ACCIÓN: AUTORIZAR SRI
  const handleAutorizar = async (row) => {
    const { facnumfac } = row.original

    Swal.fire({
      title: "¿Autorizar Nota de Débito?",
      text: `¿Está seguro que desea enviar el documento ${facnumfac} al SRI?`,
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
          const response = await api.post("/NotaDebitoDF/autorizarSRI", { facnumfac })
          if (response.data.success) {
            Swal.fire("¡Autorizado!", `El documento ${facnumfac} fue autorizado con éxito.`, "success")
            queryClient.invalidateQueries(["listarNotasDebitoDF"])
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
    const { facnumfac } = row.original

    Swal.fire({
      title: "Generando RIDE...",
      text: "Por favor espere mientras se descarga el documento",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    })

    try {
      const response = await api.post("/NotaDebitoDF/descargarRIDE", { facnumfac })
      if (response.data.success && response.data.ridePDF) {
        const linkSource = `data:application/pdf;base64,${response.data.ridePDF}`
        const downloadLink = document.createElement("a")
        const fileName = `${response.data.claveAcceso || facnumfac}.pdf`

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
          <b>Gestión de Notas de Débito Electrónicas</b>
        </div>
        <Box className={StyledRoot}>
          <CustomConditionalActionsTableServer
            endpoint="/NotaDebitoDF/listar"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="listarNotasDebitoDF"
            perPage={10}
            rowActionsWidthTable={200}
            idSearchField="facnumfac" // <-- AJUSTE CLAVE: Identificador único de fila
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

              if (autorizarAction && !isAuthorized && row.original.facnumfac) {
                actions.push({
                  label: autorizarAction?.acccaption,
                  key: autorizarAction?.acccaption,
                  icon: getIconComponent(autorizarAction?.accnameicono, autorizarAction?.acctipoico),
                  onClick: (row) => handleAutorizar(row),
                })
              }

              if (rideAction && isAuthorized && row.original.facnumfac) {
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
                            "Listado de Notas de Débito",
                            `Notas de Débito ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Listado de Notas de Débito",
                          `Notas de Débito ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Notas de Débito ${new Date().toLocaleString()}`)
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
                accessorKey: "facnumfac",
                header: "Nº Nota de Débito",
                size: 150,
                Cell: ({ cell }) => <strong>{cell.getValue()}</strong>,
              },
              {
                accessorKey: "facnumref",
                header: "Factura Modificada",
                size: 180,
                Cell: ({ cell }) => <span>{cell.getValue() || "N/A"}</span>,
              },
              {
                accessorKey: "clinombre",
                header: "Cliente",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "facfecemi",
                header: "Fecha Emisión",
                size: 150,
                Cell: ({ cell }) => {
                  const cellValue = cell.getValue()
                  // La fecha ya viene formateada desde el backend, pero mantenemos el helper por si acaso
                  return normalFormatDate(cellValue)
                },
              },
              {
                accessorKey: "factotal",
                header: "Total",
                size: 120,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>${parseFloat(value || 0).toFixed(2)}</span>
                },
              },
              {
                accessorKey: "facstatus",
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
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "facusuisys",
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

export default NotaDebitoDF
