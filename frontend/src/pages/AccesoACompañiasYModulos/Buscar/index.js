import React, { useContext, useState, useEffect } from "react"
import Header from "../../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box, Button } from "@mui/material"

import BackIcon from "../../../components/BackIcon"

import { NavLink, useNavigate, useLocation } from "react-router-dom"

import BuscarIcon from "../../../assets/iconos/Buscar.ico"
import CrearIcon from "../../../assets/iconos/Crear.ico"
import EditIcon from "@mui/icons-material/Edit"
import AddIcon from "@mui/icons-material/Add"
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"

import CustomConditionalActionsTableServer from "../../../components/CustomConditionalActionsTableServerSide"
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye"
import EliminarIcon from "../../../assets/iconos/Eliminar.ico"
import normalFormatDate from "../../utils/date/DDMMYYYFormatDate"
import {
  handleExportDataPdfLGScreen,
  handleExportDataPdfSMScreen,
  handleAllExportDataCSV,
} from "../../utils/reactTableActions/exportToolbarActions"
import { GlobalContext } from "../../../contexts/GlobalContext"
import CustomBackdrop from "../../../components/CustomBackdrop"

import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import Swal from "sweetalert2"

import getIconComponent from "../../utils/getIconComponent"
import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"
import CrearAccesoCompaniaModal from "../components/CrearAccesoCompaniaModal"

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

