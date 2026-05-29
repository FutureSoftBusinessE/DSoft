/* eslint-disable new-cap */
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export const handlePrintContraCliPDF = (formData, servicios, periodos, infoHome) => {
  const doc = new jsPDF()

  // LOGICA DE DATOS DE COMPAÑÍA (infoHome)
  const alias = infoHome?.ciaalias || ""
  const logo = infoHome?.cialogo

  // 1. DIBUJAR LOGO
  if (logo) {
    try {
      // Extraemos el string base64 del arreglo o directo
      const logoBase64 = Array.isArray(logo) ? logo[0] : logo
      const imgData = `data:image/jpeg;base64,${logoBase64}`
      doc.addImage(imgData, "JPEG", 14, 10, 40, 20)
    } catch (e) {
      console.warn("Error al dibujar logo:", e)
    }
  }

  // 2. ENCABEZADO
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(alias, 60, 20) // Usamos el alias de la compañía

  doc.setFontSize(11)
  doc.text("CONTRATO DE PRESTACIÓN DE SERVICIOS", 60, 28)
  doc.setLineWidth(0.5)
  doc.line(14, 35, 196, 35)

  // 3. DATOS GENERALES
  let startY = 45
  doc.setFontSize(10)

  doc.setFont("helvetica", "bold")
  doc.text("Nº Contrato:", 14, startY)
  doc.setFont("helvetica", "normal")
  doc.text(formData?.concodcontrato || "", 40, startY)

  doc.setFont("helvetica", "bold")
  doc.text("Cliente:", 14, startY + 8)
  doc.setFont("helvetica", "normal")
  // AQUI: Mostramos Código + Nombre del Cliente
  // const nombreCli = formData?.clinombre || "";
  // doc.text(`${formData?.clicodigo || ""} - ${nombreCli}`, 40, startY + 8);
  const nombreCli = doc.splitTextToSize(`${formData?.clicodigo || ""} - ${formData?.clinombre}` || "", 70)
  doc.text(nombreCli, 40, startY + 8)

  doc.setFont("helvetica", "bold")
  doc.text("Descripción:", 14, startY + 16)
  doc.setFont("helvetica", "normal")
  const splitDescri = doc.splitTextToSize(formData?.condescri || "", 70)
  doc.text(splitDescri, 40, startY + 16)

  // Columna Derecha
  doc.setFont("helvetica", "bold")
  doc.text("Fecha Inicio:", 120, startY)
  doc.text("Fecha Fin:", 120, startY + 8)
  doc.text("Frecuencia:", 120, startY + 16)
  doc.text("Valor Total:", 120, startY + 24)

  doc.setFont("helvetica", "normal")
  doc.text(formData?.confecinicio || "", 150, startY)
  doc.text(formData?.confecfin || "", 150, startY + 8)
  doc.text(formData?.confrecuencia || "", 150, startY + 16)
  doc.text(`$${Number(formData?.convalor || 0).toFixed(2)}`, 150, startY + 24)

  startY += 25 + splitDescri.length * 5

  // 4. TABLA DE SERVICIOS
  doc.setFont("helvetica", "bold")
  doc.text("DETALLE DE SERVICIOS", 14, startY)

  const tableServiciosBody = (servicios || []).map((s) => [
    s.artcodigo,
    s.artdescri,
    s.concantidad,
    `$${Number(s.convalor).toFixed(2)}`,
    `$${Number(s.contotal).toFixed(2)}`,
  ])

  autoTable(doc, {
    startY: startY + 4,
    head: [["Código", "Descripción del Servicio", "Cant.", "P. Unit", "Subtotal"]],
    body: tableServiciosBody,
    theme: "grid",
    headStyles: { fillColor: [25, 108, 135] },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
  })

  // 5. TABLA DE PERÍODOS
  let finalY = doc.lastAutoTable.finalY + 15
  if (finalY > 250) {
    doc.addPage()
    finalY = 20
  }

  doc.setFont("helvetica", "bold")
  doc.text("CRONOGRAMA DE FACTURACIÓN", 14, finalY)

  const tablePeriodosBody = (periodos || []).map((p) => [
    p.consecuen || "-",
    p.conmes,
    p.conanio,
    p.constatus === "A" ? "ACTIVO" : "INACTIVO",
    p.facnumfac || "Pendiente",
  ])

  autoTable(doc, {
    startY: finalY + 4,
    head: [["Sec.", "Mes", "Año", "Estado", "Factura Nº"]],
    body: tablePeriodosBody,
    theme: "striped",
    headStyles: { fillColor: [46, 125, 50] },
    styles: { halign: "center" },
  })

  // 5. FIRMAS
  let firmaY = doc.lastAutoTable.finalY + 30
  if (firmaY > 270) {
    doc.addPage()
    firmaY = 40
  }

  doc.setLineWidth(0.5)
  doc.line(30, firmaY, 80, firmaY)
  doc.line(120, firmaY, 170, firmaY)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Firma de Aceptación Cliente", 35, firmaY + 5)
  doc.text("Firma Empresa", 125, firmaY + 5)

  window.open(doc.output("bloburl"), "_blank")
}
