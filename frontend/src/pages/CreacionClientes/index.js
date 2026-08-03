import React, { useContext } from "react"
import { useNavigate } from "react-router-dom"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box, Typography, Chip } from "@mui/material"
import Swal from "sweetalert2"

// Layouts y Componentes Base
import Header from "../../layouts/Header"
import BackIcon from "../../components/BackIcon"
import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"

// Contexto y Utilidades
import { GlobalContext } from "../../contexts/GlobalContext"
import fetchwrapper from "../../services/interceptors/fetchwrapper"
import getIconComponent from "../utils/getIconComponent"
import normalFormatDate from "../utils/date/DDMMYYYFormatDate"
import {
  handleExportDataPdfLGScreen,
  handleExportDataPdfSMScreen,
  handleAllExportDataCSV,
} from "../utils/reactTableActions/exportToolbarActions"

// =================================================================
// ESTILOS Y TEMA (Estándar SIAC FUTURESOFT)
// =================================================================
const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(3),
  flexGrow: 1,
  padding: "0 16px",
  minHeight: "80vh",
}))

const theme = createTheme({
  palette: {
    primary: { main: "#196C87" },
    secondary: { main: "#2E7D32" },
    error: { main: "#d32f2f" },
  },
})

const CreacionClientes = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  // =================================================================
  // LÓGICA DE ELIMINACIÓN DE CLIENTE
  // =================================================================
  const handleEliminarCliente = async (row) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar Cliente?",
      html: `
        <div style="text-align: left; margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
          <p><strong>Código:</strong> ${row.original.clicodigo}</p>
          <p><strong>Razón Social:</strong> ${row.original.clinombre}</p>
          <p><strong>RUC/Cédula:</strong> ${row.original.cliruc || "N/A"}</p>
        </div>
        <p style="color: #d32f2f; font-weight: bold;">¿Está seguro que desea eliminar este cliente?</p>
        <p style="font-size: 0.9em; color: #666;">Esta acción afectará los registros asociados y no se puede deshacer.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#196C87",
      reverseButtons: true,
    })

    if (!confirmacion.isConfirmed) return

    Swal.fire({
      title: "Eliminando cliente...",
      text: "Sincronizando con la base de datos",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    })

    try {
      const response = await fetchwrapper(`/CreacionCliente/deleteCliente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clicodigo: row.original.clicodigo }),
      })
      const result = await response.json()

      if (result.success) {
        Swal.fire({
          title: "¡Cliente eliminado!",
          text: `El cliente ${row.original.clicodigo} ha sido dado de baja exitosamente.`,
          icon: "success",
          confirmButtonColor: "#196C87",
        }).then(() => {
          navigate(0)
        })
      } else {
        throw new Error(result.message || "Error de integridad al eliminar el cliente")
      }
    } catch (error) {
      Swal.fire({ title: "Error al eliminar", text: error.message, icon: "error", confirmButtonColor: "#d32f2f" })
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <div className="main main-app p-3 p-lg-4" style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
        <BackIcon />

        <Box display="flex" justifyContent="center" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Catalogo de Clientes
          </Typography>
        </Box>

        <StyledRoot>
          <CustomConditionalActionsTableServer
            endpoint="/CreacionCliente/getAllClientes"
            errorMsgFilterSearch="Error al cargar la lista de clientes"
            queryKeyModal="GetAllClientesMaestro"
            perPage={15}
            rowActionsWidthTable={180}
            // enableColumnFilters={true} // <-- ACTIVA EL FILTRADO POR COLUMNAS
            // ACCIONES DE FILA
            rowActions={(row) => {
              const buscarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "BUSCAR")
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "EDITAR")
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find((a) => a.acccaption === "ELIMINAR")
              const actions = []

              // SECCIÓN AGREGADA: Acción de BUSCAR (Visor Analítico)
              if (buscarAction) {
                actions.push({
                  label: "Consultar / Buscar",
                  key: "BUSCAR",
                  icon: getIconComponent(buscarAction.accnameicono, buscarAction.acctipoico),
                  onClick: (row) => navigate(`buscar`, { state: row.original }),
                })
              }

              if (editarAction) {
                actions.push({
                  label: "Editar Cliente",
                  key: "EDITAR",
                  icon: getIconComponent(editarAction.accnameicono, editarAction.acctipoico),
                  onClick: (row) => navigate(`editar`, { state: row.original }),
                })
              }

              if (eliminarAction) {
                actions.push({
                  label: "Eliminar Cliente",
                  key: "ELIMINAR",
                  icon: getIconComponent(eliminarAction.accnameicono, eliminarAction.acctipoico),
                  onClick: (row) => handleEliminarCliente(row),
                })
              }
              return actions
            }}
            // TOP TOOLBAR
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
                            "Catalogo de Clientes",
                            `Reporte_Clientes_${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Catalogo de Clientes",
                          `Reporte_Clientes_${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Reporte_Clientes_${new Date().toLocaleString()}`)
                      },
                    },
                  ],
                },
              ]
              return toolbarActions
            }}
            // DEFINICIÓN DE COLUMNAS
            columnsTable={[
              {
                accessorKey: "clicodigo",
                header: "Código",
                size: 100,
                Cell: ({ cell }) => (
                  <Typography fontWeight="bold" color="primary.main">
                    {cell.getValue()}
                  </Typography>
                ),
              },
              {
                accessorKey: "cliruc",
                header: "RUC / Cédula",
                size: 140,
                Cell: ({ cell }) => <span>{cell.getValue() || "N/A"}</span>,
              },
              {
                accessorKey: "clinombre",
                header: "Razón Social / Nombre",
                size: 280,
                Cell: ({ cell }) => <Typography fontWeight="500">{cell.getValue()}</Typography>,
              },
              {
                accessorKey: "clisexo",
                header: "Sexo",
                size: 100,
                Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
              },
              {
                accessorKey: "cliestciv",
                header: "Estado Civil",
                size: 120,
                Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
              },
              {
                accessorKey: "clidirec",
                header: "Dirección",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
              },
              {
                accessorKey: "clitelef1",
                header: "Teléfono",
                size: 130,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return value ? (
                    <a href={`tel:${value}`} style={{ color: "#196C87", textDecoration: "none", fontWeight: "bold" }}>
                      {value}
                    </a>
                  ) : (
                    <span>-</span>
                  )
                },
              },
              {
                accessorKey: "cliemail",
                header: "Email",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
              },
              {
                accessorKey: "vendedores",
                header: "Vendedores",
                size: 130,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  return <span>{val >= 1 ? "SI" : Number(val) === 0 ? "NO" : val || "-"}</span>
                },
              },
              {
                accessorKey: "referencias",
                header: "Referencias",
                size: 130,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  return <span>{val >= 1 ? "SI" : Number(val) === 0 ? "NO" : val || "-"}</span>
                },
              },
              {
                accessorKey: "agencias",
                header: "Agencias",
                size: 130,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  return <span>{val >= 1 ? "SI" : Number(val) === 0 ? "NO" : val || "-"}</span>
                },
              },
              {
                accessorKey: "descuentos",
                header: "Descuentos",
                size: 120,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  return <span>{val >= 1 ? "SI" : Number(val) === 0 ? "NO" : val || "-"}</span>
                },
              },
              {
                accessorKey: "descuentosart",
                header: "Desc. Artículos",
                size: 140,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  return <span>{val >= 1 ? "SI" : Number(val) === 0 ? "NO" : val || "-"}</span>
                },
              },
              {
                accessorKey: "historial",
                header: "Historial",
                size: 120,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  return <span>{val >= 1 ? "SI" : Number(val) === 0 ? "NO" : val || "-"}</span>
                },
              },
              {
                accessorKey: "imagenes",
                header: "Imágenes",
                size: 120,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  return <span>{val >= 1 ? "SI" : Number(val) === 0 ? "NO" : val || "-"}</span>
                },
              },
              {
                accessorKey: "garante",
                header: "Garante",
                size: 150,
                Cell: ({ cell }) => {
                  const val = cell.getValue()
                  return <span>{val >= 1 ? "SI" : Number(val) === 0 ? "NO" : val || "-"}</span>
                },
              },
              {
                accessorKey: "clistatus",
                header: "Estado",
                size: 120,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  let color = "default"
                  let label = value

                  if (value === "ACTIVO" || value === "A") {
                    color = "success"
                    label = "ACTIVO"
                  }
                  if (value === "INACTIVO" || value === "I") {
                    color = "error"
                    label = "INACTIVO"
                  }
                  if (value === "POTENCIAL" || value === "P") {
                    color = "warning"
                    label = "POTENCIAL"
                  }

                  return value ? (
                    <Chip label={label} color={color} size="small" sx={{ fontWeight: "bold" }} />
                  ) : (
                    <span>-</span>
                  )
                },
              },
              {
                accessorKey: "clifecisys",
                header: "Fecha Creación",
                size: 140,
                Cell: ({ cell }) => <span>{cell.getValue() ? normalFormatDate(cell.getValue()) : "-"}</span>,
              },
              {
                accessorKey: "clifecmsys",
                header: "Fecha Modificación",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue() ? normalFormatDate(cell.getValue()) : "-"}</span>,
              },
            ]}
          />
        </StyledRoot>
      </div>
    </ThemeProvider>
  )
}

export default CreacionClientes
