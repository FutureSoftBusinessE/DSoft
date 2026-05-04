import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { mkConfig, generateCsv, download } from "export-to-csv"

const handleExportDataPdfLGScreen = (columns, rows, titleDocument, nameDocument) => {
  // eslint-disable-next-line new-cap
  const doc = new jsPDF()

  // Agregar título al PDF
  const title = titleDocument
  doc.setFontSize(20)
  doc.text(title, 14, 15)

  // Preparar datos de la tabla
  const tableData = rows.map((row) => Object.values(row.original))
  const tableHeaders = columns.map((c) => c.header)

  // Agregar tabla con autoTable
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 25, // Empezar la tabla más abajo para dejar espacio al título
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
  })

  doc.save(`${nameDocument}.pdf`)
}
const handleExportDataPdfSMScreen = (columns, rows, titleDocument, nameDocument) => {
  // eslint-disable-next-line new-cap
  const doc = new jsPDF()

  // Agregar título al PDF
  const title = titleDocument
  doc.setFontSize(20)
  doc.text(title, 14, 15)

  // Preparar datos de la tabla
  const tableHeaders = columns.map((c) => c.header)

  // Extraer los valores de cada objeto en el orden de las columnas
  const tableData = rows.map((row) => {
    return columns.map((column) => {
      // Usar el accessor de la columna o el campo por defecto
      const field = column.accessorKey
      return row[field] !== null && row[field] !== undefined ? row[field] : ""
    })
  })

  // Agregar tabla con autoTable
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 25, // Empezar la tabla más abajo para dejar espacio al título
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
  })

  doc.save(`${nameDocument}.pdf`)
}
const handleAllExportDataCSV = (data, nameDocument) => {
  const fileName = nameDocument

  const customCsvConfig = mkConfig({
    fieldSeparator: ",",
    decimalSeparator: ".",
    useKeysAsHeaders: true,
    filename: fileName,
    utf8Bom: true,
  })

  const csv = generateCsv(customCsvConfig)(data)
  download(customCsvConfig)(csv)
}

export { handleExportDataPdfLGScreen, handleExportDataPdfSMScreen, handleAllExportDataCSV }
