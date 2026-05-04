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
import CustomCSVImportButton from "../../components/CustomCSVImportButton"

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

const CreacionUsuarios = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)

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
          <b>Creacion de usuarios</b>
        </div>

        <Box className={StyledRoot}>
          <CustomConditionalActionsTableServer
            // key={`UsuariosCreacion-${refreshCustomMultiRowSelectionRefKey}-${forceDataRefresh}`}
            // key={`UsuariosCreacion`}
            endpoint="/CreacionUsuarios/getAllUsuarios"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="CreacionUsuarios"
            perPage={10}
            rowActionsWidthTable={180}
            rowActions={(row) => {
              // Buscar todas las acciones necesarias
              const buscarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "BUSCAR",
              )
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "EDITAR",
              )
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "ELIMINAR",
              )

              const actions = [
                {
                  label: buscarAction?.acccaption,
                  key: buscarAction?.acccaption,
                  // icon: <RemoveRedEyeIcon sx={{ color: "#14AFF7" }} />,
                  icon: getIconComponent(buscarAction?.accnameicono, buscarAction?.acctipoico),
                  onClick: (row) => {
                    navigate(`buscar`, { state: row.original })
                  },
                },
                {
                  label: editarAction?.acccaption,
                  key: editarAction?.acccaption,
                  icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                  onClick: (row) => {
                    navigate("editar", { state: row.original })
                  },
                },
                {
                  label: eliminarAction?.acccaption,
                  key: eliminarAction?.acccaption,
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (row) => {
                    const result = await Swal.fire({
                      title: "¿Está seguro que quiere eliminar este usuario?",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Sí, eliminar",
                      cancelButtonText: "Cancelar",
                    })

                    if (result.isConfirmed) {
                      try {
                        await fetchwrapper("/CreacionUsuarios/eliminarUsuario", {
                          method: "POST",
                          body: JSON.stringify({ usrcodigo: row.original.usrcodigo }),
                          headers: {
                            "Content-Type": "application/json",
                          },
                        })

                        const confirm = await Swal.fire({
                          title: "¡Eliminado!",
                          text: "El usuario ha sido eliminado.",
                          icon: "success",
                          confirmButtonText: "Aceptar",
                          allowOutsideClick: false,
                        })

                        if (confirm.isConfirmed) {
                          window.location.reload()
                        }
                      } catch (error) {
                        Swal.fire("Error", "No se pudo eliminar el usuario.", "error")
                      }
                    }
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
                {
                  type: "modal",
                  label: "importar",
                  key: "importarDropdown",
                  icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                  Component: (
                    <CustomCSVImportButton
                      templateFileName="PlantillaCreacionUsuarios.csv"
                      fieldConfigs={{
                        usrcodigo: { required: true },
                        usrnombre: { required: true },
                        usrfeccad: { required: false },
                        usrcodper: { required: false },
                        usremail: { required: false },
                        usrflagoficre: { required: true },
                        usrflagperfil: { required: true },
                        usrstatus: { required: true },
                        usrdiascaduclave: { required: true },
                      }}
                      maxFileSize={10 * 1024 * 1024} // 10MB
                      onImportComplete={(data) => console.log("Datos importados:", data)}
                    />
                  ),
                },
              ]
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
                accessorKey: "usrnombre",
                header: "Nombre Completo",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "usrfeccad",
                header: "Fecha de Caducidad",
                size: 250,
                Cell: ({ cell }) => {
                  const value = cell.getValue()
                  return <span>{normalFormatDate(value)}</span> // Formatear la fecha
                },
              },
              {
                accessorKey: "usrcodper",
                header: "Pertenece a perfil",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "usremail",
                header: "Email",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "usrflagoficre",
                header: "Oficial de Crédito",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue().toString() !== "0" ? "SI" : "No"}</span>,
              },
              {
                accessorKey: "usrflagperfil",
                header: "Perfil",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue().toString() !== "0" ? "SI" : "No"}</span>,
              },
              {
                accessorKey: "usrstatus",
                header: "Estado",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue().toString() === "A" ? "Activo" : "No Activo"}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default CreacionUsuarios
