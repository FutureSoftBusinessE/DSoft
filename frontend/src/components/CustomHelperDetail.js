import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  IconButton,
  InputAdornment,
  Modal,
  InputLabel,
  TextField,
  Box,
  TablePagination,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Radio,
  Tooltip,
} from "@mui/material"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { MRT_Localization_ES } from "material-react-table/locales/es"

import SearchIcon from "@mui/icons-material/Search"
import CloseIcon from "@mui/icons-material/Close"

import { useQuery } from "@tanstack/react-query"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import { FirstPage, LastPage, KeyboardArrowLeft, KeyboardArrowRight, Refresh } from "@mui/icons-material"
import ExpandMore from "@mui/icons-material/ExpandMore"

const style = {
  Modal: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "98%",
    minHeight: "98%",
    maxHeight: "98%",
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    overflowY: "auto",
  },

  CloseIcon: {
    cursor: "pointer",
    marginLeft: "95%",
  },
}

// const helperType = {
//   INPUT_SEARCH_SINGLE: "single",
//   INPUT_SEARCH_DETAIL: "detail",
// }

// Este objeto sireve para determinar que tipo de busqueda hace
// cuando el usuario solo digita el id o key en el textfield
// hace una busqueda por "id" y si esa busqueda falla entonces abre
// una tabla (la ayuda) en donde podra filtrar por cualquier campo y
// esa busqueda es de tipo "filter"
const SEARCH_TYPE_HELPER = {
  ID_SEARCH: "id",
  FILTER_TABLE_SEARCH: "filter",
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
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
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
  onItemSelected,
  handleCloseModal,
  refetch,
  errorMsgFilterSearch,
}) => {
  const DataIsVoidMsg = "No hay registros para mostrar"
  const DataIsLoadingMsg = "Cargando..."
  const AccordionFilterTilte = "Filtros"
  const FilterSearchErrorMsg = "Error al cargar los datos"
  const DefaultColumnCotentIsVoidMsg = "-"
  const [filtersOpen, setFiltersOpen] = useState(true)
  // Estado para almacenar la fila seleccionada (selección single)
  const [selectedRow, setSelectedRow] = useState(null)
  // Efecto para notificar el registro seleccionado si se pasa la función onItemSelected
  useEffect(() => {
    if (selectedRow != null && onItemSelected) {
      onItemSelected(selectedRow)
      handleCloseModal()
    }
  }, [selectedRow])
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
                    ...(col?.enableColumnFilter === false && { display: "none" }),
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
                {/* Contenedor para radiobutton y acciones: se ubica en la esquina superior derecha */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Radio
                    checked={selectedRow === row}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedRow(row)
                    }}
                  />
                </Box>
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
  onItemSelected,
  handleCloseModal,
  refetch,
  errorMsgFilterSearch,
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
    enableRowSelection: true,
    enableRowActions: false,
    enableTopToolbar: true,
    enableGlobalFilter: false,
    enableColumnResizing: true,
    enableSelectAll: false,
    enableMultiRowSelection: false,
    enableColumnFilters: true,
    localization: { ...MRT_Localization_ES },
    // Establece el ancho de la columna de selección
    displayColumnDefOptions: {
      "mrt-row-select": {
        // Columna de checkbox
        size: 88, // Ancho en píxeles (ajusta según necesites)
        // enableResizing: false, // Opcional: desactiva el redimensionamiento
      },
    },
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

  useEffect(() => {
    if (table.getSelectedRowModel().rows[0] != null) {
      onItemSelected(table.getSelectedRowModel().rows[0].original)
      handleCloseModal()
    }
  }, [table.getSelectedRowModel()])

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
//                  CustomModal
// --------------------------------------------------
// --------------------------------------------------

