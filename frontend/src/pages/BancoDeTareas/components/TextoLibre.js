/* eslint-disable camelcase */
import { useMemo, useState } from "react"
import {
  MRT_EditActionButtons,
  MaterialReactTable,
  // createRow,
  useMaterialReactTable,
} from "material-react-table"
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  createTheme,
  ThemeProvider,
  useTheme,
} from "@mui/material"
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fakeData, usStates } from "./makeData"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import { esES } from "@mui/material/locale"
import { MRT_Localization_ES } from "material-react-table/locales/es"
import CrearIcon from "../../../assets/iconos/Crear.ico"

const CustomTable = ({ allPreguntas, setallPreguntas }) => {
  const [validationErrors, setValidationErrors] = useState({})

  const columns = useMemo(
    () => [
      {
        accessorKey: "respuesta",
        header: "Respuesta",
        muiEditTextFieldProps: {
          required: true,
          error: !!validationErrors?.respuesta,
          helperText: validationErrors?.respuesta,
          // remove any previous validation errors when Pregunta focuses on the input
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              respuesta: undefined,
            }),
          // optionally add validation checking for onBlur or onChange
        },
      },
      //   {
      //     accessorKey: "estado",
      //     header: "Estado",
      //     editVariant: "select",
      //     defaultValue: "A",
      //     editSelectOptions: ["A", "I"],
      //     muiEditTextFieldProps: {
      //       select: true,
      //       error: !!validationErrors?.estado,
      //       helperText: validationErrors?.estado,
      //       required: true,
      //     },
      //   },
    ],
    [validationErrors],
  )

  // call DELETE hook
  const deletePregunta = (row) => {
    console.log(row, "aqui", allPreguntas)
    const indexElementToDelete = row.index + 1
    // Filtrar el arreglo para excluir el elemento con el índice especificado
    const newAllPreguntas = allPreguntas.filter((pregunta) => pregunta.index !== indexElementToDelete)
    console.log(newAllPreguntas, "88888")

    // Actualizar los índices restantes
    newAllPreguntas.forEach((pregunta, newIndex) => {
      pregunta.index = newIndex + 1
    })

    setallPreguntas([...newAllPreguntas])
  }

  // CREATE action
  const handleCreatePregunta = async ({ row, values: rowUpdated, table }) => {
    setValidationErrors({})

    const newIndex = allPreguntas.length + 1
    const newRow = {
      index: newIndex,
      ...rowUpdated,
    }

    setallPreguntas((prev) => [...prev, newRow])
    table.setCreatingRow(null) // exit creating mode
  }

  // UPDATE action
  const handleSavePregunta = async ({ row, values: rowUpdated, table }) => {
    setValidationErrors({})
    const { original: oldRow } = row
    const newAllPreguntas = allPreguntas.map((pregunta) => {
      if (
        pregunta.index === oldRow.index &&
        pregunta.respuesta === oldRow.respuesta
        // && pregunta.estado === oldRow.estado
      ) {
        return {
          index: oldRow.index,
          ...rowUpdated,
        }
      }
      return pregunta
    })

    setallPreguntas([...newAllPreguntas])
    table.setEditingRow(null) // exit editing mode
  }

  // DELETE action
  const openDeleteConfirmModal = (row) => {
    if (window.confirm("Seguro que quieres eliminar esta pregunta?")) {
      deletePregunta(row)
    }
  }

  const table = useMaterialReactTable({
    columns,
    localization: { ...MRT_Localization_ES },
    data: allPreguntas,
    createDisplayMode: "modal", // default ('row', and 'custom' are also available)
    editDisplayMode: "modal", // default ('row', 'cell', 'table', and 'custom' are also available)
    enableEditing: true,
    enableRowNumbers: true,
    rowNumberDisplayMode: "original", // default
    getRowId: (row) => row.id,
    onCreatingRowCancel: () => setValidationErrors({}),
    onCreatingRowSave: handleCreatePregunta,
    onEditingRowCancel: () => setValidationErrors({}),
    onEditingRowSave: handleSavePregunta,
    // optionally customize modal content
    renderCreateRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle variant="h3">Crear una nueva pregunta</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {internalEditComponents} {/* or render custom edit components here */}
        </DialogContent>
        <DialogActions>
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </DialogActions>
      </>
    ),
    // optionally customize modal content
    renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle variant="h3">Editar Pregunta</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {internalEditComponents} {/* or render custom edit components here */}
        </DialogContent>
        <DialogActions>
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </DialogActions>
      </>
    ),
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: "flex", gap: "1rem" }}>
        <Tooltip title="Editar">
          <IconButton onClick={() => table.setEditingRow(row)}>
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
    renderTopToolbarCustomActions: ({ table }) => (
      <Button
        variant="outlined"
        onClick={() => {
          table.setCreatingRow(true) // simplest way to open the create row modal with no default values
          // or you can pass in a row object to set default values with the `createRow` helper function
          // table.setCreatingRow(
          //   createRow(table, {
          //     //optionally pass in default values for the new row, useful for nested data or other complex scenarios
          //   }),
          // );
        }}
        disabled={allPreguntas.length >= 1}
      >
        <AddIcon />
        Añadir pregunta
      </Button>
    ),
  })

  return <MaterialReactTable table={table} />
}

const TextoLibre = ({ allPreguntas, setallPreguntas }) => {
  const theme = useTheme()
  return (
    <ThemeProvider theme={createTheme(theme, esES)}>
      <CustomTable allPreguntas={allPreguntas} setallPreguntas={setallPreguntas} />
    </ThemeProvider>
  )
}

export default TextoLibre
