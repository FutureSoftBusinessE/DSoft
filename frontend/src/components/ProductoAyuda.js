import React, { useContext, useState, useEffect, useMemo, useRef } from "react"
import { Modal, Box, Button, Typography, TablePagination, TextField } from "@mui/material"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { MRT_Localization_ES } from "material-react-table/locales/es"
import { useQuery } from "@tanstack/react-query"

import fetchwrapper from "../services/interceptors/fetchwrapper"
import CustomTooltip from "./ToolTip"
import ImageIcon from "@mui/icons-material/Image"
import IconButton from "@mui/material/IconButton"
import ImageModal from "./ImageModal"
import SearchIcon from "@mui/icons-material/Search"

import { SolicitudIngresoContext } from "../pages/SolicitudDeIngreso/SolicitudIngresoContext"
import CircularProgress from "@mui/material/CircularProgress"

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "60%",
  height: 800,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
}

const styleModalProducto = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "30%",
  height: 300,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
}

// Hook para obtener productos
const useGetProductos = (pageNumber, filters) => {
  return useQuery({
    queryKey: ["solicitudDeIngresoProductos", pageNumber, filters],
    queryFn: async () => {
      const response = await fetchwrapper(`/solicitudDeIngreso/getProductos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page: pageNumber,
          filters,
        }),
      })
      const result = await response.json()
      return result
    },
    keepPreviousData: false,
    onError: () => {
      console.log("Error fetching data")
    },
  })
}

const ProductoAyuda = () => {
  const [open, setOpen] = React.useState(false)
  const [filters, setFilters] = React.useState({})
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const { data, isLoading, isError, refetch } = useGetProductos(page, filters)

  React.useEffect(() => {
    if (data) {
      setTotalPages(data.total_pages)
    }
  }, [data])

  React.useEffect(() => {
    refetch()
  }, [page, filters])

  React.useEffect(() => {
    if (open) {
      refetch()
    } else {
      setFilters({})
      setPage(1)
    }
  }, [open, refetch])

  const handleFilterChange = (columnId, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [columnId]: value,
    }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const {
    clienteSeleccionado,
    setclienteSeleccionado,
    clienteSeleccionadoDescri,
    setclienteSeleccionadoDescri,
    productoSeleccionado,
    setproductoSeleccionado,
    productoSeleccionadoDescri,
    setproductoSeleccionadoDescri,
    proveedorSeleccionado,
    setproveedorSeleccionado,
    articuloUsaDecimales,
    setarticuloUsaDecimales,
    proveedorSeleccionadoDescri,
    setproveedorSeleccionadoDescri,
    setProductoSeleccionado,
    setProductoSeleccionadoDescri,
    setProveedorSeleccionado,
    setProveedorSeleccionadoDescri,
    setClienteSeleccionado,
    setClienteSeleccionadoDescri,
    setArticuloUsaDecimales,
  } = useContext(SolicitudIngresoContext)

  return (
    <div style={{ backgroundColor: "#196C87", borderRadius: "4px", alignContent: "center" }}>
      <Button
        variant="text"
        size="sx"
        startIcon={<SearchIcon style={{ color: "#FFFFFF" }} />}
        onClick={() => {
          setOpen(true)
          refetch()
        }}
      ></Button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          refetch()
        }}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-description" sx={{ mt: 2 }}>
            <CustomTable
              data={data?.productos || []}
              isLoading={isLoading}
              isError={isError}
              totalPages={totalPages}
              currentPage={page}
              onPageChange={setPage}
              onFilterChange={handleFilterChange}
            />
          </Typography>
          <Button
            onClick={() => {
              setOpen(false)
              refetch()
            }}
          >
            Aceptar
          </Button>
          <Button
            onClick={() => {
              setOpen(false)
              setProductoSeleccionado("")
              setProductoSeleccionadoDescri("")
              setArticuloUsaDecimales(0)
              refetch()
            }}
          >
            Cancelar
          </Button>
        </Box>
      </Modal>
    </div>
  )
}

const CustomTable = ({ data, isLoading, isError, totalPages, currentPage, onPageChange, onFilterChange }) => {
  const [artcodigo, setArtcodigo] = useState("")
  const [imageProducto, setImageProducto] = useState("")
  const [openImage, setopenImage] = useState()
  const useGetProductoImages = () => {
    return useQuery({
      queryKey: ["solicitudDeIngresoImagenes"],
      queryFn: async () => {
        if (!artcodigo || artcodigo.trim() === "") {
          throw new Error("El código del artículo está vacío o es inválido.")
        }

        const response = await fetchwrapper(`/solicitudDeIngreso/getImagesxArtcodigo/${artcodigo}`)
        const result = await response.json()
        return result?.data
      },
      refetchOnWindowFocus: false,
      enabled: !!artcodigo,
    })
  }
  const { data: imagesData, isLoading: imagesLoading, isError: imagesError, refetch } = useGetProductoImages(artcodigo)

  const handleArtcodigoClick = (artiCodigo) => {
    setArtcodigo(artiCodigo)
  }

  useEffect(() => {
    if (artcodigo && imagesData && imagesData.length > 0) {
      setImageProducto(imagesData[0].artimagen)
    }
  }, [artcodigo])

  useEffect(() => {
    if (!openImage) {
      setImageProducto("")
    }
  }, [openImage])

  const columns = useMemo(
    () => [
      {
        accessorKey: "artcodigo",
        header: "Código",
        size: 100,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return (
            <CustomTooltip title={value}>
              <span>{value}</span>
            </CustomTooltip>
          )
        },
      },
      {
        accessorKey: "artdescri",
        header: "Descripción",
        size: 250,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return (
            <CustomTooltip title={value}>
              <span>{value}</span>
            </CustomTooltip>
          )
        },
      },
      {
        accessorKey: "stock",
        header: "Stock Local 1",
        size: 150,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return (
            <CustomTooltip title={value}>
              <span>{value}</span>
            </CustomTooltip>
          )
        },
      },
      {
        accessorKey: "artprecventa1",
        header: "Lista de Precios 1",
        size: 100,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return (
            <CustomTooltip title={value}>
              <span>{value}</span>
            </CustomTooltip>
          )
        },
      },
      {
        accessorKey: "mardescri",
        header: "Marca",
        size: 120,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return (
            <CustomTooltip title={value}>
              <p>{value}</p>
            </CustomTooltip>
          )
        },
      },
      {
        accessorKey: "codigo2",
        header: "Código 2",
        size: 120,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue()
          let valueFormat
          if (value === "A") valueFormat = "AMBOS"
          if (value === "I") valueFormat = "INVENTARIO"
          if (value === "S") valueFormat = "SERVICIO"
          return (
            <CustomTooltip title={valueFormat}>
              <span>{valueFormat}</span>
            </CustomTooltip>
          )
        },
      },
      {
        accessorKey: "artnumparte",
        header: "Número de Parte",
        size: 120,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return (
            <CustomTooltip title={value}>
              <span>{value}</span>
            </CustomTooltip>
          )
        },
      },
      {
        accessorKey: "lindescri",
        header: "Línea",
        size: 120,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return (
            <CustomTooltip title={value}>
              <span>{value}</span>
            </CustomTooltip>
          )
        },
      },
      {
        accessorKey: "predescri",
        header: "Presentación",
        size: 100,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return (
            <CustomTooltip title={value}>
              <span>{value}</span>
            </CustomTooltip>
          )
        },
      },
      {
        accessorKey: "artspeci",
        header: "Especificación",
        size: 150,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return (
            <CustomTooltip title={value}>
              <span>{value}</span>
            </CustomTooltip>
          )
        },
      },
      {
        accessorKey: "imagen",
        header: "Imagen",
        size: 100,
        Cell: ({ row, cell }) => {
          const artiCodigo = row.original.artcodigo
          return (
            <IconButton
              onClick={() => {
                handleArtcodigoClick(artiCodigo)
                setopenImage(true)
              }}
            >
              <ImageIcon />
            </IconButton>
          )
        },
      },
      {
        accessorKey: "artdecimal",
        header: "Usa decimal",
        size: 150,
        Filter: ({ column }) => (
          <TextField
            variant="standard"
            placeholder="Filtrar"
            onChange={(e) => onFilterChange(column.id, e.target.value)}
          />
        ),
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return (
            <CustomTooltip title={value}>
              <span>{value}</span>
            </CustomTooltip>
          )
        },
      },
    ],
    [onFilterChange],
  )

  const table = useMaterialReactTable({
    columns,
    data,
    initialState: { columnVisibility: { artdecimal: false } },
    enableEditing: false,
    enableSorting: false,
    enablePagination: false,
    enableTopToolbar: false,
    enableColumnResizing: true,
    enableColumnFilters: true,
    enableSelectAll: false,
    enableRowSelection: true,
    enableMultiRowSelection: false,
    getRowId: (row) => row.artcodigo,
    localization: { ...MRT_Localization_ES },
    muiTableContainerProps: {
      sx: {
        minWidth: "100%",
        maxWidth: "100%",
        maxHeight: "600px",
        overflowY: "auto",
        overflowX: "auto",
      },
    },
    muiTableBodyCellProps: {
      sx: {
        py: 0.4,
        fontSize: "0.875rem",
      },
    },
    muiTableHeadCellProps: {
      sx: {
        fontSize: "0.875rem",
        fontWeight: "bold",
      },
    },
    state: {
      isLoading,
    },
  })

  const {
    clienteSeleccionado,
    setclienteSeleccionado,
    clienteSeleccionadoDescri,
    setclienteSeleccionadoDescri,
    productoSeleccionado,
    setproductoSeleccionado,
    productoSeleccionadoDescri,
    setproductoSeleccionadoDescri,
    proveedorSeleccionado,
    setproveedorSeleccionado,
    articuloUsaDecimales,
    setarticuloUsaDecimales,
    proveedorSeleccionadoDescri,
    setproveedorSeleccionadoDescri,
    setProductoSeleccionado,
    setProductoSeleccionadoDescri,
    setProveedorSeleccionado,
    setProveedorSeleccionadoDescri,
    setClienteSeleccionado,
    setClienteSeleccionadoDescri,
    setArticuloUsaDecimales,
  } = useContext(SolicitudIngresoContext)

  // Function to get the original row data from selected rows
  const getSelectedRowData = (selectedRowIds) => {
    const originalValues = selectedRowIds.map((row) => row.original)
    return originalValues
  }

  useEffect(() => {
    if (table.getSelectedRowModel().rows[0] != null) {
      const artcodigo = getSelectedRowData(table.getSelectedRowModel().rows)[0].artcodigo
      const artdescri = getSelectedRowData(table.getSelectedRowModel().rows)[0].artdescri
      const artdecimal = getSelectedRowData(table.getSelectedRowModel().rows)[0].artdecimal
      setProductoSeleccionado(artcodigo)
      setProductoSeleccionadoDescri(artdescri)
      setArticuloUsaDecimales(artdecimal)
    }
  }, [table.getSelectedRowModel(), setProductoSeleccionado, setProductoSeleccionadoDescri])

  return (
    <>
      <MaterialReactTable table={table} />
      <TablePagination
        rowsPerPageOptions={[10]}
        component="div"
        count={totalPages * 10}
        rowsPerPage={10}
        page={currentPage - 1}
        onPageChange={(event, newPage) => onPageChange(newPage + 1)}
      />
      <Modal
        open={openImage}
        onClose={() => setopenImage(false)}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={styleModalProducto}>
          <Typography id="modal-title" variant="h6" component="h2">
            Imagen del Producto
          </Typography>
          <Box sx={{ mt: 2 }}>
            {imagesLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando imagen...</Typography>
              </Box>
            ) : imageProducto ? (
              <img
                src={`data:image/jpeg;base64,${imageProducto}`}
                alt="Product"
                style={{ width: "100%", height: "auto" }}
              />
            ) : (
              <Typography>No hay imagen disponible</Typography>
            )}
          </Box>
          <Button
            onClick={() => {
              setopenImage(false)
              refetch()
            }}
          >
            Cerrar
          </Button>
        </Box>
      </Modal>
    </>
  )
}

export default ProductoAyuda
