import { useMemo } from "react"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { MRT_Localization_ES } from "material-react-table/locales/es"
import { useTheme } from "@mui/material"

const CustomAggregationSegregationComponent = ({
  data = [],
  columnsConfig = {},
  aggregations = {}, // Nuevo prop para las funciones de cálculo
  tableOptions = {},
}) => {
  const theme = useTheme()
  // Calcular valores agregados usando las funciones proporcionadas
  const computedAggregations = useMemo(() => {
    const result = {}
    for (const [key, fn] of Object.entries(aggregations)) {
      result[key] = fn(data)
    }
    return result
  }, [data, aggregations])

  // Generar columnas con configuración
  const columns = useMemo(() => columnsConfig(computedAggregations), [columnsConfig, computedAggregations])

  // Configuración por defecto de la tabla
  const defaultTableOptions = {
    displayColumnDefOptions: {
      "mrt-row-expand": { enableResizing: true },
    },
    enableColumnResizing: true,
    enableGrouping: true,
    enableStickyHeader: true,
    enableStickyFooter: true,
    initialState: {
      density: "compact",
      expanded: true,
      pagination: { pageIndex: 0, pageSize: 20 },
    },
    muiToolbarAlertBannerChipProps: { color: "primary" },
    muiTableContainerProps: { sx: { maxHeight: 700 } },
    localization: { ...MRT_Localization_ES },
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        backgroundColor: row.getIsGrouped()
          ? "inherit" // No aplicar color especial a las filas agrupadas (parent)
          : row.depth > 0
            ? row.index % 2 === 0
              ? "#A4EEB3" // Color para filas hijas pares
              : "#ffff" // Color para filas hijas impares
            : row.index % 2 === 0
              ? "#A4EEB3" // Color para filas regulares pares
              : "#ffff", // Color para filas regulares impares
        "&:hover": {
          backgroundColor: `${theme.palette.action.hover} !important`,
        },
      },
    }),
    ...tableOptions,
  }

  const table = useMaterialReactTable({
    columns,
    data,
    ...defaultTableOptions,
  })

  return <MaterialReactTable table={table} />
}

export default CustomAggregationSegregationComponent
