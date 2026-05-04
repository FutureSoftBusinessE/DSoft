/* eslint-disable camelcase */
import { useMemo, useState } from "react"
import {
  MaterialReactTable,
  // createRow,
  useMaterialReactTable,
} from "material-react-table"
import { createTheme, ThemeProvider, useTheme, Box, Button, IconButton, Tooltip } from "@mui/material"
import { esES } from "@mui/material/locale"
import { MRT_Localization_ES } from "material-react-table/locales/es"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import { useNavigate } from "react-router-dom"
import CrearIcon from "../../../assets/iconos/Crear.ico"

const CustomTable = () => {
  const navigate = useNavigate()

  const columns = useMemo(
    () => [
      {
        accessorKey: "formcodigo",
        header: "Código de Formulario",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "procesocod",
        header: "Código de proceso",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "formdescri",
        header: "Descripción de Formulario",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "formstatus",
        header: "Estado del Formulario",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "formfecisys",
        header: "Fecha de Inserción",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "formhorisys",
        header: "Hora de Inserción",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "formusuisys",
        header: "Usuario de Inserción",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "formestisys",
        header: "IP de Inserción",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "formfecmsys",
        header: "Fecha de Última Modificación",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "formhormsys",
        header: "Hora de Última Modificación",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "formusumsys",
        header: "Usuario de Última Modificación",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "formestmsys",
        header: "IP de Última Modificación",
        enableEditing: false,
        size: 120,
      },
    ],
    [],
  )

  // call READ hook
  const {
    data: fetchedFormularios = [],
    isError: isLoadingFormulariosError,
    isFetching: isFetchingFormularios,
    isLoading: isLoadingFormularios,
  } = useGetFormularios()
  // call DELETE hook
  const { mutateAsync: deleteFormularios, isPending: isDeletingFormularios } = useDeleteFormularios()

  // DELETE action
  const openDeleteConfirmModal = (row) => {
    if (window.confirm("¿Está seguro que quiere eliminar este formulario?")) {
      deleteFormularios(row.original.formcodigo)
    }
  }

  const table = useMaterialReactTable({
    columns,
    data: fetchedFormularios,
    enableEditing: true,
    enableRowActions: true,
    localization: { ...MRT_Localization_ES },
    getRowId: (row) => row.formcodigo,
    muiToolbarAlertBannerProps: isLoadingFormulariosError
      ? {
          color: "error",
          children: "Error en cargar los paquetes",
        }
      : undefined,
    muiTableContainerProps: {
      sx: {
        minHeight: "500px",
      },
    },

    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: "flex", gap: "1rem" }}>
        <Tooltip title="Editar">
          <IconButton
            onClick={() => {
              navigate(`editar/${row?.original.formcodigo}`, {
                state: row?.original,
              })
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton color="error" onClick={() => openDeleteConfirmModal(row)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    state: {
      isLoading: isLoadingFormularios,
      isSaving: isDeletingFormularios,
      showAlertBanner: isLoadingFormulariosError,
      showProgressBars: isFetchingFormularios,
    },
  })

  return <MaterialReactTable table={table} />
}

// READ hook (get Formularios from api)
function useGetFormularios() {
  return useQuery({
    queryKey: ["Formularios"],
    queryFn: async () => {
      // send api request here
      let response = await fetchwrapper("/PaquetesDeProcesosTareas/getAllPaquetes")
      response = await response.json()
      response = response?.data
      return response
    },
    refetchOnWindowFocus: false,
  })
}

// DELETE hook (delete Formularios in api)
function useDeleteFormularios() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formcodigo) => {
      // send api update request here
      const options = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      const response = await fetchwrapper(`/PaquetesDeProcesosTareas/deletePaquete/${formcodigo}`, options)
      return response
    },
    // client side optimistic update
    onMutate: (formcodigo) => {
      queryClient.setQueryData(["Formularios"], (prevFormularios) =>
        prevFormularios?.filter((Formularios) => Formularios.formcodigo !== formcodigo),
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["Formularios"] })
    },

    onSuccess: () => {
      alert("Paquete eliminado con éxito")
    },

    onError: () => {
      alert("No se pudo eliminar este paquete")
    },
  })
}

const DatagridFormularios = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  return (
    <div>
      <Button variant="outlined" color="primary" onClick={() => navigate("crear")} sx={{ marginBottom: "15px" }}>
        <img src={CrearIcon} alt="Crear" style={{ width: "40px" }} />
        Crear un nuevo paquete
      </Button>
      <ThemeProvider theme={createTheme(theme, esES)}>
        <CustomTable />
      </ThemeProvider>
    </div>
  )
}

export default DatagridFormularios
