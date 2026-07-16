# fmt: off
# flake8: noqa

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, Image
)
from reportlab.graphics.barcode import code128
from pathlib import Path
import io

def generate_ride_pdf_retencion(retencion_data: dict, auth_data: dict, clave_acceso: str, output_dir: Path = None) -> tuple:
    """
    Genera el PDF RIDE para Retenciones con diseño SRI exacto.
    """
    try:
        output_dir.mkdir(parents=True, exist_ok=True)

        ruta_pdf = output_dir / f"{clave_acceso}.pdf"

        # Extraer diccionarios
        info_tributaria = retencion_data.get("info_tributaria", {})
        info_factura = retencion_data.get("info_factura", {})
        detalles = retencion_data.get("detalles", [])
        info_adicional = retencion_data.get("info_adicional", [])

        doc = SimpleDocTemplate(
            str(ruta_pdf), pagesize=A4, rightMargin=15*mm, leftMargin=15*mm,
            topMargin=15*mm, bottomMargin=15*mm, title=f"RET_{clave_acceso}"
        )

        elements = []

        # Estilos compactos
        style_title = ParagraphStyle('Title', fontSize=10, bold=True, leading=12)
        style_normal = ParagraphStyle('Normal', fontSize=7.5, leading=9)
        style_small = ParagraphStyle('Small', fontSize=6.5, leading=8)
        style_table_header = ParagraphStyle('TableHeader', fontSize=7, bold=True, alignment=1)
        style_table_cell = ParagraphStyle('TableCell', fontSize=7, alignment=1)
        style_table_cell_right = ParagraphStyle('TableCellRight', fontSize=7, alignment=2)

        bg_grey = colors.HexColor("#EAEAEA")
        border_color = colors.HexColor("#A0A0A0")

        # ========== 1. ENCABEZADO (CAJAS PROTEGIDAS) ==========
        razon_social = info_tributaria.get("razon_social", "")
        ruc = info_tributaria.get("ruc", "")
        estab = info_tributaria.get("estab", "000")
        pto_emi = info_tributaria.get("pto_emi", "000")
        secuencial = info_tributaria.get("secuencial", "000000000")
        dir_matriz = info_tributaria.get("dir_matriz", "")
        dir_sucursal = info_factura.get("dir_establecimiento", "")
        obligado_contabilidad = info_factura.get("obligado_contabilidad", "NO")

        telefono_cia = info_tributaria.get("telefono", "")
        correo_cia = info_tributaria.get("correo", "")
        resolucion = info_tributaria.get("resolucion_agente", "")

        # --- A. Preparar Elementos de la Izquierda ---
        logo_bytes_data = info_tributaria.get("logo_bytes")
        if logo_bytes_data:
            try:
                logo_stream = io.BytesIO(logo_bytes_data)
                logo_element = Image(logo_stream, width=70*mm, height=30*mm, kind='proportional')
                logo_element.hAlign = 'CENTER'
            except Exception:
                logo_element = Paragraph(f"<b>{razon_social}</b>", ParagraphStyle('C', alignment=1, fontSize=12, bold=True))
        else:
            logo_element = Paragraph(f"<b>{razon_social}</b>", ParagraphStyle('C', alignment=1, fontSize=12, bold=True))

        emisor_data = [
            [Paragraph(f"<b>{razon_social}</b>", style_normal)],
            [Paragraph(f"<b>Matriz:</b> {dir_matriz}", style_small)],
            [Paragraph(f"<b>Sucursal:</b> {dir_sucursal}", style_small)]
        ]

        if telefono_cia:
            emisor_data.append([Paragraph(f"<b>Teléfono:</b> {telefono_cia}", style_small)])
        if correo_cia:
            emisor_data.append([Paragraph(f"<b>Correos:</b> {correo_cia}", style_small)])

        emisor_data.append([Paragraph(f"<b>Obligado a Llevar Contabilidad:</b> {obligado_contabilidad}", style_small)])

        if resolucion:
            emisor_data.append([Paragraph(f"<b>Agente de Retención Resolución Nro.</b> {resolucion}", style_small)])

        t_emisor_inner = Table(emisor_data, colWidths=[80*mm])
        t_emisor_inner.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ]))

        # --- B. Preparar Elementos de la Derecha ---
        num_autorizacion = auth_data.get("numero_autorizacion", "")
        ambiente = auth_data.get("ambiente", "PRODUCCIÓN")

        tipo_emision = "Normal" if auth_data.get("tipo_emision", "1") == "1" else "Contingencia"

        barcode = code128.Code128(clave_acceso, barHeight=11*mm, barWidth=0.19*mm, humanReadable=True)

        right_data = [
            [Paragraph(f"<b>R.U.C.:</b> {ruc}", style_title)],
            [Paragraph("<b>COMPROBANTE DE RETENCIÓN</b>", style_title)],
            [Paragraph(f"<b>No.</b> {estab}-{pto_emi}-{secuencial}", style_title)],
            [Spacer(1, 2*mm)],
            [Paragraph("NUMERO DE AUTORIZACIÓN", style_small)],
            [Paragraph(f"{num_autorizacion}", style_small)],
            [Spacer(1, 2*mm)],
            [Paragraph(f"AMBIENTE: {ambiente}", style_small)],
            [Paragraph(f"EMISIÓN: {tipo_emision}", style_small)],
            [Spacer(1, 2*mm)],
            [Paragraph("CLAVE DE ACCESO", style_small)],
            [barcode],
            [Spacer(1, 4*mm)] # <--- Espacio garantizado debajo del código de barras
        ]

        t_right_inner = Table(right_data, colWidths=[80*mm])
        t_right_inner.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ]))

        # --- C. Envolver en Listas y Crear Tabla Contenedora Principal ---
        left_cell_content = [logo_element, Spacer(1, 4*mm), t_emisor_inner]
        right_cell_content = [t_right_inner]

        t_header_container = Table([[left_cell_content, "", right_cell_content]], colWidths=[88*mm, 4*mm, 88*mm])

        t_header_container.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),

            # Caja y márgenes para el lado Izquierdo
            ('BOX', (0, 0), (0, 0), 0.5, border_color),
            ('TOPPADDING', (0, 0), (0, 0), 4*mm),
            ('BOTTOMPADDING', (0, 0), (0, 0), 4*mm),
            ('LEFTPADDING', (0, 0), (0, 0), 4*mm),
            ('RIGHTPADDING', (0, 0), (0, 0), 4*mm),

            # Caja y márgenes para el lado Derecho
            ('BOX', (2, 0), (2, 0), 0.5, border_color),
            ('TOPPADDING', (2, 0), (2, 0), 4*mm),
            ('BOTTOMPADDING', (2, 0), (2, 0), 4*mm),
            ('LEFTPADDING', (2, 0), (2, 0), 4*mm),
            ('RIGHTPADDING', (2, 0), (2, 0), 4*mm),
        ]))

        elements.append(t_header_container)
        elements.append(Spacer(1, 4*mm))

        # ========== 2. INFORMACIÓN PROVEEDOR ==========
        identificacion = info_factura.get("identificacion_comprador", "")
        nombre = info_factura.get("razon_social_comprador", "")
        fecha_emision = info_factura.get("fecha_emision", "")

        correo = "S/N"
        direccion = "S/N"
        for item in info_adicional:
            if str(item.get("nombre", "")).upper() == "EMAIL":
                correo = item.get("valor", "S/N")
            if str(item.get("nombre", "")).upper() == "DIRECCION":
                direccion = item.get("valor", "S/N")

        prov_data = [
            [Paragraph("<b>Información Proveedor</b>", ParagraphStyle('C', alignment=1, bold=True, fontSize=8)), ""],
            [Paragraph(f"<b>Cédula/Ruc:</b> {identificacion}", style_normal), Paragraph(f"<b>Fecha Emisión:</b> {fecha_emision}", style_normal)],
            [Paragraph(f"<b>Nombre:</b> {nombre}", style_normal), ""],
            [Paragraph(f"<b>Teléfonos:</b> ", style_normal), ""],
            [Paragraph(f"<b>Dirección:</b> {direccion}", style_normal), ""],
            [Paragraph(f"<b>Correo:</b> {correo}", style_normal), ""]
        ]

        t_proveedor = Table(prov_data, colWidths=[120*mm, 60*mm])
        t_proveedor.setStyle(TableStyle([
            ('SPAN', (0, 0), (1, 0)),
            ('BACKGROUND', (0, 0), (1, 0), bg_grey),
            ('SPAN', (0, 2), (1, 2)),
            ('SPAN', (0, 3), (1, 3)),
            ('SPAN', (0, 4), (1, 4)),
            ('SPAN', (0, 5), (1, 5)),
            ('BOX', (0, 0), (-1, -1), 0.5, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_proveedor)
        elements.append(Spacer(1, 4*mm))

        # ========== 3. DETALLE DE RETENCIÓN ==========
        headers = ["N", "Comprobante", "Número", "Fecha\nEmisión", "Ejercicio\nFiscal", "Base\nImponible", "Tipo", "Código\nRetención", "Porcentaje", "Valor\nRetenido"]
        detalle_data = [[Paragraph(h, style_table_header) for h in headers]]

        total_base = 0.0
        total_retenido = 0.0
        periodo_fiscal = info_factura.get("periodo_fiscal", "")

        for i, det in enumerate(detalles):
            base = float(det.get('fatbase', 0))
            valor = float(det.get('fatvalor', 0))
            total_base += base
            total_retenido += valor

            tipo_imp = str(det.get("fatimpret", "")).strip().upper()
            tipo = "RENTA" if tipo_imp == "R" else "IVA" if tipo_imp == "I" else "ISD"

            detalle_data.append([
                Paragraph(str(i + 1), style_table_cell),
                Paragraph("FACTURA", style_table_cell),
                Paragraph(str(det.get("facid", "")), style_table_cell),
                Paragraph(fecha_emision, style_table_cell),
                Paragraph(periodo_fiscal, style_table_cell),
                Paragraph(f"{base:.2f}", style_table_cell_right),
                Paragraph(tipo, style_table_cell),
                Paragraph(str(det.get("codSRI", "")), style_table_cell),
                Paragraph(f"{float(det.get('fatporcent', 0)):.2f}", style_table_cell_right),
                Paragraph(f"{valor:.2f}", style_table_cell_right),
            ])

        # Fila de Totales
        detalle_data.append([
            "", "", "", "",
            Paragraph("<b>TOTAL</b>", style_table_header),
            Paragraph(f"<b>$ {total_base:,.2f}</b>", style_table_cell_right),
            "", "",
            Paragraph("<b>TOTAL<br/>RETENIDO</b>", style_table_header),
            Paragraph(f"<b>$ {total_retenido:,.2f}</b>", style_table_cell_right)
        ])

        col_widths = [8*mm, 20*mm, 30*mm, 17*mm, 17*mm, 19*mm, 13*mm, 18*mm, 16*mm, 22*mm]
        table_detalles = Table(detalle_data, colWidths=col_widths, repeatRows=1)

        t_style = [
            ('GRID', (0, 0), (-1, -2), 0.5, border_color),
            ('BOX', (0, 0), (-1, -2), 0.5, border_color),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 1),
            ('RIGHTPADDING', (0, 0), (-1, -1), 1),

            ('BOX', (4, -1), (5, -1), 0.5, border_color),
            ('GRID', (4, -1), (5, -1), 0.5, border_color),
            ('BOX', (8, -1), (9, -1), 0.5, border_color),
            ('GRID', (8, -1), (9, -1), 0.5, border_color),
        ]
        table_detalles.setStyle(TableStyle(t_style))
        elements.append(table_detalles)

        doc.build(elements)
        return str(ruta_pdf), None, None

    except Exception as e:
        return None, f"Error al generar RIDE Retención: {str(e)}", {"error": "ERROR_RIDE"}
