import { useState, useEffect, useMemo, useRef, useCallback } from "react"
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
} from "@mui/material"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { MRT_Localization_ES } from "material-react-table/locales/es"

import { useQuery } from "@tanstack/react-query"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import { FirstPage, LastPage, KeyboardArrowLeft, KeyboardArrowRight, Refresh } from "@mui/icons-material"
import CustomBackdrop from "./CustomBackdrop"
import ExpandMore from "@mui/icons-material/ExpandMore"

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
//                    LargeScreenTable
// --------------------------------------------------
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
}) => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: perPage, // Usa el valor inicial de perPage
  })
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
    onPaginationChange: setPagination, // Actualiza el estado cuando cambie
    enablePagination: true, // Habilita la paginación de MRT
    enableBottomToolbar: false, // Oculta la paginación por defecto
    initialState: { showColumnFilters: true },
    enableEditing: false,
    enableSorting: true,
    enableRowActions: false,
    enableTopToolbar: true,
    enableGlobalFilter: false,
    enableColumnResizing: true,
    enableColumnFilters: true,
    localization: { ...MRT_Localization_ES },
    muiToolbarAlertBannerProps: isError ? { color: "error", children: errorMsgFilterSearch } : undefined,
    muiTableContainerProps: {
      sx: {
        minWidth: "100%",
        maxWidth: "100%",
        maxHeight: "600px", // Ajusta la altura máxima de la tabla
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
        backgroundColor: row.index % 2 === 0 ? "#A4EEB3" : "#ffff",
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
    },
  })

  return (
    <>
      <MaterialReactTable table={table} />
      <TablePagination
        rowsPerPageOptions={[perPage]}
        sx={{
          "& .MuiTablePagination-toolbar": {
            // Contenedor principal
            minHeight: "64px", // Altura mínima
            display: "flex",
            alignItems: "center", // Centrado vertical
            justifyContent: "center", // Centrado horizontal
            gap: 1, // Espacio entre elementos
          },
          "& .MuiTablePagination-displayedRows": {
            // Texto de paginación
            margin: "auto 0", // Ajuste fino vertical
          },
        }}
        component="div"
        count={table.getFilteredRowModel().rows.length} // Total real de registros
        rowsPerPage={pagination.pageSize}
        page={pagination.pageIndex}
        onPageChange={(event, newPage) => table.setPageIndex(newPage)}
        onRowsPerPageChange={(e) => {
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
        ActionsComponent={PaginationActions}
        labelDisplayedRows={({ from, to, count }) => {
          // Calculamos las variables necesarias
          const currentPage = table.getState().pagination.pageIndex + 1 // Convertimos a 1-based
          const totalPages = Math.ceil(count / perPage)

          return `${from}-${to} de ${count} | Página ${currentPage} de ${totalPages}`
        }}
      />
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
  columnsTable,
  isLoading,
  isError,
  errorMsgFilterSearch,
  refetch,
  filtersOpenMobile,
  perPage,
}) => {
  const DataIsVoidMsg = "No hay registros para mostrar"
  const DataIsLoadingMsg = "Cargando..."
  const AccordionFilterTilte = "Filtros"
  const FilterSearchErrorMsg = "Error al cargar los datos"
  const DefaultColumnCotentIsVoidMsg = "-"

  const [filtersOpen, setFiltersOpen] = useState(filtersOpenMobile)
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(0)

  // Función para filtrar datos
  const filteredData = data.filter((row) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value.trim()) return true
      const rowValue = row[key]
      return String(rowValue).toLowerCase().includes(value.toLowerCase().trim())
    })
  })

  // Datos paginados
  const paginatedData = filteredData.slice(page * perPage, (page + 1) * perPage)

  // Manejar cambio de filtros
  const handleFilterChange = (columnId, value) => {
    setFilters((prev) => ({ ...prev, [columnId]: value }))
    setPage(0) // Resetear a primera página al cambiar filtros
  }

  return (
    <div>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: "background.paper",
        }}
      >
        {/* Barra superior con botón de refresco alineado a la derecha */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
          }}
        >
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
              bgcolor: (theme) => theme.palette.grey[50], // Fondo header
            },
            "& .MuiAccordionDetails-root": {
              bgcolor: (theme) => theme.palette.grey[50], // Fondo contenido
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
                      backgroundColor: (theme) => theme.palette.common.white, // Fondo inputs
                    },
                  }}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

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
          ) : data.length === 0 && !isError ? (
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
                key={rowIndex}
                variant="outlined"
                sx={{
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  mb: 0.5,
                  position: "relative", // Para posicionar absolutamente las acciones
                }}
              >
                <CardContent sx={{ p: 1.5, pb: 1.5 }}>
                  {columnsTable.map((col, index) => (
                    <Box
                      key={col.id || col.accessorKey}
                      sx={{
                        mb: 1.5,
                        pb: index !== columnsTable.length - 1 ? 1 : 0,
                        borderBottom: index !== columnsTable.length - 1 ? "1px dashed" : "none",
                        borderColor: "divider",
                        // Añadir un poco más de padding a la derecha para evitar solapamiento con botones
                        pr: index === 0 ? 8 : 0,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700, // Más grueso que bolder (equivalente a bold)
                          letterSpacing: "0.5px", // Añadido espacio entre letras
                          color: "text.primary",
                          display: "block",
                          mb: 0.5,
                          textTransform: "uppercase", // Texto en mayúsculas
                          fontSize: "0.75rem", // Tamaño ligeramente más pequeño
                        }}
                      >
                        {col.header}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 400, // Mantenemos regular
                          color: "text.secondary",
                          fontSize: "0.875rem", // Tamaño estándar
                          lineHeight: 1.3, // Ajuste de interlineado
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
        {!isLoading && data.length > 0 && !isError && (
          <Box
            sx={{
              mt: 2,
              pt: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <TablePagination
              rowsPerPageOptions={[perPage]}
              sx={{
                "& .MuiTablePagination-toolbar": {
                  // Contenedor principal
                  minHeight: { xs: "48px", sm: "64px" }, // Altura mínima responsiva
                  display: "flex",
                  alignItems: "center", // Centrado vertical
                  justifyContent: "space-between", // Espaciado entre elementos
                  flexWrap: "wrap", // Permite salto de línea en móviles
                  gap: 1, // Espacio entre elementos
                  padding: { xs: "4px", sm: "8px" }, // Padding reducido en móviles
                },
                "& .MuiTablePagination-displayedRows": {
                  // Texto de paginación
                  margin: "auto 0", // Ajuste fino vertical
                  fontSize: { xs: "0.75rem", sm: "0.875rem" }, // Texto más pequeño en móviles
                  whiteSpace: "nowrap", // Evita que el texto se rompa
                },
                "& .MuiInputBase-root": {
                  // Selector de filas por página
                  marginRight: { xs: 0, sm: 2 }, // Menor margen en móviles
                },
                "@media (max-width: 480px)": {
                  "& .MuiTablePagination-toolbar": {
                    justifyContent: "center", // Centra todo en pantallas muy pequeñas
                  },
                  "& .MuiTablePagination-spacer": {
                    display: "none", // Oculta espaciador en pantallas muy pequeñas
                  },
                },
              }}
              component="div"
              count={filteredData.length}
              rowsPerPage={perPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setPage(0)
              }}
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
        {isMobile ? <SmallScreenTable theme={theme} {...props} /> : <LargeScreenTable theme={theme} {...props} />}
      </div>
    </>
  )
}

// --------------------------------------------------
// --------------------------------------------------
//            CustomReadableTable
// --------------------------------------------------
// --------------------------------------------------

const CustomReadableTable = ({
  data = [],
  isLoading = false,
  columnsTable = [], // Estas son las columnas que estaran siempre presente en las tablas
  isError = false,
  errorMsgFilterSearch = "No se pudo encontrar la información",
  refetch = () => {},
  perPage = 10,
  filtersOpenMobile = false,
}) => {
  return (
    <Box>
      <CustomBackdrop isLoading={isLoading} />
      <CustomTable
        data={data || []}
        columnsTable={columnsTable || []}
        isError={isError}
        errorMsgFilterSearch={errorMsgFilterSearch}
        isLoading={isLoading}
        refetch={refetch}
        perPage={perPage}
        filtersOpenMobile={filtersOpenMobile}
      />
    </Box>
  )
}

export default CustomReadableTable
