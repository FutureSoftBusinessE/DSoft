"""
Generador de XML para Factura Electrónica SRI
Basado en el código VB6 original (XMLFacturaElectronica)
Respeta el orden exacto de los tags y las reglas de omisión de campos opcionales
"""

from decimal import Decimal
from xml.dom import minidom
from app.IntegracionFacturacionElectronica.models.factura.Factura import Factura


def build_xml_desde_factura(factura: Factura) -> str:
    """
    Genera el XML completo de la factura electrónica.
    Equivalente a la función XMLFacturaElectronica de VB6.

    Args:
        factura: Objeto Factura con todos los datos

    Returns:
        String XML formateado listo para guardar/firmar
    """

    # Crear documento XML
    dom = minidom.getDOMImplementation()
    doc = dom.createDocument(None, "factura", None)

    # Raíz <factura>
    root = doc.documentElement

    # Atributos de <factura>
    root.setAttribute("id", factura.getId())
    root.setAttribute("version", factura.getVersion())

    # ========================================================================
    # <infoTributaria>
    # ========================================================================
    infoTributaria = factura.getInfoTributaria()
    if infoTributaria:
        nodo_info_tributaria = doc.createElement("infoTributaria")

        _agregar_elemento(doc, nodo_info_tributaria, "ambiente", infoTributaria.getAmbiente())
        _agregar_elemento(doc, nodo_info_tributaria, "tipoEmision", infoTributaria.getTipoEmision())
        _agregar_elemento(doc, nodo_info_tributaria, "razonSocial", infoTributaria.getRazonSocial())

        # nombreComercial: solo si tiene valor
        if infoTributaria.getNombreComercial():
            _agregar_elemento(doc, nodo_info_tributaria, "nombreComercial", infoTributaria.getNombreComercial())

        _agregar_elemento(doc, nodo_info_tributaria, "ruc", infoTributaria.getRuc())
        _agregar_elemento(doc, nodo_info_tributaria, "claveAcceso", infoTributaria.getClaveAcceso())
        _agregar_elemento(doc, nodo_info_tributaria, "codDoc", infoTributaria.getCodDoc())
        _agregar_elemento(doc, nodo_info_tributaria, "estab", infoTributaria.getEstab())
        _agregar_elemento(doc, nodo_info_tributaria, "ptoEmi", infoTributaria.getPtoEmi())
        _agregar_elemento(doc, nodo_info_tributaria, "secuencial", infoTributaria.getSecuencial())
        _agregar_elemento(doc, nodo_info_tributaria, "dirMatriz", infoTributaria.getDirMatriz())

        # agenteRetencion: solo si tiene valor
        if infoTributaria.getAgenteRetencion():
            _agregar_elemento(doc, nodo_info_tributaria, "agenteRetencion", infoTributaria.getAgenteRetencion())

        # contribuyenteRimpe: solo si tiene valor
        if infoTributaria.getContribuyenteRimpe():
            _agregar_elemento(doc, nodo_info_tributaria, "contribuyenteRimpe", infoTributaria.getContribuyenteRimpe())

        root.appendChild(nodo_info_tributaria)

    # ========================================================================
    # <infoFactura>
    # ========================================================================
    infoFactura = factura.getInfoFactura()
    if infoFactura:
        nodo_info_factura = doc.createElement("infoFactura")

        _agregar_elemento(doc, nodo_info_factura, "fechaEmision", infoFactura.getFechaEmision())
        _agregar_elemento(doc, nodo_info_factura, "dirEstablecimiento", infoFactura.getDirEstablecimiento())

        # contribuyenteEspecial: solo si tiene valor y no es "000"
        if infoFactura.getContribuyenteEspecial() and infoFactura.getContribuyenteEspecial() != "000":
            _agregar_elemento(doc, nodo_info_factura, "contribuyenteEspecial", infoFactura.getContribuyenteEspecial())

        _agregar_elemento(doc, nodo_info_factura, "obligadoContabilidad", infoFactura.getObligadoContabilidad())
        _agregar_elemento(doc, nodo_info_factura, "tipoIdentificacionComprador", infoFactura.getTipoIdentificacionComprador())

        # guiaRemision: solo si tiene valor
        if infoFactura.getGuiaRemision():
            _agregar_elemento(doc, nodo_info_factura, "guiaRemision", infoFactura.getGuiaRemision())

        _agregar_elemento(doc, nodo_info_factura, "razonSocialComprador", infoFactura.getRazonSocialComprador())
        _agregar_elemento(doc, nodo_info_factura, "identificacionComprador", infoFactura.getIdentificacionComprador())
        _agregar_elemento(doc, nodo_info_factura, "totalSinImpuestos", _format_decimal(infoFactura.getTotalSinImpuestos()))
        _agregar_elemento(doc, nodo_info_factura, "totalDescuento", _format_decimal(infoFactura.getTotalDescuento()))

        # <totalConImpuestos>
        totales_impuestos = infoFactura.getTotalImpuesto()
        if totales_impuestos:
            nodo_total_con_impuestos = doc.createElement("totalConImpuestos")

            for total_imp in totales_impuestos:
                nodo_total_impuesto = doc.createElement("totalImpuesto")

                _agregar_elemento(doc, nodo_total_impuesto, "codigo", total_imp.getCodigo())
                _agregar_elemento(doc, nodo_total_impuesto, "codigoPorcentaje", total_imp.getCodigoPorcentaje())
                _agregar_elemento(doc, nodo_total_impuesto, "baseImponible", _format_decimal(total_imp.getBaseImponible()))
                _agregar_elemento(doc, nodo_total_impuesto, "valor", _format_decimal(total_imp.getValor()))

                nodo_total_con_impuestos.appendChild(nodo_total_impuesto)

            nodo_info_factura.appendChild(nodo_total_con_impuestos)

        _agregar_elemento(doc, nodo_info_factura, "propina", _format_decimal(infoFactura.getPropina()))
        _agregar_elemento(doc, nodo_info_factura, "importeTotal", _format_decimal(infoFactura.getImporteTotal()))
        _agregar_elemento(doc, nodo_info_factura, "moneda", infoFactura.getMoneda())

        # <pagos>: solo si hay formas de pago
        pagos = infoFactura.getPagos()
        if pagos:
            nodo_pagos = doc.createElement("pagos")

            for pago in pagos:
                nodo_pago = doc.createElement("pago")

                _agregar_elemento(doc, nodo_pago, "formaPago", pago.getFormaPago())
                _agregar_elemento(doc, nodo_pago, "total", _format_decimal(pago.getTotal()))

                # plazo y unidadTiempo: solo si tienen valor
                if pago.getPlazo():
                    _agregar_elemento(doc, nodo_pago, "plazo", pago.getPlazo())
                if pago.getUnidadTiempo():
                    _agregar_elemento(doc, nodo_pago, "unidadTiempo", pago.getUnidadTiempo())

                nodo_pagos.appendChild(nodo_pago)

            nodo_info_factura.appendChild(nodo_pagos)

        root.appendChild(nodo_info_factura)

    # ========================================================================
    # <detalles>
    # ========================================================================
    detalles = factura.getDetalle()
    if detalles:
        nodo_detalles = doc.createElement("detalles")

        for detalle in detalles:
            nodo_detalle = doc.createElement("detalle")

            _agregar_elemento(doc, nodo_detalle, "codigoPrincipal", detalle.getCodigoPrincipal())

            # codigoAuxiliar: solo si tiene valor
            if detalle.getCodigoAuxiliar():
                _agregar_elemento(doc, nodo_detalle, "codigoAuxiliar", detalle.getCodigoAuxiliar())

            _agregar_elemento(doc, nodo_detalle, "descripcion", detalle.getDescripcion())
            _agregar_elemento(doc, nodo_detalle, "cantidad", _format_decimal(detalle.getCantidad()))
            _agregar_elemento(doc, nodo_detalle, "precioUnitario", _format_decimal(detalle.getPrecioUnitario()))
            _agregar_elemento(doc, nodo_detalle, "descuento", _format_decimal(detalle.getDescuento()))
            _agregar_elemento(doc, nodo_detalle, "precioTotalSinImpuesto", _format_decimal(detalle.getPrecioTotalSinImpuesto()))

            # <detallesAdicionales>: solo si hay (comentado en VB6, dejamos soporte)
            detalles_adicionales = detalle.getDetAdicional()
            if detalles_adicionales:
                nodo_detalles_adicionales = doc.createElement("detallesAdicionales")

                # detalles_adicionales es un arreglo de diccionarios
                for det_ad in detalles_adicionales:
                    nodo_det_adicional = doc.createElement("detAdicional")
                    nombre = det_ad.get("nombre", "")
                    valor = det_ad.get("valor", "")
                    nodo_det_adicional.setAttribute("nombre", nombre)
                    nodo_det_adicional.setAttribute("valor", valor)
                    nodo_detalles_adicionales.appendChild(nodo_det_adicional)

                nodo_detalle.appendChild(nodo_detalles_adicionales)

            # <impuestos>
            impuestos = detalle.getImpuesto()
            if impuestos:
                nodo_impuestos = doc.createElement("impuestos")

                for impuesto in impuestos:
                    nodo_impuesto = doc.createElement("impuesto")

                    _agregar_elemento(doc, nodo_impuesto, "codigo", impuesto.getCodigo())
                    _agregar_elemento(doc, nodo_impuesto, "codigoPorcentaje", impuesto.getCodigoPorcentaje())
                    _agregar_elemento(doc, nodo_impuesto, "tarifa", _format_decimal(impuesto.getTarifa()))
                    _agregar_elemento(doc, nodo_impuesto, "baseImponible", _format_decimal(impuesto.getBaseImponible()))
                    _agregar_elemento(doc, nodo_impuesto, "valor", _format_decimal(impuesto.getValor()))

                    nodo_impuestos.appendChild(nodo_impuesto)

                nodo_detalle.appendChild(nodo_impuestos)

            nodo_detalles.appendChild(nodo_detalle)

        root.appendChild(nodo_detalles)

    # ========================================================================
    # <infoAdicional>
    # ========================================================================
    campos_adicionales = factura.getCampoAdicional()
    if campos_adicionales:
        nodo_info_adicional = doc.createElement("infoAdicional")

        for campo in campos_adicionales:
            nodo_campo = doc.createElement("campoAdicional")
            nodo_campo.setAttribute("nombre", campo.getNombre())
            nodo_campo.appendChild(doc.createTextNode(campo.getValue()))
            nodo_info_adicional.appendChild(nodo_campo)

        root.appendChild(nodo_info_adicional)

    # ========================================================================
    # <retenciones>
    # ========================================================================
    retenciones = factura.getRetencion()
    if retenciones:
        nodo_retenciones = doc.createElement("retenciones")

        for retencion in retenciones:
            nodo_retencion = doc.createElement("retencion")

            _agregar_elemento(doc, nodo_retencion, "codigo", retencion.getCodigo())
            _agregar_elemento(doc, nodo_retencion, "codigoPorcentaje", retencion.getCodigoPorcentaje())
            _agregar_elemento(doc, nodo_retencion, "tarifa", _format_decimal(retencion.getTarifa()))
            _agregar_elemento(doc, nodo_retencion, "valor", _format_decimal(retencion.getValor()))

            nodo_retenciones.appendChild(nodo_retencion)

        root.appendChild(nodo_retenciones)

    # ========================================================================
    # Convertir a string XML formateado
    # ========================================================================
    xml_string = doc.toxml(encoding="UTF-8")

    # Decodificar bytes a string
    if isinstance(xml_string, bytes):
        xml_string = xml_string.decode("UTF-8")

    return xml_string


# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================


def _agregar_elemento(doc, padre, nombre_tag, valor):
    """
    Crea un elemento XML y lo agrega al nodo padre.
    Equivalente a objDOM.createElement en VB6.

    Args:
        doc: Documento XML
        padre: Nodo padre
        nombre_tag: Nombre del tag
        valor: Valor del tag (string o number)
    """
    elemento = doc.createElement(nombre_tag)
    elemento.appendChild(doc.createTextNode(str(valor)))
    padre.appendChild(elemento)


def _format_decimal(valor: Decimal) -> str:
    """
    Formatea un Decimal para el XML.
    Usa 2 decimales fijos como el VB6 (Format con sMaskNum).

    Args:
        valor: Valor Decimal

    Returns:
        String formateado (ej: "80.87", "0.00")
    """
    if valor is None:
        return "0.00"
    return f"{float(valor):.2f}"
