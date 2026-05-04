/* eslint-disable camelcase */
import { useState, useMemo } from "react"
import { useTheme, createTheme, ThemeProvider } from "@mui/material/styles"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { MRT_Localization_ES } from "material-react-table/locales/es"
import { esES } from "@mui/material/locale"
import { Button } from "@mui/material"

const SingleRowSelectionTable = ({ columnsTable, dataTable, sgasoling, idProducto, setProducto, handleCloseModal }) => {
  const theme = useTheme()
  const [rowSelection, setRowSelection] = useState({})
  const columns = useMemo(() => columnsTable)
  const data = dataTable

  const table = useMaterialReactTable({
    localization: { ...MRT_Localization_ES },
    columns,
    data,
    enableRowSelection: true,
    enableMultiRowSelection: false, // use radio buttons instead of checkboxes
    getRowId: (row) => row.embcodigo, // give each row a more useful id
    muiTableBodyRowProps: ({ row }) => ({
      // add onClick to row to select upon clicking anywhere in the row
      onClick: row.getToggleSelectedHandler(),
      sx: { cursor: "pointer" },
    }),
    positionToolbarAlertBanner: "bottom", // move the alert banner to the bottom
    onRowSelectionChange: setRowSelection, // connect internal row selection state to your own
    state: { rowSelection }, // pass our managed row selection state to the table to use
  })

  const handleSelectSingleRow = () => {
    try {
      let rowSelected = table.getSelectedRowModel().rows[0]
      rowSelected = rowSelected.original
      setProducto(sgasoling, idProducto, rowSelected)
    } catch (error) {
      console.log(error)
    } finally {
      handleCloseModal()
    }
  }
  return (
    <ThemeProvider theme={createTheme(theme, esES)}>
      <MaterialReactTable table={table} />
      <div style={{ clear: "both" }}>
        <Button variant="text" color="primary" style={{ float: "right" }} onClick={handleSelectSingleRow}>
          Establecer
        </Button>
      </div>
    </ThemeProvider>
  )
}

export default SingleRowSelectionTable
