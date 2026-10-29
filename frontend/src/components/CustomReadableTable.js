import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import {
  IconButton,
  Box,
  TablePagination,
  useTheme,
  Tooltip,
  useMediaQuery,
  Card,
  CardContent,
  Typography,
  Alert,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { MRT_Localization_ES } from "material-react-table/locales/es"
import {
  FirstPage,
  LastPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Refresh,
  ExpandMore,
  ArrowDropDown,
} from "@mui/icons-material"
import CustomBackdrop from "./CustomBackdrop"
import CustomModal from "./CustomModal"

// --------------------------------------------------
//                    ExportDropdown
// --------------------------------------------------
const ExportDropdown = ({ action, columns, data, table, color }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleClick = (event) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const handleActionClick = (sub) => {
    sub.onClick({ columns, data, table })
    handleClose()
  }

  return (
    <Box>
      <Tooltip title={action.label}>
        <IconButton
          onClick={handleClick}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            color,
          }}
        >
          {action.actions[0]?.icon}
          <ArrowDropDown fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {action.actions.map((sub) => (
          <MenuItem key={sub.key} onClick={() => handleActionClick(sub)} sx={{ minWidth: 120 }}>
            <ListItemIcon>{sub.icon}</ListItemIcon>
            <ListItemText>{sub.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

// --------------------------------------------------
//                    PaginationActions
// --------------------------------------------------
function PaginationActions({ count, page, rowsPerPage, onPageChange }) {
  const theme = useTheme()
  const totalPages = Math.max(1, Math.ceil(count / rowsPerPage))

  return (
    <Box sx={{ flexShrink: 0, ml: 0 }}>
      <IconButton onClick={() => onPageChange(null, 0)} disabled={page === 0} aria-label="first page">
        {theme.direction === "rtl" ? <LastPage /> : <FirstPage />}
      </IconButton>
      <IconButton onClick={() => onPageChange(null, page - 1)} disabled={page === 0} aria-label="previous page">
        {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton onClick={() => onPageChange(null, page + 1)} disabled={page >= totalPages - 1} aria-label="next page">
        {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={() => onPageChange(null, totalPages - 1)}
        disabled={page >= totalPages - 1}
        aria-label="last page"
      >
        {theme.direction === "rtl" ? <FirstPage /> : <LastPage />}
      </IconButton>
    </Box>
  )
}

// --------------------------------------------------
//              CustomRowsPerPageInput
// --------------------------------------------------
const CustomRowsPerPageInput = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(String(value))
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    setInputValue(String(value))
  }, [value])

  const commit = () => {
    setIsEditing(false)
    const num = parseInt(inputValue, 10)
    if (!isNaN(num) && num > 0) {
      onChange(num)
    } else {
      setInputValue(String(value))
    }
  }

  if (!isEditing) {
    return (
      <Box
        onClick={() => {
          setIsEditing(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        sx={{
          minWidth: 60,
          cursor: "pointer",
          px: 1,
          py: 0.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          display: "flex",
          justifyContent: "center",
          "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
        }}
      >
        <Typography variant="body2">{value}</Typography>
      </Box>
    )
  }

  return (
    <TextField
      inputRef={inputRef}
      value={inputValue}
      onChange={(e) => /^\d*$/.test(e.target.value) && setInputValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      size="small"
      inputProps={{ style: { textAlign: "center" }, maxLength: 4 }}
      sx={{ width: 70, "& .MuiOutlinedInput-root": { height: 32 } }}
    />
  )
}

// --------------------------------------------------
//        Helper: Filter por defecto (TextField)
// --------------------------------------------------
const DefaultFilter = ({ column }) => (
  <TextField
    variant="standard"
    placeholder="Filtrar"
    value={column.getFilterValue() ?? ""}
    onChange={(e) => column.setFilterValue(e.target.value)}
  />
)

const buildColumns = (columnsTable) =>
  columnsTable.map((col) => ({
    ...col,
    Filter: col.Filter ?? DefaultFilter,
  }))

// --------------------------------------------------
//    Render de acciones del toolbar
// --------------------------------------------------
const renderToolbarActions = (actions, payload) =>
  (actions || []).map((action) => {
    if (!action?.label) return null

    if (action.type === "dropdown") {
      return (
        <ExportDropdown
          key={action.key}
          action={action}
          columns={payload?.columns}
          data={payload?.data}
          table={payload?.table}
        />
      )
    }

    if (action.type === "modal") {
      return (
        <Box key={action.key} sx={{ display: "inline-flex", alignItems: "center" }}>
          <Tooltip title={action.label}>
            <IconButton onClick={() => action.onClick?.()}>{action.icon}</IconButton>
          </Tooltip>
          <CustomModal {...(action.propsModal || {})}>{action.Component}</CustomModal>
        </Box>
      )
    }

    return (
      <Tooltip title={action.label} key={action.key}>
        <IconButton onClick={() => action.onClick(payload)}>{action.icon}</IconButton>
      </Tooltip>
    )
  })

// --------------------------------------------------
//                    LargeScreenTable
// --------------------------------------------------
const LargeScreenTable = ({
  theme,
  data,
  columnsTable,
  isLoading,
  isError,
  errorMsgFilterSearch,
  refetch,
  perPage,
  rowsPerPageOptions,
  onRowsPerPageChange,
  currentPage,
  onPageChange,
  filters,
  onFiltersChange,
  rowActionsWidthTable,
  rowActions = () => [],
  topToolbarCustomActions = () => [],
  getRowId,
}) => {
  const columns = useMemo(() => buildColumns(columnsTable), [columnsTable])

  const columnFilters = useMemo(
    () =>
      Object.entries(filters || {})
        .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
        .map(([id, value]) => ({ id, value })),
    [filters],
  )

  const table = useMaterialReactTable({
    columns,
    data,
    getRowId: getRowId || ((row, index) => row?.id ?? row?._id ?? row?.uuid ?? index),

    enableColumnFilters: true,
    enableGlobalFilter: false,
    enableFilters: true,
    enablePagination: true,
    enableEditing: false,
    enableSorting: false,
    enableBottomToolbar: false,
    enableTopToolbar: true,
    enableColumnResizing: true,
    enableRowActions: rowActions({ original: {} })?.length > 0,
    localization: { ...MRT_Localization_ES },

    initialState: { showColumnFilters: true },

    state: {
      isLoading,
      columnFilters,
      pagination: {
        pageIndex: Math.max(0, (currentPage || 1) - 1),
        pageSize: perPage,
      },
    },

    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnFilters) : updater
      const filtersObj = next.reduce((acc, f) => {
        if (f.value !== undefined && f.value !== null && String(f.value).trim() !== "") {
          acc[f.id] = f.value
        }
        return acc
      }, {})
      onFiltersChange?.(filtersObj)
    },

    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: Math.max(0, (currentPage || 1) - 1), pageSize: perPage })
          : updater
      if (next.pageIndex + 1 !== currentPage) onPageChange?.(next.pageIndex + 1)
      if (next.pageSize !== perPage) onRowsPerPageChange?.(next.pageSize)
    },

    muiToolbarAlertBannerProps: isError ? { color: "error", children: errorMsgFilterSearch } : undefined,
    muiTableContainerProps: {
      sx: {
        minWidth: "100%",
        maxWidth: "100%",
        maxHeight: "600px",
        overflowY: "auto",
        overflowX: "auto",
      },
    },
    muiTableHeadCellProps: {
      sx: {
        fontSize: "0.875rem",
        fontWeight: "bold",
      },
    },
    mrtTheme: (t) => ({
      baseBackgroundColor: t.palette.background.default,
    }),
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        backgroundColor: row.index % 2 === 0 ? "#A4EEB3" : "#ffffff",
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

    renderRowActions: ({ row }) => (
      <Box sx={{ display: "flex", gap: "0.3rem" }}>
        {rowActions(row).map(
          (action) =>
            action?.label && (
              <Tooltip title={action.label} key={action.key}>
                <IconButton onClick={() => action.onClick(row)}>{action.icon}</IconButton>
              </Tooltip>
            ),
        )}
      </Box>
    ),

    // 👇 cambio: pasar `table` como argumento de topToolbarCustomActions
    renderTopToolbarCustomActions: () => (
      <Box
        sx={{
          display: "flex",
          gap: "10px",
          padding: "8px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {renderToolbarActions(topToolbarCustomActions({ table, device: "lg" }), {
          columns,
          data,
          table,
        })}
        <Tooltip title="Recargar datos">
          <IconButton onClick={refetch}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>
    ),

    displayColumnDefOptions: rowActionsWidthTable ? { "mrt-row-actions": { size: rowActionsWidthTable } } : undefined,
  })

  const totalFiltered = table.getFilteredRowModel().rows.length

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
          <CustomRowsPerPageInput value={perPage} onChange={onRowsPerPageChange} />
          {rowsPerPageOptions?.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {rowsPerPageOptions.map((option) => (
                <Box
                  key={option}
                  onClick={() => onRowsPerPageChange?.(option)}
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
            {`${(currentPage - 1) * perPage + 1}-${Math.min(currentPage * perPage, totalFiltered)} de ${totalFiltered} | Página ${currentPage} de ${Math.max(1, Math.ceil(totalFiltered / perPage))}`}
          </Typography>
          <PaginationActions
            count={totalFiltered}
            page={Math.max(0, (currentPage || 1) - 1)}
            rowsPerPage={perPage}
            onPageChange={(_, newPage) => onPageChange?.(newPage + 1)}
          />
        </Box>
      </Box>
    </>
  )
}

// --------------------------------------------------
//                    SmallScreenTable
// --------------------------------------------------
const SmallScreenTable = ({
  data,
  columnsTable,
  isLoading,
  isError,
  errorMsgFilterSearch,
  refetch,
  filtersOpenMobile,
  perPage,
  rowsPerPageOptions,
  onRowsPerPageChange,
  currentPage,
  onPageChange,
  filters,
  onFiltersChange,
  rowActions = () => [],
  topToolbarCustomActions = () => [],
  getRowId,
}) => {
  const DataIsVoidMsg = "No hay registros para mostrar"
  const DataIsLoadingMsg = "Cargando..."
  const AccordionFilterTilte = "Filtros"
  const FilterSearchErrorMsg = "Error al cargar los datos"
  const DefaultColumnCotentIsVoidMsg = "-"

  const [filtersOpen, setFiltersOpen] = useState(filtersOpenMobile)

  useEffect(() => {
    setFiltersOpen(filtersOpenMobile)
  }, [filtersOpenMobile])

  const columns = useMemo(() => buildColumns(columnsTable), [columnsTable])

  const columnFilters = useMemo(
    () =>
      Object.entries(filters || {})
        .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
        .map(([id, value]) => ({ id, value })),
    [filters],
  )

  const table = useMaterialReactTable({
    columns,
    data,
    getRowId: getRowId || ((row, index) => row?.id ?? row?._id ?? row?.uuid ?? index),
    enableColumnFilters: true,
    enableGlobalFilter: false,
    enableFilters: true,
    enablePagination: true,
    enableSorting: false,
    enableEditing: false,
    enableRowActions: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    initialState: { showColumnFilters: true },
    state: {
      columnFilters,
      pagination: {
        pageIndex: Math.max(0, (currentPage || 1) - 1),
        pageSize: perPage,
      },
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnFilters) : updater
      const filtersObj = next.reduce((acc, f) => {
        if (f.value !== undefined && f.value !== null && String(f.value).trim() !== "") {
          acc[f.id] = f.value
        }
        return acc
      }, {})
      onFiltersChange?.(filtersObj)
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: Math.max(0, (currentPage || 1) - 1), pageSize: perPage })
          : updater
      if (next.pageIndex + 1 !== currentPage) onPageChange?.(next.pageIndex + 1)
      if (next.pageSize !== perPage) onRowsPerPageChange?.(next.pageSize)
    },
  })

  const totalFiltered = table.getFilteredRowModel().rows.length
  const paginatedData = table.getPaginationRowModel().rows.map((r) => r.original)
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage))

  return (
    <div>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1,
            mb: 2,
          }}
        >
          {/* 👇 cambio: pasar `table` como argumento de topToolbarCustomActions */}
          {renderToolbarActions(topToolbarCustomActions({ table, device: "sm" }), {
            columns: columnsTable,
            data,
            table,
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
              {columnsTable.map((col) => {
                const fieldKey = col.id || col.accessorKey
                const mrtColumn = table.getColumn(fieldKey)
                if (!mrtColumn) return null
                return (
                  <TextField
                    key={fieldKey}
                    variant="outlined"
                    size="small"
                    fullWidth
                    label={`${col.header}`}
                    value={mrtColumn.getFilterValue() ?? ""}
                    onChange={(e) => mrtColumn.setFilterValue(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1,
                        backgroundColor: (theme) => theme.palette.common.white,
                      },
                    }}
                  />
                )
              })}
            </Box>
          </AccordionDetails>
        </Accordion>

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
            paginatedData.map((row, rowIndex) => {
              const actions = rowActions({ original: row }) || []
              const rowKey = getRowId ? getRowId(row, rowIndex) : (row?.id ?? row?._id ?? row?.uuid ?? rowIndex)
              return (
                <Card
                  key={rowKey}
                  variant="outlined"
                  sx={{
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    mb: 0.5,
                    position: "relative",
                  }}
                >
                  {actions.length > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        zIndex: 1,
                        display: "flex",
                        flexDirection: "row",
                      }}
                    >
                      {actions.map(
                        (action) =>
                          action?.key && (
                            <IconButton
                              key={action.key}
                              onClick={() => action.onClick({ original: row })}
                              size="small"
                              sx={{
                                m: 0.5,
                                bgcolor: "background.paper",
                                "&:active": {
                                  bgcolor: "action.selected",
                                },
                              }}
                            >
                              {action.icon}
                            </IconButton>
                          ),
                      )}
                    </Box>
                  )}

                  <CardContent sx={{ p: 1.5, pb: 1.5 }}>
                    {columnsTable.map((col, index) => (
                      <Box
                        key={col.id || col.accessorKey}
                        sx={{
                          mb: 1.5,
                          pb: index !== columnsTable.length - 1 ? 1 : 0,
                          borderBottom: index !== columnsTable.length - 1 ? "1px dashed" : "none",
                          borderColor: "divider",
                          pr: index === 0 && actions.length ? 8 : 0,
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
                                cell: { getValue: () => row[col.accessorKey] ?? DefaultColumnCotentIsVoidMsg },
                                row: { original: row },
                              })
                            : (row[col.accessorKey] ?? DefaultColumnCotentIsVoidMsg)}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              )
            })
          )}
        </Box>

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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                  Registros por página:
                </Typography>
                <CustomRowsPerPageInput value={perPage} onChange={onRowsPerPageChange} />
                {rowsPerPageOptions?.length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {rowsPerPageOptions.map((option) => (
                      <Box
                        key={option}
                        onClick={() => onRowsPerPageChange?.(option)}
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
                count={totalFiltered}
                rowsPerPage={perPage}
                page={Math.max(0, (currentPage || 1) - 1)}
                onPageChange={(_, newPage) => onPageChange?.(newPage + 1)}
                ActionsComponent={PaginationActions}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count} | Página ${currentPage} de ${totalPages}`
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
//                    CustomTable
// --------------------------------------------------
const CustomTable = (props) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  return isMobile ? <SmallScreenTable {...props} /> : <LargeScreenTable theme={theme} {...props} />
}

// --------------------------------------------------
//            CustomReadableTable (público)
// --------------------------------------------------
const CustomReadableTable = ({
  data = [],
  columnsTable = [],
  isLoading = false,
  isError = false,
  errorMsgFilterSearch = "No se pudo encontrar la información",
  refetch = () => {},
  initialPerPage = 10,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  filtersOpenMobile = false,
  rowActions = () => [],
  topToolbarCustomActions = () => [],
  getRowId,
  rowActionsWidthTable,
  syncURL = false,
}) => {
  const [searchParams, setSearchParams] = useSearchParams()

  const getFiltersFromURL = useCallback(() => {
    if (!syncURL) return {}
    const filters = {}
    for (const [key, value] of searchParams.entries()) {
      if (key === "pagina" || key === "perPage") continue
      filters[key] = value
    }
    return filters
  }, [searchParams, syncURL])

  const syncURLFn = useCallback(
    (newFilters, newPage, newPerPage) => {
      if (!syncURL) return

      const params = new URLSearchParams()

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })

      if (newPage && newPage !== 1) {
        params.set("pagina", newPage.toString())
      }

      if (newPerPage && newPerPage !== initialPerPage) {
        params.set("perPage", newPerPage.toString())
      }

      setSearchParams(params, { replace: true })
    },
    [setSearchParams, initialPerPage, syncURL],
  )

  const [filters, setFilters] = useState(() => getFiltersFromURL())
  const [page, setPage] = useState(() => {
    if (!syncURL) return 1
    const pageParam = searchParams.get("pagina")
    return pageParam ? parseInt(pageParam) : 1
  })
  const [perPage, setPerPage] = useState(() => {
    if (!syncURL) return initialPerPage
    const perPageParam = searchParams.get("perPage")
    return perPageParam ? parseInt(perPageParam) : initialPerPage
  })

  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleFiltersChange = useCallback(
    (newFilters) => {
      setFilters(newFilters)
      setPage(1)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        syncURLFn(newFilters, 1, perPage)
      }, 500)
    },
    [syncURLFn, perPage],
  )

  const handleRowsPerPageChange = useCallback(
    (newPerPage) => {
      setPerPage(newPerPage)
      setPage(1)
      syncURLFn(filters, 1, newPerPage)
    },
    [filters, syncURLFn],
  )

  const handlePageChange = useCallback(
    (newPage) => {
      setPage(newPage)
      syncURLFn(filters, newPage, perPage)
    },
    [filters, perPage, syncURLFn],
  )

  const commonProps = {
    data,
    columnsTable,
    isLoading,
    isError,
    errorMsgFilterSearch,
    refetch,
    perPage,
    rowsPerPageOptions,
    onRowsPerPageChange: handleRowsPerPageChange,
    currentPage: page,
    onPageChange: handlePageChange,
    filters,
    onFiltersChange: handleFiltersChange,
    rowActionsWidthTable,
    rowActions,
    topToolbarCustomActions,
    getRowId,
    filtersOpenMobile,
  }

  return (
    <Box>
      <CustomBackdrop isLoading={isLoading} />
      <CustomTable {...commonProps} />
    </Box>
  )
}

export default CustomReadableTable
