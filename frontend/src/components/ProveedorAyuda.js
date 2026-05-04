import React, { useState, useEffect, useMemo, useContext } from "react"
import { Modal, Box, Button, Typography, TablePagination, TextField } from "@mui/material"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { MRT_Localization_ES } from "material-react-table/locales/es"
import { useQuery } from "@tanstack/react-query"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import CustomTooltip from "./ToolTip"
import SearchIcon from "@mui/icons-material/Search"

import { SolicitudIngresoContext } from "../pages/SolicitudDeIngreso/SolicitudIngresoContext"

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

const ProveedorAyuda = () => {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState({}) // Estado para filtros de columnas
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { data, isLoading, isError, refetch } = useGetProveedores(page, filters)

  useEffect(() => {
    refetch()
  }, [page, filters, refetch])

  useEffect(() => {
    if (open) {
      refetch()
    } else {
      setFilters({})
      setPage(1)
    }
  }, [open, refetch])

  function useGetProveedores(pageNumber, filters) {
    return useQuery({
      queryKey: ["solicitudDeIngresoProveedores", pageNumber, filters],
      queryFn: async () => {
        const response = await fetchwrapper(`/solicitudDeIngreso/getProveedores`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page: pageNumber,
            filters, // Envía los filtros al backend
          }),
        })
        const result = await response.json()
        setTotalPages(result.total_pages)
        return result.proveedores
      },
      keepPreviousData: false,
      onError: () => {
        console.log("Error fetching data")
      },
    })
  }

  // Maneja los cambios en el filtro
  const handleFilterChange = (columnId, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [columnId]: value,
    }))
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
    proveedorSeleccionadoDescri,
    setproveedorSeleccionadoDescri,
    setProductoSeleccionado,
    setProductoSeleccionadoDescri,
    setProveedorSeleccionado,
    setProveedorSeleccionadoDescri,
    setClienteSeleccionado,
    setClienteSeleccionadoDescri,
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
        onClose={() => setOpen(false)}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-description" sx={{ mt: 2 }}>
            <CustomTable
              data={data || []}
              isLoading={isLoading}
              isError={isError}
              totalPages={totalPages}
              currentPage={page}
              onPageChange={setPage}
              onFilterChange={handleFilterChange} // Pasa la función de manejo de filtros
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
              setProveedorSeleccionado("")
              setProveedorSeleccionadoDescri("")
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
  const columns = useMemo(
    () => [
      {
        accessorKey: "procodigo",
        header: "Código de Proveedor",
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
        accessorKey: "pronombre",
        header: "Nombre del Proveedor",
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
        accessorKey: "proruc",
        header: "Número de identificación",
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
        accessorKey: "protelef1",
        header: "Teléfono",
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
        accessorKey: "prodirec",
        header: "Dirección",
        size: 400,
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
        accessorKey: "bcotipcta",
        header: "Tipo de Proveedor",
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
        accessorKey: "propais",
        header: "País",
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
        accessorKey: "prostatus",
        header: "Estado",
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
          if (value === "A") return "Activo"
          if (value === "I") return "Inactivo"
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

  // global value
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
    proveedorSeleccionadoDescri,
    setproveedorSeleccionadoDescri,
    setProductoSeleccionado,
    setProductoSeleccionadoDescri,
    setProveedorSeleccionado,
    setProveedorSeleccionadoDescri,
    setClienteSeleccionado,
    setClienteSeleccionadoDescri,
  } = useContext(SolicitudIngresoContext)

  const table = useMaterialReactTable({
    columns,
    data,
    enableEditing: false,
    enableSorting: false,
    enablePagination: false,
    enableRowActions: false,
    enableTopToolbar: false,
    enableColumnResizing: true,
    enableSelectAll: false,
    enableRowSelection: true,
    enableMultiRowSelection: false,
    enableColumnFilters: true,
    localization: { ...MRT_Localization_ES },
    muiToolbarAlertBannerProps: isError ? { color: "error", children: "Error en cargar los proveedores" } : undefined,
    muiTableContainerProps: {
      sx: {
        minWidth: "100%",
        maxWidth: "100%",
        maxHeight: "600px", // Ajusta la altura máxima de la tabla
        overflowY: "auto",
        overflowX: "auto",
      },
    },
    muiTableBodyCellProps: {
      sx: {
        py: 0.4, // Ajusta la altura de las celdas
        fontSize: "0.875rem", // Ajusta el tamaño de la fuente
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

  // Function to get the original row data from selected rows
  const getSelectedRowData = (selectedRowIds) => {
    const originalValues = selectedRowIds.map((row) => row.original)
    return originalValues
  }

  useEffect(() => {
    if (table.getSelectedRowModel().rows[0] != null) {
      const procodigo = getSelectedRowData(table.getSelectedRowModel().rows)[0].procodigo
      const pronombre = getSelectedRowData(table.getSelectedRowModel().rows)[0].pronombre
      setProveedorSeleccionado(procodigo)
      console.log(proveedorSeleccionado)
      setProveedorSeleccionadoDescri(pronombre)
      console.log(proveedorSeleccionadoDescri)
    }
  }, [table.getSelectedRowModel(), setProveedorSeleccionado, setProveedorSeleccionadoDescri])

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
    </>
  )
}

export default ProveedorAyuda
