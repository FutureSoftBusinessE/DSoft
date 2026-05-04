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

const AsignacionHorariosAUsuarios = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

  const handleEliminarHorario = async (row) => {
    console.log("Horario a eliminar:", row.original)

    // Confirmar eliminación con SweetAlert
    const confirmacion = await Swal.fire({
      title: "¿Eliminar Horarios?",
      html: `
      <div style="text-align: left; margin: 10px 0;">
        <p><strong>Usuario:</strong> ${row.original.usrcodigo}</p>
        <p><strong>Nombre:</strong> ${row.original.usrnombre}</p>
        <p><strong>Localidad:</strong> ${row.original.locdescri}</p>
        <p><strong>Código Localidad:</strong> ${row.original.loccodigo}</p>
      </div>
      <p style="color: #d32f2f; font-weight: bold;">¿Está seguro que desea eliminar TODOS los horarios de este usuario en esta localidad?</p>
      <p style="font-size: 0.9em; color: #666;">Esta acción eliminará todos los horarios asignados a este usuario en la localidad seleccionada.</p>
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
      Swal.fire("Operación cancelada", "Los horarios no han sido eliminados.", "info")
      return
    }

    // Mostrar loading
    Swal.fire({
      title: "Eliminando horarios...",
      text: "Por favor espere",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      // Llamar a la API de eliminación de horarios
      const response = await fetchwrapper(`/AsignacionHorariosAUsuarios/deleteHorario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usrcodigo: row.original.usrcodigo,
          loccodigo: row.original.loccodigo,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Éxito
        Swal.fire({
          title: "¡Horarios eliminados!",
          html: `
          <div style="text-align: center;">
            <p style="color: #2e7d32; font-size: 1.2em;">
              <i class="fas fa-check-circle" style="color: #2e7d32; margin-right: 10px;"></i>
              Horarios eliminados exitosamente
            </p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Usuario:</strong> ${result.data.usrcodigo}</p>
              <p><strong>Localidad:</strong> ${row.original.locdescri}</p>
            </div>
          </div>
        `,
          icon: "success",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#196C87",
        }).then(() => {
          // Recargar la página para actualizar la tabla
          navigate(0)
        })
      } else {
        // Error del servidor
        throw new Error(result.error?.msg || "Error al eliminar los horarios")
      }
    } catch (error) {
      console.error("Error al eliminar horarios:", error)

      Swal.fire({
        title: "Error al eliminar",
        html: `
        <div style="text-align: center;">
          <p style="color: #d32f2f; font-size: 1.2em;">
            <i class="fas fa-exclamation-circle" style="color: #d32f2f; margin-right: 10px;"></i>
            No se pudieron eliminar los horarios
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
          <b>Asignación de horarios</b>
        </div>

        <Box className={StyledRoot}>
          <CustomConditionalActionsTableServer
            // key={`UsuariosCreacion-${refreshCustomMultiRowSelectionRefKey}-${forceDataRefresh}`}
            // key={`UsuariosCreacion`}
            endpoint="/AsignacionHorariosAUsuarios/getAllHorarios"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="GetallUsuariosHorarios"
            perPage={10}
            rowActionsWidthTable={100}
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
                    handleEliminarHorario(row)
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
                accessorKey: "usrcodigo",
                header: "Usuario",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "locdescri",
                header: "Localidad",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "hrfecmsys",
                header: "Fecha de última modificación",
                size: 250,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span> // Formatear la fecha
                },
              },

              {
                accessorKey: "hrhormsys",
                header: "Hora de última modificación",
                size: 250,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatHour(value)}</span> // Formatear la fecha
                },
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default AsignacionHorariosAUsuarios
