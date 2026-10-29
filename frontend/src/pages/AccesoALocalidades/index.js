import React, { useContext, useMemo } from "react"
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

import CustomReadableTable from "../../components/CustomReadableTable"
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
import { useQuery } from "@tanstack/react-query"

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
      main: "#196C87",
    },
  },
})

function useGetAllUsuariosLocalidades() {
  return useQuery({
    queryKey: ["getAllUsersModulosAccesoALocalidades"],
    queryFn: async () => {
      const response = await fetchwrapper("/AccesoALocalidades/getAllUsuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
      const result = await response.json()
      return result.data || []
    },
    retry: 1,
  })
}

const AccesoALocalidades = () => {
  const navigate = useNavigate()
  const { selectedMenuInfo } = useContext(GlobalContext)
  const { data: usuariosLocalidades = [], isLoading, isError, refetch } = useGetAllUsuariosLocalidades()
  const columnsTable = useMemo(
    () => [
      {
        accessorKey: "ciacodigo",
        header: "Cia",
        size: 100,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        accessorKey: "ciadescri",
        header: "Compañía",
        size: 200,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        accessorKey: "usrcodigo",
        header: "Usuario",
        size: 150,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        accessorKey: "usrnombre",
        header: "Nombre",
        size: 220,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        accessorKey: "usrfeccad",
        header: "Fecha de Caducidad",
        size: 180,
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return normalFormatDate(value)
        },
      },
      {
        accessorKey: "usrstatus",
        header: "Estado",
        size: 120,
        Cell: ({ cell }) => <span>{cell.getValue() === "A" ? "Activo" : "No Activo"}</span>,
      },
    ],
    [],
  )

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
          <b>Acceso a localidades</b>
        </div>

        <Box className={StyledRoot}>
          <CustomReadableTable
            data={usuariosLocalidades}
            isLoading={isLoading}
            isError={isError}
            errorMsgFilterSearch="Error en cargar datos"
            refetch={refetch}
            initialPerPage={10}
            rowActionsWidthTable={80}
            getRowId={(row, index) => {
              const composite = `${row?.ciacodigo ?? ""}-${row?.usrcodigo ?? ""}`
              return composite === "-" ? `row-${index}` : composite
            }}
            syncURL={true}
            rowActions={(row) => {
              const buscarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action?.acccaption === "BUSCAR",
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
              ]

              return actions
            }}
            topToolbarCustomActions={({ table, device }) => {
              const exportarAction = selectedMenuInfo?.data?.barraAcciones?.find(
                (action) => action.acccaption === "EXPORTAR",
              )
              const toolbarActions = [
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
            columnsTable={columnsTable}
          />
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default AccesoALocalidades
