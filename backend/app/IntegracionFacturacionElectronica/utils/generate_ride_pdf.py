# fmt: off
# flake8: noqa

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
)
from reportlab.graphics.barcode import code128
from pathlib import Path
import os

def generate_ride_pdf(factura_data: dict, auth_data: dict, clave_acceso: str, output_dir: Path = None) -> tuple:
    """
    Genera el PDF RIDE de la factura electrónica estandarizado (Diseño SRI).
    Maneja paginación de productos, alinea los bordes a 180mm y separa los bloques inferiores.
    """
    try:
        if output_dir is None:
            output_dir = Path(__file__).parent.parent / "facturas_rides"
        output_dir.mkdir(parents=True, exist_ok=True)

        ruta_pdf = output_dir / f"{clave_acceso}.pdf"

        # Extraer datos
        info_tributaria = factura_data.get("info_tributaria", {})
        info_factura = factura_data.get("info_factura", {})
        detalles = factura_data.get("detalles", [])
        totales_impuestos = factura_data.get("totales_impuestos", [])
        pagos = factura_data.get("pagos", [])
        info_adicional = factura_data.get("info_adicional", [])

        # Configurar documento (Ancho imprimible = 180mm)
        doc = SimpleDocTemplate(
            str(ruta_pdf),
            pagesize=A4,
            rightMargin=15*mm,
            leftMargin=15*mm,
            topMargin=15*mm,
            bottomMargin=15*mm,
            title=f"{clave_acceso}",
            author=info_tributaria.get('razon_social', '')
        )

        styles = getSampleStyleSheet()
        elements = []

        # Estilos personalizados
        style_logo = ParagraphStyle('Logo', fontSize=16, bold=True, alignment=1)
        style_title = ParagraphStyle('Title', fontSize=12, spaceAfter=2*mm, bold=True)
        style_normal = ParagraphStyle('Normal', fontSize=8, leading=10)
        style_bold = ParagraphStyle('Bold', fontSize=8, bold=True, leading=10)
        style_small = ParagraphStyle('Small', fontSize=7, leading=9)
        style_table_header = ParagraphStyle('TableHeader', fontSize=7, bold=True, alignment=1)
        style_table_cell = ParagraphStyle('TableCell', fontSize=7)
        style_table_cell_right = ParagraphStyle('TableCellRight', fontSize=7, alignment=2)

        # ========== 1. ENCABEZADO (CUADRÍCULA NIVELADA) ==========
        razon_social = info_tributaria.get("razon_social", "")
        ruc = info_tributaria.get("ruc", "")
        estab = info_tributaria.get("estab", "")
        pto_emi = info_tributaria.get("pto_emi", "")
        secuencial = info_tributaria.get("secuencial", "")
        dir_matriz = info_tributaria.get("dir_matriz", "")
        dir_establecimiento = info_factura.get("dir_establecimiento", "")
        obligado_contabilidad = info_factura.get("obligado_contabilidad", "NO")

        emisor_data = [
            [Paragraph(f"<b>{razon_social}</b>", style_normal)],
            [Paragraph(f"Dir Matriz: {dir_matriz}", style_small)],
            [Paragraph(f"Dir Sucursal: {dir_establecimiento}", style_small)],
            [Spacer(1, 2*mm)],
            [Paragraph(f"OBLIGADO A LLEVAR CONTABILIDAD: {obligado_contabilidad}", style_small)]
        ]
        t_emisor_inner = Table(emisor_data, colWidths=[82*mm])

        num_autorizacion = auth_data.get("numero_autorizacion", "")
        fecha_auth = auth_data.get("fecha_autorizacion", "")
        ambiente = auth_data.get("ambiente", "")
        tipo_emision = factura_data.get("tipo_emision", "1")

        fecha_auth_str = fecha_auth.strftime('%d/%m/%Y %H:%M:%S') if hasattr(fecha_auth, 'strftime') else str(fecha_auth)
        tipo_emision_str = "Normal" if tipo_emision == "1" else "Contingencia"

        barcode = code128.Code128(clave_acceso, barHeight=10*mm, barWidth=0.22*mm, humanReadable=True)

        right_data = [
            [Paragraph(f"R.U.C.: {ruc}", style_bold)],
            [Paragraph("FACTURA", style_title)],
            [Paragraph(f"Nº.: {estab}-{pto_emi}-{secuencial}", style_normal)],
            [Paragraph("NÚMERO DE AUTORIZACIÓN:", style_small)],
            [Paragraph(f"{num_autorizacion}", style_small)],
            [Paragraph("FECHA Y HORA DE AUTORIZACIÓN:", style_small)],
            [Paragraph(f"{fecha_auth_str}", style_small)],
            [Paragraph(f"Ambiente: {ambiente}", style_small)],
            [Paragraph(f"EMISIÓN: {tipo_emision_str}", style_small)],
            [Spacer(1, 2*mm)],
            [Paragraph("CLAVE DE ACCESO", style_small)],
            [barcode]
        ]

        t_right_inner = Table(right_data, colWidths=[82*mm])
        t_right_inner.setStyle(TableStyle([
            ('ALIGN', (0, -1), (0, -1), 'CENTER'),
        ]))

        header_data = [
            [Paragraph("DSOFT", style_logo), t_right_inner],
            [t_emisor_inner, ""]
        ]

        # 90 + 90 = 180mm EXACTOS
        t_header = Table(header_data, colWidths=[90*mm, 90*mm])
        t_header.setStyle(TableStyle([
            ('SPAN', (1, 0), (1, 1)),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),

            ('BOX', (0, 1), (0, 1), 0.5, colors.black),
            ('TOPPADDING', (0, 1), (0, 1), 4),
            ('BOTTOMPADDING', (0, 1), (0, 1), 4),
            ('LEFTPADDING', (0, 1), (0, 1), 4),
            ('RIGHTPADDING', (0, 1), (0, 1), 4),

            ('BOX', (1, 0), (1, 1), 0.5, colors.black),
            ('TOPPADDING', (1, 0), (1, 1), 4),
            ('BOTTOMPADDING', (1, 0), (1, 1), 15),
            ('LEFTPADDING', (1, 0), (1, 1), 4),
            ('RIGHTPADDING', (1, 0), (1, 1), 4),

            ('BOTTOMPADDING', (0, 0), (0, 0), 10*mm),
        ]))

        elements.append(t_header)
        elements.append(Spacer(1, 3*mm))

        # ========== 2. DATOS DEL COMPRADOR ==========
        razon_comprador = info_factura.get("razon_social_comprador", "")
        identificacion_comprador = info_factura.get("identificacion_comprador", "")
        fecha_emision = info_factura.get("fecha_emision", "")
        guia_remision = info_factura.get("guia_remision", "")

        comp_data = [
            [Paragraph(f"Razón Social / Nombres y Apellidos: {razon_comprador}", style_normal),
             Paragraph(f"Identificación: {identificacion_comprador}", style_normal)],
            [Paragraph(f"Fecha Emisión: {fecha_emision}", style_normal),
             Paragraph(f"Guía Remisión: {guia_remision}", style_normal)]
        ]

        # 120 + 60 = 180mm EXACTOS
        t_comprador = Table(comp_data, colWidths=[120*mm, 60*mm])
        t_comprador.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(t_comprador)
        elements.append(Spacer(1, 3*mm))

        # ========== 3. TABLA DE DETALLES ==========
        headers = ["Cod. Principal", "Cantidad", "Descripción", "Precio Unitario", "Descuento", "Precio Total"]
        detalle_data = [[Paragraph(h, style_table_header) for h in headers]]

        for det in detalles:
            detalle_data.append([
                Paragraph(str(det.get("codigo_principal", "")), style_table_cell),
                Paragraph(f"{det.get('cantidad', 0):.2f}", style_table_cell),
                Paragraph(str(det.get("descripcion", "")), style_table_cell),
                Paragraph(f"{det.get('precio_unitario', 0):.6f}", style_table_cell_right),
                Paragraph(f"{det.get('descuento', 0):.2f}", style_table_cell_right),
                Paragraph(f"{det.get('precio_total_sin_impuesto', 0):.2f}", style_table_cell_right),
            ])

        # 25 + 15 + 65 + 25 + 20 + 30 = 180mm EXACTOS
        col_widths = [25*mm, 15*mm, 65*mm, 25*mm, 20*mm, 30*mm]

        table_detalles = Table(detalle_data, colWidths=col_widths, repeatRows=1)
        table_detalles.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(table_detalles)
        elements.append(Spacer(1, 3*mm))

        # ========== 4. SECCIÓN INFERIOR (AJUSTADA A 180mm CON SEPARACIÓN) ==========
        total_iva = 0
        total_sin_impuestos = float(info_factura.get("total_sin_impuestos", 0))
        total_descuento = float(info_factura.get("total_descuento", 0))
        importe_total = float(info_factura.get("importe_total", 0))
        propina = float(info_factura.get("propina", 0))

        for imp in totales_impuestos:
            total_iva += float(imp.get("valor", 0))

        # 4.1 Información Adicional
        info_data = [[Paragraph("Información Adicional", style_table_header), ""]]
        for info in info_adicional:
            info_data.append([
                Paragraph(info.get("nombre", ""), style_table_cell),
                Paragraph(info.get("valor", ""), style_table_cell)
            ])
        if len(info_data) == 1:
            info_data.append([Paragraph("Ninguna", style_table_cell), ""])

        # 40 + 62 = 102mm
        t_info = Table(info_data, colWidths=[40*mm, 62*mm])
        t_info.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('SPAN', (0, 0), (1, 0)),
        ]))

        # 4.2 Formas de Pago
        pago_headers = ["Forma de pago", "Valor", "Plazo", "Tiempo"]
        pago_data = [[Paragraph(h, style_table_header) for h in pago_headers]]
        formas_pago = {
            "01": "SIN UTILIZACION DEL SISTEMA FINANCIERO",
            "16": "TARJETA DE DÉBITO",
            "19": "TARJETA DE CRÉDITO",
            "20": "OTROS CON UTILIZACION SISTEMA FINANCIERO",
        }
        for pago in pagos:
            forma = pago.get("forma_pago", "")
            pago_data.append([
                Paragraph(formas_pago.get(forma, forma), style_table_cell),
                Paragraph(f"{float(pago.get('total', 0)):.2f}", style_table_cell_right),
                Paragraph(pago.get("plazo", ""), style_table_cell),
                Paragraph(pago.get("unidad_tiempo", ""), style_table_cell),
            ])

        # 42 + 20 + 20 + 20 = 102mm
        t_pagos = Table(pago_data, colWidths=[42*mm, 20*mm, 20*mm, 20*mm])
        t_pagos.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ]))

        # Contenedor Izquierdo total: 102mm
        left_bottom = Table([[t_info], [Spacer(1, 3*mm)], [t_pagos]], colWidths=[102*mm])
        left_bottom.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))

        # 4.3 Totales
        totales_data = [
            [Paragraph("SUBTOTAL 5%", style_small), Paragraph("0.00", style_table_cell_right)],
            [Paragraph("SUBTOTAL 15%", style_small), Paragraph(f"{total_sin_impuestos:.2f}", style_table_cell_right)],
            [Paragraph("SUBTOTAL 0%", style_small), Paragraph("0.00", style_table_cell_right)],
            [Paragraph("SUBTOTAL No objeto de IVA", style_small), Paragraph("0.00", style_table_cell_right)],
            [Paragraph("SUBTOTAL SIN IMPUESTOS", style_small), Paragraph(f"{total_sin_impuestos:.2f}", style_table_cell_right)],
            [Paragraph("DESCUENTO", style_small), Paragraph(f"{total_descuento:.2f}", style_table_cell_right)],
            [Paragraph("ICE", style_small), Paragraph("0.00", style_table_cell_right)],
            [Paragraph("IVA 5%", style_small), Paragraph("0.00", style_table_cell_right)],
            [Paragraph("IVA 15%", style_small), Paragraph(f"{total_iva:.2f}", style_table_cell_right)],
            [Paragraph("PROPINA", style_small), Paragraph(f"{propina:.2f}", style_table_cell_right)],
            [Paragraph("<b>VALOR TOTAL</b>", style_normal), Paragraph(f"<b>{importe_total:.2f}</b>", style_table_cell_right)],
        ]

        # 50 + 25 = 75mm
        t_totales = Table(totales_data, colWidths=[50*mm, 25*mm])
        t_totales.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))

        # Contenedor Inferior Maestro: 102mm (Izq) + 3mm (Espacio vacío) + 75mm (Der) = 180mm EXACTOS
        # Aquí agregué el "" en el medio para crear la columna invisible que separa las tablas
        t_bottom_container = Table([[left_bottom, "", t_totales]], colWidths=[102*mm, 3*mm, 75*mm])

        t_bottom_container.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))

        elements.append(KeepTogether(t_bottom_container))

        # ========== GENERAR PDF ==========
        doc.build(elements)

        return str(ruta_pdf), None, None

    except Exception as e:
        return None, f"Error al generar RIDE: {str(e)}", {
            "error": "ERROR_RIDE",
            "detalle_tecnico": str(e)
        }
