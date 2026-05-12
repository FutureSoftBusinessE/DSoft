"""
Microservicio Flask para Facturación Electrónica SRI
Basado en el flujo original de Test.java (Caso 0: Flujo Completo)

Flujo:
1. Recibir JSON del frontend
2. Generar clave de acceso (algoritmo SRI)
3. Construir objeto Factura con los datos recibidos
4. Serializar a XML según esquema XSD del SRI
5. Firmar XML con certificado .p12 (XAdES)
6. Enviar al SRI (Web Service de Recepción)
7. Autorizar en SRI (Web Service de Autorización)
8. Enviar correo electrónico al comprador
9. Devolver JSON de respuesta al frontend
"""

import os
import time
import json
import logging
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

from flask import Flask, request, jsonify
from flask_cors import CORS

# Modelos (igual que los .java originales)
from IntegracionFacturacionElectronica.models.factura.Factura import Factura
from IntegracionFacturacionElectronica.models.factura.FacturaDetalle import FacturaDetalle
from IntegracionFacturacionElectronica.models.factura.InfoFactura import InfoFactura
from IntegracionFacturacionElectronica.models.factura.TotalImpuesto import TotalImpuesto
from IntegracionFacturacionElectronica.models.factura.RetencionFactura import RetencionFactura
from IntegracionFacturacionElectronica.models.InfoTributaria import InfoTributaria
from IntegracionFacturacionElectronica.models.Impuesto import Impuesto
from IntegracionFacturacionElectronica.models.CampoAdicional import CampoAdicional


# ============================================================================
# CONFIGURACION
# ============================================================================

app = Flask(__name__)
CORS(app)

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class Config:
    """Configuración del microservicio"""

    # Directorio base donde se guardarán los archivos generados
    DIRECTORIO_RAIZ = os.environ.get("DIRECTORIO_RAIZ", str(Path(__file__).parent / "comprobantes"))

    # Subdirectorios (igual que en Test.java)
    DIRECTORIO_GENERADOS = "GENERADOS"  # XML sin firmar
    DIRECTORIO_FIRMADOS = "FIRMADOS"  # XML firmados
    DIRECTORIO_AUTORIZADOS = "AUTORIZADOS"  # XML autorizados
    DIRECTORIO_NO_AUTORIZADOS = "NOAUTORIZADOS"  # XML no autorizados
    DIRECTORIO_REPORTES = "REPORTES"  # PDFs (futuro)
    DIRECTORIO_CERTIFICADOS = os.environ.get("DIRECTORIO_CERTIFICADOS", str(Path(__file__).parent / "certificados"))

    # URLs Web Services SRI
    # Ambiente 1 = Pruebas, 2 = Producción
    URLS_SRI = {
        "1": {"recepcion": "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl", "autorizacion": "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl"},
        "2": {"recepcion": "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl", "autorizacion": "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl"},
    }

    # Conexión BD legacy (Opcional - para sp_seg_java y sp_seg_update)
    BD_SERVIDOR = os.environ.get("BD_SERVIDOR", "")
    BD_BASE = os.environ.get("BD_BASE", "")
    BD_USUARIO = os.environ.get("BD_USUARIO", "")
    BD_CLAVE = os.environ.get("BD_CLAVE", "")

    # Email por defecto (si no viene en el JSON)
    SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    SMTP_PUERTO = os.environ.get("SMTP_PUERTO", "587")
    SMTP_USUARIO = os.environ.get("SMTP_USUARIO", "")
    SMTP_CLAVE = os.environ.get("SMTP_CLAVE", "")


# Crear directorios necesarios al iniciar
def crear_directorios():
    """Crea los directorios de trabajo si no existen"""
    for subdir in [Config.DIRECTORIO_GENERADOS, Config.DIRECTORIO_FIRMADOS, Config.DIRECTORIO_AUTORIZADOS, Config.DIRECTORIO_NO_AUTORIZADOS, Config.DIRECTORIO_REPORTES]:
        path = os.path.join(Config.DIRECTORIO_RAIZ, subdir)
        os.makedirs(path, exist_ok=True)


