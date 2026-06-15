from datetime import datetime
from dotenv import load_dotenv
from decouple import config as config_env
import base64

# Cargar variables de entorno
load_dotenv()  # Carga .env por defecto


def construir_payload_sri(proforma, detalles, secuencia_sri, datos_empresa, datos_cliente, forma_pago, ciacodigo, loccodigo, facnumfac):
    """
    Construye el payload JSON para la API de facturación electrónica.
    Este payload será enviado a /IntegracionFacturacionElectronica/emisionFactura
    """

    # Mapeo de formas de pago según la lógica del SRI
    # Si fortipo está en esta lista → "20" (Con sistema financiero)
    # Si no → "01" (Sin sistema financiero)
    FORMAS_PAGO_SISTEMA_FINANCIERO = ["CH", "TA", "TR", "AB"]

    if forma_pago["fortipo"] in FORMAS_PAGO_SISTEMA_FINANCIERO:
        codigo_sri_pago = "20"  # Con utilización del sistema financiero
    else:
        codigo_sri_pago = "01"  # Sin utilización del sistema financiero

    # ========== FUNCIONES AUXILIARES ==========
    def mapear_codigo_porcentaje_iva(porcentaje):
        """
        Mapea el porcentaje de IVA al código del SRI.
        TODO: Verificar si hay más porcentajes según catálogo SRI
        """
        mapeo = {
            0: "0",  # 0%
            12: "2",  # 12%
            15: "4",  # 15%
        }
        return mapeo.get(int(porcentaje), "4")

    def get_tipo_identificacion(ruc):
        """Determina el tipo de identificación según el RUC"""
        if ruc == "9999999999999":
            return "07"  # Consumidor Final
        elif len(ruc) == 13:
            return "04"  # RUC
        elif len(ruc) == 10:
            return "05"  # Cédula
        return "06"  # Pasaporte

    # ========== AGRUPAR IMPUESTOS POR PORCENTAJE ==========
    impuestos_agrupados = {}
    for detalle in detalles:
        iva_pct = int(float(detalle["pediva"]))
        if iva_pct not in impuestos_agrupados:
            impuestos_agrupados[iva_pct] = {"base_imponible": 0, "valor": 0}
        base = float(detalle["pedcantidad"]) * float(detalle["pedpreven"]) - float(detalle.get("pedvaldesc", 0))
        impuestos_agrupados[iva_pct]["base_imponible"] += base
        impuestos_agrupados[iva_pct]["valor"] += float(detalle.get("pedvaliva", 0))

    # ========== CONSTRUIR TOTALES IMPUESTOS ==========
    totales_impuestos = []
    for iva_pct, valores in impuestos_agrupados.items():
        if iva_pct > 0:
            totales_impuestos.append({"codigo": "2", "codigo_porcentaje": mapear_codigo_porcentaje_iva(iva_pct), "base_imponible": round(valores["base_imponible"], 2), "valor": round(valores["valor"], 2)})

    # ========== CONSTRUIR DETALLES ==========
    detalles_sri = []
    for detalle in detalles:
        base_imponible = float(detalle["pedcantidad"]) * float(detalle["pedpreven"]) - float(detalle.get("pedvaldesc", 0))
        iva_pct = int(float(detalle["pediva"]))

        detalle_sri = {
            "codigo_principal": detalle["artcodigo"],
            "codigo_auxiliar": detalle["artcodigo"],
            "descripcion": detalle["artdescri"],
            "cantidad": float(detalle["pedcantidad"]),
            "precio_unitario": float(detalle["pedpreven"]),
            "descuento": float(detalle.get("pedvaldesc", 0)),
            "precio_total_sin_impuesto": round(base_imponible, 2),
            "impuestos": [],
        }

        if iva_pct > 0:
            detalle_sri["impuestos"].append({"codigo": "2", "codigo_porcentaje": mapear_codigo_porcentaje_iva(iva_pct), "tarifa": float(iva_pct), "base_imponible": round(base_imponible, 2), "valor": round(float(detalle.get("pedvaliva", 0)), 2)})

        detalles_sri.append(detalle_sri)

    # ========== CONSTRUIR INFO ADICIONAL ==========
    info_adicional = [{"nombre": "Dirección", "valor": datos_cliente.get("clidirec", "")}, {"nombre": "Email", "valor": datos_empresa.get("ciaemail", "")}, {"nombre": "Proforma", "valor": proforma["pednumped"]}]

    if proforma.get("peddetalle"):
        info_adicional.append({"nombre": "Observación", "valor": proforma["peddetalle"]})

    # ========== CONSTRUIR PAYLOAD COMPLETO ==========
    # NOTA: Este payload se envía directamente a emisionFactura
    payload = {
        "ciacodigo": ciacodigo,
        "loccodigo": loccodigo,
        "facnumfac": facnumfac,
        "tipo_proceso": "0",
        "tipo_documento": "01",
        "tipo_emision": "1",
        "ambiente": config_env("INTEGRACION_FACTURACION_ELECTRONICA_AMBIENTE"),  # Pruebas (1=Pruebas, 2=Producción)
        "offline": "N",
        "configuracion": {"directorio_raiz": "", "correo_reenvio": ""},
        "info_tributaria": {
            "razon_social": datos_empresa["ciasrirazon"],
            "nombre_comercial": datos_empresa.get("ciadescri", ""),
            "ruc": datos_empresa["ciaruc"],
            "estab": secuencia_sri["sriserie01"],
            "pto_emi": secuencia_sri["sriserie02"],
            "secuencial": f"{secuencia_sri['srisecact']:09}",
            "dir_matriz": datos_empresa.get("ciadirec"),
            "logo": base64.b64encode(datos_empresa["cialogo"]).decode("utf-8") if datos_empresa.get("cialogo") else "",
        },
        "info_factura": {
            "fecha_emision": datetime.now().strftime("%d/%m/%Y"),
            "dir_establecimiento": datos_empresa.get("ciadirec"),
            "contribuyente_especial": "",  # TODO: Buscar de dónde obtener este campo
            "obligado_contabilidad": "SI" if datos_empresa.get("ciacontabilidad") == 1 else "NO",
            "tipo_identificacion_comprador": get_tipo_identificacion(datos_cliente["cliruc"]),
            "razon_social_comprador": datos_cliente["clinombre"],
            "identificacion_comprador": datos_cliente["cliruc"],
            "guia_remision": "",  # TODO: Implementar si hay guía
            "total_sin_impuestos": round(float(proforma["pedsubtot"]), 2),
            "total_descuento": round(float(proforma.get("peddesdirecto", 0)), 2),
            "propina": 0.00,  # TODO: Implementar si aplica
            "importe_total": round(float(proforma["pedtotal"]), 2),
            "moneda": "DOLAR",
        },
        "totales_impuestos": totales_impuestos,
        "pagos": [{"forma_pago": codigo_sri_pago, "total": round(float(proforma["pedtotal"]), 2), "plazo": str(forma_pago.get("fordias", "")), "unidad_tiempo": "dias" if forma_pago.get("fordias", 0) > 0 else ""}],
        "detalles": detalles_sri,
        "info_adicional": info_adicional,
        "retenciones": [],  # TODO: Implementar si hay retenciones
        "datos_correo": {
            "smtp_host": "",  # TODO: Configurar SMTP del sistema
            "puerto": "",  # TODO: Configurar puerto SMTP
            "email_salida": "",  # TODO: Email del sistema
            "clave_email": "",  # TODO: Clave del email
            "destinatario": "prueba@gmail.com",  # TODO: Cambiar por email real del cliente
            "asunto": "Factura Electrónica",
            "mensaje": "Adjuntamos su factura electrónica.",
            "office365": "N",
            "copia_correo": "N",  # TODO: Configurar si se envía copia
            "ssl_tls": "S",
            "mensaje_factura": "N",
        },
        "flags_adicionales": {"guia": "N", "agente_retencion_num_res": "", "rimpe": ""},  # TODO: Verificar en siaccia si aplica RIMPE
    }

    return payload
