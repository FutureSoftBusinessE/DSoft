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
// Conversor Hexadecimal a RGBA para transparencias
// --------------------------------------------------
const hexToRgba = (hex, alpha) => {
  let r = 0, g = 0, b = 0;
  if (!hex || !hex.startsWith("#")) return `rgba(25, 108, 135, ${alpha})`; // Fallback color SIAC
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --------------------------------------------------
// PaginationActions
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
// LargeScreenTable
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
  visualConfig, // <--- Recibe la configuración visual dinámica
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
        maxHeight: "600px", 
        overflowY: "auto",
        overflowX: "auto",
      },
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
      sx: {
        borderRadius: "10px",
        overflow: "hidden",
      },
    },

    renderTopToolbarCustomActions: () => (
      <Tooltip title="Recargar datos">
        <IconButton onClick={refetch} sx={{ color: visualConfig.color }}>
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
          fontFamily: visualConfig.fontFamily, // Aplica tipografía a la paginación
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
    </>
  )
}

// --------------------------------------------------
// SmallScreenTable
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
  visualConfig, // <--- Recibe la configuración visual dinámica
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
        {/* Barra superior con botón de refresco */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          <IconButton
            onClick={refetch}
            sx={{
              bgcolor: visualConfig.rowColor, // Color de fondo dinámico
              color: visualConfig.color,      // Ícono de color dinámico
              borderRadius: 1,
              p: 1,
            }}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Box>
        
        {isError && (
          <Alert severity="error" sx={{ mb: 2, "& .MuiAlert-icon": { alignItems: "center" }, borderRadius: 1 }}>
            {errorMsgFilterSearch || FilterSearchErrorMsg}
          </Alert>
        )}

        {/* Accordion para filtros */}
        <Accordion
          expanded={filtersOpen}
          onChange={() => setFiltersOpen(!filtersOpen)}
          sx={{
            mb: 2, border: "1px solid", borderColor: "divider", borderRadius: "8px !important", boxShadow: "none",
            bgcolor: "background.paper", "&:before": { display: "none" },
            "& .MuiAccordionSummary-root": { borderRadius: "8px", bgcolor: (theme) => theme.palette.grey[50] },
            "& .MuiAccordionDetails-root": { bgcolor: (theme) => theme.palette.grey[50] },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: "48px", "& .MuiAccordionSummary-content": { margin: "12px 0" } }}>
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, backgroundColor: (theme) => theme.palette.common.white } }}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Contenido principal */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 3 }}>
              {/* Spinner de Carga Dinámico */}
              <Box
                component="span"
                sx={{
                  display: "inline-block", width: 16, height: 16, borderRadius: "50%",
                  borderTop: "2px solid", borderColor: visualConfig.color, // Color dinámico
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
                <CardContent sx={{ p: 1.5, pb: 1.5 }}>
                  {columnsTable.map((col, index) => (
                    <Box
                      key={col.id || col.accessorKey}
                      sx={{
                        mb: 1.5, pb: index !== columnsTable.length - 1 ? 1 : 0,
                        borderBottom: index !== columnsTable.length - 1 ? "1px dashed" : "none",
                        borderColor: "divider",
                      }}
                    >
                      {/* Cabecera Móvil */}
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700, letterSpacing: "0.5px", color: visualConfig.color, // Color dinámico
                          display: "block", mb: 0.5, textTransform: "uppercase",
                          fontSize: visualConfig.fontSizeHeader,
                          fontFamily: visualConfig.fontFamily,
                        }}
                      >
                        {col.header}
                      </Typography>
                      {/* Contenido Móvil */}
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 400, color: "text.secondary", lineHeight: 1.3,
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
            <TablePagination
              rowsPerPageOptions={[perPage]}
              sx={{
                fontFamily: visualConfig.fontFamily,
                "& .MuiTablePagination-toolbar": {
                  minHeight: { xs: "48px", sm: "64px" }, display: "flex", alignItems: "center",
                  justifyContent: "space-between", flexWrap: "wrap", gap: 1, padding: { xs: "4px", sm: "8px" },
                },
                "& .MuiTablePagination-displayedRows": {
                  margin: "auto 0", fontSize: { xs: "0.75rem", sm: "0.875rem" }, whiteSpace: "nowrap",
                },
                "& .MuiInputBase-root": { marginRight: { xs: 0, sm: 2 } },
                "@media (max-width: 480px)": {
                  "& .MuiTablePagination-toolbar": { justifyContent: "center" },
                  "& .MuiTablePagination-spacer": { display: "none" },
                },
              }}
              component="div"
              count={totalPages * perPage}
              rowsPerPage={perPage}
              page={currentPage - 1}
              onPageChange={(_, newPage) => { onPageChange(newPage + 1) }}
              ActionsComponent={PaginationActions}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count} | Página ${currentPage} de ${Math.ceil((totalPages * perPage) / perPage)}`}
            />
          </Box>
        )}
      </Box>
    </div>
  )
}

// --------------------------------------------------
// CustomTable
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
// CustomReadableTableServer
// --------------------------------------------------
const CustomReadableTableServer = ({
  endpoint = "", 
  endpointJson = {}, 
  errorMsgFilterSearch = "Error en cargar datos", 
  queryKeyModal = "", 
  perPage = 10, 
  columnsTable = [], 
}) => {
  const [filters, setFilters] = useState({}) 
  const [page, setPage] = useState(1) 
  const { data, isLoading, isError, refetch, isFetching } = useGetData(page, filters)
  const [totalPages, setTotalPages] = useState(1)
  const timeoutRef = useRef(null) 

  // =========================================================================
  // EXTRACCIÓN DINÁMICA DE ESTILOS (Usa el caché automático de getInfoHome)
  // =========================================================================
  const { data: homeInfo } = useQuery({
    queryKey: ["initialHomeInfo"], // Reutiliza el caché mágico de Main.js
    queryFn: async () => {
      const response = await fetchwrapper(`/Home/getInfoHome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const result = await response.json()
      return result.data
    },
    staleTime: Infinity, // No agobia al servidor si ya está en caché
  })

  // Estructuramos la configuración visual lista para ser consumida
  const visualConfig = {
    color: homeInfo?.ciacolor || "#196C87", // Color primario
    rowColor: hexToRgba(homeInfo?.ciacolor || "#A4EEB3", 0.10), // Fila Par: 10% de opacidad del color primario
    hoverColor: hexToRgba(homeInfo?.ciacolor || "#196C87", 0.18), // Fila Hover: 18% de opacidad
    fontFamily: homeInfo?.ciatipoletra || "Arial",
    fontSize: homeInfo?.ciatamanioletra ? `${homeInfo.ciatamanioletra}px` : "0.875rem",
    // Cabecera ligeramente más grande que el texto base
    fontSizeHeader: homeInfo?.ciatamanioletra ? `${parseInt(homeInfo.ciatamanioletra) + 1}px` : "0.9rem",
  }
  // =========================================================================

  const handleFilterChange = useCallback((columnId, value) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

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

  useEffect(() => {
    refetch()
  }, [page, filters, refetch])

  function useGetData(pageNumber, filters) {
    return useQuery({
      queryKey: [queryKeyModal, pageNumber, filters],
      queryFn: async () => {
        const response = await fetchwrapper(`${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...endpointJson,
            page: pageNumber,
            perPage,
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
        isLoading={isLoading}
        isError={isError}
        totalPages={totalPages}
        currentPage={page}
        onPageChange={setPage}
        onFilterChange={handleFilterChange} 
        errorMsgFilterSearch={errorMsgFilterSearch}
        refetch={refetch}
        visualConfig={visualConfig} // <--- Enviamos la configuración inyectada
      />
    </Box>
  )
}

export default CustomReadableTableServer