import React, { useContext, useState, useEffect } from "react"
import Header from "../../layouts/Header"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import { Box, Button } from "@mui/material"

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
import CustomMultiRowSelection from "../../components/CustomMultiRowSelection"
import dayjs from "dayjs"
import CustomFieldsetAccordion from "../../components/CustomFieldsetAccordion"
import CustomDatePicker from "../../components/CustomDatePicker"

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
// *************************************************
//             ContainerCriteriosBusqueda
// ************************************************
const ContainerCriteriosBusqueda = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gridTemplateAreas: `
    "IFechaDesde IFechaDesde IFechaDesde IFechaDesde IFechaDesde IFechaDesde IFechaHasta IFechaHasta IFechaHasta IFechaHasta IFechaHasta IFechaHasta"
  `,
  gap: "8px",
  alignItems: "center",
  // Versión para pantallas pequeñas
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
    gridTemplateAreas: `
      "IFechaDesde"
      "IFechaHasta"
    `,
    gap: "12px",
  },
}))

const IFechaDesde = styled(Box)({ gridArea: "IFechaDesde" })
const IFechaHasta = styled(Box)({ gridArea: "IFechaHasta" })

const ActualizaClaveFechaCaducidadLote = () => {
  const navigate = useNavigate()
  const [refreshCustomMultiRowSelectionRefKey, setRefreshCustomMultiRowSelectionRefKey] = useState(1) // <-- Controla el reinicio del table cada vez que se de click en la busqueda
  // Nuevo estado para forzar recarga completa de datos
  const [forceDataRefresh, setForceDataRefresh] = useState(0)
  const { selectedMenuInfo } = useContext(GlobalContext)

  const [criterioBusqueda, setCriterioBusqueda] = useState({
    vencimientoDesde: dayjs(null),
    vencimientoHasta: dayjs(null),
  })
  const [nuevaFechaVencimiento, setNuevaFechaVencimiento] = useState(null)
  const handleSetCriterioBusqueda = (k, v) => setCriterioBusqueda((prev) => ({ ...prev, [k]: v }))
  const [expandedCriterioBusqueda, setExpandedCriterioBusqueda] = useState(false)
  const handleToggleCriterioBusqueda = () => {
    setExpandedCriterioBusqueda((prev) => !prev)
  }

  const [openModalEditar, setOpenModalEditar] = useState(false)
  const handleOpenModalEditar = () => {
    setOpenModalEditar(true)
  }
  const handleCloseModalEditar = () => {
    setOpenModalEditar(false)
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
          <b>Actualiza Clave Fecha Caducidad Por Lote</b>
        </div>

        <Box className={StyledRoot}>
          <CustomFieldsetAccordion
            title="Criterio de Búsqueda"
            expanded={expandedCriterioBusqueda}
            onToggle={handleToggleCriterioBusqueda}
          >
            <ContainerCriteriosBusqueda>
              <IFechaDesde>
                <CustomDatePicker
                  label="Vencimiento Desde"
                  value={criterioBusqueda.vencimientoDesde}
                  setValue={(v) => handleSetCriterioBusqueda("vencimientoDesde", v)}
                  isOptional={true}
                  defaultValue={dayjs(new Date())}
                  checkboxInitialChecked={false}
                />
              </IFechaDesde>
              <IFechaHasta>
                <CustomDatePicker
                  label="Vencimiento Hasta"
                  value={criterioBusqueda.vencimientoHasta}
                  setValue={(v) => handleSetCriterioBusqueda("vencimientoHasta", v)}
                  isOptional={true}
                  defaultValue={dayjs(new Date())}
                  checkboxInitialChecked={false}
                />
              </IFechaHasta>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setRefreshCustomMultiRowSelectionRefKey((prev) => prev + 1)
                  setForceDataRefresh((prev) => prev + 1)
                }}
              >
                Filtrar
              </Button>
            </ContainerCriteriosBusqueda>
          </CustomFieldsetAccordion>

          <CustomMultiRowSelection
            key={`ActualizaClaveFechaCaducidadLoteAllUsuarios-${refreshCustomMultiRowSelectionRefKey}-${forceDataRefresh}`}
            queryKeyModal={`ActualizaClaveFechaCaducidadLoteAllUsuarios-${forceDataRefresh}`}
            endpoint="/ActualizaClaveFechaCaducidadLote/getAllUsuarios"
            idField="usrcodigo"
            endpointJson={{
              rangoFechaVencimiento: [criterioBusqueda?.vencimientoDesde, criterioBusqueda?.vencimientoHasta],
            }}
            // onHandleSelectedData={handleSelectedData}
            topToolbarCustomActions={({ table, device, selectedRows = [] }) => {
              const editarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "EDITAR",
              )
              const exportarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === "EXPORTAR",
              )
              console.log(table.getSelectedRowModel(), selectedRows, "asssad")
              const toolbarActions = [
                {
                  type: "modal",
                  label: editarAction?.acccaption,
                  key: editarAction?.acccaption,
                  icon: getIconComponent(editarAction?.accnameicono, editarAction?.acctipoico),
                  onClick: handleOpenModalEditar,

                  Component: (
                    <>
                      <CustomDatePicker
                        // label="Vencimiento Hasta"
                        value={nuevaFechaVencimiento}
                        setValue={(v) => setNuevaFechaVencimiento(v)}
                        isOptional={true}
                        defaultValue={dayjs(new Date())}
                        checkboxInitialChecked={false}
                      />
                    </>
                  ),
                  propsModal: {
                    open: openModalEditar,
                    onClose: handleCloseModalEditar,
                    title: "Actualizar Fecha de Vencimiento en lote",
                    showDefaultActions: true,
                    confirmLabel: "Aceptar",
                    cancelLabel: "Cerrar",
                    onConfirm: async (row) => {
                      try {
                        await fetchwrapper("/ActualizaClaveFechaCaducidadLote/saveFechaCaducidadLote", {
                          method: "POST",
                          body: JSON.stringify({ usuarios: selectedRows, nuevaFechaVencimiento }),
                          headers: {
                            "Content-Type": "application/json",
                          },
                        })

                        handleCloseModalEditar()
                        const confirm = await Swal.fire({
                          title: "¡Actualizado!",
                          text: `${selectedRows.length} han sido actualizados con la nueva fecha de vencimiento.`,
                          icon: "success",
                          confirmButtonText: "Aceptar",
                          allowOutsideClick: false,
                        })

                        if (confirm.isConfirmed) {
                          window.location.reload()
                        }
                      } catch (error) {
                        Swal.fire("Error", "No se pudo actualizar la fecha de vencimiento.", "error")
                      } finally {
                        handleCloseModalEditar()
                      }
                    },
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
                // {
                //   type: "modal",
                //   label: "importar",
                //   key: "importarDropdown",
                //   icon: getIconComponent(exportarAction?.accnameicono, exportarAction?.acctipoico),
                //   Component: (
                //     <CustomCSVImportButton
                //       templateFileName="PlantillaCreacionUsuarios.csv"
                //       fieldConfigs={{
                //         usrcodigo: { required: true },
                //         usrnombre: { required: true },
                //         usrfeccad: { required: false },
                //         usrcodper: { required: false },
                //         usremail: { required: false },
                //         usrflagoficre: { required: true },
                //         usrflagperfil: { required: true },
                //         usrstatus: { required: true },
                //         usrdiascaduclave: { required: true },
                //       }}
                //       maxFileSize={10 * 1024 * 1024} // 10MB
                //       onImportComplete={(data) => console.log("Datos importados:", data)}
                //     />
                //   ),
                // },
              ]
              return toolbarActions
            }}
            perPage={10}
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

export default ActualizaClaveFechaCaducidadLote
