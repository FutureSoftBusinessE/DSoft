from typing import Dict, Any
from app.IntegracionFacturacionElectronica.models.factura.Factura import Factura
from app.IntegracionFacturacionElectronica.models.factura.FacturaDetalle import FacturaDetalle
from app.IntegracionFacturacionElectronica.models.factura.InfoFactura import InfoFactura
from app.IntegracionFacturacionElectronica.models.factura.TotalImpuesto import TotalImpuesto
from app.IntegracionFacturacionElectronica.models.factura.RetencionFactura import RetencionFactura
from app.IntegracionFacturacionElectronica.models.InfoTributaria import InfoTributaria
from app.IntegracionFacturacionElectronica.models.Impuesto import Impuesto
from app.IntegracionFacturacionElectronica.models.CampoAdicional import CampoAdicional
from app.IntegracionFacturacionElectronica.models.factura.Pago import Pago
from decimal import Decimal


def build_factura_desde_json(datos: Dict[str, Any], clave_acceso: str) -> Factura:
    """
    Construye el objeto Factura a partir del JSON recibido del frontend.
    Equivalente al main() de Factura.java.

    Args:
        datos: JSON completo recibido del frontend
        clave_acceso: Clave de acceso generada

    Returns:
        Objeto Factura listo para serializar
    """
    factura = Factura()
    factura.setId("comprobante")
    factura.setVersion("1.1.0")  # Corregido: VB6 usa 1.1.0

    # ========================================================================
    # --- InfoTributaria ---
    # ========================================================================
    it_data = datos.get("info_tributaria", {})
    info_tributaria = InfoTributaria()
    info_tributaria.setAmbiente(datos.get("ambiente", "1"))
    info_tributaria.setTipoEmision(datos.get("tipo_emision", "1"))
    info_tributaria.setRazonSocial(it_data.get("razon_social", ""))
    info_tributaria.setNombreComercial(it_data.get("nombre_comercial", ""))
    info_tributaria.setRuc(it_data.get("ruc", ""))
    info_tributaria.setClaveAcceso(clave_acceso)
    info_tributaria.setCodDoc(datos.get("tipo_documento", "01"))
    info_tributaria.setEstab(it_data.get("estab", ""))
    info_tributaria.setPtoEmi(it_data.get("pto_emi", ""))
    info_tributaria.setSecuencial(it_data.get("secuencial", ""))
    info_tributaria.setDirMatriz(it_data.get("dir_matriz", ""))

    # NUEVOS CAMPOS (según VB6)
    flags = datos.get("flags_adicionales", {})
    info_tributaria.setAgenteRetencion(flags.get("agente_retencion_num_res", ""))
    info_tributaria.setContribuyenteRimpe(flags.get("rimpe", ""))

    factura.setInfoTributaria(info_tributaria)

    # ========================================================================
    # --- InfoFactura ---
    # ========================================================================
    if_data = datos.get("info_factura", {})
    info_factura = InfoFactura()
    info_factura.setFechaEmision(if_data.get("fecha_emision", ""))
    info_factura.setDirEstablecimiento(if_data.get("dir_establecimiento", ""))
    info_factura.setContribuyenteEspecial(if_data.get("contribuyente_especial", ""))
    info_factura.setObligadoContabilidad(if_data.get("obligado_contabilidad", "NO"))
    info_factura.setTipoIdentificacionComprador(if_data.get("tipo_identificacion_comprador", ""))
    info_factura.setGuiaRemision(if_data.get("guia_remision", ""))
    info_factura.setRazonSocialComprador(if_data.get("razon_social_comprador", ""))
    info_factura.setIdentificacionComprador(if_data.get("identificacion_comprador", ""))
    info_factura.setTotalSinImpuestos(Decimal(str(if_data.get("total_sin_impuestos", "0.00"))))
    info_factura.setTotalDescuento(Decimal(str(if_data.get("total_descuento", "0.00"))))
    info_factura.setPropina(Decimal(str(if_data.get("propina", "0.00"))))
    info_factura.setImporteTotal(Decimal(str(if_data.get("importe_total", "0.00"))))
    info_factura.setMoneda(if_data.get("moneda", "DOLAR"))

    # Totales de impuestos
    lista_total_impuestos = []
    for ti_data in datos.get("totales_impuestos", []):
        ti = TotalImpuesto()
        ti.setCodigo(ti_data.get("codigo", ""))
        ti.setCodigoPorcentaje(ti_data.get("codigo_porcentaje", ""))
        ti.setBaseImponible(Decimal(str(ti_data.get("base_imponible", "0.00"))))
        ti.setValor(Decimal(str(ti_data.get("valor", "0.00"))))
        lista_total_impuestos.append(ti)
    info_factura.setTotalImpuesto(lista_total_impuestos)

    # NUEVO: Pagos
    lista_pagos = []
    for pago_data in datos.get("pagos", []):
        pago = Pago()
        pago.setFormaPago(pago_data.get("forma_pago", ""))
        pago.setTotal(Decimal(str(pago_data.get("total", "0.00"))))
        pago.setPlazo(pago_data.get("plazo", ""))
        pago.setUnidadTiempo(pago_data.get("unidad_tiempo", ""))
        lista_pagos.append(pago)
    info_factura.setPagos(lista_pagos)

    factura.setInfoFactura(info_factura)

    # ========================================================================
    # --- Detalles ---
    # ========================================================================
    lista_detalles = []
    for det_data in datos.get("detalles", []):
        detalle = FacturaDetalle()
        detalle.setCodigoPrincipal(det_data.get("codigo_principal", ""))
        detalle.setCodigoAuxiliar(det_data.get("codigo_auxiliar", ""))
        detalle.setDescripcion(det_data.get("descripcion", ""))
        detalle.setCantidad(Decimal(str(det_data.get("cantidad", "0.00"))))
        detalle.setPrecioUnitario(Decimal(str(det_data.get("precio_unitario", "0.00"))))
        detalle.setDescuento(Decimal(str(det_data.get("descuento", "0.00"))))
        detalle.setPrecioTotalSinImpuesto(Decimal(str(det_data.get("precio_total_sin_impuesto", "0.00"))))

        # Impuestos del detalle
        lista_impuestos = []
        for imp_data in det_data.get("impuestos", []):
            imp = Impuesto()
            imp.setCodigo(imp_data.get("codigo", ""))
            imp.setCodigoPorcentaje(imp_data.get("codigo_porcentaje", ""))
            imp.setTarifa(Decimal(str(imp_data.get("tarifa", "0.00"))))
            imp.setBaseImponible(Decimal(str(imp_data.get("base_imponible", "0.00"))))
            imp.setValor(Decimal(str(imp_data.get("valor", "0.00"))))
            lista_impuestos.append(imp)
        detalle.setImpuesto(lista_impuestos)

        # Detalles adicionales por producto
        lista_det_adicional = []
        for da_data in det_data.get("detalles_adicionales", []):
            da = {"nombre": da_data.get("nombre", ""), "valor": da_data.get("valor", "")}
            lista_det_adicional.append(da)
        detalle.setDetAdicional(lista_det_adicional)

        lista_detalles.append(detalle)
    factura.setDetalle(lista_detalles)

    # ========================================================================
    # --- CampoAdicional (infoAdicional) ---
    # ========================================================================
    lista_campos = []
    for ca_data in datos.get("info_adicional", []):
        ca = CampoAdicional()
        ca.setNombre(ca_data.get("nombre", ""))
        ca.setValue(ca_data.get("valor", ""))
        lista_campos.append(ca)
    factura.setCampoAdicional(lista_campos)

    # ========================================================================
    # --- Retenciones ---
    # ========================================================================
    lista_retenciones = []
    for ret_data in datos.get("retenciones", []):
        ret = RetencionFactura()
        ret.setCodigo(ret_data.get("codigo", ""))
        ret.setCodigoPorcentaje(ret_data.get("codigo_porcentaje", ""))
        ret.setTarifa(Decimal(str(ret_data.get("tarifa", "0.00"))))
        ret.setValor(Decimal(str(ret_data.get("valor", "0.00"))))
        lista_retenciones.append(ret)
    factura.setRetencion(lista_retenciones)

    return factura
