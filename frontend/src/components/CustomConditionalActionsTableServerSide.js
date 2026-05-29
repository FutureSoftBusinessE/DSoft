import { useState, useEffect, useMemo, useRef, useCallback, Component } from "react"
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { MRT_Localization_ES } from "material-react-table/locales/es"

import { useQuery } from "@tanstack/react-query"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import { FirstPage, LastPage, KeyboardArrowLeft, KeyboardArrowRight, Refresh, ArrowDropDown } from "@mui/icons-material"
import CustomBackdrop from "./CustomBackdrop"
import ExpandMore from "@mui/icons-material/ExpandMore"
import CustomModal from "./CustomModal"

// --------------------------------------------------
// Conversor Hexadecimal a RGBA para transparencias
// --------------------------------------------------
const hexToRgba = (hex, alpha) => {
  let r = 0
  let g = 0
  let b = 0
  if (!hex || !hex.startsWith("#")) return `rgba(25, 108, 135, ${alpha})` // Fallback color SIAC
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16)
    g = parseInt(hex[2] + hex[2], 16)
    b = parseInt(hex[3] + hex[3], 16)
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16)
    g = parseInt(hex.substring(3, 5), 16)
    b = parseInt(hex.substring(5, 7), 16)
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

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
          {exportActions[0]?.icon} {/* Usa el icono de la primera acción */}
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
//                    PaginationActions
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
//              CustomRowsPerPageInput
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
            "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
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
          inputProps={{ style: { textAlign: "center" }, maxLength: 4 }}
          sx={{ width: "70px", "& .MuiOutlinedInput-root": { height: "32px" } }}
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
//                    LargeScreenTable
// --------------------------------------------------