# ============================================================================
# PASO 6: Generar Clave de Acceso (Algoritmo SRI)
# ============================================================================


def generar_clave_acceso(fecha_emision: str, cod_doc: str, ruc: str, ambiente: str, serie: str, secuencial: str, codigo_numerico: str, tipo_emision: str) -> str:
    """
    Genera la clave de acceso de 49 dígitos según algoritmo del SRI.

    Estructura:
    - Fecha (8 dígitos): ddmmaaaa
    - Tipo comprobante (2): 01=factura, 04=nota crédito, etc.
    - RUC (13)
    - Ambiente (1): 1=pruebas, 2=producción
    - Serie (6): establecimiento(3) + punto_emision(3)
    - Secuencial (9)
    - Código numérico (8): aleatorio
    - Tipo emisión (1): 1=normal, 2=contingencia
    - Dígito verificador (1): módulo 11

    Args:
        fecha_emision: Fecha en formato dd/MM/yyyy
        cod_doc: Código de documento (01=factura)
        ruc: RUC del emisor
        ambiente: 1=pruebas, 2=producción
        serie: Establecimiento + Punto emisión (6 dígitos)
        secuencial: Secuencial del comprobante (9 dígitos)
        codigo_numerico: Código numérico aleatorio (8 dígitos)
        tipo_emision: 1=normal, 2=contingencia

    Returns:
        Clave de acceso de 49 dígitos
    """
    # Convertir fecha de dd/MM/yyyy a ddmmaaaa
    fecha_dt = datetime.strptime(fecha_emision, "%d/%m/%Y")
    fecha_str = fecha_dt.strftime("%d%m%Y")

    # Asegurar longitudes correctas
    ruc = ruc.zfill(13)
    serie = serie.zfill(6)
    secuencial = secuencial.zfill(9)
    codigo_numerico = codigo_numerico.zfill(8)

    # Construir los primeros 48 dígitos
    clave_sin_dv = fecha_str + cod_doc + ruc + ambiente + serie + secuencial + codigo_numerico + tipo_emision

    # Calcular dígito verificador (módulo 11)
    dv = _calcular_digito_verificador(clave_sin_dv)

    return clave_sin_dv + str(dv)


def _calcular_digito_verificador(clave_48: str) -> int:
    """
    Calcula el dígito verificador usando módulo 11.

    Algoritmo:
    1. Multiplicar cada dígito por 2,3,4,5,6,7 (en ese orden, cíclicamente)
       empezando desde el último dígito hacia el primero
    2. Sumar todos los productos
    3. Dividir la suma por 11, obtener el resto
    4. Si el resto es 0, el DV es 0
       Si el resto es 1, el DV es el resultado de 11 - resto
       En otro caso, el DV es 11 - resto
    """
    multiplicadores = [2, 3, 4, 5, 6, 7]
    suma = 0
    idx_multiplicador = 0

    # Recorrer desde el último dígito hacia el primero
    for i in range(len(clave_48) - 1, -1, -1):
        digito = int(clave_48[i])
        suma += digito * multiplicadores[idx_multiplicador]
        idx_multiplicador = (idx_multiplicador + 1) % len(multiplicadores)

    residuo = suma % 11

    if residuo == 0:
        return 0
    elif residuo == 1:
        return 11 - residuo
    else:
        return 11 - residuo


# ============================================================================
# PASO 7: Serializar objeto Factura a XML
# ============================================================================


def serializar_factura_xml(factura: Factura) -> str:
    """
    Convierte el objeto Factura a string XML según esquema XSD del SRI.

    El orden de los campos debe seguir estrictamente el @XmlType.propOrder
    definido en los archivos .java originales.

    Args:
        factura: Objeto Factura con todos los datos

    Returns:
        String XML listo para firmar
    """
    # TODO: Implementar con Jinja2 o lxml
    # Por ahora retornamos un placeholder
    # FUTURO: Construir XML completo con todos los namespaces del SRI
    pass


# ============================================================================
# PASO 8: Firmar XML con certificado .p12 (XAdES)
# ============================================================================


