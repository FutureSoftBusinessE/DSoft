import { useState, useEffect, useMemo, useRef } from "react"
import {
  IconButton,
  TextField,
  Box,
  TablePagination,
  useTheme,
  Tooltip,
  useMediaQuery,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Checkbox,
} from "@mui/material"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { MRT_Localization_ES } from "material-react-table/locales/es"
import { FirstPage, LastPage, KeyboardArrowLeft, KeyboardArrowRight, Refresh } from "@mui/icons-material"
import CustomBackdrop from "./CustomBackdrop"
import ExpandMore from "@mui/icons-material/ExpandMore"

// --------------------------------------------------
//                    PaginationActions
// --------------------------------------------------

function PaginationActions(props) {
  const theme = useTheme()
  const { count, page, rowsPerPage, onPageChange } = props
  const totalPages = Math.ceil(count / rowsPerPage)

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
        onClick={() => onPageChange(null, Math.max(0, totalPages - 1))}
        disabled={page >= totalPages - 1}
        aria-label="last page"
      >
        {theme.direction === "rtl" ? <FirstPage /> : <LastPage />}
      </IconButton>
    </Box>
  )
}

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
  isRowError,
  onSelectionChange,
}) => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: perPage })
  const tableContainerRef = useRef(null)

  // MRT row selection state: { [rowId: string]: boolean }
  const buildInitialSelection = (rows) => {
    const sel = {}
    rows.forEach((row, i) => {
      sel[String(i)] = !isRowError(row)
    })
    return sel
  }

  const [rowSelection, setRowSelection] = useState(() => buildInitialSelection(data))

  // Re-initialize when data changes (e.g. filter chip switched)
  useEffect(() => {
    setRowSelection(buildInitialSelection(data))
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [data])

  // Notify parent whenever selection changes (O(selected) not O(all rows))
  useEffect(() => {
    const selectedRowObjects = Object.entries(rowSelection)
      .filter(([, checked]) => checked)
      .map(([idx]) => data[parseInt(idx, 10)])
      .filter(Boolean)
    onSelectionChange(selectedRowObjects)
  }, [rowSelection])

  const columns = useMemo(
    () =>
      columnsTable.map((column) => ({
        ...column,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            value={column.getFilterValue() ?? ""}
            onChange={(e) => column.setFilterValue(e.target.value)}
          />
        ),
      })),
    [columnsTable],
  )

  const table = useMaterialReactTable({
    columns,
    data,
    getRowId: (_row, index) => String(index),
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      if (!isLoading) setRowSelection(updater)
    },
    onPaginationChange: setPagination,
    enablePagination: true,
    enableBottomToolbar: false,
    initialState: { showColumnFilters: true },
    enableEditing: false,
    enableSorting: true,
    enableRowActions: false,
    enableTopToolbar: true,
    enableGlobalFilter: false,
    enableColumnResizing: true,
    enableColumnFilters: true,
    enableRowVirtualization: true,
    enableStickyHeader: true,
    localization: { ...MRT_Localization_ES },
    muiToolbarAlertBannerProps: {
      ...(isError ? { color: "error", children: errorMsgFilterSearch } : {}),
      sx: {
        "& .MuiAlert-action button": {
          pointerEvents: isLoading ? "none" : "auto",
          opacity: isLoading ? 0.38 : 1,
        },
      },
    },
    muiSelectCheckboxProps: { disabled: isLoading },
    muiSelectAllCheckboxProps: { disabled: isLoading },
    muiTableContainerProps: {
      ref: tableContainerRef,
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
    mrtTheme: (theme) => ({
      baseBackgroundColor: theme.palette.background.default,
    }),
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        backgroundColor: isRowError(row.original) ? "#ffebee" : "#e8f5e9",
        outline: isRowError(row.original) ? "1px solid #ef9a9a" : "1px solid #a5d6a7",
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
    renderTopToolbarCustomActions: () => (
      <Tooltip title="Recargar datos">
        <IconButton onClick={refetch}>
          <Refresh />
        </IconButton>
      </Tooltip>
    ),
    state: {
      isLoading,
      pagination,
      rowSelection,
    },
  })

  return (
    <>
      <MaterialReactTable table={table} />
      <TablePagination
        rowsPerPageOptions={[perPage]}
        sx={{
          "& .MuiTablePagination-toolbar": {
            minHeight: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          },
          "& .MuiTablePagination-displayedRows": {
            margin: "auto 0",
          },
        }}
        component="div"
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={pagination.pageSize}
        page={pagination.pageIndex}
        onPageChange={(_, newPage) => {
          table.setPageIndex(newPage)
          tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
        }}
        onRowsPerPageChange={() => {
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
        ActionsComponent={PaginationActions}
        labelDisplayedRows={({ from, to, count }) => {
          const currentPage = table.getState().pagination.pageIndex + 1
          const totalPages = Math.ceil(count / perPage)
          return `${from}-${to} de ${count} | Página ${currentPage} de ${totalPages}`
        }}
      />
    </>
  )
}

// --------------------------------------------------
//                    SmallScreenTable
// --------------------------------------------------

const SmallScreenTable = ({
  theme,
  data,
  columnsTable,
  isLoading,
  isError,
  errorMsgFilterSearch,
  refetch,
  filtersOpenMobile,
  perPage,
  isRowError,
  onSelectionChange,
}) => {
  const DataIsVoidMsg = "No hay registros para mostrar"
  const DataIsLoadingMsg = "Cargando..."
  const AccordionFilterTitle = "Filtros"
  const FilterSearchErrorMsg = "Error al cargar los datos"
  const DefaultColumnContentIsVoidMsg = "-"

  const [filtersOpen, setFiltersOpen] = useState(filtersOpenMobile)
  const contentRef = useRef(null)
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(0)

  // Checked state: Set<number> of indices into `data`
  const buildInitialChecked = (rows) => {
    const s = new Set()
    rows.forEach((row, i) => {
      if (!isRowError(row)) s.add(i)
    })
    return s
  }

  const [checkedSet, setCheckedSet] = useState(() => buildInitialChecked(data))

  useEffect(() => {
    setCheckedSet(buildInitialChecked(data))
    setPage(0)
  }, [data])

  useEffect(() => {
    onSelectionChange([...checkedSet].map((i) => data[i]).filter(Boolean))
  }, [checkedSet])

  const toggleRow = (globalIndex) => {
    setCheckedSet((prev) => {
      const next = new Set(prev)
      if (next.has(globalIndex)) {
        next.delete(globalIndex)
      } else {
        next.add(globalIndex)
      }
      return next
    })
  }

  // Filter data
  const filteredData = data
    .map((row, globalIndex) => ({ row, globalIndex }))
    .filter(({ row }) =>
      Object.entries(filters).every(([key, value]) => {
        if (!value.trim()) return true
        return String(row[key]).toLowerCase().includes(value.toLowerCase().trim())
      }),
    )

  // Paginated data (with original global indices preserved)
  const paginatedData = filteredData.slice(page * perPage, (page + 1) * perPage)

  const handleFilterChange = (columnId, value) => {
    setFilters((prev) => ({ ...prev, [columnId]: value }))
    setPage(0)
  }

  return (
    <div>
      <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "background.paper" }}>
        {/* Refresh */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          <IconButton onClick={refetch} sx={{ bgcolor: "action.selected", borderRadius: 1, p: 1 }}>
            <Refresh fontSize="small" />
          </IconButton>
        </Box>

        {/* Error banner */}
        {isError && (
          <Alert severity="error" sx={{ mb: 2, "& .MuiAlert-icon": { alignItems: "center" }, borderRadius: 1 }}>
            {errorMsgFilterSearch || FilterSearchErrorMsg}
          </Alert>
        )}

        {/* Filters accordion */}
        <Accordion
          ref={contentRef}
          expanded={filtersOpen}
          onChange={() => setFiltersOpen(!filtersOpen)}
          sx={{
            mb: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "8px !important",
            boxShadow: "none",
            bgcolor: "background.paper",
            "&:before": { display: "none" },
            "& .MuiAccordionSummary-root": { borderRadius: "8px", bgcolor: (t) => t.palette.grey[50] },
            "& .MuiAccordionDetails-root": { bgcolor: (t) => t.palette.grey[50] },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{ minHeight: "48px", "& .MuiAccordionSummary-content": { margin: "12px 0" } }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" fontWeight="medium">
                {AccordionFilterTitle}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 1 }}>
              {columnsTable.map((col) => (
                <TextField
                  key={col.id || col.accessorKey}
                  variant="outlined"
                  size="small"
                  fullWidth
                  label={col.header}
                  onChange={(e) => handleFilterChange(col.id || col.accessorKey, e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: 1, backgroundColor: (t) => t.palette.common.white },
                  }}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Content */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 3 }}>
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
                  "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
                  mr: 1.5,
                }}
              />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {DataIsLoadingMsg}
              </Typography>
            </Box>
          ) : data.length === 0 && !isError ? (
            <Box sx={{ textAlign: "center", py: 4, bgcolor: "background.default", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {DataIsVoidMsg}
              </Typography>
            </Box>
          ) : (
            paginatedData.map(({ row, globalIndex }) => {
              const hasError = isRowError(row)
              const isChecked = checkedSet.has(globalIndex)

              return (
                <Card
                  key={globalIndex}
                  variant="outlined"
                  sx={{
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: hasError ? "#ef9a9a" : "#a5d6a7",
                    backgroundColor: hasError ? "#ffebee" : "#e8f5e9",
                    mb: 0.5,
                    position: "relative",
                  }}
                >
                  <CardContent sx={{ p: 1.5, pb: "12px !important" }}>
                    {/* Checkbox header */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleRow(globalIndex)}
                        size="small"
                        disabled={isLoading}
                        color={hasError ? "error" : "primary"}
                        sx={{ p: 0, mr: 1 }}
                      />
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        {isChecked ? "Seleccionado para importar" : "No seleccionado"}
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
                          sx={{ fontWeight: 400, color: "text.secondary", fontSize: "0.875rem", lineHeight: 1.3 }}
                        >
                          {col?.Cell
                            ? col.Cell({
                                cell: { getValue: () => row[col.accessorKey] ?? DefaultColumnContentIsVoidMsg },
                              })
                            : (row[col.accessorKey] ?? DefaultColumnContentIsVoidMsg)}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              )
            })
          )}
        </Box>

        {/* Pagination */}
        {!isLoading && data.length > 0 && !isError && (
          <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
            <TablePagination
              rowsPerPageOptions={[perPage]}
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
                "& .MuiInputBase-root": { marginRight: { xs: 0, sm: 2 } },
                "@media (max-width: 480px)": {
                  "& .MuiTablePagination-toolbar": { justifyContent: "center" },
                  "& .MuiTablePagination-spacer": { display: "none" },
                },
              }}
              component="div"
              count={filteredData.length}
              rowsPerPage={perPage}
              page={page}
              onPageChange={(_, newPage) => {
                setPage(newPage)
                contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              onRowsPerPageChange={() => setPage(0)}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count} | Página ${page + 1} de ${Math.ceil(filteredData.length / perPage)}`
              }
              ActionsComponent={PaginationActions}
            />
          </Box>
        )}
      </Box>
    </div>
  )
}

// --------------------------------------------------
//                    CustomCheckTable
// --------------------------------------------------

const CustomCheckTable = (props) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  return (
    <div>
      {isMobile ? <SmallScreenTable theme={theme} {...props} /> : <LargeScreenTable theme={theme} {...props} />}
    </div>
  )
}

// --------------------------------------------------
//            CustomCheckReadableTable
// --------------------------------------------------

/**
 * Like CustomReadableTable but with a checkbox per row.
 *
 * Props:
 *  - data              {Array}    Row objects
 *  - columnsTable      {Array}    MRT column definitions
 *  - isLoading         {boolean}
 *  - isError           {boolean}
 *  - errorMsgFilterSearch {string}
 *  - refetch           {Function}
 *  - perPage           {number}
 *  - filtersOpenMobile {boolean}
 *  - isRowError        {(row) => boolean}  Rows where true get red bg + unchecked default
 *  - onSelectionChange {(selectedRows: Array) => void}  Called on every check toggle
 */
const CustomCheckReadableTable = ({
  data = [],
  isLoading = false,
  columnsTable = [],
  isError = false,
  errorMsgFilterSearch = "No se pudo encontrar la información",
  refetch = () => {},
  perPage = 10,
  filtersOpenMobile = false,
  isRowError = () => false,
  onSelectionChange = () => {},
}) => {
  return (
    <Box>
      <CustomBackdrop isLoading={isLoading} />
      <CustomCheckTable
        data={data}
        columnsTable={columnsTable}
        isError={isError}
        errorMsgFilterSearch={errorMsgFilterSearch}
        isLoading={isLoading}
        refetch={refetch}
        perPage={perPage}
        filtersOpenMobile={filtersOpenMobile}
        isRowError={isRowError}
        onSelectionChange={onSelectionChange}
      />
    </Box>
  )
}

export default CustomCheckReadableTable
