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
  perPage,
  isLoading,
  isError,
  totalPages,
  currentPage,
  onPageChange,
  onFilterChange,
  errorMsgFilterSearch,
  refetch,
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
    enableRowActions: false,
    enableTopToolbar: true,
    enableGlobalFilter: false,
    enableColumnResizing: true,
    enableSelectAll: false,
    enableMultiRowSelection: false,
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
        count={totalPages * perPage} // Total real de registros
        rowsPerPage={perPage}
        page={currentPage - 1} // Conversión de 1-based a 0-based
        onPageChange={(_, newPage) => {
          onPageChange(newPage + 1) // Convertir de vuelta a 1-based
        }}
        ActionsComponent={PaginationActions}
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count} | Página ${currentPage} de ${Math.ceil((totalPages * perPage) / perPage)}`
        }
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
  perPage,
  isLoading,
  isError,
  totalPages,
  currentPage,
  onPageChange,
  onFilterChange,
  errorMsgFilterSearch,
  refetch,
}) => {
  const DataIsVoidMsg = "No hay registros para mostrar"
  const DataIsLoadingMsg = "Cargando..."
  const AccordionFilterTilte = "Filtros"
  const FilterSearchErrorMsg = "Error al cargar los datos"
  const DefaultColumnCotentIsVoidMsg = "-"
  const [filtersOpen, setFiltersOpen] = useState(true)

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
                  onChange={(e) => onFilterChange(col.id || col.accessorKey, e.target.value)}
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
            data.map((row, rowIndex) => (
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
              count={totalPages * perPage} // Total real de registros
              rowsPerPage={perPage}
              page={currentPage - 1} // Conversión de 1-based a 0-based
              onPageChange={(_, newPage) => {
                onPageChange(newPage + 1) // Convertir de vuelta a 1-based
              }}
              ActionsComponent={PaginationActions}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count} | Página ${currentPage} de ${Math.ceil((totalPages * perPage) / perPage)}`
              }
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
//            CustomTableServer
// --------------------------------------------------
// --------------------------------------------------

const CustomReadableTableServer = ({
  endpoint = "", // Este el endpoint que va a hacer las peticiones
  endpointJson = {}, // Este es el json del endpoint que va a mandar en las peticiones
  errorMsgFilterSearch = "Error en cargar datos", // Este errror solo aparecera en el react table cuando falle el busqueda por filter
  queryKeyModal = "", // Este es el key que usa react query en el modal para manejar la cache
  perPage = 10, // Estas son las filas que se muestran por cada pagina
  columnsTable = [], // Estas son las columnas que estaran siempre presente en las tablas
}) => {
  const [filters, setFilters] = useState({}) // Estado para filtros de columnas
  const [page, setPage] = useState(1) // Pagina actual que se esta viendo
  const { data, isLoading, isError, refetch, isFetching } = useGetData(page, filters)
  const [totalPages, setTotalPages] = useState(1)
  const timeoutRef = useRef(null) // Nuevo ref para el timeout

  // Función debounce para los filtros
  const handleFilterChange = useCallback((columnId, value) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setFilters((prevFilters) => {
        // Si el valor está vacío, eliminamos la clave del filtro
        if (!value.trim()) {
          const { [columnId]: _, ...rest } = prevFilters
          return rest
        }

        // Si tiene valor, actualizamos normalmente
        return {
          ...prevFilters,
          [columnId]: value.trim(), // eliminar espacios en blanco
        }
      })
    }, 500)
    setPage(1)
  }, [])

  // Obtener los datos siempre que el num pagina actual, filtros cambien
  useEffect(() => {
    refetch()
  }, [page, filters, refetch])

  function useGetData(pageNumber, filters) {
    return useQuery({
      queryKey: [queryKeyModal, pageNumber, filters],
      queryFn: async () => {
        const response = await fetchwrapper(`${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...endpointJson,
            page: pageNumber,
            perPage,
            filters, // Envía los filtros al backend
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
        isLoading={isLoading}
        isError={isError}
        totalPages={totalPages}
        currentPage={page}
        onPageChange={setPage}
        onFilterChange={handleFilterChange} // Pasa la función de manejo de filtros
        errorMsgFilterSearch={errorMsgFilterSearch}
        refetch={refetch}
      />
    </Box>
  )
}

export default CustomReadableTableServer
