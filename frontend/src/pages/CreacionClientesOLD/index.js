import React, { useContext, useState, useEffect } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box } from "@mui/material"

import BackIcon from "../../components/BackIcon"

import { NavLink, useNavigate } from "react-router-dom"

import BuscarIcon from "../../assets/iconos/Buscar.ico"
import CrearIcon from "../../assets/iconos/Crear.ico"
import EditIcon from "@mui/icons-material/Edit"
import AddIcon from "@mui/icons-material/Add"
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"

import CustomConditionalActionsTableServer from "../../components/CustomConditionalActionsTableServerSide"
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye"
import EliminarIcon from "../../assets/iconos/Eliminar.ico"
import normalFormatDate from "../utils/date/DDMMYYYFormatDate"
import {
  handleExportDataPdfLGScreen,
  handleExportDataPdfSMScreen,
  handleAllExportDataCSV,
} from "../utils/reactTableActions/exportToolbarActions"
import { GlobalContext } from "../../contexts/GlobalContext"
import CustomBackdrop from "../../components/CustomBackdrop"

import fetchwrapper from "../../services/interceptors/fetchwrapper"
import Swal from "sweetalert2"

import getIconComponent from "../utils/getIconComponent"
import normalFormatHour from "../utils/date/HHMMSSFormatHour"

const StyledRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(8),
  flexGrow: 1,
  padding: "0 16px",
  height: "100vh",
}))

const StyledIcons = styled(NavLink)(({ theme }) => ({
  height: 250,
  width: 250,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  // backgroundColor: theme.palette.background.default,
  // border: "1px solid #ddd",
  color: theme.palette.text.primary,
  cursor: "pointer",

  "& img": {
    width: "128px",
  },

  "&:hover": {
    textDecoration: "underline",
  },
}))

const StyledTextIcon = styled("div")(({ theme }) => ({
  fontSize: "18px",
  marginTop: "10px",
  fontWeight: "bolder",
}))

const theme = createTheme({
  palette: {
    primary: {
      main: "#196C87",
    },
    secondary: {
      main: "#196C87", // Cambia el color secundario a verde azulado
    },
  },
})

