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
        accessorKey: "pregcodigo",
        header: "Id",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregdescri",
        header: "Descripción",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregtipo",
        header: "Tipo",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregdurmin",
        header: "Duración (minutos)",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregrecuren",
        header: "Recurrencia",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "insticodigo",
        header: "Código Institución",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregespresencial",
        header: "¿Es presencial?",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregobligatoria",
        header: "Obligatoria",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregstatus",
        header: "Estado",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregfecisys",
        header: "Fecha de Inserción",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregorisys",
        header: "Fecha de Última Actualización",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregusuisys",
        header: "Usuario de Inserción",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregestisys",
        header: "Estado de Inserción",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregfecmsys",
        header: "Fecha de Última Modificación",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "preghormsys",
        header: "Hora de Última Modificación",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregusumsys",
        header: "Usuario de Última Modificación",
        enableEditing: false,
        size: 80,
      },
      {
        accessorKey: "pregestmsys",
        header: "Estado de Última Modificación",
        enableEditing: false,
        size: 80,
      },
    ],
    [],
  )

  // call CREATE hook
  const { mutateAsync: createBancoDePregunta, isPending: isCreatingBancoDePregunta } = useCreateBancoDePregunta()
  // call READ hook
  const {
    data: fetchedBancoDePreguntas = [],
    isError: isLoadingBancoDePreguntasError,
    isFetching: isFetchingBancoDePreguntas,
    isLoading: isLoadingBancoDePreguntas,
  } = useGetBancoDePreguntas()
  // call UPDATE hook
  const { mutateAsync: updateBancoDePregunta, isPending: isUpdatingBancoDePregunta } = useUpdateBancoDePregunta()
  // call DELETE hook
  const { mutateAsync: deleteBancoDePregunta, isPending: isDeletingBancoDePregunta } = useDeleteBancoDePregunta()

  // DELETE action
  const openDeleteConfirmModal = (row) => {
    if (window.confirm("¿Está seguro que quiere eliminar esta tarea?")) {
      deleteBancoDePregunta(row.original.pregcodigo)
    }
  }

  const table = useMaterialReactTable({
    columns,
    data: fetchedBancoDePreguntas,
    enableEditing: true,
    enableRowActions: true,
    localization: { ...MRT_Localization_ES },
    getRowId: (row) => row.pregcodigo,
    muiToolbarAlertBannerProps: isLoadingBancoDePreguntasError
      ? {
          color: "error",
          children: "Error en cargar el Banco de tareas",
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
              navigate(`editar/${row?.original.pregcodigo}`, {
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
      isLoading: isLoadingBancoDePreguntas,
      isSaving: isCreatingBancoDePregunta || isUpdatingBancoDePregunta || isDeletingBancoDePregunta,
      showAlertBanner: isLoadingBancoDePreguntasError,
      showProgressBars: isFetchingBancoDePreguntas,
    },
  })

  return <MaterialReactTable table={table} />
}

// CREATE hook (post new bancoDePregunta to api)
function useCreateBancoDePregunta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bancoDePregunta) => {
      // send api update request here
      await new Promise((resolve) => setTimeout(resolve, 1000)) // fake api call
      return Promise.resolve()
    },
    // client side optimistic update
    onMutate: (newBancoDePreguntaInfo) => {
      queryClient.setQueryData(["BancoDePreguntas"], (prevBancoDePreguntas) => [
        ...prevBancoDePreguntas,
        {
          ...newBancoDePreguntaInfo,
          id: (Math.random() + 1).toString(36).substring(7),
        },
      ])
    },
    // onSettled: () => queryClient.invalidateQueries({ queryKey: ['BancoDePreguntas'] }), //refetch bancoDePreguntas after mutation, disabled for demo
  })
}

// READ hook (get bancoDePreguntas from api)
function useGetBancoDePreguntas() {
  return useQuery({
    queryKey: ["BancoDePreguntas"],
    queryFn: async () => {
      // send api request here
      let response = await fetchwrapper("/BancoDeTareas/getAllBancoDeTareas")
      response = await response.json()
      response = response?.data
      // await new Promise((resolve) => setTimeout(resolve, 1000)); //fake api call
      return response
    },
    refetchOnWindowFocus: false,
  })
}

// UPDATE hook (put bancoDePregunta in api)
function useUpdateBancoDePregunta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bancoDePregunta) => {
      // send api update request here
      await new Promise((resolve) => setTimeout(resolve, 1000)) // fake api call
      return Promise.resolve()
    },
    // client side optimistic update
    onMutate: (newBancoDePreguntaInfo) => {
      queryClient.setQueryData(["BancoDePreguntas"], (prevBancoDePreguntas) =>
        prevBancoDePreguntas?.map((prevBancoDePregunta) =>
          prevBancoDePregunta.id === newBancoDePreguntaInfo.id ? newBancoDePreguntaInfo : prevBancoDePregunta,
        ),
      )
    },
    // onSettled: () => queryClient.invalidateQueries({ queryKey: ['bancoDePreguntas'] }), //refetch bancoDePreguntas after mutation, disabled for demo
  })
}

// DELETE hook (delete bancoDePregunta in api)
function useDeleteBancoDePregunta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (pregcodigo) => {
      // send api update request here
      const options = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }

      const response = await fetchwrapper(`/BancoDeTareas/deleteBancoDeTarea/${pregcodigo}`, options)
      return response
    },
    // client side optimistic update
    onMutate: (pregcodigo) => {
      queryClient.setQueryData(["BancoDePreguntas"], (prevBancoDePreguntas) =>
        prevBancoDePreguntas?.filter((bancoDePregunta) => bancoDePregunta.pregcodigo !== pregcodigo),
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["BancoDePreguntas"] })
    },

    onSuccess: () => {
      alert("Banco de tarea eliminado con éxito")
    },

    onError: () => {
      alert("No se pudo eliminar este Banco de tarea")
    },
  })
}

const DatagridBancoDePreguntas = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  return (
    <div>
      <Button variant="outlined" color="primary" onClick={() => navigate("crear")} sx={{ marginBottom: "15px" }}>
        <img src={CrearIcon} alt="Crear" style={{ width: "40px" }} />
        Crear un nueva tarea
      </Button>
      <ThemeProvider theme={createTheme(theme, esES)}>
        <CustomTable />
      </ThemeProvider>
    </div>
  )
}

export default DatagridBancoDePreguntas