def firmar_xml(xml_sin_firmar: str, ruta_certificado: str, clave_certificado: str) -> str:
    """
    Firma el XML usando XAdES (XML Advanced Electronic Signatures).

    Carga el certificado .p12, extrae la clave privada y el certificado,
    y aplica la firma al XML.

    Args:
        xml_sin_firmar: XML en string sin firmar
        ruta_certificado: Nombre del archivo .p12 (está en DIRECTORIO_CERTIFICADOS)
        clave_certificado: Clave del archivo .p12

    Returns:
        XML firmado en string
    """
    # TODO: Implementar con cryptography + signxml o xmlsec
    # FUTURO:
    # 1. Construir ruta completa: os.path.join(Config.DIRECTORIO_CERTIFICADOS, ruta_certificado)
    # 2. Cargar .p12 con cryptography.hazmat.primitives.serialization.pkcs12
    # 3. Extraer private_key, certificate, additional_certs
    # 4. Firmar con signxml.XMLSigner o xmlsec
    # 5. Retornar XML firmado como string
    pass


# ============================================================================
# PASO 9: Determinar URL del Web Service SRI
# ============================================================================


def obtener_url_ws(ambiente: str, servicio: str) -> str:
    """
    Obtiene la URL del Web Service del SRI según ambiente y servicio.

    Args:
        ambiente: "1" = pruebas, "2" = producción
        servicio: "recepcion" o "autorizacion"

    Returns:
        URL del WSDL
    """
    return Config.URLS_SRI.get(ambiente, {}).get(servicio, "")


# ============================================================================
# PASO 10.0.3: Enviar comprobante al SRI
# ============================================================================


def enviar_comprobante_sri(xml_firmado: str, ambiente: str) -> Dict[str, Any]:
    """
    Envía el XML firmado al Web Service de Recepción del SRI.

    Args:
        xml_firmado: XML firmado como string
        ambiente: "1" = pruebas, "2" = producción

    Returns:
        Diccionario con la respuesta del SRI
        {
            "exito": True/False,
            "mensaje": "...",
            "errores": []
        }
    """
    # TODO: Implementar con zeep (SOAP)
    # FUTURO:
    # 1. Obtener URL: obtener_url_ws(ambiente, "recepcion")
    # 2. Crear cliente SOAP: zeep.Client(url)
    # 3. Llamar al método validarComprobante(xml_firmado)
    # 4. Procesar respuesta
    pass


# ============================================================================
# PASO 10.0.5: Autorizar comprobante en SRI
# ============================================================================


def autorizar_comprobante_sri(clave_acceso: str, ambiente: str) -> Dict[str, Any]:
    """
    Consulta el estado de autorización del comprobante en el SRI.

    Args:
        clave_acceso: Clave de acceso de 49 dígitos
        ambiente: "1" = pruebas, "2" = producción

    Returns:
        Diccionario con la respuesta:
        {
            "estado": "AUTORIZADO" | "NO AUTORIZADO" | "EN PROCESO",
            "numero_autorizacion": "...",  # solo si AUTORIZADO
            "fecha_autorizacion": "...",   # solo si AUTORIZADO
            "xml_autorizacion": "...",     # solo si AUTORIZADO
            "mensajes": []                  # solo si NO AUTORIZADO
        }
    """
    # TODO: Implementar con zeep (SOAP)
    # FUTURO:
    # 1. Obtener URL: obtener_url_ws(ambiente, "autorizacion")
    # 2. Crear cliente SOAP: zeep.Client(url)
    # 3. Llamar al método autorizacionComprobante(clave_acceso)
    # 4. Procesar respuesta:
    #    - Si estado == "AUTORIZADO": extraer numeroAutorizacion, fechaAutorizacion, comprobanteAutorizado
    #    - Si estado == "NO AUTORIZADO": extraer lista de mensajes (identificador, mensaje, infoAdicional)
    #    - Si estado == "EN PROCESO": indicar reintento
    pass


# ============================================================================
# PASO 13: Enviar correo electrónico
# ============================================================================