const CreacionClientes = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const handleEliminarCliente = async (row) => {
    console.log("Cliente a eliminar:", row.original)

    // Confirmar eliminación con SweetAlert
    const confirmacion = await Swal.fire({
      title: "¿Eliminar Cliente?",
      html: `
      <div style="text-align: left; margin: 10px 0;">
        <p><strong>Código:</strong> ${row.original.clicodigo}</p>
        <p><strong>Nombre/Razón Social:</strong> ${row.original.clinombre}</p>
        <p><strong>RUC:</strong> ${row.original.cliruc}</p>
        <p><strong>Tipo:</strong> ${row.original.clitipo === "N" ? "Persona Natural" : "Persona Jurídica"}</p>
        ${row.original.cliapellido ? `<p><strong>Apellidos:</strong> ${row.original.cliapellido}</p>` : ""}
      </div>
      <p style="color: #d32f2f; font-weight: bold;">¿Está seguro que desea eliminar este cliente?</p>
      <p style="font-size: 0.9em; color: #666;">Esta acción no se puede deshacer.</p>
    `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#196C87",
      reverseButtons: true,
    })

    if (!confirmacion.isConfirmed) {
      Swal.fire("Operación cancelada", "El cliente no ha sido eliminado.", "info")
      return
    }

    // Mostrar loading
    Swal.fire({
      title: "Eliminando cliente...",
      text: "Por favor espere",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      // Llamar a la API de eliminación
      const response = await fetchwrapper(`/CreacionCliente/deleteCliente`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clicodigo: row.original.clicodigo,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Éxito
        Swal.fire({
          title: "¡Cliente eliminado!",
          html: `
          <div style="text-align: center;">
            <p style="color: #2e7d32; font-size: 1.2em;">
              <i class="fas fa-check-circle" style="color: #2e7d32; margin-right: 10px;"></i>
              Cliente eliminado exitosamente
            </p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Código:</strong> ${result.data.clicodigo}</p>
            </div>
          </div>
        `,
          icon: "success",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#196C87",
        }).then(() => {
          navigate(0) // recarga la ruta actual
        })
      } else {
        // Error del servidor
        throw new Error(result.error?.msg || "Error al eliminar el cliente")
      }
    } catch (error) {
      console.error("Error al eliminar cliente:", error)

      Swal.fire({
        title: "Error al eliminar",
        html: `
        <div style="text-align: center;">
          <p style="color: #d32f2f; font-size: 1.2em;">
            <i class="fas fa-exclamation-circle" style="color: #d32f2f; margin-right: 10px;"></i>
            No se pudo eliminar el cliente
          </p>
          <p style="margin-top: 10px;">${error.message}</p>
        </div>
      `,
        icon: "error",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#d32f2f",
      })
    }
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
          <b>Clientes</b>
        </div>

        <Box className={StyledRoot}>
          <CustomConditionalActionsTableServer
            // key={`GetallClientesCreacionCliente-${forceDataRefreshKey}`}
            // key={`UsuariosCreacion`}
            endpoint="/CreacionCliente/getAllClientes"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="GetallClientesCreacionCliente"
            perPage={10}
            rowActionsWidthTable={150}
            rowActions={(row) => {
              // Buscar todas las acciones necesarias
              const buscarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "BUSCAR",
              )
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "ELIMINAR",
              )

              const actions = [
                {
                  label: buscarAction?.acccaption,
                  key: buscarAction?.acccaption,
                  icon: getIconComponent(buscarAction?.accnameicono, buscarAction?.acctipoico),
                  onClick: (row) => {
                    navigate(`buscar`, { state: row.original })
                  },
                },
                {
                  label: eliminarAction?.acccaption,
                  key: eliminarAction?.acccaption,
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (row) => {
                    handleEliminarCliente(row)
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
                  label: crearAction?.acccaption,
                  key: crearAction?.acccaption,
                  icon: getIconComponent(crearAction?.accnameicono, crearAction?.acctipoico),
                  onClick: () => {
                    navigate("crear")
                  },
                },
                {
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
                            "Reporte de usuarios",
                            `Reporte de Usuarios ${new Date().toLocaleString()}`,
                          )
                        }
                        handleExportDataPdfLGScreen(
                          columns,
                          table.getCoreRowModel().rows,
                          "Reporte de usuarios",
                          `Reporte de Usuarios ${new Date().toLocaleString()}`,
                        )
                      },
                    },
                    {
                      label: "Exportar CSV",
                      key: "exportarCSV",
                      icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                      onClick: ({ data }) => {
                        handleAllExportDataCSV(data, `Reporte de Usuarios ${new Date().toLocaleString()}`)
                      },
                    },
                  ],
                },
              ]

              console.log("aquii topToolbarCustomActions", selectedMenuInfo, exportarAction, toolbarActions)

              return toolbarActions
            }}
            columnsTable={[
              {
                accessorKey: "clicodigo",
                header: "Código",
                size: 100,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "cliruc",
                header: "RUC/Cédula",
                size: 140,
                Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
              },
              {
                accessorKey: "clinombre",
                header: "Nombre",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "clisexo_desc",
                header: "Sexo",
                size: 100,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value || "-"}</span>
                },
              },
              {
                accessorKey: "cliestciv_desc",
                header: "Estado Civil",
                size: 120,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value || "-"}</span>
                },
              },
              {
                accessorKey: "clidirec",
                header: "Dirección",
                size: 200,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value || "-"}</span>
                },
              },
              {
                accessorKey: "clitelef1",
                header: "Teléfono",
                size: 130,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return value ? (
                    <a href={`tel:${value}`} style={{ color: "#196C87", textDecoration: "none" }}>
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
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return value ? (
                    <a href={`mailto:${value}`} style={{ color: "#196C87", textDecoration: "none" }}>
                      {value}
                    </a>
                  ) : (
                    <span>-</span>
                  )
                },
              },
              {
                accessorKey: "cliestado_desc",
                header: "Estado",
                size: 100,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value || "-"}</span>
                },
              },
              {
                accessorKey: "clifecisys",
                header: "Fecha Creación",
                size: 150,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value ? normalFormatDate(value) : "-"}</span>
                },
              },
              {
                accessorKey: "clifecmsys",
                header: "Últ. Modificación",
                size: 150,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{value ? normalFormatDate(value) : "-"}</span>
                },
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CreacionClientes