const CustomModal = ({
  endpoint,
  openModal,
  handleCloseModal,
  queryKeyModal,
  perPage,
  onItemSelected,
  columnsTable,
  errorMsgFilterSearch,
}) => {
  const [filters, setFilters] = useState({}) // Estado para filtros de columnas
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useGetClientes(page, filters)
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

  // refresca tabla solo cuando se abre por primera vez el modal y cuando se cierre setear todo por defecto
  useEffect(() => {
    if (openModal) {
      refetch()
    } else {
      setFilters({})
      setPage(1)
    }
  }, [openModal, refetch])

  function useGetClientes(pageNumber, filters) {
    return useQuery({
      queryKey: [queryKeyModal, pageNumber, filters],
      queryFn: async () => {
        const response = await fetchwrapper(`${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            typeSearch: SEARCH_TYPE_HELPER.FILTER_TABLE_SEARCH,
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
    })
  }
  return (
    <div>
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style.Modal}>
          <IconButton style={style.CloseIcon} onClick={() => handleCloseModal()}>
            <CloseIcon />
          </IconButton>
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
            handleCloseModal={handleCloseModal}
            refetch={refetch}
            onItemSelected={onItemSelected}
          />
        </Box>
      </Modal>
    </div>
  )
}

// --------------------------------------------------
// --------------------------------------------------
//              CustomHelperDetail
// --------------------------------------------------
// --------------------------------------------------

const CustomHelperDetail = ({
  label = "", // Este va a ser el titutlo de arriba del textfield
  valueSearched = "", // Este va a ser el valor ya buscado cuando se selecciono algo en la busqueda
  endpoint = "", // Este el endpoint que va a hacer las peticiones
  valueInputMain = "", // Esta es la propiedad del objeto que va a ser visible el input text field cuando se seleccione o se encuentre el dato
  valueInputSecondary = "", // Esta es la propiedad del objeto que va a ser visible el input text field segundario cuando se seleccione o se encuentre el dato
  idSearchField = "", // Esta es la propieadad por la que se va a hacer la peticion en la busqueda por id
  errorMsgIdSearch = "Error fetching data:", // Este errror solo aparecera por consola cuando falle el busqueda por id
  errorMsgFilterSearch = "Error en cargar datos", // Este errror solo aparecera en el react table cuando falle el busqueda por filter
  queryKeyModal = "", // Este es el key que usa react query en el modal para manejar la cache
  perPage = 10, // Estas son las filas que se muestran por cada pagina
  placeholderInputMain = "", // Este es el placeholder  que se muestra en el textfield principal
  placeholderInputSecondary = "", // Este es el placeholder  que se muestra en el textfield secundario
  columnsTable = [], // Estas son las columnas que estaran siempre presente en las tablas
  onHandleSelectedData, // Esta es una funcion que se usara cuando ya se haya encontrado o seleccionada alguna fila ya sea por la busqueda de id o filter
  sxInputMain = {},
  sxInputSecondary = {},
}) => {
  // Modal
  const [openModal, setOpenModal] = useState(false)
  const handleOpenModal = () => setOpenModal(true)
  const handleCloseModal = () => setOpenModal(false)

  const [value, setValue] = useState(valueSearched || "")
  // Selected item in table or id search
  const [itemSelected, setItemSelected] = useState(null)
  const [isLoadingIdSearch, setIsLoadingIdSearch] = useState(false)

  useEffect(() => {
    if (valueSearched) {
      setValue(valueSearched)
      // Buscar el item completo usando el endpoint
      const fetchItem = async () => {
        try {
          const response = await fetchwrapper(`${endpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              typeSearch: SEARCH_TYPE_HELPER.ID_SEARCH,
              [idSearchField]: valueSearched,
            }),
          })
          const result = await response.json()
          if (result.data && Object.keys(result.data).length > 0) {
            setItemSelected(result.data)
          }
        } catch (error) {
          console.error("Error al cargar item inicial:", error)
        }
      }
      fetchItem()
    }
  }, [valueSearched])

  // This function is used when set the row of the table in modal or when idSearch return a value
  const onItemSelected = (obj) => {
    setItemSelected(obj)
    const newValue = obj[valueInputMain]
    setValue(newValue)
  }

  useEffect(() => {
    if (itemSelected && Object.keys(itemSelected).length > 0) {
      onHandleSelectedData(itemSelected)
    }
  }, [itemSelected])

  // function for searching by ID
  const handleIdSearch = async () => {
    setIsLoadingIdSearch(true) // Show loading spinner
    try {
      const response = await fetchwrapper(`${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          typeSearch: SEARCH_TYPE_HELPER.ID_SEARCH,
          [idSearchField]: value,
        }),
      })

      const result = await response.json()

      if (result.data && Object.keys(result.data).length > 0) {
        // If search by ID returns results, handle it accordingly
        onItemSelected(result.data)
      } else {
        // If no result, open modal
        handleOpenModal()
      }
    } catch (error) {
      console.error(`${errorMsgIdSearch} `, error)
      handleOpenModal() // Open modal on error as well
    } finally {
      setIsLoadingIdSearch(false) // Hide loading spinner
    }
  }

  return (
    <>
      <CustomModal
        endpoint={endpoint}
        openModal={openModal}
        handleCloseModal={handleCloseModal}
        queryKeyModal={queryKeyModal}
        perPage={perPage}
        onItemSelected={onItemSelected}
        columnsTable={columnsTable}
        errorMsgFilterSearch={errorMsgFilterSearch}
      />
      <Box display="flex" flexDirection="column">
        <InputLabel>{label}</InputLabel>
        <Box display="flex">
          <TextField
            sx={{ ...sxInputMain }}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleIdSearch()
              }
            }}
            onBlur={(event) => {
              if (event.target.value !== valueSearched) {
                setValue("")
                setItemSelected({})
                onHandleSelectedData({})
              }
            }}
            placeholder={placeholderInputMain}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {isLoadingIdSearch ? (
                    <CircularProgress size={24} />
                  ) : (
                    <IconButton onClick={() => handleOpenModal()}>
                      <SearchIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
          <TextField
            sx={{ ...sxInputSecondary }}
            // id={`outlined-${sgasoling}-${idProducto}`}
            // variant="standard"
            value={itemSelected?.[valueInputSecondary] ?? ""}
            // fullWidth
            disabled
            placeholder={placeholderInputSecondary}
          />
        </Box>
      </Box>
    </>
  )
}

export default CustomHelperDetail