def enviar_correo(destinatario: str, asunto: str, mensaje_texto: str, adjuntos: list, smtp_host: str = None, smtp_puerto: str = None, email_salida: str = None, clave_email: str = None, ssl_tls: str = "S", office365: str = "N") -> Tuple[bool, str]:
    """
    Envía correo electrónico con los comprobantes adjuntos.

    Soporta:
    - SMTP normal con SSL/TLS
    - Office365 (con OAuth2 si es necesario)

    Args:
        destinatario: Email del comprador
        asunto: Asunto del correo
        mensaje_texto: Cuerpo del mensaje
        adjuntos: Lista de rutas de archivos a adjuntar
        smtp_host: Servidor SMTP
        smtp_puerto: Puerto SMTP
        email_salida: Email remitente
        clave_email: Clave del email remitente
        ssl_tls: "S" para usar SSL/TLS, "N" para no
        office365: "S" para Office365, "N" para SMTP normal

    Returns:
        Tupla (exito, mensaje)
    """
    # TODO: Implementar con smtplib o yagmail para Office365
    # FUTURO:
    # 1. Validar que los adjuntos existan
    # 2. Construir mensaje MIME multipart
    # 3. Adjuntar PDF (si existe) y XML autorizado
    # 4. Conectar al SMTP y enviar
    # 5. Si Office365 == "S", usar autenticación OAuth2
    pass


# ============================================================================
# PASO 12: Actualizar Base de Datos legacy (OPCIONAL)
# ============================================================================


def actualizar_bd_legacy(cia: str, fac: str, loc: str, xml_firmado_path: str, xml_autorizado_path: str, xml_no_autorizado_path: str, pdf_path: str, numero_autorizacion: str, fecha_autorizacion: str) -> bool:
    """
    Actualiza la BD SQL Server legacy con los documentos generados.
    Ejecuta sp_seg_update_documentos_electronicos.

    Este paso es OPCIONAL. Solo si se mantiene la BD del sistema anterior.

    Args:
        cia, fac, loc: Identificadores de empresa/factura/local
        xml_firmado_path: Ruta del XML firmado
        xml_autorizado_path: Ruta del XML autorizado
        xml_no_autorizado_path: Ruta del XML no autorizado
        pdf_path: Ruta del PDF
        numero_autorizacion: Número de autorización SRI
        fecha_autorizacion: Fecha de autorización

    Returns:
        True si se actualizó correctamente
    """
    # TODO: Implementar con pyodbc si se necesita la BD legacy
    # FUTURO:
    # 1. Conectar a SQL Server con pyodbc
    # 2. Leer archivos como binario
    # 3. Ejecutar sp_seg_update_documentos_electronicos
    # 4. Hacer commit
    pass


# ============================================================================
# PASO 3: Obtener configuración desde BD legacy (OPCIONAL)
# ============================================================================


def obtener_configuracion_bd_legacy(cia: str, fac: str, loc: str) -> Optional[Dict[str, Any]]:
    """
    Obtiene configuración desde la BD SQL Server legacy.
    Ejecuta sp_seg_java(cia, fac, loc).

    Este paso es OPCIONAL. Solo si la configuración no viene en el JSON.

    Args:
        cia, fac, loc: Identificadores de empresa/factura/local

    Returns:
        Diccionario con la configuración o None si no hay BD legacy
    """
    # TODO: Implementar con pyodbc si se necesita
    # FUTURO:
    # 1. Conectar a SQL Server
    # 2. Ejecutar sp_seg_java(?,?,?)
    # 3. Leer resultado: archivop12, clavep12, sriclave, emailsmtp, etc.
    pass


# ============================================================================
# FUNCION PRINCIPAL: Construir objeto Factura desde JSON
# ============================================================================


