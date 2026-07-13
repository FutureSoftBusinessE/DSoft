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

def generate_ride_pdf_remision(guia_data: dict, auth_data: dict, clave_acceso: str, output_dir: Path = None) -> tuple:
    """
    Genera el PDF RIDE exclusivo para Guías de Remisión.
    """
    try:
        if output_dir is None:
            output_dir = Path(__file__).parent.parent / "remisiones_rides"
        output_dir.mkdir(parents=True, exist_ok=True)

        ruta_pdf = output_dir / f"{clave_acceso}.pdf"

        # Extraer diccionarios
        info_tributaria = guia_data.get("info_tributaria", {})
        info_guia = guia_data.get("info_guia", {})
        detalles = guia_data.get("detalles", [])
        info_adicional = guia_data.get("info_adicional", [])

        doc = SimpleDocTemplate(
            str(ruta_pdf), pagesize=A4, rightMargin=15*mm, leftMargin=15*mm,
            topMargin=15*mm, bottomMargin=15*mm, title=f"GUIA_{clave_acceso}"
        )

        elements = []

        # Estilos compactos
        style_title = ParagraphStyle('Title', fontSize=10, bold=True, leading=12)
        style_normal = ParagraphStyle('Normal', fontSize=7.5, leading=9)
        style_small = ParagraphStyle('Small', fontSize=6.5, leading=8)
        style_table_header = ParagraphStyle('TableHeader', fontSize=7, bold=True, alignment=1)
        style_table_cell = ParagraphStyle('TableCell', fontSize=7, alignment=1)

        border_color = colors.HexColor("#000000")

        # ========== 1. ENCABEZADO (CAJAS SEPARADAS) ==========
        razon_social = info_tributaria.get("razon_social", "")
        ruc = info_tributaria.get("ruc", "")
        estab = info_tributaria.get("estab", "000")
        pto_emi = info_tributaria.get("pto_emi", "000")
        secuencial = info_tributaria.get("secuencial", "000000000")
        dir_matriz = info_tributaria.get("dir_matriz", "")
        dir_sucursal = info_guia.get("dir_establecimiento", "")
        obligado_contabilidad = info_guia.get("obligado_contabilidad", "NO")

        cont_esp = info_tributaria.get("contribuyente_especial", "")
        res_agente = info_tributaria.get("resolucion_agente", "")
        exp_habitual = info_tributaria.get("exportador_habitual", "")

        # --- CAJA IZQUIERDA ---
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
            [Paragraph(f"Dir Matriz: {dir_matriz}", style_small)],
            [Paragraph(f"Dir Sucursal: {dir_sucursal}", style_small)]
        ]

        if cont_esp:
            emisor_data.append([Paragraph(f"Contribuyente Especial Nro: {cont_esp}", style_small)])

        emisor_data.append([Paragraph(f"OBLIGADO A LLEVAR CONTABILIDAD: {obligado_contabilidad}", style_small)])

        if res_agente:
            emisor_data.append([Paragraph(f"Agente de Retención Resolución No. {res_agente}", style_small)])
        if exp_habitual:
            emisor_data.append([Paragraph(f"Exportador Habitual de Bienes", style_small)])

        t_emisor_inner = Table(emisor_data, colWidths=[80*mm])
        t_emisor_inner.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ]))

        # --- CAJA DERECHA ---
        num_autorizacion = auth_data.get("numero_autorizacion", "")
        fecha_auth = auth_data.get("fecha_autorizacion", "")
        ambiente = auth_data.get("ambiente", "PRODUCCIÓN")
        tipo_emision = "Normal" if auth_data.get("tipo_emision", "1") == "1" else "Contingencia"

        fecha_auth_str = fecha_auth.strftime('%d/%m/%Y %H:%M:%S') if hasattr(fecha_auth, 'strftime') else str(fecha_auth)

        barcode = code128.Code128(clave_acceso, barHeight=11*mm, barWidth=0.19*mm, humanReadable=True)

        right_data = [
            [Paragraph(f"R.U.C.: {ruc}", style_normal)],
            [Paragraph("GUÍA DE REMISIÓN", ParagraphStyle('T', fontSize=12, bold=True, alignment=1))],
            [Paragraph(f"Nº.: {estab}-{pto_emi}-{secuencial}", style_normal)],
            [Spacer(1, 1*mm)],
            [Paragraph("NÚMERO DE AUTORIZACIÓN:", style_small)],
            [Paragraph(f"{num_autorizacion}", style_small)],
            [Spacer(1, 1*mm)],
            [Paragraph("FECHA Y HORA DE AUTORIZACIÓN:", style_small)],
            [Paragraph(f"{fecha_auth_str}", style_small)],
            [Spacer(1, 1*mm)],
            [Paragraph(f"Ambiente: {ambiente}", style_small)],
            [Paragraph(f"EMISIÓN: {tipo_emision}", style_small)],
            [Spacer(1, 1*mm)],
            [Paragraph("CLAVE DE ACCESO", style_small)],
            [barcode],
            [Spacer(1, 2*mm)]
        ]

        t_right_inner = Table(right_data, colWidths=[80*mm])
        t_right_inner.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ]))

        left_cell_content = [logo_element, Spacer(1, 4*mm), t_emisor_inner]
        right_cell_content = [t_right_inner]

        t_header_container = Table([[left_cell_content, "", right_cell_content]], colWidths=[88*mm, 4*mm, 88*mm])
        t_header_container.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOX', (0, 0), (0, 0), 0.5, border_color),
            ('TOPPADDING', (0, 0), (0, 0), 4*mm),
            ('BOTTOMPADDING', (0, 0), (0, 0), 4*mm),
            ('LEFTPADDING', (0, 0), (0, 0), 4*mm),
            ('RIGHTPADDING', (0, 0), (0, 0), 4*mm),

            ('BOX', (2, 0), (2, 0), 0.5, border_color),
            ('TOPPADDING', (2, 0), (2, 0), 4*mm),
            ('BOTTOMPADDING', (2, 0), (2, 0), 4*mm),
            ('LEFTPADDING', (2, 0), (2, 0), 4*mm),
            ('RIGHTPADDING', (2, 0), (2, 0), 4*mm),
        ]))

        elements.append(t_header_container)
        elements.append(Spacer(1, 3*mm))

        # ========== 2. INFORMACIÓN TRANSPORTISTA ==========
        transp_data = [
            [Paragraph(f"Identificación (Transportista): {info_guia.get('identificacion_transportista', '')}", style_normal), ""],
            [Paragraph(f"Razón Social / Nombres y Apellidos: {info_guia.get('razon_social_transportista', '')}", style_normal), ""],
            [Paragraph(f"Placa: {info_guia.get('placa', '')}", style_normal), ""],
            [Paragraph(f"Punto de partida: {info_guia.get('punto_partida', '')}", style_normal), ""],
            [Paragraph(f"Fecha inicio transporte: {info_guia.get('fecha_inicio_transporte', '')}", style_normal),
             Paragraph(f"Fecha fin transporte: {info_guia.get('fecha_fin_transporte', '')}", style_normal)]
        ]

        t_transp = Table(transp_data, colWidths=[120*mm, 60*mm])
        t_transp.setStyle(TableStyle([
            ('SPAN', (0, 0), (1, 0)),
            ('SPAN', (0, 1), (1, 1)),
            ('SPAN', (0, 2), (1, 2)),
            ('SPAN', (0, 3), (1, 3)),
            ('BOX', (0, 0), (-1, -1), 0.5, border_color),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(t_transp)
        elements.append(Spacer(1, 3*mm))

        # ========== 3. INFORMACIÓN DESTINATARIO ==========
        dest_data = [
            [Paragraph(f"Comprobante de venta: {info_guia.get('comprobante_venta', '')}", style_normal),
             Paragraph(f"Fecha de emisión: {info_guia.get('fecha_emision_comprobante', '')}", style_normal)],
            [Paragraph(f"Número de autorización: {info_guia.get('num_aut_comprobante', '')}", style_normal), ""],
            [Paragraph(f"Motivo traslado: {info_guia.get('motivo_traslado', '')}", style_normal), ""],
            [Paragraph(f"Destino (Punto de llegada): {info_guia.get('destino', '')}", style_normal), ""],
            [Paragraph(f"Identificación (Destinatario): {info_guia.get('identificacion_destinatario', '')}", style_normal), ""],
            [Paragraph(f"Razón Social / Nombres Apellidos: {info_guia.get('razon_social_destinatario', '')}", style_normal), ""],
            [Paragraph(f"Documento Aduanero: {info_guia.get('doc_aduanero', '')}", style_normal), ""],
            [Paragraph(f"Código Establecimiento Destino: {info_guia.get('cod_estab_destino', '')}", style_normal), ""],
            [Paragraph(f"Ruta: {info_guia.get('ruta', '')}", style_normal), ""]
        ]

        t_dest = Table(dest_data, colWidths=[120*mm, 60*mm])
        t_dest.setStyle(TableStyle([
            ('SPAN', (0, 1), (1, 1)),
            ('SPAN', (0, 2), (1, 2)),
            ('SPAN', (0, 3), (1, 3)),
            ('SPAN', (0, 4), (1, 4)),
            ('SPAN', (0, 5), (1, 5)),
            ('SPAN', (0, 6), (1, 6)),
            ('SPAN', (0, 7), (1, 7)),
            ('SPAN', (0, 8), (1, 8)),
            ('BOX', (0, 0), (-1, -1), 0.5, border_color),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(t_dest)
        elements.append(Spacer(1, 3*mm))

        # ========== 4. DETALLES DE PRODUCTOS ==========
        headers = ["Cantidad", "Descripción", "Código Principal", "Código Auxiliar"]
        detalle_table_data = [[Paragraph(h, style_table_header) for h in headers]]

        for det in detalles:
            detalle_table_data.append([
                Paragraph(f"{float(det.get('cantidad', 0)):.2f}", ParagraphStyle('C', alignment=1, fontSize=7)),
                Paragraph(str(det.get("descripcion", "")), style_table_cell),
                Paragraph(str(det.get("codigo_principal", "")), style_table_cell),
                Paragraph(str(det.get("codigo_auxiliar", "")), style_table_cell)
            ])

        col_widths = [25*mm, 95*mm, 30*mm, 30*mm]
        t_detalles = Table(detalle_table_data, colWidths=col_widths, repeatRows=1)
        t_detalles.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(t_detalles)
        elements.append(Spacer(1, 4*mm))

        # ========== 5. INFORMACIÓN ADICIONAL (TABLA INFERIOR) ==========
        if info_adicional:
            info_data = [[Paragraph("Información Adicional", style_table_header), ""]]
            for info in info_adicional:
                info_data.append([
                    Paragraph(info.get("nombre", ""), ParagraphStyle('L', fontSize=7)),
                    Paragraph(info.get("valor", ""), ParagraphStyle('L', fontSize=7))
                ])

            t_info = Table(info_data, colWidths=[40*mm, 80*mm])
            t_info.setStyle(TableStyle([
                ('BOX', (0, 0), (-1, -1), 0.5, border_color),
                ('GRID', (0, 0), (-1, -1), 0.5, border_color),
                ('SPAN', (0, 0), (1, 0)),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ]))

            # Centramos la tabla de info adicional
            t_info_centered = Table([[t_info]], colWidths=[180*mm], style=[('ALIGN', (0,0), (-1,-1), 'CENTER')])
            elements.append(KeepTogether(t_info_centered))

        doc.build(elements)
        return str(ruta_pdf), None, None

    except Exception as e:
        return None, f"Error al generar RIDE Guía: {str(e)}", {"error": "ERROR_RIDE"}
