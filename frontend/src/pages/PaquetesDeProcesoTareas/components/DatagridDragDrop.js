/* eslint-disable camelcase */
import { useMemo, useState } from "react"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { Box, Typography, Button, createTheme, ThemeProvider, useTheme, IconButton } from "@mui/material"
import SkipNextIcon from "@mui/icons-material/SkipNext"
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

import { esES } from "@mui/material/locale"
import { MRT_Localization_ES } from "material-react-table/locales/es"

const DatagridDragDrop = ({ data1, setData1, data2, setData2 }) => {
  const theme = useTheme()

  const columns = useMemo(
    () => [
      {
        accessorKey: "pregcodigo",
        header: "Código",
        size: 120,
      },
      {
        accessorKey: "pregdescri",
        header: "Pregunta",
        size: 200,
      },
      {
        accessorKey: "pregtipo",
        header: "Tipo",
        size: 80,
      },
      {
        accessorKey: "pregstatus",
        header: "Status",
        size: 80,
      },
    ],
    [],
  )

  const [rowSelection, setRowSelection] = useState({})
  const [draggingRow, setDraggingRow] = useState(null)
  const [hoveredTable, setHoveredTable] = useState(null)
  const [initialCaptureStartDragging, setInitialCaptureStartDragging] = useState("")

  // Función para mover tareas seleccionadas de izquierda a derecha (SIMPLIFICADA)
  const moverAIzquierdaADerecha = () => {
    const selectedRows = table1.getSelectedRowModel().rows
    if (selectedRows.length === 0) {
      alert("Seleccione tareas para mover")
      return
    }

    const tareasAMover = selectedRows.map((obj) => obj.original)

    // Filtrar solo las que NO están ya en derecha
    const tareasParaMover = tareasAMover.filter((tarea) => !data2.some((d) => d.pregcodigo === tarea.pregcodigo))

    if (tareasParaMover.length === 0) {
      alert("Todas las tareas seleccionadas ya están en el paquete")
      return
    }

    // Mover las tareas
    setData1((prev) => prev.filter((t) => !tareasParaMover.some((tarea) => tarea.pregcodigo === t.pregcodigo)))
    setData2((prev) => [...prev, ...tareasParaMover])
    setRowSelection({})
  }

  // Función para devolver tareas seleccionadas de derecha a izquierda (SIMPLIFICADA)
  const moverADerechaAIzquierda = () => {
    const selectedRows = table2.getSelectedRowModel().rows
    if (selectedRows.length === 0) {
      alert("Seleccione tareas para devolver")
      return
    }

    const tareasAMover = selectedRows.map((obj) => obj.original)

    // Filtrar solo las que NO están ya en izquierda
    const tareasParaMover = tareasAMover.filter((tarea) => !data1.some((d) => d.pregcodigo === tarea.pregcodigo))

    if (tareasParaMover.length === 0) {
      alert("Todas las tareas seleccionadas ya están en el banco")
      return
    }

    // Mover las tareas
    setData2((prev) => prev.filter((t) => !tareasParaMover.some((tarea) => tarea.pregcodigo === t.pregcodigo)))
    setData1((prev) => [...prev, ...tareasParaMover])
    setRowSelection({})
  }

  // Función para devolver una sola tarea (usada en renderRowActions)
  const devolverTareaAIzquierda = (tarea) => {
    const tareaId = tarea.pregcodigo

    // Verificar si ya está en izquierda
    if (data1.some((existente) => existente.pregcodigo === tareaId)) {
      alert("Esta tarea ya está en el banco")
      return
    }

    // Mover de derecha a izquierda
    setData2((prev) => prev.filter((item) => item.pregcodigo !== tareaId))
    setData1((prev) => [...prev, tarea])
  }

  const commonTableProps = {
    columns,
    localization: { ...MRT_Localization_ES },
    enableRowDragging: true,
    enableFullScreenToggle: false,
    muiTableContainerProps: {
      sx: {
        minHeight: "320px",
      },
    },
    onDraggingRowChange: setDraggingRow,
    state: { draggingRow, rowSelection },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        setRowSelection((prev) => ({
          ...prev,
          [row.id]: !prev[row.id],
        }))
      },
      selected: rowSelection[row.id],
      sx: {
        cursor: "pointer",
      },
    }),
    onRowSelectionChange: setRowSelection,
  }

  const table1 = useMaterialReactTable({
    ...commonTableProps,
    data: data1,
    getRowId: (originalRow) => `table-1-${originalRow.pregcodigo}`,
    muiRowDragHandleProps: {
      onDragEnd: () => {
        if (hoveredTable === "table-2" && draggingRow) {
          const tarea = draggingRow.original
          const tareaId = tarea.pregcodigo

          // REGLAS: ¿Ya está en DERECHA?
          if (data2.some((item) => item.pregcodigo === tareaId)) {
            alert("Esta tarea ya está en el paquete")
          } else {
            // Mover de izquierda a derecha
            setData1((prev) => prev.filter((d) => d.pregcodigo !== tareaId))
            setData2((prev) => [...prev, tarea])
          }
        }
        setHoveredTable(null)
      },
    },
    muiTablePaperProps: {
      onDragEnter: () => setHoveredTable("table-1"),
      sx: {
        outline: hoveredTable === "table-1" ? "2px dashed pink" : undefined,
      },
      onDragStartCapture: () => {
        setInitialCaptureStartDragging("table-1")
      },
    },
    renderTopToolbarCustomActions: () => {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography color="success.main" component="span" variant="h6">
            Banco de Tareas ({data1.length})
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={moverAIzquierdaADerecha}
            disabled={table1.getSelectedRowModel().rows.length === 0}
          >
            <SkipNextIcon /> Agregar al Paquete
          </Button>
        </Box>
      )
    },
  })

  const table2 = useMaterialReactTable({
    ...commonTableProps,
    enableRowOrdering: initialCaptureStartDragging !== "table-1",
    enableSorting: false,
    data: data2,
    defaultColumn: {
      size: 100,
    },
    getRowId: (originalRow) => `table-2-${originalRow.pregcodigo}`,
    muiRowDragHandleProps: ({ table }) => ({
      onDragEnd: () => {
        if (hoveredTable === "table-1" && draggingRow) {
          const tarea = draggingRow.original
          const tareaId = tarea.pregcodigo

          // REGLAS: ¿Ya está en IZQUIERDA?
          if (data1.some((item) => item.pregcodigo === tareaId)) {
            alert("Esta tarea ya está en el banco")
          } else {
            // Mover de derecha a izquierda
            setData2((prev) => prev.filter((d) => d.pregcodigo !== tareaId))
            setData1((prev) => [...prev, tarea])
          }
        }
        setHoveredTable(null)

        // Auto ordering logic dentro de la misma tabla
        if (hoveredTable === "table-2") {
          const { draggingRow: localDraggingRow, hoveredRow } = table.getState()
          if (hoveredRow && localDraggingRow) {
            const newData = [...data2]
            newData.splice(hoveredRow.index, 0, newData.splice(localDraggingRow.index, 1)[0])
            setData2(newData)
          }
        }
      },
    }),
    muiTablePaperProps: {
      onDragEnter: () => {
        setHoveredTable("table-2")
      },
      sx: {
        outline: hoveredTable === "table-2" ? "2px dashed pink" : undefined,
      },
      onDragStartCapture: () => {
        setInitialCaptureStartDragging("table-2")
      },
    },
    renderRowActions: ({ row }) => (
      <IconButton
        onClick={() => devolverTareaAIzquierda(row.original)}
        color="primary"
        size="small"
        title="Devolver al banco de tareas"
      >
        <ArrowBackIcon />
      </IconButton>
    ),
    renderTopToolbarCustomActions: () => {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography color="error.main" component="span" variant="h6">
            Paquete Actual ({data2.length})
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={moverADerechaAIzquierda}
            disabled={table2.getSelectedRowModel().rows.length === 0}
          >
            <SkipPreviousIcon /> Devolver al Banco
          </Button>
        </Box>
      )
    },
  })

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "auto", lg: "1fr 1fr" },
        gap: "1rem",
        overflow: "auto",
        p: "4px",
        marginTop: "20px",
      }}
    >
      <ThemeProvider theme={createTheme(theme, esES)}>
        <MaterialReactTable table={table1} />
        <MaterialReactTable table={table2} />
      </ThemeProvider>
    </Box>
  )
}

export default DatagridDragDrop