def construir_factura_desde_json(datos: Dict[str, Any], clave_acceso: str) -> Factura:
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
    factura.setVersion("1.0.0")

    # --- InfoTributaria ---
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
    factura.setInfoTributaria(info_tributaria)

    # --- InfoFactura ---
    if_data = datos.get("info_factura", {})
    info_factura = InfoFactura()
    info_factura.setFechaEmision(if_data.get("fecha_emision", ""))
    info_factura.setDirEstablecimiento(if_data.get("dir_establecimiento", ""))
    info_factura.setContribuyenteEspecial(if_data.get("contribuyente_especial", "000"))
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
        ti.setTarifa(Decimal(str(ti_data.get("tarifa", "0.00"))))
        ti.setValor(Decimal(str(ti_data.get("valor", "0.00"))))
        lista_total_impuestos.append(ti)
    info_factura.setTotalImpuesto(lista_total_impuestos)
    factura.setInfoFactura(info_factura)

    # --- Detalles ---
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

        # Detalles adicionales (vacío por ahora)
        detalle.setDetAdicional([])

        lista_detalles.append(detalle)
    factura.setDetalle(lista_detalles)

    # --- CampoAdicional (infoAdicional) ---
    lista_campos = []
    for ca_data in datos.get("info_adicional", []):
        ca = CampoAdicional()
        ca.setNombre(ca_data.get("nombre", ""))
        ca.setValue(ca_data.get("valor", ""))
        lista_campos.append(ca)
    factura.setCampoAdicional(lista_campos)

    # --- Retenciones ---
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


# ============================================================================
# ENDPOINT PRINCIPAL: POST /api/factura/emitir
# ============================================================================


