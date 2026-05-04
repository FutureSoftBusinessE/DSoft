import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  IconButton,
  TextField,
  Checkbox,
  Box,
  TablePagination,
  useTheme,
  Tooltip,
  Button,
  useMediaQuery,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { MRT_Localization_ES } from "material-react-table/locales/es"

import { useQuery } from "@tanstack/react-query"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import {
  FirstPage,
  LastPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Refresh,
  Visibility,
  VisibilityOff,
  SelectAll,
  Deselect,
  ArrowDropDown,
} from "@mui/icons-material"
import CustomBackdrop from "./CustomBackdrop"
import ExpandMore from "@mui/icons-material/ExpandMore"
import CustomModal from "./CustomModal"
import Swal from "sweetalert2"

// --------------------------------------------------
// --------------------------------------------------
//                    ExportDropdown
// --------------------------------------------------
// --------------------------------------------------

const ExportDropdown = ({ exportActions, columns, data }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleActionClick = (action) => {
    action.onClick({ columns, data })
    handleClose()
  }

  return (
    <Box>
      <Tooltip title="Exportar">
        <IconButton
          onClick={handleClick}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          {exportActions[0]?.icon}
          <ArrowDropDown fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {exportActions.map((action) => (
          <MenuItem key={action.key} onClick={() => handleActionClick(action)} sx={{ minWidth: 120 }}>
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

// --------------------------------------------------
// --------------------------------------------------
//                    PaginationActions
// --------------------------------------------------
// --------------------------------------------------

function PaginationActions(props) {
  const theme = useTheme()
  const { count, page, rowsPerPage, onPageChange } = props

  const totalPages = Math.ceil(count / rowsPerPage)

  const handleFirstPageButtonClick = () => {
    onPageChange(null, 0)
  }

  const handleLastPageButtonClick = () => {
    onPageChange(null, Math.max(0, totalPages - 1))
  }

  return (
    <Box sx={{ flexShrink: 0, ml: 0 }}>
      <IconButton onClick={handleFirstPageButtonClick} disabled={page === 0} aria-label="first page">
        {theme.direction === "rtl" ? <LastPage /> : <FirstPage />}
      </IconButton>
      <IconButton onClick={() => onPageChange(null, page - 1)} disabled={page === 0} aria-label="previous page">
        {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton onClick={() => onPageChange(null, page + 1)} disabled={page >= totalPages - 1} aria-label="next page">
        {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton onClick={handleLastPageButtonClick} disabled={page >= totalPages - 1} aria-label="last page">
        {theme.direction === "rtl" ? <FirstPage /> : <LastPage />}
      </IconButton>
    </Box>
  )
}

// --------------------------------------------------
// --------------------------------------------------
//              CustomRowsPerPageInput
// --------------------------------------------------
// --------------------------------------------------

const CustomRowsPerPageInput = ({ value, onChange, rowsPerPageOptions }) => {
  const [inputValue, setInputValue] = useState(value.toString())
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    if (/^\d*$/.test(newValue)) {
      setInputValue(newValue)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    const numValue = parseInt(inputValue, 10)

    if (!isNaN(numValue) && numValue > 0) {
      onChange(numValue)
    } else {
      setInputValue(value.toString())
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur()
    }
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {!isEditing ? (
        <Box
          onClick={() => setIsEditing(true)}
          sx={{
            minWidth: "60px",
            cursor: "pointer",
            px: 1,
            py: 0.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "action.hover",
            },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2">{value}</Typography>
        </Box>
      ) : (
        <TextField
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          size="small"
          inputProps={{
            style: { textAlign: "center" },
            maxLength: 4,
          }}
          sx={{
            width: "70px",
            "& .MuiOutlinedInput-root": {
              height: "32px",
            },
          }}
        />
      )}

      {rowsPerPageOptions.length > 0 && (
        <Menu anchorEl={null} open={false}>
          {rowsPerPageOptions.map((option) => (
            <MenuItem key={option} onClick={() => onChange(option)}>
              {option}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  )
}

// --------------------------------------------------
// --------------------------------------------------
//              DebouncedFilter
// --------------------------------------------------
// --------------------------------------------------

const DebouncedFilter = ({ column, onFilterChange }) => {
  const [filterValue, setFilterValue] = useState("")

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange(column.id, filterValue)
    }, 500)

    return () => clearTimeout(timeout)
  }, [filterValue, column.id, onFilterChange])

  return (
    <TextField
      variant="standard"
      placeholder="Filtrar"
      value={filterValue}
      onChange={(e) => setFilterValue(e.target.value)}
      size="small"
      fullWidth
    />
  )
}

// --------------------------------------------------
// --------------------------------------------------
//                    LargeScreenTable
// --------------------------------------------------
// --------------------------------------------------

const LargeScreenTable = ({
  theme,
  data, // datos de la página actual
  allData, // TODOS los datos (sin paginar)
  columnsTable,
  perPage,
  rowsPerPageOptions,
  onRowsPerPageChange,
  isLoading,
  isError,
  totalPages,
  currentPage,
  onPageChange,
  onFilterChange,
  errorMsgFilterSearch,
  refetch,
  onItemSelected,
  topToolbarCustomActions,
  idField = "id",
}) => {
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [rowSelection, setRowSelection] = useState({})

  // Función para obtener ID único
  const getRowId = useCallback(
    (row) => {
      return row[idField] || row.id || row.ID || row.codigo || row.código || JSON.stringify(row)
    },
    [idField],
  )

  // CORRECCIÓN: Buscar en TODOS los datos, no solo en la página actual
  const selectedData = useMemo(() => {
    return Object.keys(rowSelection)
      .map((id) => allData.find((item) => getRowId(item) === id)) // ← allData en lugar de data
      .filter(Boolean)
  }, [rowSelection, allData, getRowId]) // ← allData en las dependencias

  // Datos a mostrar (todos o seleccionados)
  const displayData = showOnlySelected ? selectedData : data

  // Ajustar selección para vista filtrada (usando IDs)
  const adjustedRowSelection = useMemo(() => {
    if (!showOnlySelected) return rowSelection

    const newSelection = {}
    selectedData.forEach((item) => {
      const id = getRowId(item)
      newSelection[id] = true
    })
    return newSelection
  }, [rowSelection, showOnlySelected, selectedData, getRowId])

  // Manejar selección/deselección global (usando IDs)
  const handleToggleSelectAll = useCallback(() => {
    if (showOnlySelected) {
      // En vista de seleccionados: deseleccionar todos los seleccionados
      setRowSelection({})
      onItemSelected([])
    } else {
      // En vista normal: seleccionar/deseleccionar todos los datos actuales
      const allSelected = data.length > 0 && data.every((item) => rowSelection[getRowId(item)])

      if (allSelected) {
        // Deseleccionar todos
        setRowSelection({})
        onItemSelected([])
      } else {
        // Seleccionar todos los datos actuales
        const newSelection = {}
        data.forEach((item) => {
          newSelection[getRowId(item)] = true
        })
        setRowSelection(newSelection)
        onItemSelected(
          Object.keys(newSelection)
            .map((id) => allData.find((item) => getRowId(item) === id))
            .filter(Boolean),
        )
      }
    }
  }, [data, showOnlySelected, rowSelection, getRowId, onItemSelected, allData])

  // Verificar si todos están seleccionados (usando IDs)
  const allCurrentlySelected = useMemo(() => {
    const currentData = showOnlySelected ? selectedData : data
    if (currentData.length === 0) return false

    return currentData.every((item) => {
      const id = getRowId(item)
      return showOnlySelected ? adjustedRowSelection[id] : rowSelection[id]
    })
  }, [showOnlySelected, selectedData, data, rowSelection, adjustedRowSelection, getRowId])

  // Columnas con filtros debounceados
  const columns = useMemo(
    () =>
      columnsTable.map((col) => ({
        ...col,
        enableColumnFilter: true,
        Filter: ({ column }) => <DebouncedFilter column={column} onFilterChange={onFilterChange} />,
      })),
    [columnsTable, onFilterChange],
  )

  // Configuración principal de la tabla
  const table = useMaterialReactTable({
    columns,
    data: displayData,
    enableRowVirtualization: true,
    getRowVirtualizerOptions: { overscan: 5, estimateSize: () => 100 },
    enableRowSelection: true,
    enableMultiRowSelection: true,
    enableSelectAll: false,
    paginationDisplayMode: "pages",

    // CLAVE: Usar ID único real en lugar del índice
    getRowId: useCallback((row) => getRowId(row), [getRowId]),

    onRowSelectionChange: useCallback(
      (updater) => {
        const newSelection = typeof updater === "function" ? updater(adjustedRowSelection) : updater

        if (showOnlySelected) {
          // En vista de seleccionados
          const updatedOriginalSelection = { ...rowSelection }

          Object.entries(newSelection).forEach(([displayId, isSelected]) => {
            const originalItem = selectedData.find((item) => getRowId(item) === displayId)
            if (originalItem) {
              const originalId = getRowId(originalItem)
              if (isSelected) {
                updatedOriginalSelection[originalId] = true
              } else {
                delete updatedOriginalSelection[originalId]
              }
            }
          })

          setRowSelection(updatedOriginalSelection)
          onItemSelected(
            Object.keys(updatedOriginalSelection)
              .map((id) => allData.find((item) => getRowId(item) === id))
              .filter(Boolean),
          )
        } else {
          // En vista normal
          setRowSelection(newSelection)
          onItemSelected(
            Object.keys(newSelection)
              .filter((key) => newSelection[key])
              .map((id) => allData.find((item) => getRowId(item) === id))
              .filter(Boolean),
          )
        }
      },
      [onItemSelected, allData, showOnlySelected, rowSelection, selectedData, adjustedRowSelection, getRowId],
    ),

    state: {
      isLoading,
      rowSelection: adjustedRowSelection,
    },

    initialState: {
      showColumnFilters: true,
      density: "compact",
    },

    enablePagination: false,
    enableBottomToolbar: false,
    enableSorting: false,
    enableGlobalFilter: false,

    localization: MRT_Localization_ES,
    muiToolbarAlertBannerProps: isError ? { color: "error", children: errorMsgFilterSearch } : undefined,

    muiTableContainerProps: {
      sx: {
        maxHeight: "600px",
        overflow: "auto",
      },
    },

    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        backgroundColor: row.getIsSelected() ? theme.palette.action.selected : row.index % 2 === 0 ? "#A4EEB3" : "#fff",
        "&:hover": {
          backgroundColor: theme.palette.action.hover + "!important",
        },
      },
    }),

    muiTablePaperProps: {
      sx: {
        borderRadius: "10px",
        overflow: "hidden",
      },
    },

    renderTopToolbarCustomActions: useCallback(
      () => (
        <Box sx={{ display: "flex", gap: "10px", padding: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Acciones personalizadas del toolbar - CORREGIDO: usar selectedData (que ahora contiene TODAS las selecciones) */}
          {topToolbarCustomActions({ table, device: "lg", selectedRows: selectedData }).map((toolbarAction) => {
            if (toolbarAction.type === "dropdown") {
              return (
                <ExportDropdown
                  key={toolbarAction.key}
                  exportActions={toolbarAction.actions}
                  columns={columns}
                  data={data}
                />
              )
            }
            if (toolbarAction.type === "modal") {
              return (
                <>
                  <Tooltip title={toolbarAction.label} key={toolbarAction.key}>
                    <IconButton onClick={() => toolbarAction.onClick()} color="primary">
                      {toolbarAction.icon}
                    </IconButton>
                  </Tooltip>
                  <CustomModal {...toolbarAction.propsModal}>{toolbarAction.Component}</CustomModal>
                </>
              )
            }
            return (
              <Tooltip title={toolbarAction.label} key={toolbarAction.key}>
                <IconButton onClick={() => toolbarAction.onClick({ columns, data })}>{toolbarAction.icon}</IconButton>
              </Tooltip>
            )
          })}

          {/* Botón Recargar */}
          <Tooltip title="Recargar datos">
            <IconButton onClick={refetch}>
              <Refresh />
            </IconButton>
          </Tooltip>

          {/* Botón Toggle de Selección */}
          <Button
            variant={allCurrentlySelected ? "contained" : "outlined"}
            color={allCurrentlySelected ? "secondary" : "primary"}
            size="small"
            startIcon={allCurrentlySelected ? <Deselect /> : <SelectAll />}
            onClick={handleToggleSelectAll}
            disabled={displayData.length === 0}
            sx={{
              minWidth: 160,
              fontWeight: "medium",
              textTransform: "none",
              borderRadius: 2,
              px: 2,
              py: 0.5,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: theme.shadows[4],
              },
            }}
          >
            {allCurrentlySelected ? "Deseleccionar todos" : "Seleccionar todos"}
          </Button>

          {/* Botón Toggle de Vista */}
          <Button
            variant={showOnlySelected ? "contained" : "outlined"}
            color={showOnlySelected ? "primary" : "info"}
            size="small"
            startIcon={showOnlySelected ? <Visibility /> : <VisibilityOff />}
            onClick={() => setShowOnlySelected((prev) => !prev)}
            disabled={!showOnlySelected && selectedData.length === 0}
            sx={(theme) => ({
              minWidth: 180,
              fontWeight: "medium",
              textTransform: "none",
              borderRadius: 2,
              px: 2,
              py: 0.5,
              transition: "all 0.2s ease-in-out",
              position: "relative",
              overflow: "visible",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: theme.shadows[4],
              },
              "&:not(:disabled)": {
                "&::after":
                  selectedData.length > 0 && !showOnlySelected
                    ? {
                        content: `"${selectedData.length}"`,
                        position: "absolute",
                        top: -10,
                        right: -10,
                        backgroundColor: theme.palette.error.main,
                        color: theme.palette.error.contrastText,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        padding: "2px 8px",
                        minWidth: "22px",
                        height: "22px",
                        whiteSpace: "nowrap",
                      }
                    : {},
              },
            })}
          >
            {showOnlySelected ? "Mostrar todos" : "Mostrar seleccionados"}
          </Button>
        </Box>
      ),
      [
        topToolbarCustomActions,
        selectedData, // ← Ahora selectedData contiene TODAS las selecciones
        columns,
        data,
        refetch,
        allCurrentlySelected,
        handleToggleSelectAll,
        displayData.length,
        showOnlySelected,
        theme,
      ],
    ),
  })

  return (
    <>
      <MaterialReactTable table={table} />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Registros por página:
          </Typography>
          <CustomRowsPerPageInput
            value={perPage}
            onChange={onRowsPerPageChange}
            rowsPerPageOptions={rowsPerPageOptions}
          />
          {rowsPerPageOptions.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {rowsPerPageOptions.map((option) => (
                <Box
                  key={option}
                  onClick={() => onRowsPerPageChange(option)}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: option === perPage ? "primary.main" : "divider",
                    borderRadius: 1,
                    bgcolor: option === perPage ? "#A4EEB3" : "transparent",
                    color: option === perPage ? "primary.dark" : "text.secondary",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: option === perPage ? "#A4EEB3" : "action.hover",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  <Typography variant="caption">{option}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {`${(currentPage - 1) * perPage + 1}-${Math.min(currentPage * perPage, totalPages * perPage)} de ${totalPages * perPage} | Página ${currentPage} de ${totalPages}`}
          </Typography>
          <PaginationActions
            count={totalPages * perPage}
            page={currentPage - 1}
            rowsPerPage={perPage}
            onPageChange={(_, newPage) => onPageChange(newPage + 1)}
          />
        </Box>
      </Box>
    </>
  )
}

// --------------------------------------------------
// --------------------------------------------------
//                    SmallScreenTable
// --------------------------------------------------
// --------------------------------------------------

const SmallScreenTable = ({
  theme,
  data,
  allData, // ← Añadir allData también para mobile
  columnsTable,
  perPage,
  rowsPerPageOptions,
  onRowsPerPageChange,
  isLoading,
  isError,
  totalPages,
  currentPage,
  onPageChange,
  onFilterChange,
  errorMsgFilterSearch,
  refetch,
  onItemSelected,
  topToolbarCustomActions,
  idField = "id",
}) => {
  const DataIsVoidMsg = "No hay registros para mostrar"
  const DataIsLoadingMsg = "Cargando..."
  const AccordionFilterTilte = "Filtros"
  const FilterSearchErrorMsg = "Error al cargar los datos"
  const DefaultColumnCotentIsVoidMsg = "-"
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [selectedRows, setSelectedRows] = useState([])
  const [localFilters, setLocalFilters] = useState({})
  const timeoutRef = useRef(null)

  // Función para obtener ID único
  const getRowId = useCallback(
    (row) => {
      return row[idField] || row.id || row.ID || row.codigo || row.código || JSON.stringify(row)
    },
    [idField],
  )

  // Efecto para notificar los registros seleccionados
  useEffect(() => {
    if (onItemSelected) {
      onItemSelected(selectedRows)
    }
  }, [selectedRows, onItemSelected])

  // Manejar filtros con debounce
  const handleFilterChange = (columnId, value) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setLocalFilters((prev) => {
        if (!value.trim()) {
          const { [columnId]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [columnId]: value.trim() }
      })
      onFilterChange(columnId, value)
    }, 500)
  }

  // Aplicar filtros locales
  const filteredData = useMemo(() => {
    if (Object.keys(localFilters).length === 0) return data

    return data.filter((row) =>
      Object.entries(localFilters).every(([columnId, filterValue]) => {
        const column = columnsTable.find((col) => col.id === columnId || col.accessorKey === columnId)
        if (!column) return true

        const cellValue = row[column.accessorKey]?.toString().toLowerCase() || ""
        return cellValue.includes(filterValue.toLowerCase())
      }),
    )
  }, [data, localFilters, columnsTable])

  // Datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    return filteredData.slice(startIndex, startIndex + perPage)
  }, [filteredData, currentPage, perPage])

  const totalFilteredPages = Math.ceil(filteredData.length / perPage)

  // Verificar si una fila está seleccionada (usando ID)
  const isRowSelected = useCallback(
    (row) => {
      const rowId = getRowId(row)
      return selectedRows.some((item) => getRowId(item) === rowId)
    },
    [selectedRows, getRowId],
  )

  // Manejar selección/deselección (usando IDs)
  const handleRowSelection = useCallback(
    (row, isSelected) => {
      setSelectedRows((prev) => {
        const rowId = getRowId(row)
        if (isSelected) {
          // Agregar si no existe
          if (!prev.some((item) => getRowId(item) === rowId)) {
            return [...prev, row]
          }
        } else {
          // Remover por ID
          return prev.filter((item) => getRowId(item) !== rowId)
        }
        return prev
      })
    },
    [getRowId],
  )

  // Seleccionar/deseleccionar todos (usando IDs)
  const handleToggleSelectAll = useCallback(() => {
    if (selectedRows.length === filteredData.length && filteredData.length > 0) {
      // Deseleccionar todos
      setSelectedRows([])
    } else {
      // Seleccionar todos los datos filtrados actuales
      // Evitar duplicados usando IDs
      const currentIds = new Set(selectedRows.map(getRowId))
      const newSelections = filteredData.filter((row) => !currentIds.has(getRowId(row)))
      setSelectedRows((prev) => [...prev, ...newSelections])
    }
  }, [selectedRows, filteredData, getRowId])

  return (
    <div>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: "background.paper",
        }}
      >
        {/* Barra superior con botones de acciones */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
            gap: 1,
          }}
        >
          {/* Acciones personalizadas del toolbar - CORREGIDO: usar selectedRows (que contiene TODAS las selecciones) */}
          {topToolbarCustomActions({ device: "sm", selectedRows }).map((toolbarAction) => {
            if (toolbarAction.type === "dropdown") {
              return (
                <ExportDropdown
                  key={toolbarAction.key}
                  exportActions={toolbarAction.actions}
                  columns={columnsTable}
                  data={data}
                />
              )
            }
            if (toolbarAction.type === "modal") {
              return (
                <>
                  <Tooltip title={toolbarAction.label} key={toolbarAction.key}>
                    <IconButton onClick={() => toolbarAction.onClick()} color="primary">
                      {toolbarAction.icon}
                    </IconButton>
                  </Tooltip>
                  <CustomModal {...toolbarAction.propsModal}>{toolbarAction.Component}</CustomModal>
                </>
              )
            }
            return (
              <Tooltip title={toolbarAction.label} key={toolbarAction.key}>
                <IconButton onClick={() => toolbarAction.onClick({ columns: columnsTable, data })}>
                  {toolbarAction.icon}
                </IconButton>
              </Tooltip>
            )
          })}

          <IconButton
            onClick={refetch}
            sx={{
              bgcolor: "action.selected",
              borderRadius: 1,
              p: 1,
            }}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Box>

        {/* Banner de error */}
        {isError && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              "& .MuiAlert-icon": { alignItems: "center" },
              borderRadius: 1,
            }}
          >
            {errorMsgFilterSearch || FilterSearchErrorMsg}
          </Alert>
        )}

        {/* Accordion para filtros */}
        <Accordion
          expanded={filtersOpen}
          onChange={() => setFiltersOpen(!filtersOpen)}
          sx={{
            mb: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "8px !important",
            boxShadow: "none",
            bgcolor: "background.paper",
            "&:before": {
              display: "none",
            },
            "& .MuiAccordionSummary-root": {
              borderRadius: "8px",
              bgcolor: (theme) => theme.palette.grey[50],
            },
            "& .MuiAccordionDetails-root": {
              bgcolor: (theme) => theme.palette.grey[50],
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              minHeight: "48px",
              "& .MuiAccordionSummary-content": {
                margin: "12px 0",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" fontWeight="medium">
                {AccordionFilterTilte}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                p: 1,
              }}
            >
              {columnsTable.map((col) => (
                <TextField
                  key={col.id || col.accessorKey}
                  variant="outlined"
                  size="small"
                  fullWidth
                  label={`${col.header}`}
                  onChange={(e) => handleFilterChange(col.id || col.accessorKey, e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                      backgroundColor: (theme) => theme.palette.common.white,
                    },
                  }}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Botones de selección para móvil */}
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Button
            variant={selectedRows.length === filteredData.length && filteredData.length > 0 ? "contained" : "outlined"}
            color={selectedRows.length === filteredData.length && filteredData.length > 0 ? "secondary" : "primary"}
            size="small"
            startIcon={
              selectedRows.length === filteredData.length && filteredData.length > 0 ? <Deselect /> : <SelectAll />
            }
            onClick={handleToggleSelectAll}
            disabled={filteredData.length === 0}
            sx={{ textTransform: "none" }}
          >
            {selectedRows.length === filteredData.length && filteredData.length > 0
              ? "Deseleccionar todos"
              : "Seleccionar todos"}
          </Button>
        </Box>

        {/* Contenido principal */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 3,
              }}
            >
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  borderTop: "2px solid",
                  borderColor: "primary.main",
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                  mr: 1.5,
                }}
              />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {DataIsLoadingMsg}
              </Typography>
            </Box>
          ) : paginatedData.length === 0 && !isError ? (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                bgcolor: "background.default",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {DataIsVoidMsg}
              </Typography>
            </Box>
          ) : (
            paginatedData.map((row, rowIndex) => (
              <Card
                key={getRowId(row)}
                variant="outlined"
                sx={{
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  mb: 0.5,
                  position: "relative",
                  backgroundColor: isRowSelected(row) ? theme.palette.action.selected : "background.paper",
                }}
              >
                <CardContent sx={{ p: 1.5, pb: 1.5 }}>
                  {/* Checkbox de selección */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Checkbox
                      checked={isRowSelected(row)}
                      onChange={(e) => handleRowSelection(row, e.target.checked)}
                      size="small"
                    />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Seleccionar
                    </Typography>
                  </Box>

                  {columnsTable.map((col, index) => (
                    <Box
                      key={col.id || col.accessorKey}
                      sx={{
                        mb: 1.5,
                        pb: index !== columnsTable.length - 1 ? 1 : 0,
                        borderBottom: index !== columnsTable.length - 1 ? "1px dashed" : "none",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          color: "text.primary",
                          display: "block",
                          mb: 0.5,
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                        }}
                      >
                        {col.header}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 400,
                          color: "text.secondary",
                          fontSize: "0.875rem",
                          lineHeight: 1.3,
                        }}
                      >
                        {col?.Cell
                          ? col.Cell({
                              cell: { getValue: () => row[col.accessorKey] || DefaultColumnCotentIsVoidMsg },
                            })
                          : row[col.accessorKey] || DefaultColumnCotentIsVoidMsg}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </Box>

        {/* Paginación optimizada para móvil */}
        {!isLoading && paginatedData.length > 0 && !isError && (
          <Box
            sx={{
              mt: 2,
              pt: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                  Registros por página:
                </Typography>
                <CustomRowsPerPageInput
                  value={perPage}
                  onChange={onRowsPerPageChange}
                  rowsPerPageOptions={rowsPerPageOptions}
                />
                {rowsPerPageOptions.length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {rowsPerPageOptions.map((option) => (
                      <Box
                        key={option}
                        onClick={() => onRowsPerPageChange(option)}
                        sx={{
                          px: 1,
                          py: 0.5,
                          cursor: "pointer",
                          border: "1px solid",
                          borderColor: option === perPage ? "primary.main" : "divider",
                          borderRadius: 1,
                          bgcolor: option === perPage ? "#A4EEB3" : "transparent",
                          color: option === perPage ? "primary.dark" : "text.secondary",
                          "&:hover": {
                            borderColor: "primary.main",
                            bgcolor: option === perPage ? "#A4EEB3" : "action.hover",
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                          {option}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <TablePagination
                rowsPerPageOptions={[]}
                sx={{
                  "& .MuiTablePagination-toolbar": {
                    minHeight: { xs: "48px", sm: "64px" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                    padding: { xs: "4px", sm: "8px" },
                  },
                  "& .MuiTablePagination-displayedRows": {
                    margin: "auto 0",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    whiteSpace: "nowrap",
                  },
                  "& .MuiTablePagination-selectLabel": {
                    display: "none",
                  },
                  "& .MuiTablePagination-select": {
                    display: "none",
                  },
                  "& .MuiInputBase-root": {
                    display: "none",
                  },
                  "@media (max-width: 480px)": {
                    "& .MuiTablePagination-toolbar": {
                      justifyContent: "center",
                    },
                    "& .MuiTablePagination-spacer": {
                      display: "none",
                    },
                  },
                }}
                component="div"
                count={filteredData.length}
                rowsPerPage={perPage}
                page={currentPage - 1}
                onPageChange={(_, newPage) => {
                  onPageChange(newPage + 1)
                }}
                ActionsComponent={PaginationActions}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count} | Página ${currentPage} de ${totalFilteredPages}`
                }
              />
            </Box>
          </Box>
        )}
      </Box>
    </div>
  )
}

// --------------------------------------------------
// --------------------------------------------------
//                    CustomTable
// --------------------------------------------------
// --------------------------------------------------

const CustomTable = (props) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  return (
    <>
      <div>
        {/* TODO: Falta de implementar vista para pantallas pequeñas */}
        {/* {isMobile ? <SmallScreenTable theme={theme} {...props} /> : <LargeScreenTable theme={theme} {...props} />} */}
        <LargeScreenTable theme={theme} {...props} />
      </div>
    </>
  )
}

// --------------------------------------------------
// --------------------------------------------------
//            CustomMultiRowSelection
// --------------------------------------------------
// --------------------------------------------------

const CustomMultiRowSelection = ({
  endpoint = "",
  endpointJson = {},
  errorMsgFilterSearch = "Error en cargar datos",
  queryKeyModal = "",
  perPage: initialPerPage = 10,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  columnsTable = [],
  onHandleSelectedData,
  topToolbarCustomActions = () => [],
  idField = "id",
}) => {
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(initialPerPage)
  const { data, isLoading, isError, refetch, isFetching } = useGetData()
  const [totalPages, setTotalPages] = useState(1)
  const [itemSelected, setItemSelected] = useState([])
  const timeoutRef = useRef(null)

  // Función debounce para los filtros
  const handleFilterChange = useCallback((columnId, value) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setFilters((prevFilters) => {
        if (!value.trim()) {
          const { [columnId]: _, ...rest } = prevFilters
          return rest
        }
        return {
          ...prevFilters,
          [columnId]: value.trim(),
        }
      })
    }, 500)
    setPage(1)
  }, [])

  const handleRowsPerPageChange = useCallback((newPerPage) => {
    setPerPage(newPerPage)
    setPage(1)
  }, [])

  // Obtener datos del endpoint
  useEffect(() => {
    refetch()
  }, [refetch])

  // Filtrar y paginar datos en el frontend
  const filteredAndPaginatedData = useMemo(() => {
    if (!data) return []

    let filteredData = data

    // Aplicar filtros
    if (Object.keys(filters).length > 0) {
      filteredData = data.filter((row) =>
        Object.entries(filters).every(([columnId, filterValue]) => {
          const column = columnsTable.find((col) => col.id === columnId || col.accessorKey === columnId)
          if (!column) return true

          const cellValue = row[column.accessorKey]?.toString().toLowerCase() || ""
          return cellValue.includes(filterValue.toLowerCase())
        }),
      )
    }

    // Calcular total de páginas
    const totalItems = filteredData.length
    setTotalPages(Math.ceil(totalItems / perPage) || 1)

    // Paginar datos
    const startIndex = (page - 1) * perPage
    return filteredData.slice(startIndex, startIndex + perPage)
  }, [data, filters, page, perPage, columnsTable])

  function useGetData() {
    return useQuery({
      queryKey: [queryKeyModal],
      queryFn: async () => {
        try {
          const response = await fetchwrapper(`${endpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...endpointJson,
            }),
          })
          const result = await response.json()
          return result.data
        } catch (errorResponse) {
          Swal.fire({
            title: "Error",
            text: errorResponse?.details?.msg || "Error en la petición datos",
            icon: "error",
            confirmButtonText: "OK",
          })
          throw new Error(errorResponse?.details?.msg || "Error en la petición datos")
        }
      },
      keepPreviousData: false,
      retry: 1,
    })
  }

  return (
    <Box>
      <CustomBackdrop isLoading={isLoading || isFetching} />

      {/* Botón para agregar seleccionados */}
      {/* <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            if (itemSelected && itemSelected.length > 0) {
              onHandleSelectedData(itemSelected)
            }
          }}
          disabled={itemSelected.length === 0}
        >
          Agregar {itemSelected.length > 0 ? `(${itemSelected.length})` : ""} elementos seleccionados
        </Button>
      </div> */}

      <CustomTable
        data={isError ? [] : filteredAndPaginatedData} // ← datos paginados
        allData={isError ? [] : data} // ← NUEVO PROP: TODOS los datos (sin paginar)
        columnsTable={columnsTable || []}
        perPage={perPage}
        rowsPerPageOptions={rowsPerPageOptions}
        onRowsPerPageChange={handleRowsPerPageChange}
        isLoading={isLoading}
        isError={isError}
        totalPages={totalPages}
        currentPage={page}
        onPageChange={setPage}
        onFilterChange={handleFilterChange}
        errorMsgFilterSearch={errorMsgFilterSearch}
        refetch={refetch}
        onItemSelected={setItemSelected}
        topToolbarCustomActions={topToolbarCustomActions}
        idField={idField}
      />
    </Box>
  )
}

export default CustomMultiRowSelection