const BuscarAccesoACompañiasYModulos = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(true)
  const handleToggle = () => setExpanded((prev) => !prev)
  const { usrcodigo, usrnombre, usrstatus, usrflagperfil } = location.state
  const { selectedMenuInfo } = useContext(GlobalContext)
  const [isLoadingHandleConfirmModalAcceso, setIsLoadingHandleConfirmModalAcceso] = useState(false)
  const [forceDataRefreshKey, setForceDataRefreshKey] = useState(1)

  // Modal en el toptoolbar
  const [formDataModalAcceso, setFormDataModalAcceso] = useState({
    compania: null,
    modulo: null,
    accion: "CREATE",
  })
  const [modalAccesosOpen, setModalAccesosOpen] = useState(false)
  const handleOpenModalAcceso = () => setModalAccesosOpen(true)
  const handleCloseModalAcceso = () => {
    setModalAccesosOpen(false)
    setFormDataModalAcceso({
      compania: null,
      modulo: null,
      accion: "CREATE",
    })
  }

  // Funcion para crear un nuevo acceso
  const handleConfirmModalAcceso = async () => {
    // Activar el estado de carga (isLoadingHandleConfirmModalAcceso)
    setIsLoadingHandleConfirmModalAcceso(true)

    // Llamar a la API
    console.log(formDataModalAcceso, "api guardando")

    const txtUsrCodigo = usrcodigo
    const esPerfilValue = usrflagperfil
    const newAcceso = {
      compania: formDataModalAcceso.compania.value,
      modulo: formDataModalAcceso.modulo.value,
      accion: formDataModalAcceso.accion,
    }

    let updateAllAccesosPerfiles = false // Establecemos un valor por defecto

    handleCloseModalAcceso()

    if (esPerfilValue !== 0) {
      // Muestra el SweetAlert para confirmar la actualización de accesos
      const result = await Swal.fire({
        title: "¿Qué deseas hacer?",
        text: `Puedes actualizar los accesos de todos los usuarios con el perfil ${txtUsrCodigo}.`,
        icon: "warning",
        showCancelButton: true,
        showDenyButton: true, // El botón de "No actualizar"
        confirmButtonText: "Actualizar",
        denyButtonText: "No actualizar",
        cancelButtonText: "Cancelar operación",
      })

      if (result.isConfirmed) {
        updateAllAccesosPerfiles = true
      } else if (result.isDenied) {
        updateAllAccesosPerfiles = false
      } else {
        updateAllAccesosPerfiles = null // Null indica que no se continuará con la operación
      }
    }

    if (updateAllAccesosPerfiles === null) {
      Swal.fire("Operación cancelada", "No se ha realizado ningún cambio.", "info")
      setIsLoadingHandleConfirmModalAcceso(false) // Desactivar el loading antes de salir
      return
    }

    let allAccesosFormated = []
    let accesosObtenidos = false

    try {
      const response = await fetchwrapper(`/AccesoACompaniasYModulos/getAllAccesos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extraFilters: { usrcodigo },
          page: 1,
          perPage: 10000,
          filters: {},
        }),
      })

      if (response.ok) {
        const result = await response.json()
        allAccesosFormated = result.data.map((item) => ({
          compania: item.ciacodigo,
          modulo: item.modcodigo,
          accion: "UPDATE",
        }))
        accesosObtenidos = true
      } else {
        throw new Error("Error al obtener los accesos.")
      }
    } catch (er) {
      console.error("Error al obtener los accesos:", er)
      await Swal.fire({
        title: "Error",
        text: "Hubo un problema al obtener los accesos. Intenta nuevamente.",
        icon: "error",
      })
      setIsLoadingHandleConfirmModalAcceso(false) // Desactivar el loading si ocurrió un error
      return
    }

    const isModuloExistente = allAccesosFormated.some(
      (acceso) => acceso.modulo === newAcceso.modulo && acceso.compania === newAcceso.compania,
    )

    if (isModuloExistente) {
      await Swal.fire({
        title: "Acceso ya existente",
        text: `Ya existe un acceso para el módulo ${newAcceso.modulo} y la compañía ${newAcceso.compania}. No se actualizará.`,
        icon: "warning",
      })
      setIsLoadingHandleConfirmModalAcceso(false) // Desactivar el loading si el acceso ya existe
      return
    }

    // Si la obtención de accesos fue exitosa, entonces procedemos con la segunda consulta
    if (accesosObtenidos) {
      try {
        const response = await fetchwrapper(`/AccesoACompaniasYModulos/saveAccesos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            txtUsrCodigo,
            esPerfilValue,
            updateAllAccesosPerfiles,
            data: [...allAccesosFormated, newAcceso],
          }),
        })

        if (response.ok) {
          setIsLoadingHandleConfirmModalAcceso(false) // Desactivar el loading al finalizar la operación
          // Actulizar la tabla de todos los accesos
          setForceDataRefreshKey((prev) => prev + 1)
          return "Acceso guardado exitosamente" // Devolver el resultado si la consulta fue exitosa
        } else {
          throw new Error("Error al guardar los accesos.")
        }
      } catch (er) {
        console.error("Error al guardar los accesos:", er)
        await Swal.fire({
          title: "Error",
          text: "Hubo un problema al guardar los accesos. Intenta nuevamente.",
          icon: "error",
        })
        setIsLoadingHandleConfirmModalAcceso(false) // Desactivar el loading si ocurrió un error
      }
    }
  }

  // Funcion para eliminar un nuevo acceso
  const handleEliminarAcceso = async (row) => {
    console.log(row, "aquiii")
    // Activar el estado de carga (isLoadingHandleConfirmModalAcceso)
    setIsLoadingHandleConfirmModalAcceso(true)

    // Llamar a la API

    const txtUsrCodigo = usrcodigo
    const esPerfilValue = usrflagperfil
    const newAcceso = {
      compania: row.original.ciacodigo,
      modulo: row.original.modcodigo,
      accion: "DELETE",
    }

    let updateAllAccesosPerfiles = false // Establecemos un valor por defecto

    if (esPerfilValue !== 0) {
      // Muestra el SweetAlert para confirmar la actualización de accesos
      const result = await Swal.fire({
        title: "¿Qué deseas hacer?",
        text: `Puedes actualizar los accesos de todos los usuarios con el perfil ${txtUsrCodigo}.`,
        icon: "warning",
        showCancelButton: true,
        showDenyButton: true, // El botón de "No actualizar"
        confirmButtonText: "Actualizar",
        denyButtonText: "No actualizar",
        cancelButtonText: "Cancelar operación",
      })

      if (result.isConfirmed) {
        updateAllAccesosPerfiles = true
      } else if (result.isDenied) {
        updateAllAccesosPerfiles = false
      } else {
        updateAllAccesosPerfiles = null // Null indica que no se continuará con la operación
      }
    }

    if (updateAllAccesosPerfiles === null) {
      Swal.fire("Operación cancelada", "No se ha realizado ningún cambio.", "info")
      setIsLoadingHandleConfirmModalAcceso(false) // Desactivar el loading antes de salir
      return
    }

    let allAccesosFormated = []
    let accesosObtenidos = false

    try {
      const response = await fetchwrapper(`/AccesoACompaniasYModulos/getAllAccesos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extraFilters: { usrcodigo },
          page: 1,
          perPage: 10000,
          filters: {},
        }),
      })

      if (response.ok) {
        const result = await response.json()
        allAccesosFormated = result.data.map((item) => ({
          compania: item.ciacodigo,
          modulo: item.modcodigo,
          accion: "UPDATE",
        }))
        accesosObtenidos = true
      } else {
        throw new Error("Error al obtener los accesos.")
      }
    } catch (er) {
      console.error("Error al obtener los accesos:", er)
      await Swal.fire({
        title: "Error",
        text: "Hubo un problema al obtener los accesos. Intenta nuevamente.",
        icon: "error",
      })
      setIsLoadingHandleConfirmModalAcceso(false) // Desactivar el loading si ocurrió un error
      return
    }

    // Si la obtención de accesos fue exitosa, entonces procedemos con la segunda consulta
    if (accesosObtenidos) {
      try {
        const response = await fetchwrapper(`/AccesoACompaniasYModulos/saveAccesos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            txtUsrCodigo,
            esPerfilValue,
            updateAllAccesosPerfiles,
            data: [...allAccesosFormated, newAcceso],
          }),
        })

        if (response.ok) {
          setIsLoadingHandleConfirmModalAcceso(false) // Desactivar el loading al finalizar la operación
          // Actulizar la tabla de todos los accesos
          setForceDataRefreshKey((prev) => prev + 1)
          return "Acceso guardado exitosamente" // Devolver el resultado si la consulta fue exitosa
        } else {
          throw new Error("Error al guardar los accesos.")
        }
      } catch (er) {
        console.error("Error al guardar los accesos:", er)
        await Swal.fire({
          title: "Error",
          text: "Hubo un problema al guardar los accesos. Intenta nuevamente.",
          icon: "error",
        })
        setIsLoadingHandleConfirmModalAcceso(false) // Desactivar el loading si ocurrió un error
      }
    }
  }

  const handleSetFormDataModalAcceso = (k, v) => setFormDataModalAcceso((prev) => ({ ...prev, [k]: v }))

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
          <b>Acceso a Compañias y Modulos</b>
        </div>

        <CustomBackdrop open={isLoadingHandleConfirmModalAcceso} />

        <Box className={StyledRoot}>
          <CustomFieldsetAccordion title="Información del usuario" expanded={expanded} onToggle={handleToggle}>
            <div style={{ padding: "10px" }}>
              <div style={{ marginBottom: "8px" }}>
                <strong>Código:</strong> <span>{usrcodigo}</span>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Nombre:</strong> <span>{usrnombre}</span>
              </div>
              <div>
                <strong>Estado:</strong> <span>{usrstatus === "A" ? "Activo" : "No Activo"}</span>
              </div>
            </div>
          </CustomFieldsetAccordion>

          <CustomConditionalActionsTableServer
            key={`UsuarioAccesosModulosCompanias-${forceDataRefreshKey}`}
            endpoint="/AccesoACompaniasYModulos/getAllAccesos"
            endpointJson={{
              extraFilters: {
                usrcodigo,
              },
            }}
            errorMsgFilterSearch="Error en cargar datos"
            queryKeyModal="UsuarioAccesosModulosCompanias"
            perPage={10}
            rowActionsWidthTable={80}
            rowActions={(row) => {
              // Buscar todas las acciones necesarias
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "EDITAR",
              )
              const eliminarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "ELIMINAR",
              )

              const actions = [
                // {
                //   label: editarAction?.acccaption,
                //   key: editarAction?.acccaption,
                //   icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                //   onClick: (row) => {
                //     navigate("editar", { state: row.original })
                //   },
                // },
                {
                  label: eliminarAction?.acccaption,
                  key: eliminarAction?.acccaption,
                  icon: getIconComponent(eliminarAction?.accnameicono, eliminarAction?.acctipoico),
                  onClick: async (row) => {
                    handleEliminarAcceso(row)
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
                  type: "modal",
                  label: crearAction?.acccaption,
                  key: crearAction?.acccaption,
                  icon: getIconComponent(crearAction?.accnameicono, crearAction?.acctipoico),
                  onClick: () => handleOpenModalAcceso(),
                  propsModal: {
                    open: modalAccesosOpen,
                    onClose: handleCloseModalAcceso,
                    title: "Acceso",
                    showDefaultActions: true,
                    onConfirm: handleConfirmModalAcceso,
                    confirmLabel: "Crear Acceso",
                    disableConfirm: !formDataModalAcceso.compania || !formDataModalAcceso.modulo,
                    maxWidth: 400,
                  },

                  Component: (
                    <CrearAccesoCompaniaModal
                      formData={formDataModalAcceso}
                      setFormData={handleSetFormDataModalAcceso}
                    />
                  ),
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
              return toolbarActions
            }}
            columnsTable={[
              {
                accessorKey: "cia_descri",
                header: "Compañía",
                size: 150,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "mod_descri",
                header: "Módulo",
                size: 200,
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
              },
              {
                accessorKey: "usraccion",
                header: "Acción",
                size: 250,
                Cell: ({ cell }) => <span>{cell.getValue() === "CREATE" ? "UPDATE" : cell.getValue()}</span>,
              },
            ]}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default BuscarAccesoACompañiasYModulos