@app.route("/api/factura/emitir", methods=["POST"])
def emitir_factura():
    """
    Endpoint principal - Flujo completo de emisión de factura electrónica.

    Recibe JSON con todos los datos de la factura y ejecuta:
    1. Generar clave de acceso
    2. Construir objeto Factura
    3. Serializar a XML
    4. Firmar XML
    5. Enviar al SRI
    6. Autorizar en SRI
    7. Enviar correo
    8. Devolver respuesta JSON

    Request JSON: ver estructura completa en documentación

    Response JSON:
    {
        "exito": true/false,
        "clave_acceso": "...",
        "estado": "AUTORIZADO" | "NO AUTORIZADO" | "EN PROCESO",
        "numero_autorizacion": "...",
        "fecha_autorizacion": "...",
        "mensaje": "...",
        "errores": []
    }
    """
    # Variables de control (igual que flag_proceso y flag_correo en Test.java)
    flag_proceso = False
    flag_correo = False

    try:
        # PASO 1: Recibir y validar JSON
        datos = request.get_json()
        if not datos:
            return jsonify({"exito": False, "mensaje": "JSON vacío o inválido"}), 400

        logger.info("Iniciando emisión de factura")

        # Extraer configuración del JSON
        tipo_proceso = datos.get("tipo_proceso", "0")  # CASE del switch
        ambiente = datos.get("ambiente", "1")
        offline = datos.get("offline", "N")
        config = datos.get("configuracion", {})
        ruta_certificado = config.get("ruta_certificado", "")
        clave_certificado = config.get("clave_certificado", "")
        directorio_raiz = config.get("directorio_raiz", Config.DIRECTORIO_RAIZ)
        correo_reenvio = config.get("correo_reenvio", "")

        # PASO 3 (OPCIONAL): Si no hay configuración en JSON, leer de BD legacy
        # FUTURO: obtener_configuracion_bd_legacy(cia, fac, loc)

        # PASO 6: Generar clave de acceso
        it = datos.get("info_tributaria", {})
        if_data = datos.get("info_factura", {})
        serie = it.get("estab", "") + it.get("pto_emi", "")
        secuencial = it.get("secuencial", "")
        # Código numérico aleatorio de 8 dígitos
        import random

        codigo_numerico = str(random.randint(10000000, 99999999))

        clave_acceso = generar_clave_acceso(fecha_emision=if_data.get("fecha_emision", ""), cod_doc=datos.get("tipo_documento", "01"), ruc=it.get("ruc", ""), ambiente=ambiente, serie=serie, secuencial=secuencial, codigo_numerico=codigo_numerico, tipo_emision=datos.get("tipo_emision", "1"))
        logger.info(f"Clave de acceso generada: {clave_acceso}")

        # PASO 4: Construir rutas de archivos
        ruta_xml_generado = os.path.join(directorio_raiz, Config.DIRECTORIO_GENERADOS, f"{clave_acceso}.xml")
        ruta_xml_firmado = os.path.join(directorio_raiz, Config.DIRECTORIO_FIRMADOS, f"{clave_acceso}.xml")
        ruta_xml_autorizado = os.path.join(directorio_raiz, Config.DIRECTORIO_AUTORIZADOS, f"{clave_acceso}.xml")
        ruta_xml_no_autorizado = os.path.join(directorio_raiz, Config.DIRECTORIO_NO_AUTORIZADOS, f"{clave_acceso}.xml")
        ruta_pdf = os.path.join(directorio_raiz, Config.DIRECTORIO_REPORTES, f"{clave_acceso}.pdf")

        # PASO 5: Modo offline
        if offline == "S":
            ruta_xml_autorizado = ruta_xml_firmado
            logger.info("Modo OFFLINE activado")

        # PASO 7: Construir objeto Factura
        factura = construir_factura_desde_json(datos, clave_acceso)
        logger.info("Objeto Factura construido")

        # ====================================================================
        # SWITCH tipo_proceso (igual que en Test.java)
        # ====================================================================

        if tipo_proceso == "0" or tipo_proceso == "2":
            # --- CASO 0: FLUJO COMPLETO ---
            # --- CASO 2: DESDE ENVÍO (ya está firmado) ---

            if tipo_proceso == "0":
                # PASO 7: Serializar a XML
                # FUTURO: xml_sin_firmar = serializar_factura_xml(factura)
                # FUTURO: Guardar en ruta_xml_generado
                logger.info("XML generado (placeholder)")

                # PASO 8: Firmar XML
                # FUTURO: xml_firmado = firmar_xml(xml_sin_firmar, ruta_certificado, clave_certificado)
                # FUTURO: Guardar en ruta_xml_firmado
                logger.info("XML firmado (placeholder)")

            # PASO 10.0.1: Intentar conectar al WS Recepción SRI
            try:
                url_recepcion = obtener_url_ws(ambiente, "recepcion")
                if not url_recepcion:
                    raise Exception("URL de recepción no configurada")
                logger.info(f"Conectando a SRI: {url_recepcion}")
            except Exception as e:
                logger.error(f"Servicios del SRI no disponibles: {e}")
                if offline != "S":
                    return jsonify({"exito": False, "mensaje": "Servicios del SRI no disponibles"}), 503

            if offline != "S":
                # PASO 10.0.3: Enviar comprobante
                # FUTURO: respuesta_envio = enviar_comprobante_sri(xml_firmado, ambiente)
                logger.info("Comprobante enviado al SRI (placeholder)")

                # PASO 10.0.4: Esperar 1 segundo
                time.sleep(1)

                # PASO 10.0.5: Autorizar comprobante
                # FUTURO: respuesta_autorizacion = autorizar_comprobante_sri(clave_acceso, ambiente)
                logger.info("Autorización consultada (placeholder)")

            # PASO 10.0.7: Validar flag_proceso
            if offline != "S":
                flag_proceso = True
            else:
                flag_proceso = False

            flag_correo = True

        elif tipo_proceso == "1":
            # --- CASO 1: SOLO FIRMA ---
            # FUTURO: Solo firmar, sin enviar al SRI
            flag_proceso = False
            flag_correo = False
            logger.info("Caso 1: Solo firma (placeholder)")

        elif tipo_proceso == "3":
            # --- CASO 3: SOLO PDF (desde XML autorizado existente) ---
            flag_proceso = True if offline != "S" else False
            flag_correo = True
            logger.info("Caso 3: Solo PDF (placeholder)")

        elif tipo_proceso == "4":
            # --- CASO 4: SOLO CORREO ---
            flag_correo = True
            flag_proceso = False
            logger.info("Caso 4: Solo correo (placeholder)")

        elif tipo_proceso == "5":
            # --- CASO 5: SOLO ACTUALIZAR BD ---
            flag_proceso = True
            flag_correo = False
            logger.info("Caso 5: Solo actualizar BD (placeholder)")

        elif tipo_proceso == "6":
            # --- CASO 6: SOLO PDF (sin correo) ---
            flag_proceso = True
            flag_correo = False
            logger.info("Caso 6: Solo PDF (placeholder)")

        else:
            logger.error(f"Tipo de proceso no definido: {tipo_proceso}")
            return jsonify({"exito": False, "mensaje": f"Tipo de proceso no definido: {tipo_proceso}"}), 400

        # ====================================================================
        # FIN SWITCH
        # ====================================================================

        # PASO 11: Extraer número y fecha de autorización
        numero_autorizacion = ""
        fecha_autorizacion = ""
        # FUTURO: Parsear XML de autorización para extraer estos datos
        logger.info("Número y fecha de autorización extraídos (placeholder)")

        # PASO 12: Actualizar BD legacy (OPCIONAL)
        if flag_proceso:
            # FUTURO: actualizar_bd_legacy(...)
            logger.info("BD legacy actualizada (placeholder)")

        # PASO 13: Enviar correo electrónico
        if flag_correo:
            datos_correo = datos.get("datos_correo", {})
            destinatario = correo_reenvio if correo_reenvio else datos_correo.get("destinatario", "")
            # FUTURO: enviar_correo(destinatario, asunto, mensaje, adjuntos, ...)
            logger.info(f"Correo enviado a {destinatario} (placeholder)")

        # PASO 14 y 15: Construir y devolver respuesta JSON
        respuesta = {"exito": True, "clave_acceso": clave_acceso, "estado": "AUTORIZADO", "numero_autorizacion": numero_autorizacion, "fecha_autorizacion": fecha_autorizacion, "mensaje": "Factura procesada correctamente", "errores": []}  # Placeholder

        logger.info(f"Factura emitida exitosamente: {clave_acceso}")
        return jsonify(respuesta), 200

    except Exception as e:
        logger.error(f"Error al emitir factura: {str(e)}", exc_info=True)
        return jsonify({"exito": False, "clave_acceso": clave_acceso if "clave_acceso" in locals() else "", "mensaje": f"Error interno: {str(e)}", "errores": [str(e)]}), 500


