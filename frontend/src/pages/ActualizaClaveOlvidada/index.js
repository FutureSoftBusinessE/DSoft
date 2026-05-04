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

const ActualizaClaveOlvidada = () => {
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
          <b>Actualiza Clave Olvidada</b>
        </div>

        <Box className={StyledRoot}>
          <CustomConditionalActionsTableServer
            // key={`UsuariosCreacion-${refreshCustomMultiRowSelectionRefKey}-${forceDataRefresh}`}
            // key={`UsuariosCreacion`}
            endpoint="/ActualizaClaveOlvidada/getAllUsuarios"
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="ActualizaClaveOlvidadaGetallUsuarios"
            perPage={10}
            rowActionsWidthTable={120}
            rowActions={(row) => {
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "EDITAR",
              )

              const actions = [
                {
                  label: editarAction?.acccaption,
                  key: editarAction?.acccaption,
                  icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                  onClick: async (row) => {
                    const result = await Swal.fire({
                      title: "¿Está seguro que quiere restablecer la clave de este usuario?",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Sí",
                      cancelButtonText: "Cancelar",
                    })

                    if (result.isConfirmed) {
                      try {
                        await fetchwrapper("/ActualizaClaveOlvidada/restablecerClave", {
                          method: "POST",
                          body: JSON.stringify({ txtUsrCodigo: row.original.usrcodigo }),
                          headers: {
                            "Content-Type": "application/json",
                          },
                        })

                        const confirm = await Swal.fire({
                          title: "¡Restablecido!",
                          text: "La clave ha sido restablecida.",
                          icon: "success",
                          confirmButtonText: "Aceptar",
                          allowOutsideClick: false,
                        })

                        if (confirm.isConfirmed) {
                          window.location.reload()
                        }
                      } catch (error) {
                        Swal.fire("Error", "No se pudo restablecer la clave del usuario.", "error")
                      }
                    }
                  },
                },
              ]

              return actions
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
                accessorKey: "usremail",
                header: "Email",
                size: 300,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
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

export default ActualizaClaveOlvidada