const LargeScreenTable = ({
  theme,
  data,
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
  rowActionsWidthTable,
  rowActions,
  useGetObj,
  topToolbarCustomActions,
  visualConfig, // <--- Dinámico
}) => {
  const columns = useMemo(
    () =>
      columnsTable.map((column) => ({
        ...column,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
      })),
    [onFilterChange],
  )

  const table = useMaterialReactTable({
    columns,
    data,
    initialState: { showColumnFilters: true },
    enableEditing: false,
    enableSorting: false,
    enablePagination: false,
    enableBottomToolbar: false,
    enableRowActions: true,
    enableTopToolbar: true,
    enableGlobalFilter: false,
    enableColumnResizing: true,
    enableSelectAll: false,
    enableMultiRowSelection: false,
    enableColumnFilters: true,
    enableStickyHeader: true,
    localization: { ...MRT_Localization_ES },
    muiToolbarAlertBannerProps: isError ? { color: "error", children: errorMsgFilterSearch } : undefined,
    muiTableContainerProps: {
      sx: { minWidth: "100%", maxWidth: "100%", maxHeight: "600px", overflowY: "auto", overflowX: "auto" },
    },
    // --- ESTILOS DINÁMICOS PARA CABECERAS ---
    muiTableHeadCellProps: {
      sx: {
        fontSize: visualConfig.fontSizeHeader,
        fontFamily: visualConfig.fontFamily,
        color: visualConfig.color,
        fontWeight: "bold",
      },
    },
    mrtTheme: (theme) => ({
      baseBackgroundColor: theme.palette.background.default,
    }),
    // --- ESTILOS DINÁMICOS PARA FILAS (CEBRA) ---
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        backgroundColor: row.index % 2 === 0 ? visualConfig.rowColor : "#ffff",
        "&:hover": {
          backgroundColor: visualConfig.hoverColor + "!important",
        },
      },
    }),
    // --- ESTILOS DINÁMICOS PARA CELDAS ---
    muiTableBodyCellProps: {
      sx: {
        fontSize: visualConfig.fontSize,
        fontFamily: visualConfig.fontFamily,
      },
    },
    muiTablePaperProps: {
      sx: { borderRadius: "10px", overflow: "hidden" },
    },
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: "flex", gap: "0.3rem" }}>
        {rowActions(row).map(
          (action) =>
            action.label && (
              <Tooltip title={action.label} key={action.key}>
                <IconButton onClick={() => action.onClick(row, useGetObj)} sx={{ color: visualConfig.color }}>
                  {action.icon}
                </IconButton>
              </Tooltip>
            ),
        )}
      </Box>
    ),
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: "flex", gap: "10px", padding: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {topToolbarCustomActions({ table, device: "lg" }).map((toolbarAction) => {
          if (!toolbarAction.label) return null
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
                  <IconButton onClick={() => toolbarAction.onClick()} sx={{ color: visualConfig.color }}>
                    {toolbarAction.icon}
                  </IconButton>
                </Tooltip>
                <CustomModal {...toolbarAction.propsModal}>{toolbarAction.Component}</CustomModal>
              </>
            )
          }
          return (
            <Tooltip title={toolbarAction.label} key={toolbarAction.key}>
              <IconButton onClick={() => toolbarAction.onClick({ columns, data })} sx={{ color: visualConfig.color }}>
                {toolbarAction.icon}
              </IconButton>
            </Tooltip>
          )
        })}
        <Tooltip title="Recargar datos">
          <IconButton onClick={refetch} sx={{ color: visualConfig.color }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    state: { isLoading },
    displayColumnDefOptions: {
      "mrt-row-actions": { size: rowActionsWidthTable },
    },
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
          fontFamily: visualConfig.fontFamily,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary" fontFamily={visualConfig.fontFamily}>
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
                    borderColor: option === perPage ? visualConfig.color : "divider",
                    borderRadius: 1,
                    bgcolor: option === perPage ? visualConfig.rowColor : "transparent",
                    color: option === perPage ? visualConfig.color : "text.secondary",
                    "&:hover": {
                      borderColor: visualConfig.color,
                      bgcolor: option === perPage ? visualConfig.rowColor : "action.hover",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  <Typography variant="caption" fontFamily={visualConfig.fontFamily}>
                    {option}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary" fontFamily={visualConfig.fontFamily}>
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
//                    SmallScreenTable
// --------------------------------------------------

const SmallScreenTable = ({
  theme,
  data,
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
  rowActions,
  useGetObj,
  topToolbarCustomActions,
  visualConfig, // <--- Dinámico
}) => {
  const DataIsVoidMsg = "No hay registros para mostrar"
  const DataIsLoadingMsg = "Cargando..."
  const AccordionFilterTilte = "Filtros"
  const FilterSearchErrorMsg = "Error al cargar los datos"
  const DefaultColumnCotentIsVoidMsg = "-"
  const [filtersOpen, setFiltersOpen] = useState(true)

  return (
    <div>
      <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          {topToolbarCustomActions({ device: "sm" }).map((toolbarAction) => {
            if (!toolbarAction.label) return null
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
                    <IconButton onClick={() => toolbarAction.onClick()} sx={{ color: visualConfig.color }}>
                      {toolbarAction.icon}
                    </IconButton>
                  </Tooltip>
                  <CustomModal {...toolbarAction.propsModal}>{toolbarAction.Component}</CustomModal>
                </>
              )
            }
            return (
              <Tooltip title={toolbarAction.label} key={toolbarAction.key}>
                <IconButton
                  onClick={() => toolbarAction.onClick({ columns: columnsTable, data })}
                  sx={{ color: visualConfig.color }}
                >
                  {toolbarAction.icon}
                </IconButton>
              </Tooltip>
            )
          })}
          <IconButton
            onClick={refetch}
            sx={{ bgcolor: visualConfig.rowColor, color: visualConfig.color, borderRadius: 1, p: 1, ml: 1 }}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Box>

        {isError && (
          <Alert severity="error" sx={{ mb: 2, "& .MuiAlert-icon": { alignItems: "center" }, borderRadius: 1 }}>
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
            "&:before": { display: "none" },
            "& .MuiAccordionSummary-root": { borderRadius: "8px", bgcolor: (theme) => theme.palette.grey[50] },
            "& .MuiAccordionDetails-root": { bgcolor: (theme) => theme.palette.grey[50] },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{ minHeight: "48px", "& .MuiAccordionSummary-content": { margin: "12px 0" } }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" fontWeight="medium" fontFamily={visualConfig.fontFamily}>
                {AccordionFilterTilte}
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
                  label={`${col.header}`}
                  onChange={(e) => onFilterChange(col.id || col.accessorKey, e.target.value)}
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
                  borderColor: visualConfig.color,
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
                  mr: 1.5,
                }}
              />
              <Typography variant="body2" sx={{ color: "text.secondary", fontFamily: visualConfig.fontFamily }}>
                {DataIsLoadingMsg}
              </Typography>
            </Box>
          ) : data.length === 0 && !isError ? (
            <Box sx={{ textAlign: "center", py: 4, bgcolor: "background.default", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary", fontFamily: visualConfig.fontFamily }}>
                {DataIsVoidMsg}
              </Typography>
            </Box>
          ) : (
            data.map((row, rowIndex) => (
              <Card
                key={rowIndex}
                variant="outlined"
                sx={{ borderRadius: 1, border: "1px solid", borderColor: "divider", mb: 0.5, position: "relative" }}
              >
                {rowActions({ original: row }) && rowActions({ original: row }).length > 0 && (
                  <Box
                    sx={{ position: "absolute", top: 0, right: 0, zIndex: 1, display: "flex", flexDirection: "row" }}
                  >
                    {rowActions({ original: row }).map(
                      (action) =>
                        action.key && (
                          <IconButton
                            key={action.key}
                            onClick={() => action.onClick({ original: row }, useGetObj)}
                            size="small"
                            sx={{
                              m: 0.5,
                              bgcolor: "background.paper",
                              "&:active": { bgcolor: "action.selected" },
                              color: visualConfig.color,
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
                        pr: index === 0 && rowActions({ original: row })?.length ? 8 : 0,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          color: visualConfig.color,
                          display: "block",
                          mb: 0.5,
                          textTransform: "uppercase",
                          fontSize: visualConfig.fontSizeHeader,
                          fontFamily: visualConfig.fontFamily,
                        }}
                      >
                        {col.header}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 400,
                          color: "text.secondary",
                          lineHeight: 1.3,
                          fontSize: visualConfig.fontSize,
                          fontFamily: visualConfig.fontFamily,
                        }}
                      >
                        {col?.Cell
                          ? col.Cell({ cell: { getValue: () => row[col.accessorKey] || DefaultColumnCotentIsVoidMsg } })
                          : row[col.accessorKey] || DefaultColumnCotentIsVoidMsg}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </Box>

        {!isLoading && data.length > 0 && !isError && (
          <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.75rem", fontFamily: visualConfig.fontFamily }}
                >
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
                          borderColor: option === perPage ? visualConfig.color : "divider",
                          borderRadius: 1,
                          bgcolor: option === perPage ? visualConfig.rowColor : "transparent",
                          color: option === perPage ? visualConfig.color : "text.secondary",
                          "&:hover": {
                            borderColor: visualConfig.color,
                            bgcolor: option === perPage ? visualConfig.rowColor : "action.hover",
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: "0.7rem", fontFamily: visualConfig.fontFamily }}>
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
                  fontFamily: visualConfig.fontFamily,
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
                  "& .MuiTablePagination-selectLabel": { display: "none" },
                  "& .MuiTablePagination-select": { display: "none" },
                  "& .MuiInputBase-root": { display: "none" },
                  "@media (max-width: 480px)": {
                    "& .MuiTablePagination-toolbar": { justifyContent: "center" },
                    "& .MuiTablePagination-spacer": { display: "none" },
                  },
                }}
                component="div"
                count={totalPages * perPage}
                rowsPerPage={perPage}
                page={currentPage - 1}
                onPageChange={(_, newPage) => {
                  onPageChange(newPage + 1)
                }}
                ActionsComponent={PaginationActions}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count} | Página ${currentPage} de ${Math.ceil((totalPages * perPage) / perPage)}`
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

  return (
    <>
      <div>
        {isMobile ? <SmallScreenTable theme={theme} {...props} /> : <LargeScreenTable theme={theme} {...props} />}
      </div>
    </>
  )
}

// --------------------------------------------------
//            CustomConditionalActionsTableServer
// --------------------------------------------------

const CustomConditionalActionsTableServer = ({
  endpoint = "",
  endpointJson = {},
  errorMsgFilterSearch = "Error en cargar datos",
  queryKeyModal = "",
  perPage: initialPerPage = 10,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  columnsTable = [],
  rowActionsWidthTable = "100",
  rowActions = () => [],
  topToolbarCustomActions = () => [],
}) => {
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(initialPerPage)
  const { data, isLoading, isError, refetch, isFetching } = useGetData(page, filters, perPage)
  const [totalPages, setTotalPages] = useState(1)
  const timeoutRef = useRef(null)

  // =========================================================================
  // EXTRACCIÓN DINÁMICA DE ESTILOS (Usa el caché automático de getInfoHome)
  // =========================================================================
  const { data: homeInfo } = useQuery({
    queryKey: ["initialHomeInfo"],
    queryFn: async () => {
      const response = await fetchwrapper(`/Home/getInfoHome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const result = await response.json()
      return result.data
    },
    staleTime: Infinity,
  })

  const visualConfig = {
    color: homeInfo?.ciacolor || "#196C87",
    rowColor: hexToRgba(homeInfo?.ciacolor || "#A4EEB3", 0.1),
    hoverColor: hexToRgba(homeInfo?.ciacolor || "#196C87", 0.18),
    fontFamily: homeInfo?.ciatipoletra || "Arial",
    fontSize: homeInfo?.ciatamanioletra ? `${homeInfo.ciatamanioletra}px` : "0.875rem",
    fontSizeHeader: homeInfo?.ciatamanioletra ? `${parseInt(homeInfo.ciatamanioletra) + 1}px` : "0.9rem",
  }
  // =========================================================================

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

  useEffect(() => {
    refetch()
  }, [page, filters, perPage, refetch])

  function useGetData(pageNumber, filters, currentPerPage) {
    return useQuery({
      queryKey: [queryKeyModal, pageNumber, filters, currentPerPage],
      queryFn: async () => {
        const response = await fetchwrapper(`${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...endpointJson,
            page: pageNumber,
            perPage: currentPerPage,
            filters,
          }),
        })
        const result = await response.json()
        setTotalPages(result.total_pages)
        return result.data
      },
      keepPreviousData: false,
      retry: 1,
    })
  }

  return (
    <Box>
      <CustomBackdrop isLoading={isLoading || isFetching} />
      <CustomTable
        data={data || []}
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
        rowActionsWidthTable={rowActionsWidthTable}
        rowActions={rowActions}
        useGetObj={{ data, isLoading, isError, refetch, isFetching }}
        topToolbarCustomActions={topToolbarCustomActions}
        visualConfig={visualConfig} // <--- Inyectamos la configuración
      />
    </Box>
  )
}

export default CustomConditionalActionsTableServer