# ============================================================================
# ENDPOINTS ADICIONALES (Futuro)
# ============================================================================


@app.route("/api/factura/<clave_acceso>/estado", methods=["GET"])
def consultar_estado(clave_acceso):
    """Consulta el estado de un comprobante por clave de acceso"""
    # FUTURO: Consultar estado en SRI o en BD local
    return jsonify({"clave_acceso": clave_acceso, "estado": "EN PROCESO", "mensaje": "Endpoint en desarrollo"}), 200


@app.route("/api/factura/<clave_acceso>/xml/<tipo>", methods=["GET"])
def descargar_xml(clave_acceso, tipo):
    """
    Descarga el XML firmado o autorizado.
    tipo: "firmado" o "autorizacion"
    """
    # FUTURO: Leer archivo del disco y devolverlo
    return jsonify({"mensaje": "Endpoint en desarrollo"}), 200


@app.route("/api/factura/<clave_acceso>/pdf", methods=["GET"])
def descargar_pdf(clave_acceso):
    """Descarga el PDF (RIDE) del comprobante"""
    # FUTURO: Leer PDF del disco y devolverlo
    return jsonify({"mensaje": "Endpoint en desarrollo"}), 200


@app.route("/api/health", methods=["GET"])
def health():
    """Health check para monitoreo"""
    return jsonify({"estado": "ok", "servicio": "Facturación Electrónica SRI", "version": "1.0.0"}), 200


# ============================================================================
# INICIO DE LA APLICACIÓN
# ============================================================================

if __name__ == "__main__":
    crear_directorios()
    logger.info("Iniciando microservicio de Facturación Electrónica SRI")
    app.run(debug=True, host="0.0.0.0", port=5000)
