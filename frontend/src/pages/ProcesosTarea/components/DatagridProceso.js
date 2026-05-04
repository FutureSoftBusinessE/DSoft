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
        accessorKey: "procesocod",
        header: "Código Proceso",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "procesosta",
        header: "Estado",
        enableEditing: true,
        size: 120,
      },
      {
        accessorKey: "procesofisys",
        header: "Fecha de Inserción",
        enableEditing: false,
        size: 150,
      },
      {
        accessorKey: "procesohisys",
        header: "Hora de Inserción",
        enableEditing: false,
        size: 180,
      },
      {
        accessorKey: "procesouisys",
        header: "Usuario de Inserción",
        enableEditing: false,
        size: 150,
      },
      {
        accessorKey: "procesoeisys",
        header: "IP de Inserción",
        enableEditing: false,
        size: 180,
      },
      {
        accessorKey: "procesofmsys",
        header: "Fecha de Última Modificación",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "procesohmsys",
        header: "Hora de Última Modificación",
        enableEditing: false,
        size: 150,
      },
      {
        accessorKey: "procesoumsys",
        header: "Usuario de Última Modificación",
        enableEditing: false,
        size: 120,
      },
      {
        accessorKey: "procesoemsys",
        header: "IP de Última Modificación",
        enableEditing: false,
        size: 150,
      },
    ],
    [],
  )

  // call READ hook
  const {
    data: fetchedGestionAlmacenProcesos = [],
    isError: isLoadingGestionAlmacenProcesosError,
    isFetching: isFetchingGestionAlmacenProcesos,
    isLoading: isLoadingGestionAlmacenProcesos,
  } = useGetGestionAlmacenProcesos()
  // call DELETE hook
  const { mutateAsync: deleteGestionAlmacenProcesos, isPending: isDeletingGestionAlmacenProcesos } =
    useDeleteGestionAlmacenProcesos()

  // DELETE action
  const openDeleteConfirmModal = (row) => {
    if (window.confirm("¿Está seguro que quiere eliminar este proceso?")) {
      deleteGestionAlmacenProcesos(row.original.procesocod)
    }
  }

  const table = useMaterialReactTable({
    columns,
    data: fetchedGestionAlmacenProcesos,
    enableEditing: true,
    enableRowActions: true,
    localization: { ...MRT_Localization_ES },
    getRowId: (row) => row.procesocod,
    muiToolbarAlertBannerProps: isLoadingGestionAlmacenProcesosError
      ? {
          color: "error",
          children: "Error en cargar los procesos",
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
              navigate(`editar/${row?.original.procesocod}`, {
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
      isLoading: isLoadingGestionAlmacenProcesos,
      isSaving: isDeletingGestionAlmacenProcesos,
      showAlertBanner: isLoadingGestionAlmacenProcesosError,
      showProgressBars: isFetchingGestionAlmacenProcesos,
    },
  })

  return <MaterialReactTable table={table} />
}

// READ hook (get GestionAlmacenProcesos from api)
function useGetGestionAlmacenProcesos() {
  return useQuery({
    queryKey: ["GestionAlmacenProcesos"],
    queryFn: async () => {
      // send api request here
      let response = await fetchwrapper("/ProcesosDeTarea/getAllProcesos")
      response = await response.json()
      response = response?.data
      return response
    },
    refetchOnWindowFocus: false,
  })
}

// DELETE hook (delete GestionAlmacenProcesos in api)
function useDeleteGestionAlmacenProcesos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (procesocod) => {
      // send api update request here
      const options = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      const response = await fetchwrapper(`/ProcesosDeTarea/deleteProceso/${procesocod}`, options)
      return response
    },
    // client side optimistic update
    onMutate: (procesocod) => {
      queryClient.setQueryData(["GestionAlmacenProcesos"], (prevGestionAlmacenProcesos) =>
        prevGestionAlmacenProcesos?.filter(
          (GestionAlmacenProcesos) => GestionAlmacenProcesos.procesocod !== procesocod,
        ),
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["GestionAlmacenProcesos"] })
    },

    onSuccess: () => {
      alert("Proceso eliminado con éxito")
    },

    onError: () => {
      alert("No se pudo eliminar este proceso")
    },
  })
}

const DatagridProceso = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  return (
    <div>
      <Button variant="outlined" color="primary" onClick={() => navigate("crear")} sx={{ marginBottom: "15px" }}>
        <img src={CrearIcon} alt="Crear" style={{ width: "40px" }} />
        Crear un nuevo proceso
      </Button>
      <ThemeProvider theme={createTheme(theme, esES)}>
        <CustomTable />
      </ThemeProvider>
    </div>
  )
}

export default DatagridProceso
